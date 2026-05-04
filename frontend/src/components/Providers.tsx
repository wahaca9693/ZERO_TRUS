'use client';

import { useState, useEffect, useCallback, ReactNode } from 'react';
import { api, User } from '@/lib/api';
import { AuthContext } from '@/lib/auth';
import { Locale, getDir } from '@/lib/i18n';

export function Providers({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [locale, setLocale] = useState<Locale>('en');

  useEffect(() => {
    const token = api.getToken();
    if (token) {
      api
        .getMe()
        .then(setUser)
        .catch(() => {
          api.setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.documentElement.dir = getDir(locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.login({ email, password });
    api.setToken(data.token);
    setUser(data.user);
  }, []);

  const register = useCallback(
    async (username: string, email: string, password: string) => {
      const data = await api.register({ username, email, password }) as { user: User; token: string };
      api.setToken(data.token);
      setUser(data.user);
    },
    []
  );

  const logout = useCallback(() => {
    api.setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, locale, login, register, logout, setLocale }}
    >
      {children}
    </AuthContext.Provider>
  );
}
