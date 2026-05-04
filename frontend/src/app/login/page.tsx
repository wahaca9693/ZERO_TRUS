'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Terminal, Eye, EyeOff, Globe } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { t } from '@/lib/i18n';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register, locale, setLocale } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(username, email, password);
      }
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950 px-4">
      <div className="absolute top-4 right-4">
        <button
          onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-dark-400 hover:text-dark-200 hover:bg-dark-900 transition-all"
        >
          <Globe className="w-4 h-4" />
          {locale === 'en' ? 'العربية' : 'English'}
        </button>
      </div>

      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-neon-500/20 flex items-center justify-center mx-auto mb-4 glow-green">
            <Terminal className="w-8 h-8 text-neon-400" />
          </div>
          <h1 className="text-2xl font-bold text-neon-400 font-mono tracking-wider mb-1">
            ZDC
          </h1>
          <p className="text-dark-500 text-sm">
            {t('app.tagline', locale)}
          </p>
        </div>

        <div className="card p-8">
          <h2 className="text-lg font-semibold text-dark-100 mb-6">
            {isLogin ? t('auth.login', locale) : t('auth.register', locale)}
          </h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm text-dark-400 mb-1.5">
                  {t('auth.username', locale)}
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-field"
                  placeholder="hacker_01"
                  required
                  minLength={3}
                />
              </div>
            )}

            <div>
              <label className="block text-sm text-dark-400 mb-1.5">
                {t('auth.email', locale)}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="user@zdc.io"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-dark-400 mb-1.5">
                {t('auth.password', locale)}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-10"
                  placeholder="********"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {isLogin && (
              <label className="flex items-center gap-2 text-sm text-dark-400 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-dark-600 bg-dark-900 text-neon-500 focus:ring-neon-500/20"
                />
                {t('auth.rememberMe', locale)}
              </label>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? t('common.loading', locale)
                : isLogin
                ? t('auth.login', locale)
                : t('auth.register', locale)}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-dark-500">
            {isLogin ? t('auth.noAccount', locale) : t('auth.hasAccount', locale)}{' '}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-neon-400 hover:text-neon-300 font-medium"
            >
              {isLogin ? t('auth.register', locale) : t('auth.login', locale)}
            </button>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-dark-600 font-mono">
          &gt; secure connection established_
        </p>
      </div>
    </div>
  );
}
