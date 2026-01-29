export default () => ({
  port: parseInt(process.env.PORT, 10) || 3001,
  database: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
    user: process.env.DATABASE_USER || 'credentials_app',
    password: process.env.DATABASE_PASSWORD || 'credentials_app',
    name: process.env.DATABASE_NAME || 'credential_issuance',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRATION || '1d',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB, 10) || 0,
  },
  session: {
    storeType: process.env.SESSION_STORE_TYPE || 'redis',
    ttl: parseInt(process.env.SESSION_TTL, 10) || 3600, // 1 hour in seconds
  },
  matt: {
    apiUrl: process.env.MATTR_API_URL || '',
    clientId: process.env.MATTR_CLIENT_ID || '',
    clientSecret: process.env.MATTR_CLIENT_SECRET || '',
    oauthUrl: process.env.MATTR_OAUTH_URL || '',
    tokenUrl: process.env.MATTR_TOKEN_URL || '',
    audience: process.env.MATTR_AUDIENCE || '',
    issuerDid: process.env.MATTR_ISSUER_DID || 'did:web:nzbn-pre.vii.au01.mattr.global',
    issuerName: process.env.MATTR_ISSUER_NAME || 'NZBN Organization',
    collectionCredentialTemplateId:
      process.env.MATTR_COLLECTION_CREDENTIAL_TEMPLATE_ID || 'harvest-collection-v1',
    deliveryCredentialTemplateId:
      process.env.MATTR_DELIVERY_CREDENTIAL_TEMPLATE_ID || 'delivery-v1',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
  nzbn: {
    apiUrl: process.env.NZBN_API_URL || 'https://api.business.govt.nz/sandbox',
    subscriptionKey: process.env.NZBN_SUBSCRIPTION_KEY || '',
    oauth: {
      authorizeUrl:
        process.env.NZBN_OAUTH_AUTHORIZE_URL ||
        'https://api.business.govt.nz/oauth2/v2.0/authorize',
      tokenUrl:
        process.env.NZBN_OAUTH_TOKEN_URL ||
        'https://api.business.govt.nz/oauth2/v2.0/token',
      clientId: process.env.NZBN_OAUTH_CLIENT_ID || '',
      clientSecret: process.env.NZBN_OAUTH_CLIENT_SECRET || '',
      redirectUri:
        process.env.NZBN_OAUTH_REDIRECT_URI ||
        'http://localhost:3001/nzbn/oauth/callback',
      scope:
        process.env.NZBN_OAUTH_SCOPE ||
        'https://api.business.govt.nz/sandbox/NZBNCO:manage offline_access',
      policy: 'b2c_1a_api_consent_susi',
    },
  },
});
