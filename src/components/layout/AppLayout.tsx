import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "./Sidebar";
import Header from "./Header";
import MobileNavigation from "./MobileNavigation";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

type AppLayoutProps = {
  children: React.ReactNode;
};

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const isMobileHook = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobileHook); 
  const [isMobile, setIsMobile] = useState(isMobileHook);
  const { currentUser } = useAuth();

  useEffect(() => {
    setIsMobile(isMobileHook);
    if (!isMobileHook) { // if changing to desktop
      setSidebarOpen(true); // Open sidebar by default on desktop
    } else { // if changing to mobile
      setSidebarOpen(false); // Close sidebar by default on mobile
    }
  }, [isMobileHook]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (!currentUser) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Backdrop for mobile sidebar */} 
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Sidebar for mobile (slide-in) */}
      <div 
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-white transition-transform duration-300 ease-in-out md:hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Sidebar collapsed={false} toggleSidebar={toggleSidebar} />
      </div>

      {/* Sidebar for tablet and desktop (static or collapsible) */}
      <div className={cn(
        "hidden md:flex md:flex-shrink-0 transition-all duration-300",
        sidebarOpen ? "md:w-64" : "md:w-20"
      )}>
        <Sidebar collapsed={!sidebarOpen && !isMobile} toggleSidebar={toggleSidebar} />
      </div>

      {/* Main content area */} 
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header toggleSidebar={toggleSidebar} />
        
        <main className={cn("flex-1 overflow-y-auto bg-gray-50", isMobile ? "p-4 pb-20" : "p-6")}>
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
        
        {/* Mobile bottom navigation */} 
        {isMobile && <MobileNavigation />}
      </div>
    </div>
  );
};

export default AppLayout;
