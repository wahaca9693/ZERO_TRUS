'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Database,
  Plus,
  Trash2,
  Search,
  ChevronRight,
  FileJson,
  Table2,
  FileUp,
  Eye,
  Edit3,
  X,
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { api, Project, Collection, DataItem } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { t } from '@/lib/i18n';

function ExplorerContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  const { locale } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(projectId);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [dataItems, setDataItems] = useState<DataItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionType, setNewCollectionType] = useState('JSON');
  const [showDataEditor, setShowDataEditor] = useState(false);
  const [editingData, setEditingData] = useState<string>('{}');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [viewingItem, setViewingItem] = useState<DataItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getProjects().then((data) => {
      setProjects(data.projects);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (selectedProject) {
      api.getCollections(selectedProject).then(setCollections);
    }
  }, [selectedProject]);

  useEffect(() => {
    if (selectedCollection) {
      api
        .getDataItems(selectedCollection, { search: searchQuery || undefined })
        .then((data) => setDataItems(data.items));
    }
  }, [selectedCollection, searchQuery]);

  const createCollection = async () => {
    if (!selectedProject || !newCollectionName.trim()) return;
    await api.createCollection({
      projectId: selectedProject,
      name: newCollectionName,
      type: newCollectionType,
    });
    setNewCollectionName('');
    setShowNewCollection(false);
    api.getCollections(selectedProject).then(setCollections);
  };

  const saveData = async () => {
    if (!selectedCollection) return;
    try {
      const parsed = JSON.parse(editingData);
      if (editingItemId) {
        await api.updateDataItem(editingItemId, { data: parsed });
      } else {
        await api.createDataItem({ collectionId: selectedCollection, data: parsed });
      }
      setShowDataEditor(false);
      setEditingItemId(null);
      setEditingData('{}');
      api
        .getDataItems(selectedCollection)
        .then((data) => setDataItems(data.items));
    } catch {
      // Invalid JSON
    }
  };

  const deleteItem = async (id: string) => {
    await api.deleteDataItem(id);
    if (selectedCollection) {
      api
        .getDataItems(selectedCollection)
        .then((data) => setDataItems(data.items));
    }
  };

  const deleteCollection = async (id: string) => {
    await api.deleteCollection(id);
    setSelectedCollection(null);
    setDataItems([]);
    if (selectedProject) {
      api.getCollections(selectedProject).then(setCollections);
    }
  };

  const typeIcons: Record<string, typeof FileJson> = {
    JSON: FileJson,
    TABLE: Table2,
    FILE: FileUp,
  };

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-dark-100">
            {t('explorer.title', locale)}
          </h1>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Left: Projects & Collections */}
          <div className="col-span-3 space-y-4">
            <div className="card p-4">
              <h3 className="text-xs font-mono text-dark-500 uppercase tracking-widest mb-3">
                {t('dashboard.projects', locale)}
              </h3>
              {loading ? (
                <div className="flex justify-center py-4">
                  <div className="w-5 h-5 border-2 border-neon-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="space-y-1">
                  {projects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => {
                        setSelectedProject(project.id);
                        setSelectedCollection(null);
                        setDataItems([]);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                        selectedProject === project.id
                          ? 'bg-neon-500/10 text-neon-400'
                          : 'text-dark-400 hover:bg-dark-900 hover:text-dark-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <ChevronRight className="w-3 h-3" />
                        {project.name}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedProject && (
              <div className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-mono text-dark-500 uppercase tracking-widest">
                    Collections
                  </h3>
                  <button
                    onClick={() => setShowNewCollection(true)}
                    className="text-neon-400 hover:text-neon-300"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {showNewCollection && (
                  <div className="mb-3 space-y-2">
                    <input
                      type="text"
                      value={newCollectionName}
                      onChange={(e) => setNewCollectionName(e.target.value)}
                      placeholder="Collection name"
                      className="input-field text-sm"
                    />
                    <select
                      value={newCollectionType}
                      onChange={(e) => setNewCollectionType(e.target.value)}
                      className="input-field text-sm"
                    >
                      <option value="JSON">JSON</option>
                      <option value="TABLE">Table</option>
                      <option value="FILE">File</option>
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={createCollection}
                        className="btn-primary text-xs flex-1"
                      >
                        {t('common.create', locale)}
                      </button>
                      <button
                        onClick={() => setShowNewCollection(false)}
                        className="btn-secondary text-xs"
                      >
                        {t('common.cancel', locale)}
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  {collections.map((col) => {
                    const Icon = typeIcons[col.type] || Database;
                    return (
                      <div
                        key={col.id}
                        className={`flex items-center justify-between group px-3 py-2 rounded-lg text-sm transition-all cursor-pointer ${
                          selectedCollection === col.id
                            ? 'bg-neon-500/10 text-neon-400'
                            : 'text-dark-400 hover:bg-dark-900 hover:text-dark-200'
                        }`}
                        onClick={() => setSelectedCollection(col.id)}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="w-3.5 h-3.5" />
                          <span className="truncate">{col.name}</span>
                          <span className="text-[10px] text-dark-600">
                            ({col._count?.dataItems || 0})
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteCollection(col.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right: Data Items */}
          <div className="col-span-9">
            {selectedCollection ? (
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t('explorer.search', locale)}
                      className="input-field pl-10"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setShowDataEditor(true);
                      setEditingItemId(null);
                      setEditingData('{\n  \n}');
                    }}
                    className="btn-primary text-sm flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    {t('explorer.newItem', locale)}
                  </button>
                </div>

                {dataItems.length === 0 ? (
                  <div className="text-center py-16">
                    <Database className="w-12 h-12 text-dark-700 mx-auto mb-3" />
                    <p className="text-dark-500">{t('common.noData', locale)}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {dataItems.map((item) => (
                      <div
                        key={item.id}
                        className="group flex items-center justify-between p-4 rounded-lg bg-dark-900/50 hover:bg-dark-900 border border-transparent hover:border-dark-700 transition-all"
                      >
                        <div className="flex-1 min-w-0">
                          <pre className="text-xs text-dark-300 font-mono truncate max-w-2xl">
                            {JSON.stringify(item.data).slice(0, 200)}
                          </pre>
                          <div className="flex items-center gap-3 mt-1 text-[10px] text-dark-600">
                            <span>v{item.version}</span>
                            <span>
                              {new Date(item.updatedAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setViewingItem(item)}
                            className="p-2 rounded hover:bg-dark-800 text-dark-400 hover:text-dark-200"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setShowDataEditor(true);
                              setEditingItemId(item.id);
                              setEditingData(
                                JSON.stringify(item.data, null, 2)
                              );
                            }}
                            className="p-2 rounded hover:bg-dark-800 text-dark-400 hover:text-dark-200"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteItem(item.id)}
                            className="p-2 rounded hover:bg-dark-800 text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="card p-16 text-center">
                <Database className="w-16 h-16 text-dark-800 mx-auto mb-4" />
                <h3 className="text-lg text-dark-400 mb-2">
                  Select a collection
                </h3>
                <p className="text-sm text-dark-600">
                  Choose a project and collection from the sidebar
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Data Editor Modal */}
        {showDataEditor && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="card p-6 w-full max-w-2xl mx-4 animate-slide-up">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-dark-100">
                  {editingItemId ? t('common.edit', locale) : t('common.create', locale)} Data
                </h3>
                <button
                  onClick={() => {
                    setShowDataEditor(false);
                    setEditingItemId(null);
                  }}
                  className="text-dark-400 hover:text-dark-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <textarea
                value={editingData}
                onChange={(e) => setEditingData(e.target.value)}
                className="input-field font-mono text-sm h-64 resize-none"
                placeholder='{"key": "value"}'
              />
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => {
                    setShowDataEditor(false);
                    setEditingItemId(null);
                  }}
                  className="btn-secondary"
                >
                  {t('common.cancel', locale)}
                </button>
                <button onClick={saveData} className="btn-primary">
                  {t('common.save', locale)}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Item Modal */}
        {viewingItem && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="card p-6 w-full max-w-2xl mx-4 animate-slide-up">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-dark-100">
                    Data Item
                  </h3>
                  <p className="text-xs text-dark-500 font-mono mt-1">
                    ID: {viewingItem.id} | Version: {viewingItem.version}
                  </p>
                </div>
                <button
                  onClick={() => setViewingItem(null)}
                  className="text-dark-400 hover:text-dark-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <pre className="bg-dark-900 border border-dark-700 rounded-lg p-4 text-sm text-neon-400 font-mono overflow-auto max-h-96">
                {JSON.stringify(viewingItem.data, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function ExplorerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-dark-950" />}>
      <ExplorerContent />
    </Suspense>
  );
}
