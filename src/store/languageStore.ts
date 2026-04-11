import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type Locale = 'bn' | 'en';

interface LanguageState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      locale: 'bn', // Default Bengali per SRS §1.5
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: 'dokaniai-language',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
