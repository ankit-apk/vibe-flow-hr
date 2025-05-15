import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Role } from "@/types/hrms";

const loginFormSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const registerFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  inviteCode: z.string().optional(),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;
type RegisterFormValues = z.infer<typeof registerFormSchema>;

// Environment keys for signup role elevation
const ADMIN_SIGNUP_CODE = import.meta.env.VITE_ADMIN_SIGNUP_KEY;
const HR_SIGNUP_CODE = import.meta.env.VITE_HR_SIGNUP_KEY;
const MANAGER_SIGNUP_CODE = import.meta.env.VITE_MANAGER_SIGNUP_KEY;

const LoginPage: React.FC = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      inviteCode: "",
    },
  });
  
  const onLoginSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      const success = await login(values.email, values.password);
      if (success) {
        navigate("/");
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const onRegisterSubmit = async (values: RegisterFormValues) => {
    setIsLoading(true);
    try {
      // Determine role based on invite code
      let signupRole: Role = "employee";
      if (values.inviteCode === ADMIN_SIGNUP_CODE) signupRole = "admin";
      else if (values.inviteCode === HR_SIGNUP_CODE) signupRole = "hr";
      else if (values.inviteCode === MANAGER_SIGNUP_CODE) signupRole = "manager";
      const success = await register(
        values.email,
        values.password,
        values.name,
        signupRole
      );
      if (success) {
        // Stay on login page but switch to login tab
        loginForm.setValue("email", values.email);
        // Move to login tab
        setActiveTab("login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-hrms-100 to-background">
      <div className="w-full max-w-md px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-hrms-700">HRMS</h1>
          <p className="text-muted-foreground mt-2">Human Resource Management System</p>
        </div>
        
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Welcome</CardTitle>
            <CardDescription>
              Access your HRMS account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as "login" | "register")}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter your email" 
                              {...field} 
                              autoComplete="email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="••••••••" 
                              {...field} 
                              autoComplete="current-password"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              
              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter your full name" 
                              {...field} 
                              autoComplete="name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter your email" 
                              {...field} 
                              autoComplete="email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="••••••••" 
                              {...field} 
                              autoComplete="new-password"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="inviteCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Invite Code (optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter invite code"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Registering..." : "Register"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex flex-col">
            {/* <div className="text-center text-sm text-muted-foreground mt-2">
              <p>For testing, you can create a new account or use:</p>
              <p>Email: john@example.com</p>
              <p>Password: password123</p>
              <p className="mt-1">(Create these accounts in Supabase)</p>
            </div> */}
            
            {/* Demo Section */}
            {/* <div className="mt-4 border-t pt-4">
              <h3 className="text-sm font-medium mb-2">Demo Access</h3>
              <div className="grid grid-cols-1 gap-2 text-xs">
                <div className="p-2 bg-muted rounded-md">
                  <p className="font-semibold">HR Role:</p>
                  <p>Email: hr@example.com</p>
                  <p>Password: password123</p>
                  <p className="text-muted-foreground mt-1">For HR registration, use invite code: <span className="font-mono bg-background px-1">HR_CODE</span></p>
                </div>
                <div className="p-2 bg-muted rounded-md">
                  <p className="font-semibold">Manager Role:</p>
                  <p>Email: manager@example.com</p>
                  <p>Password: password123</p>
                  <p className="text-muted-foreground mt-1">For manager registration, use invite code: <span className="font-mono bg-background px-1">MGR_CODE</span></p>
                </div>
              </div>
            </div> */}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
