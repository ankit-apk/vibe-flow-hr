
import { Database } from "@/integrations/supabase/types";

// Export convenient type aliases based on the generated Database type
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type LeaveRow = Database["public"]["Tables"]["leaves"]["Row"];
export type LeaveBalanceRow = Database["public"]["Tables"]["leave_balances"]["Row"];
export type ExpenseRow = Database["public"]["Tables"]["expenses"]["Row"];

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
