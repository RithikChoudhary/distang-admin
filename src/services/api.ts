import axios from 'axios';

// Update this to your backend URL
const API_BASE_URL = import.meta.env.DEV 
  ? 'http://localhost:3000' 
  : 'https://api.codex-couples.com';

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

export const adminApi = {
  // Auth
  login: (email: string, password: string) => 
    api.post('/admin/login', { email, password }),

  // Dashboard
  getStats: () => api.get('/admin/stats'),

  // Users
  getUsers: (page = 1, limit = 20, search = '') => 
    api.get('/admin/users', { params: { page, limit, search } }),
  
  getUser: (id: string) => api.get(`/admin/users/${id}`),
  
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  
  updateUser: (id: string, data: any) => 
    api.patch(`/admin/users/${id}`, data),

  // Couples
  getCouples: (page = 1, limit = 20) => 
    api.get('/admin/couples', { params: { page, limit } }),
  
  deleteCouple: (id: string) => api.delete(`/admin/couples/${id}`),

  // Memories
  getMemories: (page = 1, limit = 20, coupleId = '') => 
    api.get('/admin/memories', { params: { page, limit, coupleId } }),
  
  deleteMemory: (id: string) => api.delete(`/admin/memories/${id}`),

  // Messages
  getMessages: (page = 1, limit = 50, coupleId = '') => 
    api.get('/admin/messages', { params: { page, limit, coupleId } }),
  
  deleteMessage: (id: string) => api.delete(`/admin/messages/${id}`),

  // System
  getHealth: () => api.get('/health'),
  getLogs: (level = 'error', limit = 100) => 
    api.get('/admin/logs', { params: { level, limit } }),
};

export default api;

