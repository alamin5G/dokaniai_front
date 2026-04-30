import { getOrCreateClientDeviceId } from '@/lib/device';
import { useAuthStore } from '@/store/authStore';
import { useLanguageStore } from '@/store/languageStore';
import axios from 'axios';

const DESCRIPTION_TRACE_KEY = 'dokaniai-debug-onboarding-description';

function isDescriptionTraceEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_DEBUG_ONBOARDING_TRACE === '1') {
    return true;
  }

  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return window.localStorage.getItem(DESCRIPTION_TRACE_KEY) === '1';
  } catch {
    return false;
  }
}

function isDescriptionTraceTarget(url?: string): boolean {
  if (!url || !url.includes('/businesses')) {
    return false;
  }

  return (
    url === '/businesses'
    || /\/businesses\/[^/]+$/.test(url)
    || url.includes('/profile')
    || url.includes('/onboarding')
  );
}

function getRequestDescription(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') {
    return undefined;
  }

  const candidate = data as { description?: unknown };
  return typeof candidate.description === 'string' ? candidate.description : undefined;
}

function getResponseDescription(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') {
    return undefined;
  }

  const apiEnvelope = payload as { data?: { description?: unknown } };
  const nestedDescription = apiEnvelope.data?.description;
  if (typeof nestedDescription === 'string') {
    return nestedDescription;
  }

  const directPayload = payload as { description?: unknown };
  return typeof directPayload.description === 'string' ? directPayload.description : undefined;
}

function createTraceId(): string {
  return `desc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const PUBLIC_AUTH_FREE_ROUTES = new Set([
  '/',
  '/pricing',
  '/login',
  '/register',
  '/forgot-password',
  '/verify-email',
  '/reset-password',
  '/set-password',
]);

function shouldSkipLoginRedirect(pathname: string): boolean {
  return PUBLIC_AUTH_FREE_ROUTES.has(pathname);
}

const PUBLIC_NO_AUTH_ENDPOINTS = ['/subscriptions/plans'];

function isPublicNoAuthEndpoint(url?: string): boolean {
  if (!url) {
    return false;
  }

  return PUBLIC_NO_AUTH_ENDPOINTS.some((endpoint) => url.includes(endpoint));
}

function getPreferredLocale(): string {
  const storeLocale = useLanguageStore.getState().locale;
  if (storeLocale === 'bn' || storeLocale === 'en') {
    return storeLocale;
  }

  if (typeof document === 'undefined') {
    return 'en';
  }

  const cookieValue = document.cookie
    .split('; ')
    .find((row) => row.startsWith('NEXT_LOCALE='))
    ?.split('=')[1];

  if (!cookieValue) {
    return 'en';
  }

  return decodeURIComponent(cookieValue).toLowerCase() === 'bn' ? 'bn' : 'en';
}

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8082/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshPromise: Promise<{ accessToken: string; refreshToken: string }> | null = null;

// Request interceptor to attach token
apiClient.interceptors.request.use((config) => {
  const publicNoAuthRequest = isPublicNoAuthEndpoint(config.url);
  let { accessToken } = useAuthStore.getState();

  if (!publicNoAuthRequest && !accessToken && typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('dokaniai-auth-storage');
      if (raw) {
        const parsed = JSON.parse(raw);
        accessToken = parsed?.state?.accessToken || null;
      }
    } catch { /* ignore */ }
  }

  if (!publicNoAuthRequest && accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  config.headers['Accept-Language'] = getPreferredLocale();
  const deviceId = getOrCreateClientDeviceId();
  if (deviceId) {
    config.headers["X-Device-Id"] = deviceId;
  }

  if (isDescriptionTraceEnabled() && isDescriptionTraceTarget(config.url)) {
    const traceId = createTraceId();
    config.headers['X-Dokaniai-Trace-Id'] = traceId;
    (config as { __descriptionTraceId?: string }).__descriptionTraceId = traceId;
    const description = getRequestDescription(config.data);
    console.info('[desc-trace:req]', {
      traceId,
      method: config.method?.toUpperCase(),
      url: config.url,
      businessId: typeof config.url === 'string' ? config.url.match(/\/businesses\/([^/?]+)/)?.[1] : undefined,
      description,
      step: description != null ? 'request-with-description' : 'request',
    });
  }

  return config;
});

// Response interceptor for refresh token logic
apiClient.interceptors.response.use(
  (response) => {
    const traceId = (response.config as { __descriptionTraceId?: string }).__descriptionTraceId;
    if (traceId) {
      const description = getResponseDescription(response.data);
      console.info('[desc-trace:res]', {
        traceId,
        method: response.config.method?.toUpperCase(),
        url: response.config.url,
        status: response.status,
        businessId: typeof response.config.url === 'string'
          ? response.config.url.match(/\/businesses\/([^/?]+)/)?.[1]
          : undefined,
        description,
      });
    }

    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const publicNoAuthRequest = isPublicNoAuthEndpoint(originalRequest?.url);

    const traceId = (originalRequest as { __descriptionTraceId?: string } | undefined)?.__descriptionTraceId;
    if (traceId) {
      console.warn('[desc-trace:err]', {
        traceId,
        method: originalRequest?.method?.toUpperCase(),
        url: originalRequest?.url,
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
      });
    }

    if (publicNoAuthRequest) {
      return Promise.reject(error);
    }

    // If 401 Unauthorized and we haven't already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const currentStore = useAuthStore.getState();
        const { refreshToken } = currentStore;
        if (!refreshToken) throw new Error('No refresh token available');

        if (!refreshPromise) {
          refreshPromise = axios.post(`${apiClient.defaults.baseURL}/auth/refresh`, {
            refreshToken,
          }, {
            headers: {
              "X-Device-Id": getOrCreateClientDeviceId(),
            },
          }).then((response) => {
            const { accessToken: newAccess, refreshToken: newRefresh } = response.data.data;
            return { accessToken: newAccess, refreshToken: newRefresh };
          }).finally(() => {
            refreshPromise = null;
          });
        }

        const { accessToken: newAccess, refreshToken: newRefresh } = await refreshPromise;
        currentStore.setTokens(newAccess, newRefresh, currentStore.userId!, currentStore.status);

        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return apiClient(originalRequest);

      } catch (refreshError) {
        useAuthStore.getState().clearTokens();
        if (typeof window !== 'undefined' && !shouldSkipLoginRedirect(window.location.pathname)) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
