import { query } from "@/db/client";
import { Leave, LeaveType, LeaveStatus } from "@/types/hrms";
import apiClient from "./apiClient"; // Import the default apiClient instance

// Get leaves for a specific user
export const getUserLeaves = async (userId: string): Promise<Leave[]> => {
  try {
    const result = await query(
      `SELECT * FROM leaves WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    
    return result.rows.map(mapDbRowToLeave);
  } catch (error) {
    console.error("Error fetching leaves:", error);
    throw error;
  }
};

// Get all pending approvals for a manager
export const getPendingLeavesForManager = async (managerId: string): Promise<Leave[]> => {
  try {
    // First get all users managed by this manager
    const managedUsersResult = await query(
      `SELECT id FROM profiles WHERE manager_id = $1`,
      [managerId]
    );
    
    const userIds = managedUsersResult.rows.map(user => user.id);
    
    if (userIds.length === 0) return [];
    
    // Then get all pending leaves for those users
    const leavesResult = await query(
      `SELECT * FROM leaves 
       WHERE user_id = ANY($1) 
       AND status = 'pending' 
       ORDER BY created_at DESC`,
      [userIds]
    );
    
    return leavesResult.rows.map(mapDbRowToLeave);
  } catch (error) {
    console.error("Error fetching pending leaves:", error);
    throw error;
  }
};

// Create a new leave request
export const createLeave = async (leave: Omit<Leave, 'id' | 'createdAt' | 'status'>): Promise<Leave> => {
  try {
    const result = await query(
      `INSERT INTO leaves (
         user_id, type, start_date, end_date, reason, status
       ) VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING *`,
      [
        leave.userId,
        leave.type,
        leave.startDate,
        leave.endDate,
        leave.reason
      ]
    );
    
    return mapDbRowToLeave(result.rows[0]);
  } catch (error) {
    console.error("Error creating leave:", error);
    throw error;
  }
};

// Update leave status
export const updateLeaveStatus = async (
  leaveId: string, 
  status: "approved" | "rejected", 
  reviewerId: string, // Though reviewerId is now taken from token on backend, 
                      // keeping it in signature for now if other parts of app expect it,
                      // but it won't be explicitly sent in the PUT request body if backend derives it.
                      // Or, we can remove it if no longer needed by any caller.
                      // For this change, let's assume it might still be logged or used by caller, but not sent.
  remarks?: string
): Promise<Leave> => {
  try {
    // Use the new dedicated endpoint
    const response = await apiClient.put<Leave>(`/leaves/${leaveId}/status`, {
      status,
      remarks: remarks || null,
      // reviewerId is not sent; backend uses token.
    });
    return mapDbRowToLeave(response.data); // Assuming response.data is the updated leave row
  } catch (error) {
    console.error("Error updating leave status:", error);
    throw error;
  }
};

// Helper function to map database row to application type
const mapDbRowToLeave = (row: any): Leave => ({
  id: row.id,
  userId: row.user_id,
  type: row.type as LeaveType,
  startDate: row.start_date,
  endDate: row.end_date,
  reason: row.reason,
  status: row.status as LeaveStatus,
  reviewedBy: row.reviewed_by || undefined,
  reviewedAt: row.reviewed_at || undefined,
  remarks: row.remarks || undefined,
  createdAt: row.created_at
});

// Export a helper to fetch all pending leaves (for admins and HR)
export const getAllPendingLeaves = async (): Promise<Leave[]> => {
  try {
    const result = await query(
      `SELECT * FROM leaves 
       WHERE status = 'pending' 
       ORDER BY created_at DESC`,
      []
    );
    
    return result.rows.map(mapDbRowToLeave);
  } catch (error) {
    console.error("Error fetching all pending leaves:", error);
    throw error;
  }
}; 