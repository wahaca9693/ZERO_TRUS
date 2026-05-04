'use client';

import { useState, useEffect } from 'react';
import {
  Key,
  Plus,
  Trash2,
  Copy,
  Check,
  Shield,
  Clock,
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { api, ApiKeyItem } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { t } from '@/lib/i18n';

const ALL_PERMISSIONS = [
  'create_data',
  'edit_data',
  'delete_data',
  'view_data',
  'share_data',
  'access_api',
];

export default function ApiKeysPage() {
  const { locale } = useAuth();
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = async () => {
    try {
      const data = await api.getApiKeys();
      setKeys(data);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  const createKey = async () => {
    if (!newKeyName.trim()) return;
    try {
      const key = await api.createApiKey({
        name: newKeyName,
        permissions: selectedPermissions,
      });
      setNewlyCreatedKey(key.key);
      setNewKeyName('');
      setSelectedPermissions([]);
      setShowCreate(false);
      loadKeys();
    } catch {
      // Handle error
    }
  };

  const deleteKey = async (id: string) => {
    await api.deleteApiKey(id);
    loadKeys();
  };

  const copyKey = (key: string, id: string) => {
    navigator.clipboard.writeText(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const togglePermission = (perm: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-dark-100">
              {t('api.title', locale)}
            </h1>
            <p className="text-dark-500 text-sm mt-1">
              Manage API access keys and permissions
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="btn-primary flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            {t('api.newKey', locale)}
          </button>
        </div>

        {/* New Key Created Banner */}
        {newlyCreatedKey && (
          <div className="mb-6 card p-4 border-neon-500/30 bg-neon-500/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neon-400 font-medium mb-1">
                  New API Key Created
                </p>
                <p className="text-xs text-dark-400">
                  Copy this key now. It will not be shown again in full.
                </p>
              </div>
              <button
                onClick={() => setNewlyCreatedKey(null)}
                className="text-dark-400 hover:text-dark-200 text-sm"
              >
                Dismiss
              </button>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <code className="flex-1 bg-dark-900 px-4 py-2 rounded-lg text-neon-400 text-sm font-mono">
                {newlyCreatedKey}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(newlyCreatedKey);
                }}
                className="btn-primary text-sm"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Create Key Form */}
        {showCreate && (
          <div className="mb-6 card p-6">
            <h3 className="text-lg font-semibold text-dark-100 mb-4">
              Create New API Key
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-dark-400 mb-1.5">
                  {t('api.name', locale)}
                </label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="input-field max-w-md"
                  placeholder="My API Key"
                />
              </div>

              <div>
                <label className="block text-sm text-dark-400 mb-2">
                  {t('api.permissions', locale)}
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {ALL_PERMISSIONS.map((perm) => (
                    <label
                      key={perm}
                      className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedPermissions.includes(perm)
                          ? 'border-neon-500/50 bg-neon-500/5 text-neon-400'
                          : 'border-dark-700 text-dark-400 hover:border-dark-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(perm)}
                        onChange={() => togglePermission(perm)}
                        className="hidden"
                      />
                      <Shield className="w-3.5 h-3.5" />
                      <span className="text-sm">{perm}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={createKey} className="btn-primary">
                  {t('common.create', locale)}
                </button>
                <button
                  onClick={() => setShowCreate(false)}
                  className="btn-secondary"
                >
                  {t('common.cancel', locale)}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Keys List */}
        <div className="card">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-neon-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : keys.length === 0 ? (
            <div className="text-center py-16">
              <Key className="w-12 h-12 text-dark-700 mx-auto mb-3" />
              <p className="text-dark-500">{t('common.noData', locale)}</p>
            </div>
          ) : (
            <div className="divide-y divide-dark-800">
              {keys.map((key) => (
                <div
                  key={key.id}
                  className="p-5 flex items-center justify-between hover:bg-dark-900/30 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <Key className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-dark-200">
                        {key.name}
                      </p>
                      <code className="text-xs text-dark-500 font-mono">
                        {key.key}
                      </code>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex gap-1">
                      {(key.permissions as string[]).slice(0, 3).map((p) => (
                        <span
                          key={p}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-dark-800 text-dark-400"
                        >
                          {p}
                        </span>
                      ))}
                      {(key.permissions as string[]).length > 3 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-dark-800 text-dark-400">
                          +{(key.permissions as string[]).length - 3}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-xs text-dark-500">
                      <Clock className="w-3 h-3" />
                      {new Date(key.createdAt).toLocaleDateString()}
                    </div>

                    <div className="flex gap-1">
                      <button
                        onClick={() => copyKey(key.key, key.id)}
                        className="p-2 rounded hover:bg-dark-800 text-dark-400 hover:text-dark-200"
                      >
                        {copiedId === key.id ? (
                          <Check className="w-4 h-4 text-neon-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => deleteKey(key.id)}
                        className="p-2 rounded hover:bg-red-500/10 text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
