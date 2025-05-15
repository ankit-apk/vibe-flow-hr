import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'your-very-secret-key'; // Store this in .env!

// Middleware
app.use(cors());
app.use(express.json());

// Create database connection pool
const pool = new Pool({
  host: process.env.VITE_PG_HOST || 'localhost',
  port: parseInt(process.env.VITE_PG_PORT || '5432'),
  user: process.env.VITE_PG_USER || 'postgres',
  password: process.env.VITE_PG_PASSWORD || 'postgres',
  database: process.env.VITE_PG_DATABASE || 'vibeflowdb',
});

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (token == null) return res.sendStatus(401); // if there isn't any token

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403); // if token is no longer valid
    req.user = user; // user contains the payload (e.g., userId, role)
    next(); // pass the execution to the downstream handlers
  });
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// --- AUTH ROUTES --- //
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role = 'employee', department = 'General', position = 'Employee' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Check if user already exists
    const existingUser = await pool.query('SELECT * FROM profiles WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    
    // Generate UUID for the new user
    const idResult = await pool.query('SELECT gen_random_uuid() as id');
    const userId = idResult.rows[0].id;

    const newUserResult = await pool.query(
      `INSERT INTO profiles (id, name, email, password_hash, role, department, position)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, email, role, department, position, avatar_url, manager_id, created_at, updated_at`,
      [userId, name, email, passwordHash, role, department, position]
    );

    // Create leave balances for the user
    await pool.query(
      `INSERT INTO leave_balances (user_id) VALUES ($1)`,
      [userId]
    );

    const user = newUserResult.rows[0];
    const token = jwt.sign({ userId: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    
    res.status(201).json({ user, token });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await pool.query('SELECT * FROM profiles WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Fetch full profile with leave balances for the token payload / response
    const profileResult = await pool.query(
      `SELECT p.*, lb.annual, lb.sick, lb.personal 
       FROM profiles p
       LEFT JOIN leave_balances lb ON p.id = lb.user_id
       WHERE p.id = $1`,
      [user.id]
    );
    const fullUserProfile = profileResult.rows[0];

    const token = jwt.sign({ userId: fullUserProfile.id, role: fullUserProfile.role, email: fullUserProfile.email }, JWT_SECRET, { expiresIn: '1h' });
    
    // Remove password_hash from the user object sent to client
    delete fullUserProfile.password_hash;

    res.json({ user: fullUserProfile, token });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(400).json({ message: 'User ID not found in token' });
    }
    
    const profileResult = await pool.query(
      `SELECT p.id, p.name, p.email, p.role, p.department, p.position, p.avatar_url, p.manager_id, 
              lb.annual, lb.sick, lb.personal
       FROM profiles p
       LEFT JOIN leave_balances lb ON p.id = lb.user_id
       WHERE p.id = $1`,
      [req.user.userId]
    );

    if (profileResult.rows.length > 0) {
      const userProfile = profileResult.rows[0];
      // Remove password_hash if it was accidentally included, though SELECT p.* was avoided here
      // delete userProfile.password_hash; // Not strictly needed due to explicit select
      res.json(userProfile);
    } else {
      res.status(404).json({ message: 'Profile not found for this user' });
    }
  } catch (error) {
    console.error('Error fetching current user profile:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

// New endpoint to get count of active profiles
app.get('/api/profiles/count', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT COUNT(*) AS total_profiles FROM profiles');
    res.json({ count: parseInt(rows[0].total_profiles, 10) });
  } catch (error) {
    console.error('Error fetching profiles count:', error);
    res.status(500).json({ message: 'Error fetching profiles count' });
  }
});

// Generic query endpoint (now protected)
app.post('/api/query', authenticateToken, async (req, res) => {
  try {
    const { text, params } = req.body;
    // Potentially add role-based query restrictions here if needed
    const result = await pool.query(text, params);
    res.json(result);
  } catch (error) {
    console.error('Database query error:', error);
    res.status(500).json({ error: 'Database query error' });
  }
});

// User profile endpoints (get by ID) - now protected
app.get('/api/profiles/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT p.id, p.name, p.email, p.role, p.department, p.position, p.avatar_url, p.manager_id, p.created_at, p.updated_at,
              lb.annual, lb.sick, lb.personal 
       FROM profiles p
       LEFT JOIN leave_balances lb ON p.id = lb.user_id
       WHERE p.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Error fetching profile' });
  }
});

// Create user profile - this endpoint is effectively replaced by /api/auth/register
// If you need a separate admin endpoint to create profiles without passwords, it would be different.
// For now, let's comment it out to avoid confusion.
/*
app.post('/api/profiles', authenticateToken, async (req, res) => {
  // Ensure only admins/HR can call this if it were to be reactivated
  // if (req.user.role !== 'admin' && req.user.role !== 'hr') return res.sendStatus(403);
  try {
    const { id, name, email, role, department, position } = req.body;
    // This version would need a way to set a default password or send an invite
    // For now, registration is the primary way to create users.
    const result = await pool.query(
      `INSERT INTO profiles (
        id, name, email, role, department, position
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, email, role, department, position`,
      [id, name, email, role, department, position]
    );
    
    await pool.query(
      `INSERT INTO leave_balances (user_id) VALUES ($1)`,
      [id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating profile:', error);
    res.status(500).json({ error: 'Error creating profile' });
  }
});
*/

