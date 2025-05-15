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
    // req.user is populated by authenticateToken middleware (contains userId, role, email from JWT)
    if (!req.user || !req.user.userId) { // Ensure userId exists in token payload
      return res.status(400).json({ message: 'User ID not found in token' });
    }
    // Fetch profile using userId from token, assuming profiles.id is the target
    const { rows } = await pool.query('SELECT id, name AS full_name, role, email FROM profiles WHERE id = $1', [req.user.userId]);
    if (rows.length > 0) {
      res.json(rows[0]);
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
    const { rows } = await pool.query('SELECT id, user_id, full_name, role, email FROM profiles');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching profiles:', error);
    res.status(500).json({ message: 'Error fetching profiles' });
  }
});

// Get a single profile by ID
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

const PORT = process.env.API_PORT || 3001;
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
}); 