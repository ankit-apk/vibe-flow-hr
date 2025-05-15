// Test connection to PostgreSQL

const { Pool } = require('pg');
require('dotenv').config();

// Create a pool instance
const pool = new Pool({
  host: process.env.VITE_PG_HOST || 'localhost',
  port: parseInt(process.env.VITE_PG_PORT || '5432'),
  user: process.env.VITE_PG_USER || 'postgres',
  password: process.env.VITE_PG_PASSWORD || 'postgres',
  database: process.env.VITE_PG_DATABASE || 'vibeflowdb',
});

async function testConnection() {
  try {
    // Test simple query
    const res = await pool.query('SELECT NOW() as current_time');
    console.log('✅ PostgreSQL connection successful!');
    console.log(`🕒 Database time: ${res.rows[0].current_time}`);
    
    // Test schema
    const schemaRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('\n📋 Database tables:');
    schemaRes.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    
    // Test count of records in each table
    const tables = schemaRes.rows.map(row => row.table_name);
    
    console.log('\n📊 Table record counts:');
    for (const table of tables) {
      const countRes = await pool.query(`SELECT COUNT(*) FROM ${table}`);
      console.log(`- ${table}: ${countRes.rows[0].count} records`);
    }
    
  } catch (err) {
    console.error('❌ Database connection test failed:');
    console.error(err);
  } finally {
    // Close the connection pool
    await pool.end();
  }
}

// Run the test
testConnection(); 