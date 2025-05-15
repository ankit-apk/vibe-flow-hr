import React, { useEffect, useState } from 'react';
import { getAllProfilesWithBalances, updateLeaveBalance } from '@/services/apiClient';
import { User, Role } from '@/types/hrms'; // Role might be needed for checks
import { useAuth } from '@/contexts/AuthContext';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from "sonner";
import { Pencil } from 'lucide-react';

interface EditBalanceForm {
  annual: string;
  sick: string;
  personal: string;
}

const EmployeeListPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [employees, setEmployees] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<EditBalanceForm>({ annual: '0', sick: '0', personal: '0' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchEmployees = async () => {
      // Add role check if needed, for now, assume navigation handles access control
      // if (!currentUser || !['manager', 'hr', 'admin'].includes(currentUser.role)) {
      //   setError('Access Denied');
      //   setIsLoading(false);
      //   return;
      // }
      
      setIsLoading(true);
      try {
        const data = await getAllProfilesWithBalances();
        setEmployees(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching employees:', err);
        setError('Failed to load employee data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployees();
  }, [currentUser]); // Refetch if user changes, though typically not needed for this list

  const handleEditClick = (employee: User) => {
    setSelectedEmployee(employee);
    setEditForm({
      annual: String(employee.leaveBalance.annual),
      sick: String(employee.leaveBalance.sick),
      personal: String(employee.leaveBalance.personal),
    });
    setIsEditDialogOpen(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveBalances = async () => {
    if (!selectedEmployee) return;

    const annual = parseInt(editForm.annual, 10);
    const sick = parseInt(editForm.sick, 10);
    const personal = parseInt(editForm.personal, 10);

    if (isNaN(annual) || isNaN(sick) || isNaN(personal) || annual < 0 || sick < 0 || personal < 0) {
      toast.error("Invalid input. Leave days must be non-negative numbers.");
      return;
    }

    setIsSaving(true);
    try {
      const updatedBalances = await updateLeaveBalance(selectedEmployee.id, { annual, sick, personal });
      setEmployees(prevEmployees => 
        prevEmployees.map(emp => 
          emp.id === selectedEmployee.id 
            ? { ...emp, leaveBalance: { annual: updatedBalances.annual, sick: updatedBalances.sick, personal: updatedBalances.personal } } 
            : emp
        )
      );
      toast.success("Leave balances updated successfully!");
      setIsEditDialogOpen(false);
    } catch (err: any) {
      console.error("Error updating balances:", err);
      toast.error(err.response?.data?.message || "Failed to update leave balances.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-4">Loading employee data...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }

  if (employees.length === 0) {
    return <div className="p-4">No employees found.</div>;
  }

  const canEditBalances = currentUser && (currentUser.role === 'hr' || currentUser.role === 'admin');

  return (
    <ScrollArea className="h-full p-4 md:p-6">
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Employee Management</h1>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Position</TableHead>
              <TableHead className="text-right">Annual</TableHead>
              <TableHead className="text-right">Sick</TableHead>
              <TableHead className="text-right">Personal</TableHead>
              {canEditBalances && <TableHead className="text-center">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell>{employee.name}</TableCell>
                <TableCell>{employee.email}</TableCell>
                <TableCell><Badge variant="outline">{employee.role.charAt(0).toUpperCase() + employee.role.slice(1)}</Badge></TableCell>
                <TableCell>{employee.department}</TableCell>
                <TableCell>{employee.position}</TableCell>
                <TableCell className="text-right">{employee.leaveBalance.annual} d</TableCell>
                <TableCell className="text-right">{employee.leaveBalance.sick} d</TableCell>
                <TableCell className="text-right">{employee.leaveBalance.personal} d</TableCell>
                {canEditBalances && (
                  <TableCell className="text-center">
                    <Button variant="outline" size="sm" onClick={() => handleEditClick(employee)}>
                      <Pencil className="h-4 w-4 mr-1 md:mr-2" /> Edit
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedEmployee && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Leave Balances for {selectedEmployee.name}</DialogTitle>
              <DialogDescription>
                Update the annual, sick, and personal leave day balances.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="annual" className="text-right">
                  Annual
                </Label>
                <Input id="annual" name="annual" type="number" value={editForm.annual} onChange={handleFormChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="sick" className="text-right">
                  Sick
                </Label>
                <Input id="sick" name="sick" type="number" value={editForm.sick} onChange={handleFormChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="personal" className="text-right">
                  Personal
                </Label>
                <Input id="personal" name="personal" type="number" value={editForm.personal} onChange={handleFormChange} className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                 <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              </DialogClose>
              <Button onClick={handleSaveBalances} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </ScrollArea>
  );
};

export default EmployeeListPage; 