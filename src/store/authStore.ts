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

function normalizeStatus(status: string): AuthStatus {
  if (status === 'AUTHENTICATED' || status === 'PASSWORD_SETUP_REQUIRED') {
    return status;
  }
  return 'UNAUTHENTICATED';
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
    }
  )
);
