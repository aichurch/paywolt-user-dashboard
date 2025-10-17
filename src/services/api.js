import axios from 'axios';

// API Configuration
const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || 'https://paywolt-backend.onrender.com',
  timeout: 30000, // 30 seconds (important for Render cold starts)
  headers: {
    'Content-Type': 'application/json',
  }
};

// Create axios instance
const api = axios.create(API_CONFIG);

// Request Queue for retry logic
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request Interceptor - Add token & track requests
api.interceptors.request.use(
  (config) => {
    // Add authorization token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request timestamp for debugging
    config.metadata = { startTime: new Date().getTime() };

    // Log request in development
    if (import.meta.env.DEV) {
      console.log(`🚀 API Request: ${config.method.toUpperCase()} ${config.url}`);
    }

    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response Interceptor - Handle errors & calculate response time
api.interceptors.response.use(
  (response) => {
    // Calculate response time
    if (response.config.metadata) {
      const endTime = new Date().getTime();
      const duration = endTime - response.config.metadata.startTime;
      
      if (import.meta.env.DEV) {
        console.log(`✅ API Response: ${response.config.method.toUpperCase()} ${response.config.url} (${duration}ms)`);
      }
    }

    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Log error in development
    if (import.meta.env.DEV) {
      console.error('❌ API Error:', {
        url: error.config?.url,
        status: error.response?.status,
        message: error.response?.data?.message || error.message
      });
    }

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue the request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      // Try to refresh token (if you have refresh token logic)
      // For now, just logout
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      processQueue(error, null);
      isRefreshing = false;

      // Redirect to login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }

      return Promise.reject(error);
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.error('🚫 Access Denied');
      // Optionally show toast notification
    }

    // Handle 404 Not Found
    if (error.response?.status === 404) {
      console.error('🔍 Resource Not Found');
    }

    // Handle 500 Server Error
    if (error.response?.status >= 500) {
      console.error('🔥 Server Error - Please try again later');
      // Optionally show toast notification
    }

    // Handle Network Error
    if (error.message === 'Network Error') {
      console.error('📡 Network Error - Check your connection');
      // Optionally show toast notification
    }

    // Handle Timeout
    if (error.code === 'ECONNABORTED') {
      console.error('⏱️ Request Timeout - Server is taking too long');
      // Optionally show toast notification
    }

    return Promise.reject(error);
  }
);

// Helper function to handle API errors
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error
    return {
      success: false,
      message: error.response.data?.message || 'An error occurred',
      status: error.response.status,
      data: error.response.data
    };
  } else if (error.request) {
    // Request made but no response
    return {
      success: false,
      message: 'No response from server. Please check your connection.',
      status: 0
    };
  } else {
    // Something else happened
    return {
      success: false,
      message: error.message || 'An unexpected error occurred',
      status: 0
    };
  }
};

export default api;

// ==================== API ENDPOINTS ====================

