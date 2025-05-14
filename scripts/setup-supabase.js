#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

console.log(`${colors.bright}${colors.cyan}
======================================
      VibeFlow HR Setup Script
======================================
${colors.reset}

This script will help you set up your Supabase project for VibeFlow HR.
`);

// Check if Supabase CLI is installed
try {
  execSync('supabase --version', { stdio: 'ignore' });
  console.log(`${colors.green}✓ Supabase CLI is installed${colors.reset}`);
} catch (error) {
  console.log(`${colors.red}✗ Supabase CLI is not installed${colors.reset}`);
  console.log(`
Please install the Supabase CLI:
npm install -g supabase
`);
  process.exit(1);
}

// Function to prompt for Supabase URL and key
function promptForSupabaseCredentials() {
  return new Promise((resolve) => {
    rl.question(`Enter your Supabase project URL: `, (url) => {
      rl.question(`Enter your Supabase anon key: `, (key) => {
        resolve({ url, key });
      });
    });
  });
}

// Function to update the Supabase client file
function updateSupabaseClient(url, key) {
  const clientFilePath = path.join(__dirname, '..', 'src', 'integrations', 'supabase', 'client.ts');
  
  try {
    let content = fs.readFileSync(clientFilePath, 'utf8');
    
    // Replace URL and key
    content = content.replace(/const SUPABASE_URL = ".*";/, `const SUPABASE_URL = "${url}";`);
    content = content.replace(/const SUPABASE_PUBLISHABLE_KEY = ".*";/, `const SUPABASE_PUBLISHABLE_KEY = "${key}";`);
    
    fs.writeFileSync(clientFilePath, content);
    console.log(`${colors.green}✓ Updated Supabase client configuration${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}✗ Failed to update Supabase client: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Function to apply SQL migrations
function applyMigrations() {
  console.log(`${colors.yellow}
To apply the database schema:
1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of supabase/migrations/20240801000000_initial_schema.sql
4. Run the SQL script

Would you like to open the migration file now?
${colors.reset}`);

  return new Promise((resolve) => {
    rl.question(`Open migration file? (y/n): `, (answer) => {
      if (answer.toLowerCase() === 'y') {
        const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20240801000000_initial_schema.sql');
        try {
          // Try to open the file with the default application
          switch (process.platform) {
            case 'darwin': // macOS
              execSync(`open "${migrationPath}"`);
              break;
            case 'win32': // Windows
              execSync(`start "" "${migrationPath}"`);
              break;
            default: // Linux and others
              execSync(`xdg-open "${migrationPath}"`);
              break;
          }
          console.log(`${colors.green}✓ Opened migration file${colors.reset}`);
        } catch (error) {
          console.log(`${colors.yellow}Could not open the file automatically. Please open it manually at:${colors.reset}`);
          console.log(migrationPath);
        }
      }
      resolve();
    });
  });
}

// Main function
async function main() {
  try {
    // Get Supabase credentials
    const { url, key } = await promptForSupabaseCredentials();
    
    // Update client file
    updateSupabaseClient(url, key);
    
    // Apply migrations
    await applyMigrations();
    
    console.log(`${colors.bright}${colors.green}
======================================
      Setup completed successfully!
======================================
${colors.reset}

${colors.yellow}Important: For users to be registered and logged in immediately (without email verification),
please ensure you have DISABLED "Confirm email" in your Supabase project settings under:
Authentication -> Providers -> Email.${colors.reset}

You can now start the development server with:
npm run dev

Happy coding!
`);
  } catch (error) {
    console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
  } finally {
    rl.close();
  }
}

main(); 