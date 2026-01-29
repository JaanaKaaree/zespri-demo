import * as fs from 'fs';
import * as path from 'path';
import { Client } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

async function runSqlFile(filename: string) {
  const client = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    user: process.env.DATABASE_USER || 'credentials_app',
    password: process.env.DATABASE_PASSWORD || 'credentials_app',
    database: process.env.DATABASE_NAME || 'credential_issuance',
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    const sqlFilePath = path.join(__dirname, '../migrations', filename);
    
    if (!fs.existsSync(sqlFilePath)) {
      throw new Error(`SQL file not found: ${sqlFilePath}`);
    }

    console.log(`\n📝 Running SQL file: ${filename}`);
    console.log(`   Path: ${sqlFilePath}`);

    // Read and execute SQL file
    const sql = fs.readFileSync(sqlFilePath, 'utf8');

    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');
      console.log(`✅ Successfully executed ${filename}`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`❌ Error executing ${filename}:`, error.message);
      throw error;
    }
  } catch (error) {
    console.error('❌ SQL execution failed:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\nDatabase connection closed');
  }
}

// Get filename from command line argument
const filename = process.argv[2];

if (!filename) {
  console.error('❌ Please provide a SQL filename as an argument');
  console.error('Usage: ts-node scripts/run-sql-file.ts <filename>');
  console.error('Example: ts-node scripts/run-sql-file.ts 004_cleanup_all_data.sql');
  process.exit(1);
}

// Run the SQL file
runSqlFile(filename).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
