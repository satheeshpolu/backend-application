/**
 * Production-ready rate limiter with Redis support
 * Falls back to in-memory if Redis is unavailable
 */

const redis = require('redis');

// In-memory fallback storage
const memoryStore = new Map();

// Redis client (lazy initialization)
let redisClient = null;
let useRedis = false;

/**
 * Initialize Redis client
 */
const initRedis = async () => {
  if (redisClient) return redisClient;
  
  // Skip Redis if REDIS_URL is not set
  if (!process.env.REDIS_URL) {
    console.log('[RateLimiter] REDIS_URL not set, using in-memory store');
    useRedis = false;
    return null;
  }
  
  try {
    const redisUrl = process.env.REDIS_URL;
    redisClient = redis.createClient({ url: redisUrl });
    
    redisClient.on('error', (err) => {
      if (useRedis) { // Only log once
        console.warn('[RateLimiter] Redis error, falling back to in-memory:', err.message);
      }
      useRedis = false;
    });

    redisClient.on('connect', () => {
      console.log('[RateLimiter] Connected to Redis');
      useRedis = true;
    });

    await redisClient.connect();
    useRedis = true;
    return redisClient;
  } catch (error) {
    console.warn('[RateLimiter] Redis unavailable, using in-memory store:', error.message);
    useRedis = false;
    return null;
  }
};

// Initialize Redis on module load (non-blocking)
initRedis().catch(() => {});

/**
 * Rate limiter configuration
 */
const defaultConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // Max requests per window
  message: 'Too many requests, please try again later',
  keyPrefix: 'rl:', // Redis key prefix
  skipFailedRequests: false, // Don't count failed requests
  skipSuccessfulRequests: false, // Don't count successful requests
};

/**
 * Clean up old entries from memory store periodically
 */
const cleanupMemory = (windowMs) => {
  const now = Date.now();
  for (const [key, value] of memoryStore.entries()) {
    if (now - value.startTime > windowMs) {
      memoryStore.delete(key);
    }
  }
};

/**
 * Get client identifier from request
 */
const getClientKey = (req, keyPrefix) => {
  const identifier = req.ip || 
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
    req.connection?.remoteAddress || 
    'unknown';
  return `${keyPrefix}${identifier}`;
};

/**
 * Redis-based rate limiting
 */
const checkRateLimitRedis = async (key, windowMs, maxRequests) => {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  // Use Redis sorted set for sliding window
  const multi = redisClient.multi();
  
  // Remove old entries
  multi.zRemRangeByScore(key, 0, windowStart);
  // Add current request
  multi.zAdd(key, { score: now, value: `${now}-${Math.random()}` });
  // Count requests in window
  multi.zCard(key);
  // Set expiry
  multi.expire(key, Math.ceil(windowMs / 1000));
  
  const results = await multi.exec();
  const count = results[2]; // zCard result
  
  return {
    count,
    remaining: Math.max(0, maxRequests - count),
    resetTime: new Date(now + windowMs).toISOString(),
  };
};

/**
 * In-memory rate limiting (fallback)
 */
const checkRateLimitMemory = (key, windowMs, maxRequests) => {
  const now = Date.now();
  
  if (!memoryStore.has(key)) {
    memoryStore.set(key, {
      count: 1,
      startTime: now,
    });
    return {
      count: 1,
      remaining: maxRequests - 1,
      resetTime: new Date(now + windowMs).toISOString(),
    };
  }

  const record = memoryStore.get(key);

  // Reset if window has passed
  if (now - record.startTime > windowMs) {
    memoryStore.set(key, {
      count: 1,
      startTime: now,
    });
    return {
      count: 1,
      remaining: maxRequests - 1,
      resetTime: new Date(now + windowMs).toISOString(),
    };
  }

  // Increment count
  record.count++;
  
  return {
    count: record.count,
    remaining: Math.max(0, maxRequests - record.count),
    resetTime: new Date(record.startTime + windowMs).toISOString(),
  };
};

/**
 * Rate limiter middleware factory
 * @param {Object} options - Configuration options
 * @returns {Function} Express middleware
 */
const rateLimiter = (options = {}) => {
  const config = { ...defaultConfig, ...options };
  
  // Run memory cleanup every minute (only if using memory store)
  const cleanupInterval = setInterval(() => {
    if (!useRedis) {
      cleanupMemory(config.windowMs);
    }
  }, 60000);
  
  // Don't prevent process from exiting
  cleanupInterval.unref();

  return async (req, res, next) => {
    const key = getClientKey(req, config.keyPrefix);
    
    try {
      let result;
      
      if (useRedis && redisClient?.isOpen) {
        result = await checkRateLimitRedis(key, config.windowMs, config.maxRequests);
      } else {
        result = checkRateLimitMemory(key, config.windowMs, config.maxRequests);
      }

      // Add rate limit headers
      res.set('X-RateLimit-Limit', config.maxRequests);
      res.set('X-RateLimit-Remaining', result.remaining);
      res.set('X-RateLimit-Reset', result.resetTime);

      // Check if limit exceeded
      if (result.count > config.maxRequests) {
        res.set('Retry-After', Math.ceil(config.windowMs / 1000));
        return res.status(429).json({
          success: false,
          error: {
            statusCode: 429,
            message: config.message,
          },
          timestamp: new Date().toISOString(),
        });
      }

      next();
    } catch (error) {
      console.error('[RateLimiter] Error:', error.message);
      // On error, allow the request through (fail-open)
      next();
    }
  };
};

/**
 * Stricter rate limiter for sensitive endpoints (auth, etc.)
 */
const strictRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10, // Only 10 requests per window
  message: 'Too many attempts, please try again later',
  keyPrefix: 'rl:strict:',
});

/**
 * API rate limiter (general use)
 */
const apiRateLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60, // 60 requests per minute
  message: 'API rate limit exceeded, please slow down',
  keyPrefix: 'rl:api:',
});

/**
 * Close Redis connection (for graceful shutdown)
 */
const closeRateLimiter = async () => {
  if (redisClient?.isOpen) {
    await redisClient.quit();
    console.log('[RateLimiter] Redis connection closed');
  }
};

module.exports = {
  rateLimiter,
  strictRateLimiter,
  apiRateLimiter,
  closeRateLimiter,
  initRedis,
};
