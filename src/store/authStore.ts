import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  status: 'UNAUTHENTICATED' | 'AUTHENTICATED' | 'PASSWORD_SETUP_REQUIRED';
  setTokens: (accessToken: string, refreshToken: string, userId: string, status: string) => void;
  clearTokens: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      userId: null,
      status: 'UNAUTHENTICATED',
      
      setTokens: (accessToken, refreshToken, userId, status) => set({ 
        accessToken, 
        refreshToken, 
        userId, 
        status: status as any
      }),
      
      clearTokens: () => set({ 
        accessToken: null, 
        refreshToken: null, 
        userId: null, 
        status: 'UNAUTHENTICATED' 
      }),
    }),
    {
      name: 'dokaniai-auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
