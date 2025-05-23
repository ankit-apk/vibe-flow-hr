import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Calendar, DollarSign, UserCheck, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const MobileNavigation: React.FC = () => {
  const location = useLocation();
  const { currentUser } = useAuth();
  
  const navItems = [
    {
      icon: Home,
      label: "Home",
      href: "/",
      roles: ["employee", "manager", "admin", "hr"],
    },
    {
      icon: Calendar,
      label: "Leaves",
      href: "/leaves",
      roles: ["employee", "manager", "admin", "hr"],
    },
    {
      icon: DollarSign,
      label: "Expenses",
      href: "/expenses",
      roles: ["employee", "manager", "admin", "hr"],
    },
    {
      icon: UserCheck,
      label: "Approvals",
      href: "/approvals",
      roles: ["manager", "admin", "hr"],
    },
    // {
    //   icon: User,
    //   label: "Profile",
    //   href: "/profile",
    //   roles: ["employee", "manager", "admin"],
    // },
  ];

  const filteredNavItems = navItems.filter(
    (item) => currentUser && item.roles.includes(currentUser.role)
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border p-2 flex justify-around items-center z-10 md:hidden">
      {filteredNavItems.map((item) => (
        <Link
          key={item.href}
          to={item.href}
          className={cn(
            "flex flex-1 flex-col items-center justify-center py-2",
            location.pathname === item.href
              ? "text-happinest-green"
              : "text-gray-500"
          )}
        >
          <item.icon
            className={cn(
              "h-5 w-5",
              location.pathname === item.href ? "text-happinest-green" : ""
            )}
          />
          <span className="text-xs mt-1">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
};

export default MobileNavigation;
