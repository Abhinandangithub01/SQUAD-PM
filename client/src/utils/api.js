import axios from 'axios';
import { mockApi } from './mockApi';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Check if we should use mock data (when backend is not available)
const USE_MOCK_DATA = process.env.REACT_APP_USE_MOCK_DATA === 'true' || true; // Default to true for demo

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || localStorage.getItem('mock_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // If backend is not available, fall back to mock data
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK' || USE_MOCK_DATA) {
      console.log('Backend not available, using mock data for:', error.config?.url || 'unknown endpoint');
      
      if (error.config) {
        const method = error.config.method.toLowerCase();
        const url = error.config.url.replace(API_URL, '');
        
        try {
          if (method === 'get') {
            return await mockApi.get(url);
          } else if (method === 'post') {
            const data = error.config.data ? JSON.parse(error.config.data) : {};
            return await mockApi.post(url, data);
          } else if (method === 'put') {
            const data = error.config.data ? JSON.parse(error.config.data) : {};
            return await mockApi.put(url, data);
          } else if (method === 'delete') {
            return await mockApi.delete(url);
          }
        } catch (mockError) {
          console.error('Mock API error:', mockError);
          return Promise.reject(mockError);
        }
      }
    }
    
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('mock_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Create a wrapper that always uses mock data for demo
const demoApi = {
  get: async (url, config) => {
    try {
      return await mockApi.get(url, config);
    } catch (error) {
      console.error('Demo API GET error:', error);
      return { data: {} };
    }
  },
  post: async (url, data, config) => {
    try {
      return await mockApi.post(url, data, config);
    } catch (error) {
      console.error('Demo API POST error:', error);
      return { data: { message: 'Success' } };
    }
  },
  put: async (url, data, config) => {
    try {
      return await mockApi.put(url, data, config);
    } catch (error) {
      console.error('Demo API PUT error:', error);
      return { data: { message: 'Updated' } };
    }
  },
  delete: async (url, config) => {
    try {
      return await mockApi.delete(url, config);
    } catch (error) {
      console.error('Demo API DELETE error:', error);
      return { data: { message: 'Deleted' } };
    }
  },
  defaults: {
    headers: {
      common: {}
    }
  }
};

export default USE_MOCK_DATA ? demoApi : api;
