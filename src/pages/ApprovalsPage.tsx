import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getAllPendingLeaves, updateLeaveStatus } from "@/services/leaveService";
import { getAllPendingExpenses, updateExpenseStatus } from "@/services/expenseService";
import { getProfile } from "@/services/apiClient";
import { format } from "date-fns";
import { Leave, Expense } from "@/types/hrms";
import { Check, X, Calendar, DollarSign, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const ApprovalsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: "leave" | "expense";
    id: string;
    action: "approve" | "reject";
    remarks: string;
  }>({
    open: false,
    type: "leave",
    id: "",
    action: "approve",
    remarks: "",
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [employeeCache, setEmployeeCache] = useState<Record<string, { name: string }>>({});
  
  useEffect(() => {
    const fetchApprovals = async () => {
      if (!currentUser) return;
      
      try {
        setIsLoading(true);
        
        const [pendingLeaves, pendingExpenses] = await Promise.all([
          getAllPendingLeaves(),
          getAllPendingExpenses(),
        ]);
        
        setLeaves(pendingLeaves);
        setExpenses(pendingExpenses);
        
        const userIds = new Set<string>();
        pendingLeaves.forEach(leave => userIds.add(leave.userId));
        pendingExpenses.forEach(expense => userIds.add(expense.userId));
        
        if (userIds.size > 0) {
          const profilesData = await Promise.all(
            Array.from(userIds).map(id => getProfile(id))
          );

          const cache: Record<string, { name: string }> = {};
          profilesData.forEach(profile => {
            if (profile && profile.id && profile.name) {
              cache[profile.id] = { name: profile.name };
            }
          });
          setEmployeeCache(cache);
        }
      } catch (error) {
        console.error("Error fetching approvals or profiles:", error);
        toast.error("Failed to load pending approvals or employee details");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchApprovals();
  }, [currentUser, refreshKey]);
  
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
  
  // Helper function to get employee name
  const getEmployeeName = (userId: string) => {
    return employeeCache[userId]?.name || "Unknown Employee";
  };
  
  const handleLeaveAction = (leaveId: string, action: "approve" | "reject") => {
    setConfirmDialog({
      open: true,
      type: "leave",
      id: leaveId,
      action,
      remarks: ""
    });
  };
  
  const handleExpenseAction = (expenseId: string, action: "approve" | "reject") => {
    setConfirmDialog({
      open: true,
      type: "expense",
      id: expenseId,
      action,
      remarks: ""
    });
  };

  const handleRemarksChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setConfirmDialog({
      ...confirmDialog,
      remarks: e.target.value
    });
  };
  
  const confirmAction = async () => {
    try {
      if (confirmDialog.type === "leave") {
        await updateLeaveStatus(
          confirmDialog.id,
          confirmDialog.action === "approve" ? "approved" : "rejected",
          currentUser.id,
          confirmDialog.remarks
        );
        toast.success(`Leave request ${confirmDialog.action}d successfully`);
      } else {
        await updateExpenseStatus(
          confirmDialog.id,
          confirmDialog.action === "approve" ? "approved" : "rejected",
          currentUser.id,
          confirmDialog.remarks
        );
        toast.success(`Expense request ${confirmDialog.action}d successfully`);
      }
      setConfirmDialog({ ...confirmDialog, open: false, remarks: "" });
      setRefreshKey(prev => prev + 1); // Force re-render to refresh data
    } catch (error) {
      console.error("Error processing request:", error);
      toast.error("An error occurred. Please try again.");
    }
  };

  return (
    <div className="space-y-6 animate-enter" key={refreshKey}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Approvals</h1>
        <p className="text-muted-foreground">
          Review and approve leave and expense requests
        </p>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-hrms-700"></div>
        </div>
      ) : null}
      
      <Tabs defaultValue="leaves">
        <TabsList>
          <TabsTrigger value="leaves" className="flex items-center">
            <Calendar className="h-4 w-4 mr-2" /> 
            Leave Requests <span className="ml-2 bg-hrms-100 text-hrms-700 text-xs py-0.5 px-2 rounded-full">{leaves.length}</span>
          </TabsTrigger>
          <TabsTrigger value="expenses" className="flex items-center">
            <DollarSign className="h-4 w-4 mr-2" /> 
            Expense Requests <span className="ml-2 bg-hrms-100 text-hrms-700 text-xs py-0.5 px-2 rounded-full">{expenses.length}</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="leaves" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Leave Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {leaves.length > 0 ? (
                <div className="rounded-md border">
                  <div className="grid grid-cols-6 bg-muted/50 p-4 text-sm font-medium">
                    <div>Employee</div>
                    <div>Type</div>
                    <div>Period</div>
                    <div>Duration</div>
                    <div>Reason</div>
                    <div>Actions</div>
                  </div>
                  
                  <div className="divide-y">
                    {leaves.map((leave) => {
                      const employeeName = getEmployeeName(leave.userId);
                      const startDate = new Date(leave.startDate);
                      const endDate = new Date(leave.endDate);
                      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                      
                      return (
                        <div key={leave.id} className="grid grid-cols-6 p-4 text-sm">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-hrms-100 flex items-center justify-center text-hrms-700 mr-2">
                              <User className="h-4 w-4" />
                            </div>
                            {employeeName}
                          </div>
                          <div className="capitalize">{leave.type}</div>
                          <div>
                            {format(startDate, "MMM dd")} - {format(endDate, "MMM dd")}
                          </div>
                          <div>{diffDays} day{diffDays > 1 ? "s" : ""}</div>
                          <div className="truncate max-w-[150px]">{leave.reason}</div>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 px-2 text-green-600 border-green-600 hover:bg-green-50"
                              onClick={() => handleLeaveAction(leave.id, "approve")}
                            >
                              <Check className="h-4 w-4 mr-1" /> Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 px-2 text-red-600 border-red-600 hover:bg-red-50"
                              onClick={() => handleLeaveAction(leave.id, "reject")}
                            >
                              <X className="h-4 w-4 mr-1" /> Reject
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <h3 className="text-lg font-medium mb-2">No pending leave requests</h3>
                  <p className="text-muted-foreground">
                    All leave requests have been processed.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="expenses" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Expense Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {expenses.length > 0 ? (
                <div className="rounded-md border">
                  <div className="grid grid-cols-6 bg-muted/50 p-4 text-sm font-medium">
                    <div>Employee</div>
                    <div>Type</div>
                    <div>Date</div>
                    <div>Amount</div>
                    <div>Description</div>
                    <div>Actions</div>
                  </div>
                  
                  <div className="divide-y">
                    {expenses.map((expense) => {
                      const employeeName = getEmployeeName(expense.userId);
                      
                      return (
                        <div key={expense.id} className="grid grid-cols-6 p-4 text-sm">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-hrms-100 flex items-center justify-center text-hrms-700 mr-2">
                              <User className="h-4 w-4" />
                            </div>
                            {employeeName}
                          </div>
                          <div className="capitalize">{expense.type}</div>
                          <div>{format(new Date(expense.date), "MMM dd, yyyy")}</div>
                          <div>${expense.amount.toFixed(2)}</div>
                          <div className="truncate max-w-[150px]">{expense.description}</div>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 px-2 text-green-600 border-green-600 hover:bg-green-50"
                              onClick={() => handleExpenseAction(expense.id, "approve")}
                            >
                              <Check className="h-4 w-4 mr-1" /> Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 px-2 text-red-600 border-red-600 hover:bg-red-50"
                              onClick={() => handleExpenseAction(expense.id, "reject")}
                            >
                              <X className="h-4 w-4 mr-1" /> Reject
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <h3 className="text-lg font-medium mb-2">No pending expense requests</h3>
                  <p className="text-muted-foreground">
                    All expense requests have been processed.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Confirmation Dialog - Updated to include remarks */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Confirm {confirmDialog.action === "approve" ? "Approval" : "Rejection"}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to {confirmDialog.action} this {confirmDialog.type} request?
            </DialogDescription>
          </DialogHeader>
          
          <div className="my-4">
            <Label htmlFor="remarks" className="text-sm font-medium">Remarks (Optional)</Label>
            <Textarea 
              id="remarks"
              placeholder="Add any comments or feedback about this decision"
              value={confirmDialog.remarks}
              onChange={handleRemarksChange}
              className="mt-2"
            />
          </div>
          
          <DialogFooter className="flex items-center justify-end space-x-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button 
              variant={confirmDialog.action === "approve" ? "default" : "destructive"}
              onClick={confirmAction}
            >
              {confirmDialog.action === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApprovalsPage;
