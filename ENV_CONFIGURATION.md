# Environment Configuration Guide

This document lists all environment variables required for the Zespri Demo application, including the new Harvest Collection Credential feature.

## Backend Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

### Application Configuration

```bash
# Server Port
PORT=3001

# Frontend URL (for CORS and redirects)
FRONTEND_URL=http://localhost:3000
```

### JWT Authentication

```bash
# JWT Secret Key (use a strong random string in production)
JWT_SECRET=your-secret-key-change-in-production

# JWT Token Expiration
JWT_EXPIRATION=1d
```

### Redis Configuration

```bash
# Redis Host
REDIS_HOST=localhost

# Redis Port
REDIS_PORT=6379

# Redis Password (optional, leave empty if not using password)
REDIS_PASSWORD=

# Redis Database Number
REDIS_DB=0
```

### Session Configuration

```bash
# Session Store Type: 'redis' or 'memory'
SESSION_STORE_TYPE=redis

# Session Time-to-Live in seconds (default: 3600 = 1 hour)
SESSION_TTL=3600
```

### MATTR Platform Configuration

```bash
# MATTR API Base URL
# IMPORTANT: This should match your MATTR tenant URL pattern
# If your audience is https://nzbn-pre.vii.au01.mattr.global,
# your API URL should likely be: https://nzbn-pre.vii.au01.mattr.global
# Example: https://api.mattr.global or https://nzbn-pre.vii.au01.mattr.global
MATTR_API_URL=

# MATTR OAuth Client ID
# This is the OAuth client ID for authenticating with MATTR platform
MATTR_CLIENT_ID=

# MATTR OAuth Client Secret
# This is the OAuth client secret for authenticating with MATTR platform
MATTR_CLIENT_SECRET=

# MATTR OAuth URL (optional)
# The OAuth token endpoint URL
# Example: https://auth.mattr.global/oauth/token
MATTR_OAUTH_URL=

# MATTR OAuth Token URL (optional, deprecated - use MATTR_OAUTH_URL)
# If not provided, defaults to {MATTR_API_URL}/oauth/token
MATTR_TOKEN_URL=

# MATTR Audience (optional)
# The audience parameter for OAuth token requests
# Example: https://api.mattr.global
MATTR_AUDIENCE=

# MATTR Collection Credential Template ID / Configuration ID
# This is the credential configuration ID from MATTR platform
# for the harvest collection credential template
# Default: harvest-collection-v1
MATTR_COLLECTION_CREDENTIAL_TEMPLATE_ID=harvest-collection-v1
```

### NZBN API Configuration

```bash
# NZBN API Base URL
# Default: https://api.business.govt.nz/sandbox (sandbox)
# Production: https://api.business.govt.nz (production)
NZBN_API_URL=https://api.business.govt.nz/sandbox

# NZBN Subscription Key (API Key)
NZBN_SUBSCRIPTION_KEY=
```

### NZBN OAuth Configuration

```bash
# OAuth Authorization URL
NZBN_OAUTH_AUTHORIZE_URL=https://api.business.govt.nz/oauth2/v2.0/authorize

# OAuth Token URL
NZBN_OAUTH_TOKEN_URL=https://api.business.govt.nz/oauth2/v2.0/token

# OAuth Client ID (from NZBN API registration)
NZBN_OAUTH_CLIENT_ID=

# OAuth Client Secret (from NZBN API registration)
NZBN_OAUTH_CLIENT_SECRET=

# OAuth Redirect URI (must match registered redirect URI)
# Backend callback endpoint
NZBN_OAUTH_REDIRECT_URI=http://localhost:3001/nzbn/oauth/callback

# OAuth Scope
NZBN_OAUTH_SCOPE=https://api.business.govt.nz/sandbox/NZBNCO:manage offline_access
```

### Logging Configuration

```bash
# Log Level: 'error', 'warn', 'info', 'debug', 'verbose'
LOG_LEVEL=info
```

## Frontend Environment Variables

Create a `.env.local` file in the `frontend/` directory with the following variables:

### Application Configuration

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3001

