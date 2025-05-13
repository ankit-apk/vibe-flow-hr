
import React, { createContext, useState, useContext, ReactNode } from "react";
import { User, Role } from "../types/hrms";
import { mockUsers, currentUserId } from "../data/mockData";
import { toast } from "sonner";

type AuthContextType = {
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: Role) => void;
};

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  isAuthenticated: false,
  login: async () => false,
  logout: () => {},
  switchRole: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const user = mockUsers.find(u => u.id === currentUserId);
    return user || null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!currentUser);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // In a real app, validate credentials on the backend
    const user = mockUsers.find(u => u.email === email);
    
    if (user) {
      setCurrentUser(user);
      setIsAuthenticated(true);
      toast.success("Login successful!");
      return true;
    } else {
      toast.error("Invalid email or password");
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    toast.info("You have been logged out");
  };

  // For demo purposes - switch between roles
  const switchRole = (role: Role) => {
    const user = mockUsers.find(u => u.role === role);
    if (user) {
      setCurrentUser(user);
      toast.success(`Switched to ${role} role`);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, isAuthenticated, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
};
