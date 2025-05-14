import React, { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { User, Role } from "../types/hrms";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { mapProfileRowToUser, ProfileWithLeaveBalanceRow } from "@/types/supabase";
import { useNavigate } from "react-router-dom";

type AuthContextType = {
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string, role?: Role) => Promise<boolean>;
  logout: () => Promise<void>;
  switchRole: (role: Role) => void;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  isAuthenticated: false,
  login: async () => false,
  register: async () => false,
  logout: async () => {},
  switchRole: () => {},
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  // Helper to fetch and set user profile
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*, leave_balances(*)')
        .eq('id', userId)
        .single<ProfileWithLeaveBalanceRow>();
      if (error || !profile) throw error || new Error('Profile not found');
      const user = mapProfileRowToUser(profile);
      if (profile.leave_balances) {
        const balance = profile.leave_balances;
        user.leaveBalance = {
          annual: balance.annual,
          sick: balance.sick,
          personal: balance.personal,
        };
      }
      setCurrentUser(user);
      setIsAuthenticated(true);
    } catch (err) {
      console.error('Error loading user profile:', err);
      setCurrentUser(null);
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    let subscription: any;
    const initializeAuth = async () => {
      setLoading(true);
      // Load initial session if exists
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
      setLoading(false);

      // Subscribe to auth state changes
      const { data } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          setLoading(true);
          if (session?.user) {
            await fetchUserProfile(session.user.id);
          } else {
            setCurrentUser(null);
            setIsAuthenticated(false);
          }
          setLoading(false);
        }
      );
      subscription = data.subscription;
    };
    initializeAuth();
    return () => subscription?.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Login failed",
          description: error.message,
        });
        return false;
      }
      
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      return true;
    } catch (error) {
      console.error("Login error:", error);
      toast({
        variant: "destructive",
        title: "Login error",
        description: "An unexpected error occurred during login",
      });
      return false;
    }
  };
  
  const register = async (
    email: string, 
    password: string, 
    name: string,
    role: Role = "employee"
  ): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role,
          },
        },
      });
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Registration failed",
          description: error.message,
        });
        return false;
      }
      
      toast({
        title: "Registration successful!",
        description: "You are now registered and logged in.",
      });
      return true;
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        variant: "destructive",
        title: "Registration error",
        description: "An unexpected error occurred during registration",
      });
      return false;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
  };

  // For demo purposes - switch between roles
  // In a real app, this would require admin privileges
  const switchRole = async (role: Role) => {
    if (!currentUser) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', currentUser.id);
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Role switch failed",
          description: error.message,
        });
        return;
      }
      
      // Refresh the user to get updated role
      const { data: profile } = await supabase
        .from('profiles')
        .select('*, leave_balances(*)')
        .eq('id', currentUser.id)
        .single<ProfileWithLeaveBalanceRow>();
      
      if (profile) {
        const updatedUser = mapProfileRowToUser(profile);
        if (profile.leave_balances) {
          const balance = profile.leave_balances;
          updatedUser.leaveBalance = {
            annual: balance.annual,
            sick: balance.sick,
            personal: balance.personal
          };
        }
        
        setCurrentUser(updatedUser);
        toast({
          title: "Role switched",
          description: `Switched to ${role} role`,
        });
      }
    } catch (error) {
      console.error("Role switch error:", error);
      toast({
        variant: "destructive",
        title: "Role switch error",
        description: "An unexpected error occurred",
      });
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
