import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import LeavesPage from "@/pages/LeavesPage";
import ExpensesPage from "@/pages/ExpensesPage";
import ApprovalsPage from "@/pages/ApprovalsPage";
import LeaveBalancesPage from "@/pages/LeaveBalancesPage";
import EmployeeListPage from "@/pages/EmployeeListPage";
import LoginPage from "@/pages/LoginPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  
  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-hrms-700"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <AppLayout>{children}</AppLayout>;
};

// Role-based route component
const RoleRoute = ({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode; 
  allowedRoles: string[];
}) => {
  const { currentUser, isAuthenticated, loading } = useAuth();
  
  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-hrms-700"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (currentUser && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/" replace />;
  }
  
  return <AppLayout>{children}</AppLayout>;
};

// App routes wrapped in AuthProvider
const AppWithAuth = () => {
  const { isAuthenticated, loading } = useAuth();
  
  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          loading ? (
            <div className="flex items-center justify-center min-h-screen">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-hrms-700"></div>
            </div>
          ) : (
            isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
          )
        } 
      />
      
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/leaves" element={<ProtectedRoute><LeavesPage /></ProtectedRoute>} />
      <Route path="/expenses" element={<ProtectedRoute><ExpensesPage /></ProtectedRoute>} />
      
      <Route 
        path="/approvals" 
        element={
          <RoleRoute allowedRoles={["manager", "admin", "hr"]}>
            <ApprovalsPage />
          </RoleRoute>
        } 
      />
      
      <Route 
        path="/leave-balances" 
        element={
          <RoleRoute allowedRoles={["manager", "admin", "hr"]}>
            <LeaveBalancesPage />
          </RoleRoute>
        } 
      />
      
      <Route 
        path="/employees" 
        element={
          <RoleRoute allowedRoles={["manager", "admin", "hr"]}>
            <EmployeeListPage />
          </RoleRoute>
        } 
      />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <AppWithAuth />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
