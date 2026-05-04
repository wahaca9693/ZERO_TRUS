const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface ApiOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('zdc_token', token);
      } else {
        localStorage.removeItem('zdc_token');
      }
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('zdc_token');
    }
    return this.token;
  }

  async request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {} } = options;
    const token = this.getToken();

    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    };

    if (body) {
      config.body = JSON.stringify(body);
    }

    const res = await fetch(`${API_URL}${endpoint}`, config);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data as T;
  }

  async upload(endpoint: string, formData: FormData): Promise<unknown> {
    const token = this.getToken();

    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data;
  }

  // Auth
  register(data: { username: string; email: string; password: string }) {
    return this.request('/auth/register', { method: 'POST', body: data });
  }

  login(data: { email: string; password: string }) {
    return this.request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: data,
    });
  }

  getMe() {
    return this.request<User>('/auth/me');
  }

  // Users
  getUsers(params?: { page?: number; search?: string }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.search) query.set('search', params.search);
    return this.request<{ users: User[]; pagination: Pagination }>(
      `/users?${query}`
    );
  }

  updateUser(id: string, data: Partial<User>) {
    return this.request(`/users/${id}`, { method: 'PUT', body: data });
  }

  deleteUser(id: string) {
    return this.request(`/users/${id}`, { method: 'DELETE' });
  }

  changePassword(id: string, data: { currentPassword: string; newPassword: string }) {
    return this.request(`/users/${id}/password`, { method: 'PUT', body: data });
  }

  // Projects
  getProjects(page = 1) {
    return this.request<{ projects: Project[]; pagination: Pagination }>(
      `/projects?page=${page}`
    );
  }

  createProject(data: { name: string; description?: string }) {
    return this.request<Project>('/projects', { method: 'POST', body: data });
  }

  getProject(id: string) {
    return this.request<Project>(`/projects/${id}`);
  }

  deleteProject(id: string) {
    return this.request(`/projects/${id}`, { method: 'DELETE' });
  }

  // Collections
  getCollections(projectId: string) {
    return this.request<Collection[]>(`/collections?projectId=${projectId}`);
  }

  createCollection(data: {
    projectId: string;
    name: string;
    type?: string;
  }) {
    return this.request<Collection>('/collections', {
      method: 'POST',
      body: data,
    });
  }

  deleteCollection(id: string) {
    return this.request(`/collections/${id}`, { method: 'DELETE' });
  }

  // Data Items
  getDataItems(
    collectionId: string,
    params?: { page?: number; search?: string }
  ) {
    const query = new URLSearchParams({ collectionId });
    if (params?.page) query.set('page', String(params.page));
    if (params?.search) query.set('search', params.search);
    return this.request<{ items: DataItem[]; pagination: Pagination }>(
      `/data?${query}`
    );
  }

  createDataItem(data: { collectionId: string; data: unknown }) {
    return this.request<DataItem>('/data', { method: 'POST', body: data });
  }

  updateDataItem(id: string, data: { data: unknown }) {
    return this.request<DataItem>(`/data/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  deleteDataItem(id: string) {
    return this.request(`/data/${id}`, { method: 'DELETE' });
  }

  // Files
  getFiles(parentId?: string) {
    const query = parentId ? `?parentId=${parentId}` : '';
    return this.request<FileItem[]>(`/files${query}`);
  }

  uploadFile(formData: FormData) {
    return this.upload('/files/upload', formData);
  }

  createFolder(data: { name: string; parentId?: string }) {
    return this.request('/files/folder', { method: 'POST', body: data });
  }

  deleteFile(id: string) {
    return this.request(`/files/${id}`, { method: 'DELETE' });
  }

  // API Keys
  getApiKeys() {
    return this.request<ApiKeyItem[]>('/api-keys');
  }

  createApiKey(data: { name: string; permissions?: string[] }) {
    return this.request<ApiKeyItem>('/api-keys', {
      method: 'POST',
      body: data,
    });
  }

  deleteApiKey(id: string) {
    return this.request(`/api-keys/${id}`, { method: 'DELETE' });
  }

  // Logs
  getLogs(params?: { page?: number; action?: string }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.action) query.set('action', params.action);
    return this.request<{ logs: LogEntry[]; pagination: Pagination }>(
      `/logs?${query}`
    );
  }

  getLogStats() {
    return this.request<LogStats>('/logs/stats');
  }
}

export const api = new ApiClient();

// Types
export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  status?: string;
  storageLimit?: number;
  storageUsed?: number;
  lastLogin?: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  owner?: { id: string; username: string };
  _count?: { collections: number; members: number };
  createdAt: string;
}

export interface Collection {
  id: string;
  projectId: string;
  name: string;
  type: string;
  _count?: { dataItems: number };
  createdAt: string;
}

export interface DataItem {
  id: string;
  collectionId: string;
  data: unknown;
  fileUrl?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface FileItem {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  isFolder: boolean;
  parentId?: string;
  createdAt: string;
}

export interface ApiKeyItem {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  lastUsed?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface LogEntry {
  id: string;
  userId?: string;
  user?: { id: string; username: string; email: string };
  action: string;
  resource?: string;
  details?: unknown;
  ip?: string;
  timestamp: string;
}

export interface LogStats {
  totalLogs: number;
  todayLogs: number;
  weekLogs: number;
  totalUsers: number;
  activeUsers: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}
