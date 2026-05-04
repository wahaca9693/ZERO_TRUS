'use client';

import { useState, useEffect } from 'react';
import {
  Database,
  HardDrive,
  FolderGit2,
  Activity,
  Plus,
  ArrowUpRight,
  Clock,
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { api, Project } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { t } from '@/lib/i18n';
import Link from 'next/link';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function DashboardPage() {
  const { user, locale } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await api.getProjects();
      setProjects(data.projects);
    } catch {
      // Handle error silently
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    if (!newProjectName.trim()) return;
    try {
      await api.createProject({ name: newProjectName });
      setNewProjectName('');
      setShowNewProject(false);
      loadProjects();
    } catch {
      // Handle error
    }
  };

  const stats = [
    {
      label: t('dashboard.projects', locale),
      value: projects.length.toString(),
      icon: FolderGit2,
      color: 'text-neon-400',
      bg: 'bg-neon-500/10',
    },
    {
      label: t('dashboard.storage', locale),
      value: formatBytes(user?.storageUsed || 0),
      icon: HardDrive,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      label: t('dashboard.totalData', locale),
      value: projects
        .reduce((acc, p) => acc + (p._count?.collections || 0), 0)
        .toString(),
      icon: Database,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
    },
    {
      label: t('dashboard.apiCalls', locale),
      value: '--',
      icon: Activity,
      color: 'text-orange-400',
      bg: 'bg-orange-500/10',
    },
  ];

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-dark-100">
              {t('nav.dashboard', locale)}
            </h1>
            <p className="text-dark-500 text-sm mt-1">
              {t('app.tagline', locale)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-dark-400 text-sm">
              {new Date().toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="card-hover p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-dark-600" />
                </div>
                <p className="text-2xl font-bold text-dark-100 font-mono">
                  {stat.value}
                </p>
                <p className="text-sm text-dark-500 mt-1">{stat.label}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-dark-100">
                  {t('dashboard.projects', locale)}
                </h2>
                <button
                  onClick={() => setShowNewProject(true)}
                  className="btn-primary text-sm flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  {t('common.create', locale)}
                </button>
              </div>

              {showNewProject && (
                <div className="mb-4 flex gap-2">
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Project name..."
                    className="input-field flex-1"
                    onKeyDown={(e) => e.key === 'Enter' && createProject()}
                  />
                  <button onClick={createProject} className="btn-primary">
                    {t('common.create', locale)}
                  </button>
                  <button
                    onClick={() => setShowNewProject(false)}
                    className="btn-secondary"
                  >
                    {t('common.cancel', locale)}
                  </button>
                </div>
              )}

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-neon-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-12">
                  <FolderGit2 className="w-12 h-12 text-dark-700 mx-auto mb-3" />
                  <p className="text-dark-500">{t('common.noData', locale)}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {projects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/explorer?projectId=${project.id}`}
                      className="flex items-center justify-between p-4 rounded-lg bg-dark-900/50 hover:bg-dark-900 border border-transparent hover:border-dark-700 transition-all duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-neon-500/10 flex items-center justify-center">
                          <FolderGit2 className="w-4 h-4 text-neon-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-dark-200">
                            {project.name}
                          </p>
                          <p className="text-xs text-dark-500">
                            {project._count?.collections || 0} collections
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-dark-500">
                        <Clock className="w-3 h-3" />
                        {new Date(project.createdAt).toLocaleDateString()}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-dark-100 mb-4">
                {t('dashboard.quickActions', locale)}
              </h2>
              <div className="space-y-2">
                <Link
                  href="/explorer"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-dark-900 transition-all text-sm text-dark-300 hover:text-dark-100"
                >
                  <Database className="w-4 h-4 text-neon-400" />
                  {t('explorer.newCollection', locale)}
                </Link>
                <Link
                  href="/files"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-dark-900 transition-all text-sm text-dark-300 hover:text-dark-100"
                >
                  <HardDrive className="w-4 h-4 text-blue-400" />
                  {t('files.upload', locale)}
                </Link>
                <Link
                  href="/api-keys"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-dark-900 transition-all text-sm text-dark-300 hover:text-dark-100"
                >
                  <Activity className="w-4 h-4 text-purple-400" />
                  {t('api.newKey', locale)}
                </Link>
              </div>
            </div>

            <div className="card p-6">
              <h2 className="text-lg font-semibold text-dark-100 mb-4">
                {t('dashboard.storage', locale)}
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-dark-400">Used</span>
                  <span className="text-dark-200 font-mono">
                    {formatBytes(user?.storageUsed || 0)}
                  </span>
                </div>
                <div className="w-full bg-dark-800 rounded-full h-2">
                  <div
                    className="bg-neon-500 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        ((user?.storageUsed || 0) / (user?.storageLimit || 1)) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-dark-500">
                  <span>0 B</span>
                  <span>{formatBytes(user?.storageLimit || 0)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
