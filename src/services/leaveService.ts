import { supabase } from "@/integrations/supabase/client";
import { Leave, LeaveType, LeaveStatus } from "@/types/hrms";
import { Tables } from "@/integrations/supabase/types";

// Get leaves for a specific user
export const getUserLeaves = async (userId: string): Promise<Leave[]> => {
  const { data, error } = await supabase
    .from('leaves')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error("Error fetching leaves:", error);
    throw error;
  }
  
  // Map database records to application types
  return data.map(mapLeaveRowToLeave);
};

// Get all pending approvals for a manager
export const getPendingLeavesForManager = async (managerId: string): Promise<Leave[]> => {
  // First get all users managed by this manager
  const { data: managedUsers, error: userError } = await supabase
    .from('profiles')
    .select('id')
    .eq('manager_id', managerId);
    
  if (userError) {
    console.error("Error fetching managed users:", userError);
    throw userError;
  }
  
  const userIds = managedUsers.map(user => user.id);
  
  if (userIds.length === 0) return [];
  
  // Then get all pending leaves for those users
  const { data: leaves, error: leavesError } = await supabase
    .from('leaves')
    .select('*')
    .in('user_id', userIds)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
    
  if (leavesError) {
    console.error("Error fetching pending leaves:", leavesError);
    throw leavesError;
  }
  
  return leaves.map(mapLeaveRowToLeave);
};

// Create a new leave request
export const createLeave = async (leave: Omit<Leave, 'id' | 'createdAt' | 'status'>): Promise<Leave> => {
  const { data, error } = await supabase
    .from('leaves')
    .insert({
      user_id: leave.userId,
      type: leave.type,
      start_date: leave.startDate,
      end_date: leave.endDate,
      reason: leave.reason,
      status: 'pending'
    })
    .select()
    .single();
    
  if (error) {
    console.error("Error creating leave:", error);
    throw error;
  }
  
  return mapLeaveRowToLeave(data);
};

// Update leave status
export const updateLeaveStatus = async (
  leaveId: string, 
  status: "approved" | "rejected", 
  reviewerId: string
): Promise<Leave> => {
  const { data, error } = await supabase
    .from('leaves')
    .update({
      status,
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', leaveId)
    .select()
    .single();
    
  if (error) {
    console.error("Error updating leave status:", error);
    throw error;
  }
  
  return mapLeaveRowToLeave(data);
};

// Helper function to map database row to application type
const mapLeaveRowToLeave = (row: Tables<'leaves'>): Leave => ({
  id: row.id,
  userId: row.user_id,
  type: row.type as LeaveType,
  startDate: row.start_date,
  endDate: row.end_date,
  reason: row.reason,
  status: row.status as LeaveStatus,
  reviewedBy: row.reviewed_by || undefined,
  reviewedAt: row.reviewed_at || undefined,
  createdAt: row.created_at
});

// Export a helper to fetch all pending leaves (for admins)
export const getAllPendingLeaves = async (): Promise<Leave[]> => {
  const { data, error } = await supabase
    .from('leaves')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (error) {
    console.error("Error fetching all pending leaves:", error);
    throw error;
  }
  return data.map(mapLeaveRowToLeave);
}; 