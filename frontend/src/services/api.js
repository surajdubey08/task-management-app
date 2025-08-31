import axios from 'axios';

// API configuration with enhanced authentication support
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
const getAccessToken = () => localStorage.getItem('accessToken');
const getRefreshToken = () => localStorage.getItem('refreshToken');
const setTokens = (accessToken, refreshToken, expiresAt) => {
  if (accessToken) localStorage.setItem('accessToken', accessToken);
  if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
  if (expiresAt) localStorage.setItem('tokenExpiry', expiresAt);
};
const clearTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('tokenExpiry');
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = getRefreshToken();
        const accessToken = getAccessToken();
        
        if (refreshToken && accessToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
            accessToken,
            refreshToken,
          });

          const { accessToken: newAccessToken, refreshToken: newRefreshToken, expiresAt } = response.data;
          setTokens(newAccessToken, newRefreshToken, expiresAt);

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens
        clearTokens();
        // Don't redirect here, let AuthContext handle it
        return Promise.reject(refreshError);
      }
    }

    // Log errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', error.response?.data || error.message);
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (data) => api.post('/auth/login', data).then(res => res.data),
  register: (data) => api.post('/auth/register', data).then(res => res.data),
  logout: () => api.post('/auth/logout').then(res => res.data),
  refreshToken: (data) => api.post('/auth/refresh-token', data).then(res => res.data),
  getCurrentUser: () => api.get('/auth/me').then(res => res.data),
  changePassword: (data) => api.post('/auth/change-password', data).then(res => res.data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data).then(res => res.data),
  resetPassword: (data) => api.post('/auth/reset-password', data).then(res => res.data),
  validateToken: () => api.get('/auth/validate').then(res => res.data),
};

// Tasks API
export const tasksAPI = {
  getAll: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        searchParams.append(key, params[key]);
      }
    });
    const queryString = searchParams.toString();
    return api.get(`/tasks${queryString ? `?${queryString}` : ''}`).then(res => res.data);
  },
  getById: (id) => api.get(`/tasks/${id}`).then(res => res.data),
  create: (data) => api.post('/tasks', data).then(res => res.data),
  update: (id, data) => api.put(`/tasks/${id}`, data).then(res => res.data),
  delete: (id) => api.delete(`/tasks/${id}`).then(res => res.data),
  bulkUpdate: (updates) => api.post('/tasks/bulk-update', updates).then(res => res.data),
  search: (query) => api.get(`/tasks/search?q=${encodeURIComponent(query)}`).then(res => res.data),
};

// Users API
export const usersAPI = {
  getAll: () => api.get('/users').then(res => res.data),
  getById: (id) => api.get(`/users/${id}`).then(res => res.data),
  getByEmail: (email) => api.get(`/users/email/${email}`).then(res => res.data),
  create: (data) => api.post('/users', data).then(res => res.data),
  update: (id, data) => api.put(`/users/${id}`, data).then(res => res.data),
  delete: (id) => api.delete(`/users/${id}`).then(res => res.data),
};

// Categories API
export const categoriesAPI = {
  getAll: (activeOnly = false) => api.get(`/categories?activeOnly=${activeOnly}`).then(res => res.data),
  getById: (id) => api.get(`/categories/${id}`).then(res => res.data),
  create: (data) => api.post('/categories', data).then(res => res.data),
  update: (id, data) => api.put(`/categories/${id}`, data).then(res => res.data),
  delete: (id) => api.delete(`/categories/${id}`).then(res => res.data),
};

// Task Comments API
export const taskCommentsAPI = {
  getByTaskId: (taskId) => api.get(`/tasks/${taskId}/comments`).then(res => res.data),
  create: (taskId, data) => api.post(`/tasks/${taskId}/comments`, data).then(res => res.data),
  update: (taskId, commentId, data) => api.put(`/tasks/${taskId}/comments/${commentId}`, data).then(res => res.data),
  delete: (taskId, commentId) => api.delete(`/tasks/${taskId}/comments/${commentId}`).then(res => res.data),
};

// Task Activities API
export const taskActivitiesAPI = {
  getByTaskId: (taskId) => api.get(`/tasks/${taskId}/activities`).then(res => res.data),
};

// Backward compatibility with existing naming
export const tasksApi = tasksAPI;
export const usersApi = usersAPI;
export const categoriesApi = categoriesAPI;
export const taskCommentsApi = taskCommentsAPI;
export const taskActivitiesApi = taskActivitiesAPI;

// Analytics API (future implementation)
export const analyticsAPI = {
  getDashboardStats: () => api.get('/analytics/dashboard').then(res => res.data),
  getTaskMetrics: (params = {}) => api.get('/analytics/tasks', { params }).then(res => res.data),
  getUserProductivity: (userId, params = {}) => api.get(`/analytics/users/${userId}/productivity`, { params }).then(res => res.data),
  getTeamPerformance: (teamId, params = {}) => api.get(`/analytics/teams/${teamId}/performance`, { params }).then(res => res.data),
};

// File Upload API (future implementation)
export const filesAPI = {
  upload: (file, taskId) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('taskId', taskId);
    return api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }).then(res => res.data);
  },
  delete: (fileId) => api.delete(`/files/${fileId}`).then(res => res.data),
  download: (fileId) => api.get(`/files/${fileId}/download`, { responseType: 'blob' }).then(res => res.data),
};

// Notifications API (future implementation)
export const notificationsAPI = {
  getAll: () => api.get('/notifications').then(res => res.data),
  markAsRead: (id) => api.put(`/notifications/${id}/read`).then(res => res.data),
  markAllAsRead: () => api.put('/notifications/read-all').then(res => res.data),
  getUnreadCount: () => api.get('/notifications/unread-count').then(res => res.data),
};

export default api;
