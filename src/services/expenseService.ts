import { supabase } from "@/integrations/supabase/client";
import { Expense, ExpenseType, ExpenseStatus } from "@/types/hrms";
import { Tables } from "@/integrations/supabase/types";

// Get expenses for a specific user
export const getUserExpenses = async (userId: string): Promise<Expense[]> => {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error("Error fetching expenses:", error);
    throw error;
  }
  
  // Map database records to application types
  return data.map(mapExpenseRowToExpense);
};

// Get all pending approvals for a manager
export const getPendingExpensesForManager = async (managerId: string): Promise<Expense[]> => {
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
  
  // Then get all pending expenses for those users
  const { data: expenses, error: expensesError } = await supabase
    .from('expenses')
    .select('*')
    .in('user_id', userIds)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
    
  if (expensesError) {
    console.error("Error fetching pending expenses:", expensesError);
    throw expensesError;
  }
  
  return expenses.map(mapExpenseRowToExpense);
};

// Create a new expense
export const createExpense = async (expense: Omit<Expense, 'id' | 'createdAt' | 'status'>): Promise<Expense> => {
  const { data, error } = await supabase
    .from('expenses')
    .insert({
      user_id: expense.userId,
      type: expense.type,
      amount: expense.amount,
      description: expense.description,
      date: expense.date,
      status: 'pending'
    })
    .select()
    .single();
    
  if (error) {
    console.error("Error creating expense:", error);
    throw error;
  }
  
  return mapExpenseRowToExpense(data);
};

// Update expense status
export const updateExpenseStatus = async (
  expenseId: string, 
  status: "approved" | "rejected", 
  reviewerId: string
): Promise<Expense> => {
  const { data, error } = await supabase
    .from('expenses')
    .update({
      status,
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', expenseId)
    .select()
    .single();
    
  if (error) {
    console.error("Error updating expense status:", error);
    throw error;
  }
  
  return mapExpenseRowToExpense(data);
};

// Helper function to map database row to application type
const mapExpenseRowToExpense = (row: Tables<'expenses'>): Expense => ({
  id: row.id,
  userId: row.user_id,
  type: row.type as ExpenseType,
  amount: row.amount,
  description: row.description,
  date: row.date,
  status: row.status as ExpenseStatus,
  reviewedBy: row.reviewed_by || undefined,
  reviewedAt: row.reviewed_at || undefined,
  createdAt: row.created_at
}); 