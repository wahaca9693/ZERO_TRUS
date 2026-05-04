'use client';

import { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  Activity,
  FileText,
  Search,
  Ban,
  CheckCircle2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Server,
  Database,
  HardDrive,
  Clock,
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { api, User, LogEntry, LogStats, Pagination } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { t } from '@/lib/i18n';

export default function AdminPage() {
  const { user: currentUser, locale } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'logs' | 'monitoring'>(
    'users'
  );
  const [users, setUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userPagination, setUserPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logPagination, setLogPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });
  const [logStats, setLogStats] = useState<LogStats | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin =
    currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN';

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const data = await api.getUsers({
          page: userPagination.page,
          search: userSearch || undefined,
        });
        setUsers(data.users);
        setUserPagination(data.pagination);
      } else if (activeTab === 'logs') {
        const [logsData, stats] = await Promise.all([
          api.getLogs({ page: logPagination.page }),
          api.getLogStats(),
        ]);
        setLogs(logsData.logs);
        setLogPagination(logsData.pagination);
        setLogStats(stats);
      }
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getUsers({ page: 1, search: userSearch });
      setUsers(data.users);
      setUserPagination(data.pagination);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  const updateUserStatus = async (userId: string, status: string) => {
    await api.updateUser(userId, { status } as Partial<User>);
    loadData();
  };

  const deleteUser = async (userId: string) => {
    await api.deleteUser(userId);
    loadData();
  };

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-dark-200 mb-2">
              Access Denied
            </h2>
            <p className="text-dark-500">
              You need admin privileges to access this panel.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const tabs = [
    { id: 'users' as const, label: t('admin.users', locale), icon: Users },
    { id: 'logs' as const, label: t('admin.logs', locale), icon: FileText },
    { id: 'monitoring' as const, label: t('admin.monitoring', locale), icon: Activity },
  ];

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-dark-100">
              {t('admin.title', locale)}
            </h1>
            <p className="text-dark-500 text-sm">
              System administration and monitoring
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-dark-800 pb-px">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-neon-500 text-neon-400'
                    : 'border-transparent text-dark-400 hover:text-dark-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
                  placeholder={t('common.search', locale)}
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div className="card overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-6 h-6 border-2 border-neon-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-dark-800">
                      <th className="text-left px-5 py-3 text-xs text-dark-500 font-mono uppercase">
                        User
                      </th>
                      <th className="text-left px-5 py-3 text-xs text-dark-500 font-mono uppercase">
                        Role
                      </th>
                      <th className="text-left px-5 py-3 text-xs text-dark-500 font-mono uppercase">
                        Status
                      </th>
                      <th className="text-left px-5 py-3 text-xs text-dark-500 font-mono uppercase">
                        Last Login
                      </th>
                      <th className="text-right px-5 py-3 text-xs text-dark-500 font-mono uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr
                        key={u.id}
                        className="border-b border-dark-800/50 hover:bg-dark-900/30"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-neon-500/20 flex items-center justify-center text-neon-400 text-xs font-bold">
                              {u.username[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm text-dark-200">
                                {u.username}
                              </p>
                              <p className="text-xs text-dark-500">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`text-xs px-2.5 py-1 rounded-full ${
                              u.role === 'SUPER_ADMIN'
                                ? 'bg-red-500/10 text-red-400'
                                : u.role === 'ADMIN'
                                ? 'bg-orange-500/10 text-orange-400'
                                : 'bg-dark-800 text-dark-400'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`text-xs px-2.5 py-1 rounded-full ${
                              u.status === 'ACTIVE'
                                ? 'bg-neon-500/10 text-neon-400'
                                : 'bg-red-500/10 text-red-400'
                            }`}
                          >
                            {u.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-dark-400">
                          {u.lastLogin
                            ? new Date(u.lastLogin).toLocaleString()
                            : 'Never'}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1">
                            {u.status === 'ACTIVE' ? (
                              <button
                                onClick={() =>
                                  updateUserStatus(u.id, 'BANNED')
                                }
                                className="p-2 rounded hover:bg-red-500/10 text-dark-400 hover:text-red-400"
                                title="Ban"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  updateUserStatus(u.id, 'ACTIVE')
                                }
                                className="p-2 rounded hover:bg-neon-500/10 text-dark-400 hover:text-neon-400"
                                title="Activate"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                            )}
                            {currentUser?.role === 'SUPER_ADMIN' && (
                              <button
                                onClick={() => deleteUser(u.id)}
                                className="p-2 rounded hover:bg-red-500/10 text-dark-400 hover:text-red-400"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Pagination */}
              {userPagination.pages > 1 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-dark-800">
                  <p className="text-xs text-dark-500">
                    Page {userPagination.page} of {userPagination.pages} (
                    {userPagination.total} users)
                  </p>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setUserPagination((p) => ({
                          ...p,
                          page: p.page - 1,
                        }));
                        loadData();
                      }}
                      disabled={userPagination.page <= 1}
                      className="p-2 rounded hover:bg-dark-800 text-dark-400 disabled:opacity-30"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setUserPagination((p) => ({
                          ...p,
                          page: p.page + 1,
                        }));
                        loadData();
                      }}
                      disabled={userPagination.page >= userPagination.pages}
                      className="p-2 rounded hover:bg-dark-800 text-dark-400 disabled:opacity-30"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <div>
            {logStats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {[
                  {
                    label: 'Total Logs',
                    value: logStats.totalLogs,
                    icon: FileText,
                    color: 'text-neon-400',
                    bg: 'bg-neon-500/10',
                  },
                  {
                    label: 'Today',
                    value: logStats.todayLogs,
                    icon: Clock,
                    color: 'text-blue-400',
                    bg: 'bg-blue-500/10',
                  },
                  {
                    label: 'This Week',
                    value: logStats.weekLogs,
                    icon: Activity,
                    color: 'text-purple-400',
                    bg: 'bg-purple-500/10',
                  },
                  {
                    label: 'Active Users',
                    value: `${logStats.activeUsers}/${logStats.totalUsers}`,
                    icon: Users,
                    color: 'text-orange-400',
                    bg: 'bg-orange-500/10',
                  },
                ].map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} className="card-hover p-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}
                        >
                          <Icon className={`w-4 h-4 ${stat.color}`} />
                        </div>
                        <div>
                          <p className="text-lg font-bold text-dark-100 font-mono">
                            {stat.value}
                          </p>
                          <p className="text-xs text-dark-500">{stat.label}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="card overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-6 h-6 border-2 border-neon-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="divide-y divide-dark-800/50">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="px-5 py-3 flex items-center justify-between hover:bg-dark-900/30"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            log.action === 'LOGIN' || log.action === 'REGISTER'
                              ? 'bg-neon-400'
                              : log.action === 'LOGOUT'
                              ? 'bg-blue-400'
                              : 'bg-dark-500'
                          }`}
                        />
                        <div>
                          <p className="text-sm text-dark-200">
                            <span className="font-mono text-neon-400">
                              {log.action}
                            </span>
                            {log.user && (
                              <span className="text-dark-400">
                                {' '}
                                by {log.user.username}
                              </span>
                            )}
                          </p>
                          {log.resource && (
                            <p className="text-xs text-dark-600 font-mono">
                              {log.resource}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-dark-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </p>
                        {log.ip && (
                          <p className="text-[10px] text-dark-600 font-mono">
                            {log.ip}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {logPagination.pages > 1 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-dark-800">
                  <p className="text-xs text-dark-500">
                    Page {logPagination.page} of {logPagination.pages}
                  </p>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setLogPagination((p) => ({ ...p, page: p.page - 1 }));
                        loadData();
                      }}
                      disabled={logPagination.page <= 1}
                      className="p-2 rounded hover:bg-dark-800 text-dark-400 disabled:opacity-30"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setLogPagination((p) => ({ ...p, page: p.page + 1 }));
                        loadData();
                      }}
                      disabled={logPagination.page >= logPagination.pages}
                      className="p-2 rounded hover:bg-dark-800 text-dark-400 disabled:opacity-30"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Monitoring Tab */}
        {activeTab === 'monitoring' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-dark-100 mb-4 flex items-center gap-2">
                <Server className="w-5 h-5 text-neon-400" />
                Server Status
              </h3>
              <div className="space-y-4">
                {[
                  { label: 'API Server', status: 'Online', color: 'bg-neon-400' },
                  { label: 'Database', status: 'Online', color: 'bg-neon-400' },
                  { label: 'Redis Cache', status: 'Online', color: 'bg-neon-400' },
                  { label: 'File Storage', status: 'Online', color: 'bg-neon-400' },
                ].map((service) => (
                  <div
                    key={service.label}
                    className="flex items-center justify-between p-3 rounded-lg bg-dark-900/50"
                  >
                    <span className="text-sm text-dark-300">
                      {service.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${service.color} animate-pulse`}
                      />
                      <span className="text-xs text-neon-400">
                        {service.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-6">
              <h3 className="text-lg font-semibold text-dark-100 mb-4 flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-400" />
                System Resources
              </h3>
              <div className="space-y-4">
                {[
                  { label: 'CPU Usage', value: '23%', percent: 23 },
                  { label: 'Memory', value: '1.2 GB / 4 GB', percent: 30 },
                  { label: 'Disk', value: '12 GB / 100 GB', percent: 12 },
                ].map((resource) => (
                  <div key={resource.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-dark-400">{resource.label}</span>
                      <span className="text-dark-200 font-mono text-xs">
                        {resource.value}
                      </span>
                    </div>
                    <div className="w-full bg-dark-800 rounded-full h-1.5">
                      <div
                        className="bg-neon-500 h-1.5 rounded-full"
                        style={{ width: `${resource.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-6 md:col-span-2">
              <h3 className="text-lg font-semibold text-dark-100 mb-4 flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-purple-400" />
                Quick Info
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Node.js', value: 'v18.x' },
                  { label: 'PostgreSQL', value: '15.x' },
                  { label: 'Redis', value: '7.x' },
                  { label: 'Uptime', value: '99.9%' },
                ].map((info) => (
                  <div
                    key={info.label}
                    className="p-3 rounded-lg bg-dark-900/50 text-center"
                  >
                    <p className="text-xs text-dark-500 mb-1">{info.label}</p>
                    <p className="text-sm text-dark-200 font-mono">
                      {info.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
