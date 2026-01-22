# Database Migrations

This directory contains SQL migration files for setting up the PostgreSQL database schema.

## Setup Instructions

### 1. Install Dependencies

First, install the required PostgreSQL client library:

```bash
npm install
```

### 2. Ensure PostgreSQL is Running

Make sure your PostgreSQL database is running and accessible with the credentials specified in your `.env` file:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=credentials_app
DATABASE_PASSWORD=credentials_app
DATABASE_NAME=credential_issuance
```

### 3. Create the Database (if it doesn't exist)

If the database doesn't exist yet, create it:

```bash
# Connect to PostgreSQL as superuser
psql -U postgres

# Create database and user
CREATE DATABASE credential_issuance;
CREATE USER credentials_app WITH PASSWORD 'credentials_app';
GRANT ALL PRIVILEGES ON DATABASE credential_issuance TO credentials_app;
\q
```

### 4. Run Migrations

Run the migration script to create all tables:

```bash
npm run migrate:up
```

This will:
- Connect to your PostgreSQL database
- Create a `schema_migrations` table to track executed migrations
- Execute all SQL files in the `migrations/` directory in order
- Skip migrations that have already been executed

## Migration Files

- `001_initial_schema.sql` - Creates all initial tables:
  - `users` - User accounts
  - `sessions` - User sessions
  - `collection_credentials` - Harvest collection credentials
  - `oauth_tokens` - OAuth token storage
  - `organisation_parts_cache` - NZBN API data cache
  - `audit_logs` - Audit trail for changes

## Manual Migration (Alternative)

If you prefer to run migrations manually, you can execute the SQL files directly:

```bash
psql -U credentials_app -d credential_issuance -f migrations/001_initial_schema.sql
```

## Verifying Migrations

To check which migrations have been executed:

```bash
psql -U credentials_app -d credential_issuance -c "SELECT * FROM schema_migrations ORDER BY executed_at;"
```
