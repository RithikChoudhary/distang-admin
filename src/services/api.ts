import axios from 'axios';

// Update this to your backend URL
const API_BASE_URL = import.meta.env.DEV 
  ? 'http://localhost:3000' 
  : 'https://backend.distang.com';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const adminApi = {
  // Auth
  login: (email: string, password: string) => 
    api.post('/admin/login', { email, password }),

  // Dashboard & Analytics
  getStats: () => api.get('/admin/stats'),
  
  getAnalytics: (days = 30) => 
    api.get('/admin/analytics', { params: { days } }),
  
  getActivityFeed: (limit = 50) => 
    api.get('/admin/activity', { params: { limit } }),
  
  getSystemHealth: () => api.get('/admin/health'),

  // Users
  getUsers: (params: PaginationParams = {}) => 
    api.get('/admin/users', { params: { page: 1, limit: 20, ...params } }),
  
  getUser: (id: string) => api.get(`/admin/users/${id}`),
  
  updateUser: (id: string, data: { isBanned?: boolean; isVerified?: boolean; note?: string }) => 
    api.put(`/admin/users/${id}`, data),
  
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),

  // Couples
  getCouples: (params: PaginationParams = {}) => 
    api.get('/admin/couples', { params: { page: 1, limit: 20, ...params } }),
  
  getCouple: (id: string) => api.get(`/admin/couples/${id}`),
  
  deleteCouple: (id: string) => api.delete(`/admin/couples/${id}`),

  // Memories
  getMemories: (params: PaginationParams & { coupleId?: string; type?: string } = {}) => 
    api.get('/admin/memories', { params: { page: 1, limit: 24, ...params } }),
  
  deleteMemory: (id: string) => api.delete(`/admin/memories/${id}`),

  // Messages
  getMessages: (params: PaginationParams & { coupleId?: string; type?: string } = {}) => 
    api.get('/admin/messages', { params: { page: 1, limit: 50, ...params } }),
  
  deleteMessage: (id: string) => api.delete(`/admin/messages/${id}`),

  // Export
  exportData: (type: 'users' | 'couples' | 'messages' | 'memories') => 
    api.get('/admin/export', { params: { type } }),
};

export default api;
