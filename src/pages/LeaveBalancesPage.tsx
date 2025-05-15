import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getAllEmployeesWithBalances, updateLeaveBalance } from "@/services/leaveBalanceService";
import { User } from "@/types/hrms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Edit2, Save, User as UserIcon } from "lucide-react";
import { toast } from "sonner";

const LeaveBalancesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [employees, setEmployees] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    annual: number;
    sick: number;
    personal: number;
  }>({
    annual: 0,
    sick: 0,
    personal: 0
  });

  useEffect(() => {
    const fetchEmployees = async () => {
      if (!currentUser) return;
      
      try {
        setIsLoading(true);
        const allEmployees = await getAllEmployeesWithBalances();
        setEmployees(allEmployees);
      } catch (error) {
        console.error("Error fetching employees:", error);
        toast.error("Failed to load employees");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEmployees();
  }, [currentUser]);
  
  // Only HR and Manager can access this page
  if (!currentUser || (currentUser.role !== "manager" && currentUser.role !== "admin" && currentUser.role !== "hr")) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  const startEditing = (employee: User) => {
    setEditingId(employee.id);
    setEditValues({
      annual: employee.leaveBalance.annual,
      sick: employee.leaveBalance.sick,
      personal: employee.leaveBalance.personal
    });
  };

  const handleInputChange = (field: 'annual' | 'sick' | 'personal', value: string) => {
    const numValue = parseInt(value) || 0;
    setEditValues({
      ...editValues,
      [field]: numValue < 0 ? 0 : numValue // Prevent negative values
    });
  };

  const saveLeaveBalance = async (userId: string) => {
    try {
      await updateLeaveBalance(userId, editValues);
      
      // Update local state
      setEmployees(employees.map(emp => {
        if (emp.id === userId) {
          return {
            ...emp,
            leaveBalance: {
              ...editValues
            }
          };
        }
        return emp;
      }));
      
      setEditingId(null);
      toast.success("Leave balance updated successfully");
    } catch (error) {
      console.error("Error updating leave balance:", error);
      toast.error("Failed to update leave balance");
    }
  };

  return (
    <div className="space-y-6 animate-enter">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Leave Balance Management</h1>
        <p className="text-muted-foreground">
          Manage leave balances for all employees
        </p>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-hrms-700"></div>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Employee Leave Balances</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Annual Leave</TableHead>
                  <TableHead>Sick Leave</TableHead>
                  <TableHead>Personal Leave</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-hrms-100 flex items-center justify-center text-hrms-700 mr-2">
                          {employee.avatar ? (
                            <img
                              src={employee.avatar}
                              alt={employee.name}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <UserIcon className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{employee.name}</p>
                          <p className="text-xs text-muted-foreground">{employee.position}</p>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      {editingId === employee.id ? (
                        <Input
                          type="number"
                          min="0"
                          value={editValues.annual}
                          onChange={(e) => handleInputChange('annual', e.target.value)}
                          className="w-20 h-8"
                        />
                      ) : (
                        <span>{employee.leaveBalance.annual}</span>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      {editingId === employee.id ? (
                        <Input
                          type="number"
                          min="0"
                          value={editValues.sick}
                          onChange={(e) => handleInputChange('sick', e.target.value)}
                          className="w-20 h-8"
                        />
                      ) : (
                        <span>{employee.leaveBalance.sick}</span>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      {editingId === employee.id ? (
                        <Input
                          type="number"
                          min="0"
                          value={editValues.personal}
                          onChange={(e) => handleInputChange('personal', e.target.value)}
                          className="w-20 h-8"
                        />
                      ) : (
                        <span>{employee.leaveBalance.personal}</span>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      {editingId === employee.id ? (
                        <Button
                          size="sm"
                          className="h-8 px-2 bg-green-600 hover:bg-green-700"
                          onClick={() => saveLeaveBalance(employee.id)}
                        >
                          <Save className="h-4 w-4 mr-1" /> Save
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-2"
                          onClick={() => startEditing(employee)}
                        >
                          <Edit2 className="h-4 w-4 mr-1" /> Edit
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LeaveBalancesPage; 