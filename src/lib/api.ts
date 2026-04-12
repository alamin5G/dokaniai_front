import { getOrCreateClientDeviceId } from '@/lib/device';
import { useAuthStore } from '@/store/authStore';
import { useLanguageStore } from '@/store/languageStore';
import axios from 'axios';

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
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach token
apiClient.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  config.headers['Accept-Language'] = getPreferredLocale();
  const deviceId = getOrCreateClientDeviceId();
  if (deviceId) {
    config.headers["X-Device-Id"] = deviceId;
  }
  return config;
});

// Response interceptor for refresh token logic
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 Unauthorized and we haven't already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { refreshToken } = useAuthStore.getState();
        if (!refreshToken) throw new Error('No refresh token available');

        const response = await axios.post(`${apiClient.defaults.baseURL}/auth/refresh`, {
          refreshToken,
        }, {
          headers: {
            "X-Device-Id": getOrCreateClientDeviceId(),
          },
        });

        const { accessToken: newAccess, refreshToken: newRefresh } = response.data.data;
        const currentStore = useAuthStore.getState();
        currentStore.setTokens(newAccess, newRefresh, currentStore.userId!, currentStore.status);

        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return apiClient(originalRequest);

      } catch (refreshError) {
        useAuthStore.getState().clearTokens();
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
