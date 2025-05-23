import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getUserExpenses, createExpense } from "@/services/expenseService";
import { format } from "date-fns";
import { Expense, ExpenseType } from "@/types/hrms";
import { DollarSign, Plus, Filter, CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { expenseTypeOptions } from "@/data/formOptions";

// Form schema for expense request
const expenseFormSchema = z.object({
  type: z.enum(["travel", "office", "meals", "other"]),
  amount: z.coerce
    .number()
    .positive("Amount must be greater than 0")
    .max(10000, "Amount cannot exceed $10,000"),
  date: z.date({
    required_error: "Date is required",
  }),
  description: z.string().min(5, "Description must be at least 5 characters"),
});

const ExpensesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [filter, setFilter] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [userExpenses, setUserExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [totalApproved, setTotalApproved] = useState<number>(0);
  const [totalPending, setTotalPending] = useState<number>(0);
  
  useEffect(() => {
    const fetchExpenses = async () => {
      if (!currentUser) return;
      
      try {
        setIsLoading(true);
        const expenses = await getUserExpenses(currentUser.id);
        const filteredExpenses = expenses.filter(expense => !filter || expense.status === filter);
        
        setUserExpenses(filteredExpenses);
        
        // Calculate totals, ensuring amount is a number
        setTotalApproved(expenses
          .filter(expense => expense.status === "approved")
          .reduce((sum, expense) => sum + Number(expense.amount), 0)); // Ensure Number conversion
        
        setTotalPending(expenses
          .filter(expense => expense.status === "pending")
          .reduce((sum, expense) => sum + Number(expense.amount), 0)); // Ensure Number conversion
      } catch (error) {
        console.error("Error fetching expenses:", error);
        toast.error("Failed to fetch expense requests");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchExpenses();
  }, [currentUser, filter]);
  
  if (!currentUser) return null;
  
  // Form for creating a new expense request
  const form = useForm<z.infer<typeof expenseFormSchema>>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      type: "travel",
      amount: undefined, // Revert to undefined, will fix input binding
      description: "",
      date: new Date(),
    },
  });
  
  const onSubmit = async (values: z.infer<typeof expenseFormSchema>) => {
    if (!currentUser) return;
    
    try {
      await createExpense({
        userId: currentUser.id,
        type: values.type,
        amount: values.amount, // Zod schema coerces this to number
        date: values.date.toISOString().split('T')[0],
        description: values.description,
      });
      
      toast.success("Expense submitted successfully");
      setDialogOpen(false);
      form.reset(); // This will reset to new defaultValues including amount
      
      // Refresh the expenses list
      const updatedExpenses = await getUserExpenses(currentUser.id);
      const filteredExpenses = updatedExpenses.filter(expense => !filter || expense.status === filter);
      setUserExpenses(filteredExpenses);
      
      // Update totals, ensuring amount is a number
      setTotalApproved(updatedExpenses
        .filter(expense => expense.status === "approved")
        .reduce((sum, expense) => sum + Number(expense.amount), 0)); // Ensure Number conversion
      
      setTotalPending(updatedExpenses
        .filter(expense => expense.status === "pending")
        .reduce((sum, expense) => sum + Number(expense.amount), 0)); // Ensure Number conversion
    } catch (error) {
      console.error("Error creating expense:", error);
      toast.error("Failed to submit expense");
    }
  };

  return (
    <div className="space-y-6 animate-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">
            Submit and track your expense requests
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={filter === null}
                onCheckedChange={() => setFilter(null)}
              >
                All
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filter === "pending"}
                onCheckedChange={() => setFilter("pending")}
              >
                Pending
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filter === "approved"}
                onCheckedChange={() => setFilter("approved")}
              >
                Approved
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filter === "rejected"}
                onCheckedChange={() => setFilter("rejected")}
              >
                Rejected
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              {filter ? `Filter: ${filter}` : "Filter"}
            </Button>
          </DropdownMenu>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Expense
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Submit New Expense</DialogTitle>
                <DialogDescription>
                  Fill in the details below to submit a new expense request.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expense Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select expense type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {expenseTypeOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
                              <Input
                                ref={field.ref}
                                name={field.name}
                                onBlur={field.onBlur}
                                type="number"
                                placeholder="0.00"
                                className="pl-8"
                                value={field.value === undefined || field.value === null || isNaN(Number(field.value)) ? '' : String(field.value)}
                                onChange={(e) => {
                                  const stringValue = e.target.value;
                                  field.onChange(stringValue === '' ? undefined : stringValue);
                                }}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarDays className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                                className="p-3 pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Provide details about this expense"
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Briefly explain the purpose of this expense.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button 
                      variant="outline" 
                      type="button"
                      onClick={() => setDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Submit Expense</Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Expense summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Approved Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalApproved.toFixed(2)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalPending.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Expense list */}
      <Card>
        <CardHeader>
          <CardTitle>Expense Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="rounded-md border min-w-[600px]">
              <div className="grid grid-cols-5 bg-muted/50 p-4 text-sm font-medium">
                <div>Type</div>
                <div>Date</div>
                <div>Amount</div>
                <div>Description</div>
                <div>Status</div>
              </div>
              
              {userExpenses.length > 0 ? (
                <div className="divide-y">
                  {userExpenses.map((expense) => (
                    <div key={expense.id} className="grid grid-cols-5 p-4 text-sm">
                      <div className="capitalize">{expense.type}</div>
                      <div>{format(new Date(expense.date), "MMM dd, yyyy")}</div>
                      <div>₹{typeof expense.amount === 'number' ? expense.amount.toFixed(2) : parseFloat(expense.amount as any).toFixed(2)}</div>
                      <div className="truncate max-w-[200px]">{expense.description}</div>
                      <div>
                        {expense.status === "pending" && (
                          <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                            Pending
                          </span>
                        )}
                        {expense.status === "approved" && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                            Approved
                          </span>
                        )}
                        {expense.status === "rejected" && (
                          <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                            Rejected
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-muted-foreground">No expense requests found</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpensesPage;
