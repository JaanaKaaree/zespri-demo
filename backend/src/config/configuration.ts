export default () => ({
  port: parseInt(process.env.PORT, 10) || 3001,
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
    apiKey: process.env.MATTR_API_KEY || '',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
});
