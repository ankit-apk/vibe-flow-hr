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
  {
    label: "Leave Balances",
    icon: Users,
    href: "/leave-balances",
    roles: ["manager", "admin", "hr"],
  },
  {
    label: "Department",
    icon: Briefcase,
    href: "/department",
    roles: ["manager", "admin"],
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/settings",
    roles: ["admin"],
  },
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
            <span className="text-xl font-bold text-hrms-700 ml-2">HRMS</span>
          )}
          {collapsed && (
            <span className="text-xl font-bold text-hrms-700">HR</span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="text-muted-foreground"
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
                  ? "bg-hrms-100 text-hrms-700"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", location.pathname === item.href ? "text-hrms-500" : "")} />
              {!collapsed && <span className="ml-3">{item.label}</span>}
            </Link>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-border">
        <div className="flex items-center">
          {!collapsed && (
            <div>
              <p className="text-sm font-medium">{currentUser?.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{currentUser?.role}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
