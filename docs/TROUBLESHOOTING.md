# Troubleshooting Guide

## HR Registration and Permissions

### Cannot Register as HR

If you're unable to register as an HR user:

1. **Check Environment Variables:**

   - Verify that `VITE_HR_SIGNUP_KEY` is set in your `.env` file:
     ```
     VITE_HR_SIGNUP_KEY=HR_CODE
     ```
   - Ensure your app is restarted after adding/changing environment variables.

2. **Registration Process:**

   - When registering, make sure to enter exactly `HR_CODE` in the invite code field (case sensitive).
   - Check browser console for any errors.

3. **Verify Supabase Configuration:**
   - The HR role needs to be added to Supabase schema and policies.
   - Run the migration file to ensure all policies include the 'hr' role.

### HR Cannot See Leave/Expense Requests

If an HR user can't view or approve leave/expense requests:

1. **RLS (Row-Level Security) Policies:**

   - Verify that RLS policies for leaves and expenses include the 'hr' role.
   - The HR role should have the same level of access as managers.

2. **Type Definitions:**

   - Ensure the HR role is included in the types definition (src/types/hrms.ts).

3. **UI Access:**
   - Check that the HR role is included in the allowed roles for approval pages.
   - Verify the sidebar includes HR in the roles array for relevant menu items.

### Database Schema Issues

If there are errors related to missing fields:

1. **Missing 'remarks' Field:**

   - Make sure the 'leaves' and 'expenses' tables have the 'remarks' column.
   - Verify Supabase types include remarks in the type definitions.

2. **Migration Commands:**
   - Run the following command to apply schema changes:
     ```bash
     npx supabase migration up
     ```

### Testing the HR Workflow

To test the full HR workflow:

1. **Register Users:**

   - Register an employee user with no invite code
   - Register an HR user with the invite code `HR_CODE`

2. **Submit and Approve Requests:**

   - Login as employee and submit a leave request
   - Logout and login as HR
   - Navigate to Approvals page to view and approve the request

3. **Testing Script:**
   - Run the testing script to automate this workflow:
     ```bash
     node scripts/test-hr-workflow.js
     ```
