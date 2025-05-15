export type Role = "employee" | "manager" | "hr" | "admin";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  position: string;
  avatar?: string;
  manager?: string;
  leaveBalance: {
    annual: number;
    sick: number;
    personal: number;
  };
};

export type LeaveType = "annual" | "sick" | "personal" | "unpaid";

export type LeaveStatus = "pending" | "approved" | "rejected";

export type Leave = {
  id: string;
  userId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  remarks?: string;
  createdAt: string;
};

export type ExpenseType = "travel" | "office" | "meals" | "other";

export type ExpenseStatus = "pending" | "approved" | "rejected";

export type Expense = {
  id: string;
  userId: string;
  type: ExpenseType;
  amount: number;
  description: string;
  date: string;
  status: ExpenseStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  remarks?: string;
  createdAt: string;
};
