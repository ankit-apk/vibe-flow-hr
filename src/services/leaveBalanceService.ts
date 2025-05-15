import { query } from "@/db/client"; // New PostgreSQL client
import { User, Role } from "@/types/hrms";

// Get all employees with their leave balances
export const getAllEmployeesWithBalances = async (): Promise<User[]> => {
  try {
    const result = await query(
      `SELECT p.*, lb.annual, lb.sick, lb.personal 
       FROM profiles p
       LEFT JOIN leave_balances lb ON p.id = lb.user_id
       ORDER BY p.name`,
      []
    );
    
    return result.rows.map(row => {
      const user: User = {
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role as Role,
        department: row.department || "",
        position: row.position || "",
        avatar: row.avatar_url,
        leaveBalance: {
          annual: row.annual || 0,
          sick: row.sick || 0,
          personal: row.personal || 0
        }
      };
      
      if (row.manager_id) {
        user.manager = row.manager_id;
      }
      
      return user;
    });
  } catch (error) {
    console.error("Error fetching employees with balances:", error);
    throw error;
  }
};

// Update employee leave balances
export const updateLeaveBalance = async (
  userId: string, 
  balances: { 
    annual?: number; 
    sick?: number; 
    personal?: number; 
  }
): Promise<void> => {
  try {
    // Build the SQL dynamically based on which fields are being updated
    const setFields = [];
    const params = [];
    let paramCounter = 1;
    
    if (balances.annual !== undefined) {
      setFields.push(`annual = $${paramCounter++}`);
      params.push(balances.annual);
    }
    
    if (balances.sick !== undefined) {
      setFields.push(`sick = $${paramCounter++}`);
      params.push(balances.sick);
    }
    
    if (balances.personal !== undefined) {
      setFields.push(`personal = $${paramCounter++}`);
      params.push(balances.personal);
    }
    
    // Add userId as the last parameter
    params.push(userId);
    
    if (setFields.length === 0) {
      return; // Nothing to update
    }
    
    await query(
      `UPDATE leave_balances 
       SET ${setFields.join(', ')}, updated_at = NOW()
       WHERE user_id = $${paramCounter}`,
      params
    );
  } catch (error) {
    console.error("Error updating leave balance:", error);
    throw error;
  }
}; 