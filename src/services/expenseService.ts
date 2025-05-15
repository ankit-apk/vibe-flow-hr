// import { supabase } from "@/integrations/supabase/client";
import { query } from "@/db/client";
import { Expense, ExpenseType, ExpenseStatus } from "@/types/hrms";

// Get expenses for a specific user
export const getUserExpenses = async (userId: string): Promise<Expense[]> => {
  try {
    const result = await query(
      `SELECT * FROM expenses WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    
    return result.rows.map(mapDbRowToExpense);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    throw error;
  }
};

// Get all pending approvals for a manager
export const getPendingExpensesForManager = async (managerId: string): Promise<Expense[]> => {
  try {
    // First get all users managed by this manager
    const managedUsersResult = await query(
      `SELECT id FROM profiles WHERE manager_id = $1`,
      [managerId]
    );
    
    const userIds = managedUsersResult.rows.map(user => user.id);
    
    if (userIds.length === 0) return [];
    
    // Then get all pending expenses for those users
    const expensesResult = await query(
      `SELECT * FROM expenses 
       WHERE user_id = ANY($1) 
       AND status = 'pending' 
       ORDER BY created_at DESC`,
      [userIds]
    );
    
    return expensesResult.rows.map(mapDbRowToExpense);
  } catch (error) {
    console.error("Error fetching pending expenses:", error);
    throw error;
  }
};

// Create a new expense
export const createExpense = async (expense: Omit<Expense, 'id' | 'createdAt' | 'status'>): Promise<Expense> => {
  try {
    const result = await query(
      `INSERT INTO expenses (
         user_id, type, amount, description, date, status
       ) VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING *`,
      [
        expense.userId,
        expense.type,
        expense.amount,
        expense.description,
        expense.date
      ]
    );
    
    return mapDbRowToExpense(result.rows[0]);
  } catch (error) {
    console.error("Error creating expense:", error);
    throw error;
  }
};

// Update expense status
export const updateExpenseStatus = async (
  expenseId: string, 
  status: "approved" | "rejected", 
  reviewerId: string,
  remarks?: string
): Promise<Expense> => {
  try {
    const result = await query(
      `UPDATE expenses 
       SET status = $1, reviewed_by = $2, reviewed_at = $3, remarks = $4
       WHERE id = $5
       RETURNING *`,
      [status, reviewerId, new Date().toISOString(), remarks || null, expenseId]
    );
    
    return mapDbRowToExpense(result.rows[0]);
  } catch (error) {
    console.error("Error updating expense status:", error);
    throw error;
  }
};

// Helper function to map database row to application type
const mapDbRowToExpense = (row: any): Expense => ({
  id: row.id,
  userId: row.user_id,
  type: row.type as ExpenseType,
  amount: parseFloat(row.amount),
  description: row.description,
  date: row.date,
  status: row.status as ExpenseStatus,
  reviewedBy: row.reviewed_by || undefined,
  reviewedAt: row.reviewed_at || undefined,
  remarks: row.remarks || undefined,
  createdAt: row.created_at
});

// Export a helper to fetch all pending expenses (for admins and HR)
export const getAllPendingExpenses = async (): Promise<Expense[]> => {
  try {
    const result = await query(
      `SELECT * FROM expenses 
       WHERE status = 'pending' 
       ORDER BY created_at DESC`,
      []
    );
    
    return result.rows.map(mapDbRowToExpense);
  } catch (error) {
    console.error("Error fetching all pending expenses:", error);
    throw error;
  }
}; 