# Application Name (optional)
NEXT_PUBLIC_APP_NAME=MATTR Issuance Demo
```

## Environment Variable Summary

### Required for Basic Functionality

1. **Backend:**
   - `PORT` - Server port
   - `JWT_SECRET` - JWT signing secret
   - `FRONTEND_URL` - Frontend URL for CORS
   - `MATTR_API_URL` - MATTR platform API URL
   - `MATTR_CLIENT_ID` - MATTR OAuth client ID
   - `MATTR_CLIENT_SECRET` - MATTR OAuth client secret
   - `MATTR_COLLECTION_CREDENTIAL_TEMPLATE_ID` - MATTR credential configuration/template ID

2. **Frontend:**
   - `NEXT_PUBLIC_API_URL` - Backend API URL

### Required for NZBN Integration

1. **Backend:**
   - `NZBN_API_URL` - NZBN API base URL
   - `NZBN_SUBSCRIPTION_KEY` - NZBN API subscription key
   - `NZBN_OAUTH_CLIENT_ID` - OAuth client ID
   - `NZBN_OAUTH_CLIENT_SECRET` - OAuth client secret
   - `NZBN_OAUTH_REDIRECT_URI` - OAuth redirect URI

### Optional (with defaults)

1. **Backend:**
   - `JWT_EXPIRATION` - Default: `1d`
   - `REDIS_HOST` - Default: `localhost`
   - `REDIS_PORT` - Default: `6379`
   - `REDIS_PASSWORD` - Optional
   - `REDIS_DB` - Default: `0`
   - `SESSION_STORE_TYPE` - Default: `redis`
   - `SESSION_TTL` - Default: `3600`
   - `LOG_LEVEL` - Default: `info`
   - `NZBN_OAUTH_AUTHORIZE_URL` - Has default
   - `NZBN_OAUTH_TOKEN_URL` - Has default
   - `NZBN_OAUTH_SCOPE` - Has default

2. **Frontend:**
   - `NEXT_PUBLIC_APP_NAME` - Default: `MATTR Issuance Demo`

## Example .env Files

### backend/.env

```bash
# Application
PORT=3001
FRONTEND_URL=http://localhost:3000

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRATION=1d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Session
SESSION_STORE_TYPE=redis
SESSION_TTL=3600

# MATTR Platform
MATTR_API_URL=https://api.mattr.global
MATTR_CLIENT_ID=your-mattr-client-id
MATTR_CLIENT_SECRET=your-mattr-client-secret
MATTR_OAUTH_URL=https://auth.mattr.global/oauth/token
MATTR_AUDIENCE=https://api.mattr.global
MATTR_COLLECTION_CREDENTIAL_TEMPLATE_ID=your-mattr-credential-config-id

# NZBN API
NZBN_API_URL=https://api.business.govt.nz/sandbox
NZBN_SUBSCRIPTION_KEY=your-nzbn-subscription-key

# NZBN OAuth
NZBN_OAUTH_CLIENT_ID=your-oauth-client-id
NZBN_OAUTH_CLIENT_SECRET=your-oauth-client-secret
NZBN_OAUTH_REDIRECT_URI=http://localhost:3001/nzbn/oauth/callback

# Logging
LOG_LEVEL=info
```

### frontend/.env.local

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME=Zespri Harvest Collection Demo
```

## Notes

1. **Security:**
   - Never commit `.env` or `.env.local` files to version control
   - Use strong, random values for `JWT_SECRET` in production
   - Keep `MATTR_API_KEY` and OAuth credentials secure
   - Consider using environment variable management services in production

2. **MATTR Platform:**
   - You'll need to create a MATTR account and obtain OAuth client credentials
   - The `MATTR_API_URL` should point to your MATTR tenant API
   - The `MATTR_CLIENT_ID` and `MATTR_CLIENT_SECRET` are used for OAuth client credentials flow
   - The `MATTR_TOKEN_URL` is the OAuth token endpoint (defaults to `{MATTR_API_URL}/oauth/token` if not provided)
   - The system automatically obtains and caches OAuth access tokens
   - The `MATTR_COLLECTION_CREDENTIAL_TEMPLATE_ID` is the credential configuration ID
     created in your MATTR tenant for the harvest collection credential
   - You'll need to create a credential configuration in MATTR platform first,
     then use that configuration ID here

3. **NZBN API:**
   - Register for NZBN API access at https://www.business.govt.nz/api/
   - Obtain subscription key and OAuth credentials
   - Register your redirect URI in the NZBN API portal
   - Use sandbox URLs for development, production URLs for production

4. **Redis:**
   - Redis is used for session storage and OAuth state management
   - Can use `SESSION_STORE_TYPE=memory` for development without Redis
   - For production, use Redis for persistence and scalability

5. **Collection Credential Feature:**
   - Requires `MATTR_COLLECTION_CREDENTIAL_TEMPLATE_ID` environment variable
   - This should be set to the credential configuration ID from your MATTR tenant
   - Defaults to `"harvest-collection-v1"` if not provided
   - You must create the credential configuration in MATTR platform first

## Production Checklist

- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Set `LOG_LEVEL` to `warn` or `error` in production
- [ ] Use production NZBN API URL (`https://api.business.govt.nz`)
- [ ] Update `NZBN_OAUTH_REDIRECT_URI` to production URL
- [ ] Use production MATTR API URL
- [ ] Ensure Redis is properly configured and secured
- [ ] Set `FRONTEND_URL` to production frontend URL
- [ ] Review and update all OAuth scopes if needed
- [ ] Enable HTTPS for all URLs in production
