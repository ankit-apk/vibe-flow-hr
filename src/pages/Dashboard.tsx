import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getUserLeaves, getAllPendingLeaves } from "@/services/leaveService";
import { getUserExpenses, getAllPendingExpenses } from "@/services/expenseService";
import { getActiveProfilesCount } from "@/services/apiClient";
import { Leave, Expense, User } from "@/types/hrms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { DollarSign, CalendarDays, Briefcase, Users, AlertTriangle, CheckCircle, Clock, X } from "lucide-react";
// import { mockUserLeaves, mockUserExpenses } from '@/data/mockData'; // Remove mock data

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, description }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </CardContent>
  </Card>
);

const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [userLeaves, setUserLeaves] = useState<Leave[]>([]);
  const [userExpenses, setUserExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New state for role-specific stats
  const [pendingLeavesCount, setPendingLeavesCount] = useState<number | null>(null);
  const [pendingExpensesCount, setPendingExpensesCount] = useState<number | null>(null);
  const [totalEmployeesCount, setTotalEmployeesCount] = useState<number | null>(null);


  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const [leavesData, expensesData] = await Promise.all([
          getUserLeaves(currentUser.id),
          getUserExpenses(currentUser.id),
        ]);
        setUserLeaves(leavesData);
        setUserExpenses(expensesData);

        // Fetch role-specific data
        if (currentUser.role === 'manager' || currentUser.role === 'hr' || currentUser.role === 'admin') {
          const [allPendingLeaves, allPendingExpenses] = await Promise.all([
            getAllPendingLeaves(),
            getAllPendingExpenses(),
          ]);
          setPendingLeavesCount(allPendingLeaves.length);
          setPendingExpensesCount(allPendingExpenses.length);
        }

        if (currentUser.role === 'hr' || currentUser.role === 'admin') {
          const profileCountData = await getActiveProfilesCount();
          setTotalEmployeesCount(profileCountData.count);
        }

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        // Handle error display to user if necessary
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  if (isLoading) {
    return <div className="p-4">Loading dashboard...</div>;
  }

  if (!currentUser) {
    return <div className="p-4">Please log in to view the dashboard.</div>;
  }

  const upcomingLeaves = userLeaves
    .filter(leave => new Date(leave.startDate) >= new Date() && leave.status === 'approved')
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 3);

  const recentExpenses = userExpenses
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const totalLeaveDaysTaken = userLeaves
    .filter(l => l.status === 'approved' && new Date(l.startDate) < new Date()) // consider only past approved leaves
    .reduce((acc, leave) => {
        const start = new Date(leave.startDate);
        const end = new Date(leave.endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include start day
        return acc + diffDays;
    },0);

  const totalExpensesAmount = userExpenses
    .filter(e => e.status === 'approved')
    .reduce((acc, expense) => acc + (typeof expense.amount === 'number' ? expense.amount : parseFloat(expense.amount as any)), 0);


  return (
    <ScrollArea className="h-full p-4 md:p-6">
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Welcome, {currentUser.name}!</h1>

        {/* General User Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Approved Leave Days Taken"
            value={totalLeaveDaysTaken}
            icon={<CalendarDays className="h-4 w-4 text-muted-foreground" />}
            description="Total approved leave days this year."
          />
          <StatCard
            title="Total Approved Expenses"
            value={`₹${totalExpensesAmount.toFixed(2)}`}
            icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
            description="Total sum of your approved expenses."
          />
           <StatCard
            title="Remaining Annual Leave"
            value={`${currentUser.leaveBalance?.annual || 0} days`}
            icon={<Briefcase className="h-4 w-4 text-muted-foreground" />}
          />
          <StatCard
            title="Role"
            value={currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}
            icon={<Users className="h-4 w-4 text-muted-foreground" />}
          />
        </div>

        {/* Role-Specific Stats for Manager/HR/Admin */}
        {(currentUser.role === 'manager' || currentUser.role === 'hr' || currentUser.role === 'admin') && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {pendingLeavesCount !== null && (
              <StatCard
                title="Pending Leave Approvals"
                value={pendingLeavesCount}
                icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
                description="Leave requests needing review."
              />
            )}
            {pendingExpensesCount !== null && (
              <StatCard
                title="Pending Expense Approvals"
                value={pendingExpensesCount}
                icon={<AlertTriangle className="h-4 w-4 text-orange-500" />}
                description="Expense claims needing review."
              />
            )}
            {(currentUser.role === 'hr' || currentUser.role === 'admin') && totalEmployeesCount !== null && (
              <StatCard
                title="Total Employees"
                value={totalEmployeesCount}
                icon={<Users className="h-4 w-4 text-blue-500" />}
                description="Total active employees in system."
              />
            )}
          </div>
        )}


        <Tabs defaultValue="leaves" className="space-y-4">
          <TabsList>
            <TabsTrigger value="leaves">My Upcoming Leaves</TabsTrigger>
            <TabsTrigger value="expenses">My Recent Expenses</TabsTrigger>
          </TabsList>
          <TabsContent value="leaves" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Approved Leaves</CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingLeaves.length > 0 ? (
                  <ul className="space-y-2">
                    {upcomingLeaves.map((leave) => (
                      <li key={leave.id} className="flex justify-between items-center p-2 border rounded-md">
                        <div>
                          <p className="font-semibold">{leave.type} Leave</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(leave.startDate), "PPP")} - {format(new Date(leave.endDate), "PPP")}
                          </p>
                        </div>
                        <span className="text-sm font-medium capitalize p-1.5 rounded-md bg-green-100 text-green-700 flex items-center">
                          <CheckCircle className="h-4 w-4 mr-1" /> Approved
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No upcoming approved leaves.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="expenses" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                {recentExpenses.length > 0 ? (
                  <ul className="space-y-2">
                    {recentExpenses.map((expense) => (
                      <li key={expense.id} className="flex justify-between items-center p-2 border rounded-md">
                        <div>
                          <p className="font-semibold">{expense.type}: {expense.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(expense.date), "PPP")} - Amount: ₹{typeof expense.amount === 'number' ? expense.amount.toFixed(2) : parseFloat(expense.amount as any).toFixed(2)}
                          </p>
                        </div>
                        <span className={`text-sm font-medium capitalize p-1.5 rounded-md flex items-center ${
                          expense.status === 'approved' ? 'bg-green-100 text-green-700' :
                          expense.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          expense.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {expense.status === 'approved' && <CheckCircle className="h-4 w-4 mr-1" />}
                          {expense.status === 'pending' && <Clock className="h-4 w-4 mr-1" />}
                          {expense.status === 'rejected' && <X className="h-4 w-4 mr-1" />}
                          {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No recent expenses found.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
};

export default Dashboard;
