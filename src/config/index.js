/**
 * Application Configuration
 * Centralizes all configuration from environment variables
 */
require("dotenv").config();

const config = {
  // Server
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  
  // Database
  database: {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_DATABASE,
    port: parseInt(process.env.DB_PORT, 10) || 1433,
    options: {
      trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
      trustedConnection: process.env.DB_TRUSTED_CONNECTION === 'true',
      enableArithAbort: true,
      instancename: process.env.DB_INSTANCE_NAME,
    },
    pool: {
      max: parseInt(process.env.DB_POOL_MAX, 10) || 10,
      min: parseInt(process.env.DB_POOL_MIN, 10) || 0,
      idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT, 10) || 30000,
    },
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'change-this-secret-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  
  // Redis (optional)
  redis: {
    url: process.env.REDIS_URL,
  },
  
  // CORS
  cors: {
    origins: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  },
};

// Validate required config in production
if (config.env === 'production') {
  const required = ['database.user', 'database.password', 'database.server', 'database.database', 'jwt.secret'];
  const missing = [];
  
  for (const key of required) {
    const value = key.split('.').reduce((obj, k) => obj?.[k], config);
    if (!value || value === 'change-this-secret-in-production') {
      missing.push(key);
    }
  }
  
  if (missing.length > 0) {
    console.error(`Missing required configuration: ${missing.join(', ')}`);
    process.exit(1);
  }
}

module.exports = config;
