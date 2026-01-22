import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

async function grantPermissions() {
  // Connect as postgres superuser to grant permissions
  const adminClient = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    user: process.env.DATABASE_ADMIN_USER || 'postgres',
    password: process.env.DATABASE_ADMIN_PASSWORD || process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME || 'credential_issuance',
  });

  const dbUser = process.env.DATABASE_USER || 'credentials_app';
  const dbName = process.env.DATABASE_NAME || 'credential_issuance';

  try {
    console.log('Connecting as admin user to grant permissions...');
    await adminClient.connect();
    console.log('✅ Connected to database');

    console.log(`\nGranting permissions to user: ${dbUser}`);

    // Grant schema permissions
    await adminClient.query(`GRANT ALL ON SCHEMA public TO ${dbUser};`);
    console.log('✅ Granted schema permissions');

    // Grant database permissions
    await adminClient.query(`GRANT ALL PRIVILEGES ON DATABASE ${dbName} TO ${dbUser};`);
    console.log('✅ Granted database permissions');

    // Grant permissions on all existing tables (if any)
    await adminClient.query(`GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${dbUser};`);
    console.log('✅ Granted table permissions');

    // Grant permissions on sequences
    await adminClient.query(`GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ${dbUser};`);
    console.log('✅ Granted sequence permissions');

    // Set default privileges for future objects
    await adminClient.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${dbUser};`);
    await adminClient.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${dbUser};`);
    console.log('✅ Set default privileges for future objects');

    console.log('\n✅ All permissions granted successfully!');
    console.log('\nYou can now run: npm run migrate:up');
  } catch (error) {
    console.error('❌ Failed to grant permissions:', error.message);
    console.error('\nNote: You may need to run this manually as a PostgreSQL superuser:');
    console.error(`  GRANT ALL ON SCHEMA public TO ${dbUser};`);
    console.error(`  GRANT ALL PRIVILEGES ON DATABASE ${dbName} TO ${dbUser};`);
    process.exit(1);
  } finally {
    await adminClient.end();
  }
}

grantPermissions().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