// Authentication API
export const authAPI = {
  login: async (data) => {
    try {
      const response = await api.post('/api/auth/login', data);
      // Store token and user data
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  register: async (data) => {
    try {
      const response = await api.post('/api/auth/register', data);
      // Store token and user data
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  me: async () => {
    try {
      const response = await api.get('/api/auth/me');
      // Update user data
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  logout: async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage regardless of API response
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  }
};

// Wallet API
export const walletAPI = {
  getAll: async () => {
    try {
      const response = await api.get('/api/wallets');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getById: async (id) => {
    try {
      const response = await api.get(`/api/wallets/${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  create: async (data) => {
    try {
      const response = await api.post('/api/wallets', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  update: async (id, data) => {
    try {
      const response = await api.put(`/api/wallets/${id}`, data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  delete: async (id) => {
    try {
      const response = await api.delete(`/api/wallets/${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Additional wallet methods
  getBalance: async (id) => {
    try {
      const response = await api.get(`/api/wallets/${id}/balance`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  requestIBAN: async (walletId, data) => {
    try {
      const response = await api.post(`/api/wallets/${walletId}/iban`, data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
};

// Transaction API
export const transactionAPI = {
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/api/transactions', { params });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getById: async (id) => {
    try {
      const response = await api.get(`/api/transactions/${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  send: async (data) => {
    try {
      const response = await api.post('/api/transactions/send', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getStats: async () => {
    try {
      const response = await api.get('/api/transactions/stats');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Additional transaction methods
  deposit: async (data) => {
    try {
      const response = await api.post('/api/transactions/deposit', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  withdraw: async (data) => {
    try {
      const response = await api.post('/api/transactions/withdraw', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  exchange: async (data) => {
    try {
      const response = await api.post('/api/transactions/exchange', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  exportCSV: async (params) => {
    try {
      const response = await api.get('/api/transactions/export/csv', { 
        params,
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
};

// Payment API (Flutterwave, Paysafe, etc.)
export const paymentAPI = {
  initialize: async (data) => {
    try {
      const response = await api.post('/api/payments/initialize', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  verify: async (reference) => {
    try {
      const response = await api.get(`/api/payments/verify/${reference}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Additional payment methods
  getProviders: async () => {
    try {
      const response = await api.get('/api/payments/providers');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  cancel: async (reference) => {
    try {
      const response = await api.post(`/api/payments/cancel/${reference}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
};

// User API
export const userAPI = {
  search: async (data) => {
    try {
      const response = await api.post('/api/users/search', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getProfile: async () => {
    try {
      const response = await api.get('/api/users/profile');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  updateProfile: async (data) => {
    try {
      const response = await api.put('/api/users/profile', data);
      // Update stored user data
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Additional user methods
  uploadAvatar: async (formData) => {
    try {
      const response = await api.post('/api/users/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  changePassword: async (data) => {
    try {
      const response = await api.put('/api/users/password', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  enable2FA: async () => {
    try {
      const response = await api.post('/api/users/2fa/enable');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  verify2FA: async (data) => {
    try {
      const response = await api.post('/api/users/2fa/verify', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
};

// KYC API
export const kycAPI = {
  getStatus: async () => {
    try {
      const response = await api.get('/api/kyc/status');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  submit: async (formData) => {
    try {
      const response = await api.post('/api/kyc/submit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  uploadDocument: async (type, file) => {
    try {
      const formData = new FormData();
      formData.append('type', type);
      formData.append('document', file);

      const response = await api.post('/api/kyc/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
};

// Card API (Wallester, Treezor)
export const cardAPI = {
  getAll: async () => {
    try {
      const response = await api.get('/api/cards');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getById: async (id) => {
    try {
      const response = await api.get(`/api/cards/${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  request: async (data) => {
    try {
      const response = await api.post('/api/cards/request', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  activate: async (id, data) => {
    try {
      const response = await api.post(`/api/cards/${id}/activate`, data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  freeze: async (id) => {
    try {
      const response = await api.post(`/api/cards/${id}/freeze`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  unfreeze: async (id) => {
    try {
      const response = await api.post(`/api/cards/${id}/unfreeze`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
};

// Savings API
export const savingsAPI = {
  getAll: async () => {
    try {
      const response = await api.get('/api/savings');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  create: async (data) => {
    try {
      const response = await api.post('/api/savings', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  withdraw: async (id, data) => {
    try {
      const response = await api.post(`/api/savings/${id}/withdraw`, data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
};

// AI API
export const aiAPI = {
  getInsights: async () => {
    try {
      const response = await api.get('/api/ai/insights');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getAdvice: async (data) => {
    try {
      const response = await api.post('/api/ai/advice', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  chat: async (message) => {
    try {
      const response = await api.post('/api/ai/chat', { message });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
};

// Notifications API
export const notificationsAPI = {
  getAll: async () => {
    try {
      const response = await api.get('/api/notifications');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  markAsRead: async (id) => {
    try {
      const response = await api.put(`/api/notifications/${id}/read`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  markAllAsRead: async () => {
    try {
      const response = await api.put('/api/notifications/read-all');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
};
// Analytics API
export const analyticsAPI = {
  getStats: async () => {
    try {
      const response = await api.get('/api/analytics/stats');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getChartData: async (params) => {
    try {
      const response = await api.get('/api/analytics/chart', { params });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getSpending: async (params) => {
    try {
      const response = await api.get('/api/analytics/spending', { params });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getIncome: async (params) => {
    try {
      const response = await api.get('/api/analytics/income', { params });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
};

// Provider API
export const providerAPI = {
  getAll: async () => {
    try {
      const response = await api.get('/api/providers');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getActive: async () => {
    try {
      const response = await api.get('/api/providers/active');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getById: async (id) => {
    try {
      const response = await api.get(`/api/providers/${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getByType: async (type) => {
    try {
      const response = await api.get(`/api/providers/type/${type}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
};