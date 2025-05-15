import axios from 'axios';
import { User, Role } from '@/types/hrms';

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

// Define an interface for the raw profile data from the API
interface ApiProfileWithFlatBalances extends Omit<User, 'leaveBalance' | 'avatar' | 'manager'> {
  annual?: number; 
  sick?: number;
  personal?: number;
  avatar_url?: string;
  manager_id?: string;
  // Include other fields from profiles table that are not in User type but are fetched, if any
  // e.g., created_at, updated_at (though User type doesn't have them, they are fetched)
}

export const getAllProfilesWithBalances = async (): Promise<User[]> => {
  try {
    // Fetch data as the raw ApiProfileWithFlatBalances type
    const response = await apiClient.get<ApiProfileWithFlatBalances[]>('/profiles');
    
    return response.data.map((profile: ApiProfileWithFlatBalances) => ({
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role, // Role type should be compatible
      department: profile.department,
      position: profile.position,
      avatar: profile.avatar_url, // Map avatar_url to avatar
      manager: profile.manager_id,   // Map manager_id to manager
      leaveBalance: {
        annual: profile.annual || 0, // Handle potential null from LEFT JOIN
        sick: profile.sick || 0,    // Handle potential null
        personal: profile.personal || 0, // Handle potential null
      }
      // created_at, updated_at from profile are not mapped to User type explicitly here
      // if User type needs them, they should be added to User and mapped here.
    }));
  } catch (error) {
    console.error('Error fetching all profiles with balances:', error);
    throw error;
  }
};

interface LeaveBalanceUpdatePayload {
  annual: number;
  sick: number;
  personal: number;
}

// LeaveBalance type might be useful if we define it in hrms.ts for the return type
// For now, using any for the direct response from API.
export const updateLeaveBalance = async (userId: string, balances: LeaveBalanceUpdatePayload): Promise<any> => {
  try {
    const response = await apiClient.put(`/leave-balances/${userId}`, balances);
    return response.data;
  } catch (error) {
    console.error(`Error updating leave balance for user ${userId}:`, error);
    throw error;
  }
};

export const getActiveProfilesCount = async (): Promise<{ count: number }> => {
  try {
    const response = await apiClient.get<{ count: number }>('/profiles/count');
    return response.data;
  } catch (error) {
    console.error('Error fetching active profiles count:', error);
    throw error; // Re-throw error to be handled by the caller
  }
};

// Service-specific query function
export const runQuery = async <T = unknown>(query: string, params: unknown[] = []): Promise<T> => {
  const response = await apiClient.post('/query', { text: query, params });
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