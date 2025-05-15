import React, { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { User, Role } from "../types/hrms";
// import { supabase } from "@/integrations/supabase/client"; // Remove Supabase
import { toast } from "@/components/ui/use-toast";
// import { mapProfileRowToUser, ProfileWithLeaveBalanceRow } from "@/types/supabase"; // Remove Supabase types
import { useNavigate } from "react-router-dom";
import { loginUser, registerUser, fetchCurrentUser, executeQuery } from "@/services/apiClient";

interface ApiUser extends Omit<User, 'leaveBalance'> { // API might not send leaveBalance directly with auth user
  avatar_url?: string; // from db
  manager_id?: string; // from db
  // Fields that might come from /api/auth/me or /api/auth/login response
  annual?: number;
  sick?: number;
  personal?: number;
}

const mapApiUserToUser = (apiUser: ApiUser): User => {
  return {
    id: apiUser.id,
    name: apiUser.name,
    email: apiUser.email,
    role: apiUser.role as Role,
    department: apiUser.department || '',
    position: apiUser.position || '',
    avatar: apiUser.avatar_url,
    manager: apiUser.manager_id,
    leaveBalance: {
      annual: apiUser.annual || 0,
      sick: apiUser.sick || 0,
      personal: apiUser.personal || 0,
    },
  };
};

type AuthContextType = {
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string, role?: Role, department?: string, position?: string) => Promise<boolean>;
  logout: () => void; // No longer async as it's client-side
  switchRole: (role: Role) => Promise<void>; // Still needs backend call
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  isAuthenticated: false,
  login: async () => false,
  register: async () => false,
  logout: () => {},
  switchRole: async () => {},
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  const loadUserFromToken = async () => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        setLoading(true);
        const apiUser = await fetchCurrentUser(); // Uses token from apiClient interceptor
        if (apiUser) {
          setCurrentUser(mapApiUserToUser(apiUser as ApiUser));
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Failed to fetch user with token:", error);
        localStorage.removeItem('authToken'); // Invalid token
        setCurrentUser(null);
        setIsAuthenticated(false);
      }
    } else {
        setCurrentUser(null);
        setIsAuthenticated(false);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadUserFromToken();
    // No Supabase listener needed anymore
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await loginUser({ email, password }); // API call
      if (response.user && response.token) {
        localStorage.setItem('authToken', response.token);
        setCurrentUser(mapApiUserToUser(response.user as ApiUser));
        setIsAuthenticated(true);
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        setLoading(false);
        return true;
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message || "An unexpected error occurred during login",
      });
      localStorage.removeItem('authToken');
      setCurrentUser(null);
      setIsAuthenticated(false);
      setLoading(false);
      return false;
    }
  };
  
  const register = async (
    email: string, 
    password: string, 
    name: string,
    role: Role = "employee",
    department?: string, // Added for more complete registration
    position?: string   // Added for more complete registration
  ): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await registerUser({ 
        email, 
        password, 
        name, 
        role, 
        department: department || (role === 'hr' ? 'Human Resources' : 'General'),
        position: position || (role === 'hr' ? 'HR Specialist' : role === 'manager' ? 'Manager' : 'Employee') 
      }); // API call

      if (response.user && response.token) {
        localStorage.setItem('authToken', response.token);
        setCurrentUser(mapApiUserToUser(response.user as ApiUser));
        setIsAuthenticated(true);
        toast({
          title: "Registration successful!",
          description: "You are now registered and logged in.",
        });
        setLoading(false);
        return true;
      } else {
        throw new Error(response.error || 'Registration failed');
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: error.message || "An unexpected error occurred during registration",
      });
      localStorage.removeItem('authToken');
      setCurrentUser(null);
      setIsAuthenticated(false);
      setLoading(false);
      return false;
    }
  };

  const logout = () => { // No longer async
    localStorage.removeItem('authToken');
    setCurrentUser(null);
    setIsAuthenticated(false);
    navigate("/login");
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
  };

  const switchRole = async (role: Role) => {
    if (!currentUser) return;
    setLoading(true);
    try {
      await executeQuery(
        `UPDATE profiles SET role = $1 WHERE id = $2`,
        [role, currentUser.id]
      );
      // Refresh user data to get updated role and potentially other info
      const apiUser = await fetchCurrentUser();
      if (apiUser) {
         setCurrentUser(mapApiUserToUser(apiUser as ApiUser));
      }
      toast({
        title: "Role switched",
        description: `Switched to ${role} role`,
      });
    } catch (error: any) {
      console.error("Role switch error:", error);
      toast({
        variant: "destructive",
        title: "Role switch error",
        description: error.message || "An unexpected error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        currentUser, 
        isAuthenticated, 
        login, 
        register, 
        logout, 
        switchRole,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
