import { Database, Tables } from "@/integrations/supabase/types";
import { User, Role } from "./hrms"; // Added import for User and Role

// Export convenient type aliases based on the generated Database type
export type ProfileRow = Tables<'profiles'>;
export type LeaveRow = Tables<'leaves'>;
export type LeaveBalanceRow = Tables<'leave_balances'>;
export type ExpenseRow = Tables<'expenses'>;

// New type for profile with its one-to-one leave_balances record
export type ProfileWithLeaveBalanceRow = ProfileRow & {
  leave_balances: LeaveBalanceRow | null; 
};

// Map Supabase types to our application types
export const mapProfileRowToUser = (profile: ProfileRow): User => {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: profile.role as Role,
    department: profile.department,
    position: profile.position,
    avatar: profile.avatar_url || undefined,
    manager: profile.manager_id || undefined,
    leaveBalance: {
      annual: 0, // This will be populated separately from leave_balances table
      sick: 0,
      personal: 0
    }
  };
};

// Additional mapper functions can be added here as needed
