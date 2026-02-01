#!/usr/bin/env node
import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';

const DB_NAME = 'feedback-db-v11';

console.log('\nFeedback Intelligence Setup\n');
console.log('================================\n');

// Step 1: Login check
console.log('1. Checking Cloudflare login...');
try {
  execSync('npx wrangler whoami 2>&1', { encoding: 'utf8' });
  console.log('   OK Logged in\n');
} catch {
  console.log('   Logging in...');
  execSync('npx wrangler login', { stdio: 'inherit' });
}

// Step 2: Create or find database
console.log('2. Setting up D1 database...');
let databaseId = null;

// First check if database already exists
try {
  const listOutput = execSync('npx wrangler d1 list --json 2>/dev/null', { encoding: 'utf8' });
  const databases = JSON.parse(listOutput);
  const existing = databases.find(d => d.name === DB_NAME);
  if (existing) {
    databaseId = existing.uuid;
    console.log('   Found existing database: ' + DB_NAME);
    console.log('   ID: ' + databaseId + '\n');
  }
} catch (e) {
  // List failed, will try to create
}

// Create if not exists
if (!databaseId) {
  try {
    console.log('   Creating new database: ' + DB_NAME);
    const createOutput = execSync('npx wrangler d1 create ' + DB_NAME + ' 2>&1', { encoding: 'utf8' });
    
    // Parse the output for database_id
    const lines = createOutput.split('\n');
    for (const line of lines) {
      if (line.includes('database_id')) {
        const match = line.match(/database_id\s*=\s*"([^"]+)"/);
        if (match) {
          databaseId = match[1];
          break;
        }
      }
    }
    
    if (!databaseId) {
      // Try alternative parsing
      const idMatch = createOutput.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
      if (idMatch) {
        databaseId = idMatch[1];
      }
    }
    
    if (databaseId) {
      console.log('   OK Created database');
      console.log('   ID: ' + databaseId + '\n');
    }
  } catch (e) {
    // Check if it was created despite error
    try {
      const listOutput = execSync('npx wrangler d1 list --json 2>/dev/null', { encoding: 'utf8' });
      const databases = JSON.parse(listOutput);
      const existing = databases.find(d => d.name === DB_NAME);
      if (existing) {
        databaseId = existing.uuid;
        console.log('   OK Database found: ' + databaseId + '\n');
      }
    } catch (e2) {
      // ignore
    }
  }
}

if (!databaseId) {
  console.log('\nERROR: Could not get database ID automatically.');
  console.log('\nPlease run manually:');
  console.log('  npx wrangler d1 create ' + DB_NAME);
  console.log('  # Copy the database_id from output');
  console.log('  # Edit wrangler.toml and replace REPLACE_ME');
  console.log('  npx wrangler d1 migrations apply ' + DB_NAME + ' --remote');
  console.log('  npx wrangler deploy');
  process.exit(1);
}

// Step 3: Update wrangler.toml
console.log('3. Updating wrangler.toml...');
try {
  let config = readFileSync('wrangler.toml', 'utf8');
  config = config.replace(/database_id = ".*"/, 'database_id = "' + databaseId + '"');
  writeFileSync('wrangler.toml', config);
  console.log('   OK Updated config\n');
} catch (e) {
  console.log('   ERROR Failed: ' + e.message);
  process.exit(1);
}

// Step 4: Apply migrations
console.log('4. Applying migrations...');
try {
  execSync('npx wrangler d1 migrations apply ' + DB_NAME + ' --remote', { stdio: 'inherit' });
  console.log('   OK Migrations applied\n');
} catch (e) {
  console.log('   WARN Migration failed - may already be applied\n');
}

// Step 5: Deploy
console.log('5. Deploying...');
try {
  const output = execSync('npx wrangler deploy 2>&1', { encoding: 'utf8' });
  console.log('   OK Deployed!\n');
  
  const urlMatch = output.match(/https:\/\/[^\s]+\.workers\.dev/);
  if (urlMatch) {
    console.log('============================================');
    console.log('Live at: ' + urlMatch[0]);
    console.log('============================================\n');
  }
} catch (e) {
  console.log('   Deploy output:', e.stdout || e.message);
}

console.log('Done! Open your app and click "Seed Data" then "Run Analysis"\n');
