// Test script for HR workflow
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function runTest() {
  console.log('🧪 Starting HR workflow test');
  
  // 1. Create test users
  console.log('\n[1] Creating test users...');
  
  // 1.1 Create employee
  const { data: employeeData, error: employeeError } = await supabase.auth.signUp({
    email: 'test-employee@example.com',
    password: 'password123',
    options: {
      data: {
        name: 'Test Employee',
        role: 'employee'
      }
    }
  });
  
  if (employeeError) {
    console.error('❌ Error creating employee:', employeeError.message);
    return;
  }
  
  const employeeId = employeeData.user.id;
  console.log('✅ Employee created with ID:', employeeId);
  
  // 1.2 Create HR
  const { data: hrData, error: hrError } = await supabase.auth.signUp({
    email: 'test-hr@example.com',
    password: 'password123',
    options: {
      data: {
        name: 'Test HR',
        role: 'hr'
      }
    }
  });
  
  if (hrError) {
    console.error('❌ Error creating HR:', hrError.message);
    return;
  }
  
  const hrId = hrData.user.id;
  console.log('✅ HR created with ID:', hrId);
  
  // Wait for user creation triggers to complete
  console.log('⌛ Waiting for database triggers...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 2. Sign in as employee and create leave request
  console.log('\n[2] Creating leave request as employee...');
  
  const { data: employeeAuth, error: employeeAuthError } = await supabase.auth.signInWithPassword({
    email: 'test-employee@example.com',
    password: 'password123'
  });
  
  if (employeeAuthError) {
    console.error('❌ Error signing in as employee:', employeeAuthError.message);
    return;
  }
  
  const employeeClient = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY,
    { 
      auth: { 
        autoRefreshToken: false, 
        persistSession: false
      }
    }
  );
  
  employeeClient.auth.setSession(employeeAuth.session);
  
  // Create leave request
  const { data: leaveData, error: leaveError } = await employeeClient.from('leaves').insert({
    user_id: employeeId,
    type: 'annual',
    start_date: new Date().toISOString().split('T')[0], // Today
    end_date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
    reason: 'Test leave request',
    status: 'pending'
  }).select().single();
  
  if (leaveError) {
    console.error('❌ Error creating leave request:', leaveError.message);
    return;
  }
  
  const leaveId = leaveData.id;
  console.log('✅ Leave request created with ID:', leaveId);
  
  // 3. Sign in as HR and view/approve the request
  console.log('\n[3] Signing in as HR to approve leave request...');
  
  const { data: hrAuth, error: hrAuthError } = await supabase.auth.signInWithPassword({
    email: 'test-hr@example.com',
    password: 'password123'
  });
  
  if (hrAuthError) {
    console.error('❌ Error signing in as HR:', hrAuthError.message);
    return;
  }
  
  const hrClient = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY,
    { 
      auth: { 
        autoRefreshToken: false, 
        persistSession: false
      }
    }
  );
  
  hrClient.auth.setSession(hrAuth.session);
  
  // View all pending leave requests
  const { data: pendingLeaves, error: pendingLeavesError } = await hrClient
    .from('leaves')
    .select('*')
    .eq('status', 'pending');
    
  if (pendingLeavesError) {
    console.error('❌ Error fetching pending leave requests:', pendingLeavesError.message);
    return;
  }
  
  console.log(`✅ HR can view ${pendingLeaves.length} pending leave requests`);
  
  // Approve the leave request
  const { data: approvedLeave, error: approveError } = await hrClient
    .from('leaves')
    .update({
      status: 'approved',
      reviewed_by: hrId,
      reviewed_at: new Date().toISOString(),
      remarks: 'Approved by HR as part of testing'
    })
    .eq('id', leaveId)
    .select()
    .single();
    
  if (approveError) {
    console.error('❌ Error approving leave request:', approveError.message);
    return;
  }
  
  console.log('✅ Leave request approved successfully:', approvedLeave.status);
  
  // 4. Check if the employee can see the updated status
  console.log('\n[4] Checking if employee can see updated leave status...');
  
  const { data: updatedLeave, error: updatedLeaveError } = await employeeClient
    .from('leaves')
    .select('*')
    .eq('id', leaveId)
    .single();
    
  if (updatedLeaveError) {
    console.error('❌ Error fetching updated leave status:', updatedLeaveError.message);
    return;
  }
  
  console.log('✅ Employee can see updated leave status:', updatedLeave.status);
  
  // 5. Test updating leave balances as HR
  console.log('\n[5] Testing HR updating leave balances...');
  
  // Get current leave balance
  const { data: currentBalance, error: balanceError } = await hrClient
    .from('leave_balances')
    .select('*')
    .eq('user_id', employeeId)
    .single();
    
  if (balanceError) {
    console.error('❌ Error fetching leave balance:', balanceError.message);
    return;
  }
  
  console.log('✅ Current leave balance:', currentBalance);
  
  // Update leave balance
  const { data: updatedBalance, error: updateBalanceError } = await hrClient
    .from('leave_balances')
    .update({
      annual: 25,
      sick: 15,
      personal: 10
    })
    .eq('user_id', employeeId)
    .select()
    .single();
    
  if (updateBalanceError) {
    console.error('❌ Error updating leave balance:', updateBalanceError.message);
    return;
  }
  
  console.log('✅ Updated leave balance:', updatedBalance);
  
  // Clean up test data
  console.log('\n[6] Cleaning up test data...');
  
  // This would need admin access to delete auth users
  console.log('⚠️ Note: Test users will remain in your database.');
  console.log('⚠️ To completely clean up, manually delete users in Supabase dashboard.');
  
  console.log('\n✅ Test completed successfully!');
}

runTest().catch(error => {
  console.error('\n❌ Test failed with error:', error);
}); 