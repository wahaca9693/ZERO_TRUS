'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import {
  LayoutDashboard,
  Database,
  FolderOpen,
  Key,
  Settings,
  Shield,
  LogOut,
  Terminal,
  Globe,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { t } from '@/lib/i18n';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'nav.dashboard' },
  { href: '/explorer', icon: Database, label: 'nav.explorer' },
  { href: '/files', icon: FolderOpen, label: 'nav.files' },
  { href: '/api-keys', icon: Key, label: 'nav.apiKeys' },
  { href: '/settings', icon: Settings, label: 'nav.settings' },
];

const adminItems = [
  { href: '/admin', icon: Shield, label: 'nav.admin' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout, locale, setLocale } = useAuth();

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  return (
    <aside className="sidebar fixed top-0 left-0 h-screen w-64 bg-dark-950 border-r border-dark-800 flex flex-col z-40">
      <div className="p-6 border-b border-dark-800">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-neon-500/20 flex items-center justify-center">
            <Terminal className="w-5 h-5 text-neon-400" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-neon-400 font-mono tracking-wider">
              ZDC
            </h1>
            <p className="text-[10px] text-dark-500 uppercase tracking-widest">
              Zero Data Cloud
            </p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200',
                isActive
                  ? 'bg-neon-500/10 text-neon-400 border-glow'
                  : 'text-dark-400 hover:text-dark-200 hover:bg-dark-900'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{t(item.label, locale)}</span>
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <div className="pt-4 pb-2">
              <p className="px-3 text-[10px] text-dark-600 uppercase tracking-widest font-mono">
                Admin
              </p>
            </div>
            {adminItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200',
                    isActive
                      ? 'bg-neon-500/10 text-neon-400 border-glow'
                      : 'text-dark-400 hover:text-dark-200 hover:bg-dark-900'
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{t(item.label, locale)}</span>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      <div className="p-4 border-t border-dark-800 space-y-2">
        <button
          onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-dark-400 hover:text-dark-200 hover:bg-dark-900 transition-all duration-200"
        >
          <Globe className="w-4 h-4" />
          <span>{locale === 'en' ? 'العربية' : 'English'}</span>
        </button>

        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-neon-500/20 flex items-center justify-center text-neon-400 text-xs font-bold">
            {user?.username?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-dark-200 truncate">{user?.username}</p>
            <p className="text-[10px] text-dark-500 font-mono">{user?.role}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          <span>{t('nav.logout', locale)}</span>
        </button>
      </div>
    </aside>
  );
}
