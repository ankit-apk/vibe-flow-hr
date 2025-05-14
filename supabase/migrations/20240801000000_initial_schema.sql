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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create RLS policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Managers can view profiles they manage" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() IN (
    SELECT manager_id FROM public.profiles WHERE id = auth.uid()
  ));

-- Leave balances policies
CREATE POLICY "Users can view their own leave balance" 
  ON public.leave_balances FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Managers can view leave balances they manage" 
  ON public.leave_balances FOR SELECT 
  USING (auth.uid() IN (
    SELECT manager_id FROM public.profiles WHERE id = user_id
  ));

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