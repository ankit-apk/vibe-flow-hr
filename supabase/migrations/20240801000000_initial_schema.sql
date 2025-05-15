-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'employee',
  department TEXT NOT NULL,
  position TEXT NOT NULL,
  avatar_url TEXT,
  manager_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create leave_balances table
CREATE TABLE IF NOT EXISTS public.leave_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  annual INTEGER NOT NULL DEFAULT 15,
  sick INTEGER NOT NULL DEFAULT 10,
  personal INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_user_id UNIQUE (user_id)
);

-- Create leaves table
CREATE TABLE IF NOT EXISTS public.leaves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create RLS policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Clean up any old profile SELECT policies
DROP POLICY IF EXISTS "Managers can view profiles they manage" ON public.profiles;
DROP POLICY IF EXISTS "HR can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: self, manager, admin view" ON public.profiles;

-- New policy: employees, managers, or admins can SELECT any profile they need
CREATE POLICY "Profiles: self or approver view"
  ON public.profiles FOR SELECT
  USING (
    -- you can always read your own row
    auth.uid() = id
    -- managers, hr, and admins can read all rows
    OR EXISTS (
      SELECT 1 FROM public.profiles AS p
      WHERE p.id = auth.uid() AND p.role IN ('manager', 'admin', 'hr')
    )
  );

-- Leave balances policies
CREATE POLICY "Users can view their own leave balance" 
  ON public.leave_balances FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Managers can view leave balances they manage" 
  ON public.leave_balances FOR SELECT 
  USING (auth.uid() IN (
    SELECT manager_id FROM public.profiles WHERE id = user_id
  ));

-- HR can view and update all leave balances
CREATE POLICY "HR can view all leave balances" 
  ON public.leave_balances FOR SELECT 
  USING ((SELECT role = 'hr' FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "HR can update all leave balances" 
  ON public.leave_balances FOR UPDATE 
  USING ((SELECT role = 'hr' FROM public.profiles WHERE id = auth.uid()));

-- Leaves policies
CREATE POLICY "Users can view their own leaves" 
  ON public.leaves FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own leaves" 
  ON public.leaves FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Managers can view leaves they manage" 
  ON public.leaves FOR SELECT 
  USING (auth.uid() IN (
    SELECT manager_id FROM public.profiles WHERE id = user_id
  ));

CREATE POLICY "Managers can update leaves they manage" 
  ON public.leaves FOR UPDATE 
  USING (auth.uid() IN (
    SELECT manager_id FROM public.profiles WHERE id = user_id
  ));

-- Expenses policies
CREATE POLICY "Users can view their own expenses" 
  ON public.expenses FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own expenses" 
  ON public.expenses FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Managers can view expenses they manage" 
  ON public.expenses FOR SELECT 
  USING (auth.uid() IN (
    SELECT manager_id FROM public.profiles WHERE id = user_id
  ));

CREATE POLICY "Managers can update expenses they manage" 
  ON public.expenses FOR UPDATE 
  USING (auth.uid() IN (
    SELECT manager_id FROM public.profiles WHERE id = user_id
  ));

-- Managers can view all leaves
CREATE POLICY "Managers can view all leaves" 
  ON public.leaves FOR SELECT 
  USING ((SELECT role = 'manager' FROM public.profiles WHERE id = auth.uid()));

-- Managers can update all leaves
CREATE POLICY "Managers can update all leaves"
  ON public.leaves FOR UPDATE
  USING ((SELECT role = 'manager' FROM public.profiles WHERE id = auth.uid()));

-- Managers can view all expenses
CREATE POLICY "Managers can view all expenses"
  ON public.expenses FOR SELECT
  USING ((SELECT role = 'manager' FROM public.profiles WHERE id = auth.uid()));

-- Managers can update all expenses
CREATE POLICY "Managers can update all expenses"
  ON public.expenses FOR UPDATE
  USING ((SELECT role = 'manager' FROM public.profiles WHERE id = auth.uid()));

-- HR can view all leaves
CREATE POLICY "HR can view all leaves"
  ON public.leaves FOR SELECT
  USING ((SELECT role = 'hr' FROM public.profiles WHERE id = auth.uid()));

-- HR can update all leaves
CREATE POLICY "HR can update all leaves"
  ON public.leaves FOR UPDATE
  USING ((SELECT role = 'hr' FROM public.profiles WHERE id = auth.uid()));

-- HR can view all expenses
CREATE POLICY "HR can view all expenses"
  ON public.expenses FOR SELECT
  USING ((SELECT role = 'hr' FROM public.profiles WHERE id = auth.uid()));

-- HR can update all expenses
CREATE POLICY "HR can update all expenses"
  ON public.expenses FOR UPDATE
  USING ((SELECT role = 'hr' FROM public.profiles WHERE id = auth.uid()));

-- Admins can view all leaves
CREATE POLICY "Admins can view all leaves"
  ON public.leaves FOR SELECT
  USING ((SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid()));

-- Admins can update all leaves
CREATE POLICY "Admins can update all leaves"
  ON public.leaves FOR UPDATE
  USING ((SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid()));

-- Admins can view all expenses
CREATE POLICY "Admins can view all expenses"
  ON public.expenses FOR SELECT
  USING ((SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid()));

-- Admins can update all expenses
CREATE POLICY "Admins can update all expenses"
  ON public.expenses FOR UPDATE
  USING ((SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid()));

-- Automatically create profile record when a new user registers
CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, department, position)
  VALUES (
    NEW.id,
    COALESCE(NEW.user_metadata->>'name', ''),
    NEW.email,
    COALESCE(NEW.user_metadata->>'role', 'employee'),
    'Employee',
    'Employee'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Automatically create leave balance record when a new profile is inserted
CREATE OR REPLACE FUNCTION public.handle_new_leave_balance()
  RETURNS trigger AS $$
BEGIN
  INSERT INTO public.leave_balances (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profile_insert
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_leave_balance(); 