// Get all profiles (example, might need adjustment based on actual profile schema)
// Consider adding pagination and filtering in a real application
app.get('/api/profiles', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        p.id, p.name, p.email, p.role, p.department, p.position, p.avatar_url, p.manager_id,
        p.created_at, p.updated_at,
        lb.annual, lb.sick, lb.personal
      FROM profiles p
      LEFT JOIN leave_balances lb ON p.id = lb.user_id
      ORDER BY p.name;
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching all profiles with balances:', error);
    res.status(500).json({ message: 'Error fetching profiles' });
  }
});

// Endpoint to update leave balances for a specific user (HR/Admin only)
app.put('/api/leave-balances/:userId', authenticateToken, async (req, res) => {
  const { userId } = req.params;
  const { annual, sick, personal } = req.body;
  const { role: requesterRole } = req.user; // Get role from JWT

  if (requesterRole !== 'hr' && requesterRole !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: Insufficient privileges' });
  }

  if (typeof annual !== 'number' || typeof sick !== 'number' || typeof personal !== 'number') {
    return res.status(400).json({ message: 'Invalid leave balance values. Must be numbers.' });
  }
  if (annual < 0 || sick < 0 || personal < 0) {
    return res.status(400).json({ message: 'Leave balance values cannot be negative.' });
  }

  try {
    const result = await pool.query(
      `UPDATE leave_balances
       SET annual = $1, sick = $2, personal = $3, updated_at = NOW()
       WHERE user_id = $4
       RETURNING *`,
      [annual, sick, personal, userId]
    );

    if (result.rows.length === 0) {
      // This could happen if the user_id is valid but has no leave_balance record yet (should be rare if created on profile creation)
      // Optionally, insert a new record, or return 404.
      // For now, assume record exists if user_id is valid.
      return res.status(404).json({ message: 'Leave balance record not found for this user.' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating leave balances:', error);
    res.status(500).json({ message: 'Error updating leave balances' });
  }
});

// New dedicated endpoint to update leave status and deduct balance if approved
app.put('/api/leaves/:leaveId/status', authenticateToken, async (req, res) => {
  const { leaveId } = req.params;
  const { status, remarks } = req.body; // reviewerId comes from token
  const reviewerId = req.user.userId; // Assuming JWT payload has userId which is the profile ID

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status value.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Update the leave status, reviewer, remarks, and reviewed_at
    const updatedLeaveResult = await client.query(
      `UPDATE leaves 
       SET status = $1, reviewed_by = $2, reviewed_at = NOW(), remarks = $3
       WHERE id = $4
       RETURNING *`,
      [status, reviewerId, remarks || null, leaveId]
    );

    if (updatedLeaveResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Leave request not found.' });
    }

    const updatedLeave = updatedLeaveResult.rows[0];

    // 2. If approved, deduct from leave_balances
    if (status === 'approved') {
      const leaveType = updatedLeave.type.toLowerCase(); // e.g., 'annual', 'sick', 'personal'
      const userId = updatedLeave.user_id;
      
      // Calculate leave duration (inclusive of start and end dates)
      const startDate = new Date(updatedLeave.start_date);
      const endDate = new Date(updatedLeave.end_date);
      const durationMs = endDate.getTime() - startDate.getTime();
      const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24)) + 1;

      if (durationDays <= 0) {
        // This case should ideally be validated at leave creation, but good to check
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Leave duration must be at least 1 day.' });
      }

      // Check if the leave type is one that deducts from balances
      if (['annual', 'sick', 'personal'].includes(leaveType)) {
        // Dynamically construct the column name for the update query
        // Ensure leaveType is a valid column name to prevent SQL injection, though here it's from DB value.
        const balanceUpdateQuery = 
          `UPDATE leave_balances 
           SET ${leaveType} = ${leaveType} - $1, updated_at = NOW()
           WHERE user_id = $2`;
        
        const balanceUpdateResult = await client.query(balanceUpdateQuery, [durationDays, userId]);

        if (balanceUpdateResult.rowCount === 0) {
          // This implies the user might not have a leave_balance record, or an issue occurred.
          // For robustness, you might create one, or log an error.
          await client.query('ROLLBACK');
          console.error(`Failed to update leave balance for user ${userId}, type ${leaveType}. No leave_balance record updated.`);
          // Not necessarily a client error if leave was approved but balance update failed systemically
          return res.status(500).json({ message: 'Leave approved, but failed to update balance record.' });
        }
      } else if (leaveType === 'unpaid') {
        // No balance deduction for unpaid leave, do nothing here
      } else {
        // Unknown leave type for balance deduction
        console.warn(`Leave type "${leaveType}" not recognized for balance deduction.`);
      }
    }

    await client.query('COMMIT');
    res.json(updatedLeave); // Return the updated leave object

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating leave status/balance:', error);
    res.status(500).json({ message: 'Error processing leave status update.' });
  } finally {
    client.release();
  }
});

const PORT = process.env.API_PORT || 3001;
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
}); 