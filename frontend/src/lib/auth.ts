'use client';

import { createContext, useContext } from 'react';
import { User } from './api';
import { Locale } from './i18n';

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  locale: Locale;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  setLocale: (locale: Locale) => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  locale: 'en',
  login: async () => {},
  register: async () => {},
  logout: () => {},
  setLocale: () => {},
});

export const useAuth = () => useContext(AuthContext);
