import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Calendar, 
  DollarSign, 
  Home, 
  ChevronRight, 
  ChevronLeft,
  UserCheck, 
  Settings,
  Briefcase,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";

type SidebarProps = {
  collapsed: boolean;
  toggleSidebar: () => void;
};

type NavItem = {
  label: string;
  icon: React.ElementType;
  href: string;
  roles: string[];
};

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    icon: Home,
    href: "/",
    roles: ["employee", "manager", "admin", "hr"],
  },
  {
    label: "Employee Management",
    icon: Users,
    href: "/employees",
    roles: ["manager", "admin", "hr"],
  },
  {
    label: "Leave Management",
    icon: Calendar,
    href: "/leaves",
    roles: ["employee", "manager", "admin", "hr"],
  },
  {
    label: "Expenses",
    icon: DollarSign,
    href: "/expenses",
    roles: ["employee", "manager", "admin", "hr"],
  },
  {
    label: "Approvals",
    icon: UserCheck,
    href: "/approvals",
    roles: ["manager", "admin", "hr"],
  },
  // {
  //   label: "Leave Balances",
  //   icon: Users,
  //   href: "/leave-balances",
  //   roles: ["manager", "admin", "hr"],
  // },
  // {
  //   label: "Department",
  //   icon: Briefcase,
  //   href: "/department",
  //   roles: ["manager", "admin"],
  // },
  // {
  //   label: "Settings",
  //   icon: Settings,
  //   href: "/settings",
  //   roles: ["admin"],
  // },
];

const Sidebar: React.FC<SidebarProps> = ({ collapsed, toggleSidebar }) => {
  const location = useLocation();
  const { currentUser } = useAuth();

  const filteredNavItems = navItems.filter((item) =>
    currentUser && item.roles.includes(currentUser.role)
  );

  return (
    <div className="h-full bg-white border-r border-border flex flex-col">
      <div className="h-16 border-b border-border flex items-center px-4 justify-between">
        <div className="flex items-center">
          {!collapsed && (
            <div className="flex items-center">
              <img 
                src="https://happinestindia.com/Assets/logo.svg" 
                alt="Happinest Logo" 
                className="h-8 w-auto"
              />
            </div>
          )}
          {collapsed && (
            <img 
              src="https://happinestindia.com/Assets/logo.svg" 
              alt="Happinest Logo" 
              className="h-8 w-auto"
            />
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="text-happinest-green hover:bg-gray-100"
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </Button>
      </div>

      <div className="flex-1 py-4 overflow-y-auto">
        <nav className="space-y-1 px-2">
          {filteredNavItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                location.pathname === item.href
                  ? "bg-accent text-happinest-green"
                  : "text-gray-700 hover:bg-accent hover:text-happinest-green"
              )}
            >
              <item.icon className={cn("h-5 w-5", location.pathname === item.href ? "text-happinest-green" : "text-gray-500")} />
              {!collapsed && <span className="ml-3">{item.label}</span>}
            </Link>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-border">
        <div className="flex items-center">
          {!collapsed && (
            <div>
              <p className="text-sm font-medium text-gray-800">{currentUser?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{currentUser?.role}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
