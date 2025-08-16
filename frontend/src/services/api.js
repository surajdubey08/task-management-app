import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for error handling
api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only log errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', error.response?.data || error.message);
    }
    return Promise.reject(error);
  }
);

// Tasks API
export const tasksApi = {
  getAll: (params = {}) => api.get('/tasks', { params }),
  getById: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
};

// Users API
export const usersApi = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  getByEmail: (email) => api.get(`/users/email/${email}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

// Categories API
export const categoriesApi = {
  getAll: (activeOnly = false) => api.get('/categories', { params: { activeOnly } }),
  getById: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

// Task Comments API
export const taskCommentsApi = {
  getByTaskId: (taskId) => api.get(`/tasks/${taskId}/comments`),
  getById: (taskId, commentId) => api.get(`/tasks/${taskId}/comments/${commentId}`),
  create: (taskId, data) => api.post(`/tasks/${taskId}/comments`, data),
  update: (taskId, commentId, data) => api.put(`/tasks/${taskId}/comments/${commentId}`, data),
  delete: (taskId, commentId) => api.delete(`/tasks/${taskId}/comments/${commentId}`),
};

// Task Activities API
export const taskActivitiesApi = {
  getByTaskId: (taskId) => api.get(`/tasks/${taskId}/activities`),
};



export default api;
