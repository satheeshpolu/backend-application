/**
 * Request logging middleware for monitoring and debugging
 */

/**
 * Generate a unique request ID
 */
const generateRequestId = () => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Format bytes to human readable string
 */
const formatBytes = (bytes) => {
  if (bytes === 0) {
    return '0 B';
  }
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Request logger middleware
 */
const requestLogger = (options = {}) => {
  const {
    excludePaths = ['/health', '/favicon.ico'],
    logBody = false,
  } = options;

  return (req, res, next) => {
    // Skip excluded paths
    if (excludePaths.some(path => req.path.startsWith(path))) {
      next();
      return;
    }

    // Add request ID
    req.requestId = generateRequestId();
    res.set('X-Request-Id', req.requestId);

    // Capture start time
    const startTime = process.hrtime();

    // Log request
    const requestLog = {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      query: Object.keys(req.query).length > 0 ? req.query : undefined,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      timestamp: new Date().toISOString(),
    };

    if (logBody && req.body && Object.keys(req.body).length > 0) {
      // Don't log sensitive fields
      const sanitizedBody = { ...req.body };
      const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];
      sensitiveFields.forEach(field => {
        if (sanitizedBody[field]) {
          sanitizedBody[field] = '[REDACTED]';
        }
      });
      requestLog.body = sanitizedBody;
    }

    // eslint-disable-next-line no-console
    console.log(`[REQUEST] ${JSON.stringify(requestLog)}`);

    // Capture response
    const originalSend = res.send;
    res.send = function (body) {
      res.body = body;
      return originalSend.apply(this, arguments);
    };

    // Log response on finish
    res.on('finish', () => {
      const diff = process.hrtime(startTime);
      const responseTime = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);

      const responseLog = {
        requestId: req.requestId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        responseTime: `${responseTime}ms`,
        contentLength: res.get('content-length') ? formatBytes(parseInt(res.get('content-length'))) : undefined,
        timestamp: new Date().toISOString(),
      };

      const logLevel = res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'WARN' : 'INFO';
      // eslint-disable-next-line no-console
      console.log(`[${logLevel}] ${JSON.stringify(responseLog)}`);
    });

    next();
  };
};

module.exports = {
  requestLogger,
  generateRequestId,
};
