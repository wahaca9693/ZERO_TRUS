'use client';

import { useState, useEffect, useCallback, DragEvent } from 'react';
import {
  FolderOpen,
  FileIcon,
  Upload,
  FolderPlus,
  Trash2,
  ChevronRight,
  Home,
  Image,
  FileText,
  FileCode,
  Film,
  Music,
  Archive,
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { api, FileItem } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { t } from '@/lib/i18n';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getFileIcon(mimeType: string) {
  if (mimeType === 'folder') return FolderOpen;
  if (mimeType.startsWith('image/')) return Image;
  if (mimeType.startsWith('video/')) return Film;
  if (mimeType.startsWith('audio/')) return Music;
  if (mimeType.includes('zip') || mimeType.includes('tar') || mimeType.includes('rar'))
    return Archive;
  if (mimeType.includes('text') || mimeType.includes('pdf')) return FileText;
  if (mimeType.includes('json') || mimeType.includes('javascript') || mimeType.includes('xml'))
    return FileCode;
  return FileIcon;
}

export default function FilesPage() {
  const { locale } = useAuth();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [path, setPath] = useState<{ id: string | null; name: string }[]>([
    { id: null, name: 'Root' },
  ]);
  const [isDragging, setIsDragging] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [loading, setLoading] = useState(true);

  const currentParentId = path[path.length - 1].id;

  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getFiles(currentParentId ?? undefined);
      setFiles(data);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  }, [currentParentId]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleUpload = async (fileList: FileList) => {
    for (let i = 0; i < fileList.length; i++) {
      const formData = new FormData();
      formData.append('file', fileList[i]);
      if (currentParentId) {
        formData.append('parentId', currentParentId);
      }
      await api.uploadFile(formData);
    }
    loadFiles();
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files);
    }
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    await api.createFolder({
      name: newFolderName,
      parentId: currentParentId ?? undefined,
    });
    setNewFolderName('');
    setShowNewFolder(false);
    loadFiles();
  };

  const deleteFile = async (id: string) => {
    await api.deleteFile(id);
    loadFiles();
  };

  const navigateToFolder = (file: FileItem) => {
    setPath([...path, { id: file.id, name: file.originalName }]);
  };

  const navigateToPath = (index: number) => {
    setPath(path.slice(0, index + 1));
  };

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-dark-100">
            {t('files.title', locale)}
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowNewFolder(true)}
              className="btn-secondary text-sm flex items-center gap-1.5"
            >
              <FolderPlus className="w-4 h-4" />
              {t('files.newFolder', locale)}
            </button>
            <label className="btn-primary text-sm flex items-center gap-1.5 cursor-pointer">
              <Upload className="w-4 h-4" />
              {t('files.upload', locale)}
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && handleUpload(e.target.files)}
              />
            </label>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1 mb-4 text-sm">
          {path.map((p, i) => (
            <div key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="w-3 h-3 text-dark-600" />}
              <button
                onClick={() => navigateToPath(i)}
                className={`flex items-center gap-1 px-2 py-1 rounded hover:bg-dark-900 transition-all ${
                  i === path.length - 1
                    ? 'text-neon-400'
                    : 'text-dark-400 hover:text-dark-200'
                }`}
              >
                {i === 0 && <Home className="w-3 h-3" />}
                {p.name}
              </button>
            </div>
          ))}
        </div>

        {showNewFolder && (
          <div className="mb-4 flex gap-2">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name..."
              className="input-field flex-1 max-w-xs"
              onKeyDown={(e) => e.key === 'Enter' && createFolder()}
            />
            <button onClick={createFolder} className="btn-primary text-sm">
              {t('common.create', locale)}
            </button>
            <button
              onClick={() => setShowNewFolder(false)}
              className="btn-secondary text-sm"
            >
              {t('common.cancel', locale)}
            </button>
          </div>
        )}

        {/* Drop Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`card min-h-[400px] transition-all duration-200 ${
            isDragging ? 'border-neon-500 bg-neon-500/5' : ''
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-6 h-6 border-2 border-neon-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : files.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24">
              <Upload className="w-16 h-16 text-dark-700 mb-4" />
              <p className="text-dark-400 text-lg mb-1">
                {t('files.dragDrop', locale)}
              </p>
              <p className="text-dark-600 text-sm">
                or click Upload to browse
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 p-4">
              {files.map((file) => {
                const Icon = getFileIcon(file.mimeType);
                return (
                  <div
                    key={file.id}
                    className="group relative p-4 rounded-lg hover:bg-dark-900 border border-transparent hover:border-dark-700 transition-all cursor-pointer text-center"
                    onDoubleClick={() =>
                      file.isFolder && navigateToFolder(file)
                    }
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteFile(file.id);
                      }}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <Icon
                      className={`w-10 h-10 mx-auto mb-2 ${
                        file.isFolder ? 'text-neon-400' : 'text-dark-400'
                      }`}
                    />
                    <p className="text-xs text-dark-200 truncate">
                      {file.originalName}
                    </p>
                    {!file.isFolder && (
                      <p className="text-[10px] text-dark-600 mt-1">
                        {formatBytes(file.size)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
