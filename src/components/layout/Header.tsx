import React from "react";
import { Menu, Bell, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useIsMobile } from "@/hooks/use-mobile";

type HeaderProps = {
  toggleSidebar: () => void;
};

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const { currentUser, logout, switchRole } = useAuth();
  const isMobile = useIsMobile();
  
  const getInitials = (name?: string) => {
    if (name && typeof name === 'string' && name.trim() !== '') {
      return name
        .split(" ")
        .map(n => n[0])
        .join("")
        .toUpperCase();
    }
    return "U";
  };

  return (
    <header className="bg-white border-b border-border h-16 flex items-center px-4 z-10">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="flex md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
          
          {isMobile && (
            <h1 className="text-xl font-semibold text-hrms-700">HRMS</h1>
          )}
          
          {!isMobile && (
            <h1 className="text-xl font-semibold text-hrms-700">HRMS Dashboard</h1>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
          </Button> */}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-hrms-500 text-white">
                    {currentUser && currentUser.name ? getInitials(currentUser.name) : getInitials()}
                  </AvatarFallback>
                </Avatar>
                {!isMobile && (
                  <span className="text-sm font-medium">{currentUser?.name}</span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              {/* <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator /> */}
              
              {/* For demo purposes - role switching */}
              {/* <DropdownMenuLabel>Demo Controls</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => switchRole("employee")}>
                Switch to Employee
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => switchRole("manager")}>
                Switch to Manager
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => switchRole("admin")}>
                Switch to Admin
              </DropdownMenuItem>
              <DropdownMenuSeparator /> */}
              
              <DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
