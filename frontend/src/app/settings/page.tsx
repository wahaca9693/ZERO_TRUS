'use client';

import { useState, FormEvent } from 'react';
import {
  User,
  Shield,
  Lock,
  Save,
  Eye,
  EyeOff,
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { t } from '@/lib/i18n';

export default function SettingsPage() {
  const { user, locale } = useAuth();
  const [activeTab, setActiveTab] = useState<'account' | 'security'>('account');
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      await api.updateUser(user!.id, { username, email });
      setMessage('Profile updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      await api.changePassword(user!.id, { currentPassword, newPassword });
      setMessage('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    }
  };

  const tabs = [
    { id: 'account' as const, label: t('settings.account', locale), icon: User },
    { id: 'security' as const, label: t('settings.security', locale), icon: Shield },
  ];

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-dark-100 mb-6">
          {t('settings.title', locale)}
        </h1>

        <div className="flex gap-6">
          {/* Tabs */}
          <div className="w-56 space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMessage('');
                    setError('');
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all ${
                    activeTab === tab.id
                      ? 'bg-neon-500/10 text-neon-400 border-glow'
                      : 'text-dark-400 hover:bg-dark-900 hover:text-dark-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 max-w-2xl">
            {message && (
              <div className="mb-4 p-3 rounded-lg bg-neon-500/10 border border-neon-500/30 text-neon-400 text-sm">
                {message}
              </div>
            )}
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            {activeTab === 'account' && (
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-dark-100 mb-6 flex items-center gap-2">
                  <User className="w-5 h-5 text-neon-400" />
                  {t('settings.account', locale)}
                </h2>

                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className="block text-sm text-dark-400 mb-1.5">
                      {t('auth.username', locale)}
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-dark-400 mb-1.5">
                      {t('auth.email', locale)}
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-dark-400 mb-1.5">
                        Role
                      </label>
                      <input
                        type="text"
                        value={user?.role || ''}
                        className="input-field opacity-60"
                        disabled
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-dark-400 mb-1.5">
                        Member Since
                      </label>
                      <input
                        type="text"
                        value={
                          user?.createdAt
                            ? new Date(user.createdAt).toLocaleDateString()
                            : ''
                        }
                        className="input-field opacity-60"
                        disabled
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn-primary flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {t('common.save', locale)}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-dark-100 mb-6 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-neon-400" />
                  {t('settings.changePassword', locale)}
                </h2>

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm text-dark-400 mb-1.5">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="input-field pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowCurrentPassword(!showCurrentPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500"
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-dark-400 mb-1.5">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="input-field pr-10"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500"
                      >
                        {showNewPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-dark-400 mb-1.5">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="input-field"
                      required
                      minLength={8}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn-primary flex items-center gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    {t('settings.changePassword', locale)}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
