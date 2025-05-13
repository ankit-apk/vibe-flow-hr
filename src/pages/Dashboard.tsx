
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getUserLeaves, getUserExpenses } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, DollarSign, Check, X } from "lucide-react";
import { format } from "date-fns";

const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  
  if (!currentUser) return null;
  
  const leaves = getUserLeaves(currentUser.id);
  const expenses = getUserExpenses(currentUser.id);
  
  // Summary stats
  const pendingLeaves = leaves.filter((leave) => leave.status === "pending").length;
  const approvedLeaves = leaves.filter((leave) => leave.status === "approved").length;
  const pendingExpenses = expenses.filter((expense) => expense.status === "pending").length;
  const totalExpensesAmount = expenses
    .filter((expense) => expense.status === "approved")
    .reduce((sum, expense) => sum + expense.amount, 0);
  
  // Recent items
  const recentLeaves = [...leaves].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 3);
  
  const recentExpenses = [...expenses].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 3);

  return (
    <div className="space-y-6 animate-enter">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {currentUser.name}!
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Leave Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentUser.leaveBalance.annual} days</div>
            <p className="text-xs text-muted-foreground mt-1">Annual leave remaining</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Leaves</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingLeaves}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingExpenses}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalExpensesAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Total approved</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent leaves and expenses */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5 text-hrms-500" />
              Recent Leave Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentLeaves.length > 0 ? (
              <div className="space-y-4">
                {recentLeaves.map((leave) => (
                  <div
                    key={leave.id}
                    className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium capitalize">{leave.type} Leave</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(leave.startDate), "MMM dd")} - {format(new Date(leave.endDate), "MMM dd, yyyy")}
                      </p>
                    </div>
                    <div className="flex items-center">
                      {leave.status === "pending" && (
                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">Pending</span>
                      )}
                      {leave.status === "approved" && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Approved</span>
                      )}
                      {leave.status === "rejected" && (
                        <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">Rejected</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-6">No recent leave requests</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="mr-2 h-5 w-5 text-hrms-500" />
              Recent Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentExpenses.length > 0 ? (
              <div className="space-y-4">
                {recentExpenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium capitalize">{expense.type}</p>
                      <p className="text-sm text-muted-foreground">{format(new Date(expense.date), "MMM dd, yyyy")}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">${expense.amount.toFixed(2)}</span>
                      {expense.status === "pending" && (
                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">Pending</span>
                      )}
                      {expense.status === "approved" && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Approved</span>
                      )}
                      {expense.status === "rejected" && (
                        <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">Rejected</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-6">No recent expenses</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
