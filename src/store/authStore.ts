import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type AuthStatus = 'UNAUTHENTICATED' | 'AUTHENTICATED' | 'PASSWORD_SETUP_REQUIRED';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  userRole: string | null;
  status: AuthStatus;
  setTokens: (accessToken: string, refreshToken: string, userId: string, status: string) => void;
  setUserRole: (role: string | null) => void;
  clearTokens: () => void;
}

type PersistedAuthState = Partial<Pick<AuthState, "accessToken" | "refreshToken" | "userId" | "userRole" | "status">>;

function normalizeStatus(status: string): AuthStatus {
  if (status === 'PASSWORD_SETUP_REQUIRED') {
    return status;
  }
  if (status === 'AUTHENTICATED' || status === 'SUCCESS') {
    return 'AUTHENTICATED';
  }
  if (status && status !== 'UNAUTHENTICATED') {
    return 'AUTHENTICATED';
  }
  return 'UNAUTHENTICATED';
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    const decoded = atob(padded);
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function extractRoleFromAccessToken(accessToken: string | null | undefined): string | null {
  if (!accessToken) return null;
  const payload = decodeJwtPayload(accessToken);
  const rolesClaim = payload?.roles;
  if (typeof rolesClaim !== 'string' || !rolesClaim.trim()) {
    return null;
  }

  const normalizedRoles = rolesClaim
    .split(',')
    .map((role) => role.trim().replace(/^ROLE_/, ''))
    .filter(Boolean);

  if (normalizedRoles.includes('SUPER_ADMIN')) return 'SUPER_ADMIN';
  if (normalizedRoles.includes('ADMIN')) return 'ADMIN';
  if (normalizedRoles.length > 0) return normalizedRoles[0];
  return null;
}

function enrichAuthState(state: PersistedAuthState): PersistedAuthState {
  const derivedRole = state.userRole ?? extractRoleFromAccessToken(state.accessToken);
  return {
    ...state,
    userRole: derivedRole,
    status: normalizeStatus(state.status ?? 'UNAUTHENTICATED'),
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      userId: null,
      userRole: null,
      status: 'UNAUTHENTICATED',
      
      setTokens: (accessToken, refreshToken, userId, status) => set({ 
        accessToken, 
        refreshToken, 
        userId, 
        userRole: extractRoleFromAccessToken(accessToken),
        status: normalizeStatus(status)
      }),

      setUserRole: (role) => set({
        userRole: role,
      }),
      
      clearTokens: () => set({ 
        accessToken: null, 
        refreshToken: null, 
        userId: null, 
        userRole: null,
        status: 'UNAUTHENTICATED' 
      }),
    }),
    {
      name: 'dokaniai-auth-storage',
      storage: createJSONStorage(() => localStorage),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...enrichAuthState((persistedState as PersistedAuthState | undefined) ?? {}),
      }),
    }
  )
);
