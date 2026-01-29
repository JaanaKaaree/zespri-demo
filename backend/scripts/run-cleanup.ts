import * as fs from 'fs';
import * as path from 'path';
import { Client } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

async function runCleanup() {
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

    const cleanupFile = path.join(__dirname, '../migrations/004_cleanup_all_data.sql');
    console.log(`\n📝 Running cleanup script: 004_cleanup_all_data.sql`);

    // Read and execute cleanup script
    const sql = fs.readFileSync(cleanupFile, 'utf8');

    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');
      console.log(`✅ Successfully executed cleanup script`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`❌ Error executing cleanup script:`, error.message);
      throw error;
    }

    console.log('\n✅ Cleanup completed successfully!');
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\nDatabase connection closed');
  }
}

// Run cleanup
runCleanup().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
