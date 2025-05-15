import axios from 'axios';

// Set up base API client
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to include the token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- Auth Endpoints --- //
export const registerUser = async (userData: any) => {
  const response = await apiClient.post('/auth/register', userData);
  return response.data; // Should include user object and token
};

export const loginUser = async (credentials: any) => {
  const response = await apiClient.post('/auth/login', credentials);
  return response.data; // Should include user object and token
};

export const fetchCurrentUser = async () => {
  const response = await apiClient.get('/auth/me');
  return response.data; // Should be the user profile
};

// Execute a raw SQL query (protected by auth middleware on server)
export const executeQuery = async (text: string, params: any[] = []) => {
  const response = await apiClient.post('/query', { text, params });
  return response.data;
};

// User profiles (protected by auth middleware on server)
export const getProfile = async (userId: string) => {
  const response = await apiClient.get(`/profiles/${userId}`);
  return response.data;
};

// createProfile is now handled by registerUser, but if you need a separate admin function:
/*
export const createProfile = async (profileData: {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  position: string;
}) => {
  const response = await apiClient.post('/profiles', profileData);
  return response.data;
};
*/

export default apiClient; 