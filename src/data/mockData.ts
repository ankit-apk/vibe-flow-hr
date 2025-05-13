
import { User, Leave, Expense } from "../types/hrms";

export const mockUsers: User[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    role: "employee",
    department: "Engineering",
    position: "Software Developer",
    manager: "2",
    leaveBalance: {
      annual: 15,
      sick: 10,
      personal: 5,
    },
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
    role: "manager",
    department: "Engineering",
    position: "Engineering Manager",
    leaveBalance: {
      annual: 18,
      sick: 10,
      personal: 5,
    },
  },
  {
    id: "3",
    name: "Admin User",
    email: "admin@example.com",
    role: "admin",
    department: "HR",
    position: "HR Director",
    leaveBalance: {
      annual: 20,
      sick: 10,
      personal: 5,
    },
  },
];

export const mockLeaves: Leave[] = [
  {
    id: "l1",
    userId: "1",
    type: "annual",
    startDate: "2025-05-20",
    endDate: "2025-05-25",
    reason: "Family vacation",
    status: "pending",
    createdAt: "2025-05-13T10:00:00Z",
  },
  {
    id: "l2",
    userId: "1",
    type: "sick",
    startDate: "2025-05-05",
    endDate: "2025-05-06",
    reason: "Cold",
    status: "approved",
    reviewedBy: "2",
    reviewedAt: "2025-05-04T14:30:00Z",
    createdAt: "2025-05-03T09:00:00Z",
  },
  {
    id: "l3",
    userId: "2",
    type: "personal",
    startDate: "2025-05-30",
    endDate: "2025-05-30",
    reason: "Personal appointment",
    status: "approved",
    reviewedBy: "3",
    reviewedAt: "2025-05-28T11:20:00Z",
    createdAt: "2025-05-27T16:45:00Z",
  },
];

export const mockExpenses: Expense[] = [
  {
    id: "e1",
    userId: "1",
    type: "travel",
    amount: 250.50,
    description: "Client meeting travel expenses",
    date: "2025-05-10",
    status: "pending",
    createdAt: "2025-05-12T08:30:00Z",
  },
  {
    id: "e2",
    userId: "1",
    type: "meals",
    amount: 45.75,
    description: "Team lunch",
    date: "2025-05-08",
    status: "approved",
    reviewedBy: "2",
    reviewedAt: "2025-05-09T10:15:00Z",
    createdAt: "2025-05-08T14:00:00Z",
  },
  {
    id: "e3",
    userId: "2",
    type: "office",
    amount: 120.00,
    description: "Office supplies",
    date: "2025-05-05",
    status: "approved",
    reviewedBy: "3",
    reviewedAt: "2025-05-06T09:45:00Z",
    createdAt: "2025-05-05T16:20:00Z",
  },
];

// Currently logged in user (for demo)
export const currentUserId = "1";

// Helper functions to get data
export const getCurrentUser = (): User | undefined => {
  return mockUsers.find(user => user.id === currentUserId);
};

export const getUserById = (id: string): User | undefined => {
  return mockUsers.find(user => user.id === id);
};

export const getUserLeaves = (userId: string): Leave[] => {
  return mockLeaves.filter(leave => leave.userId === userId);
};

export const getUserExpenses = (userId: string): Expense[] => {
  return mockExpenses.filter(expense => expense.userId === userId);
};

export const getPendingApprovals = (managerId: string): { leaves: Leave[], expenses: Expense[] } => {
  // Get users managed by this manager
  const managedUsers = mockUsers.filter(user => user.manager === managerId).map(user => user.id);
  
  const leaves = mockLeaves.filter(leave => 
    managedUsers.includes(leave.userId) && leave.status === "pending"
  );
  
  const expenses = mockExpenses.filter(expense => 
    managedUsers.includes(expense.userId) && expense.status === "pending"
  );
  
  return { leaves, expenses };
};

// Function to update leave status
export const updateLeaveStatus = (leaveId: string, status: "approved" | "rejected", reviewerId: string): Leave => {
  const leave = mockLeaves.find(l => l.id === leaveId);
  if (!leave) throw new Error("Leave not found");
  
  leave.status = status;
  leave.reviewedBy = reviewerId;
  leave.reviewedAt = new Date().toISOString();
  
  return leave;
};

// Function to update expense status
export const updateExpenseStatus = (expenseId: string, status: "approved" | "rejected", reviewerId: string): Expense => {
  const expense = mockExpenses.find(e => e.id === expenseId);
  if (!expense) throw new Error("Expense not found");
  
  expense.status = status;
  expense.reviewedBy = reviewerId;
  expense.reviewedAt = new Date().toISOString();
  
  return expense;
};
