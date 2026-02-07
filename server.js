/**
 * Main Application Entry Point
 */
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const swaggerUi = require("swagger-ui-express");

// Configuration
const config = require("./src/config");
const swaggerSpec = require("./src/docs/swagger");

// Middleware
const { errorHandler, asyncHandler, notFoundHandler } = require("./src/middleware/errorHandler");
const { sanitizeBody } = require("./src/middleware/validator");
const { rateLimiter, closeRateLimiter } = require("./src/middleware/rateLimiter");
const { requestLogger } = require("./src/middleware/requestLogger");

// Utilities
const { successResponse } = require("./src/utils/responseHandler");

// Modules
const notesModule = require("./src/modules/notes");
const usersModule = require("./src/modules/users");

const app = express();

// ===========================================
// Security & Performance Middleware
// ===========================================

app.use(helmet({
  contentSecurityPolicy: config.env === 'production',
  crossOriginEmbedderPolicy: false,
}));

app.use(compression());

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.use(cors({
  origin: config.cors.origins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400,
}));

app.use(requestLogger({ logBody: config.env === 'development' }));
app.use(rateLimiter(config.rateLimit));
app.use(sanitizeBody);

// ===========================================
// API Documentation
// ===========================================

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Notes API Documentation",
}));

// Serve OpenAPI spec as JSON
app.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// ===========================================
// Routes
// ===========================================

// Health check
app.get("/health", (req, res) => {
  const healthData = {
    status: "healthy",
    timestamp: new Date().toISOString(),
  };

  // Only expose detailed info in development
  if (config.env === "development") {
    healthData.uptime = process.uptime();
    healthData.environment = config.env;
    healthData.memoryUsage = process.memoryUsage().heapUsed;
    healthData.version = process.env.npm_package_version || "1.0.0";
  }

  successResponse(res, healthData, "Service is healthy");
});

// API routes
app.use("/api/v1/users", usersModule.router);
app.use("/api/v1/notes", notesModule.router);

// Test endpoint
app.get("/api/v1/test", (req, res) => {
  successResponse(res, { version: "1.0.0" }, "REST API works fine!");
});

// ===========================================
// SSE Endpoints
// ===========================================

app.get("/api/v1/sse", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  
  const intervalId = setInterval(() => {
    res.write(`data: ${JSON.stringify({ timestamp: new Date().toISOString() })}\n\n`);
  }, 1000);

  res.on("close", () => {
    clearInterval(intervalId);
    res.end();
  });
});

app.get("/api/v1/events", asyncHandler(async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const result = await notesModule.service.findAll();
  res.write(`data: ${JSON.stringify(result.data)}\n\n`);

  const pollTimer = setInterval(async () => {
    try {
      const updated = await notesModule.service.findAll();
      res.write(`data: ${JSON.stringify(updated.data)}\n\n`);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('SSE error:', error.message);
    }
  }, 5000);

  res.on('close', () => {
    clearInterval(pollTimer);
    res.end();
  });
}));

// ===========================================
// Error Handling
// ===========================================

app.use(notFoundHandler);
app.use(errorHandler);

// ===========================================
// Server Startup
// ===========================================

const server = app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`
┌────────────────────────────────────────────────┐
│           Server Started Successfully          │
├────────────────────────────────────────────────┤
│  Environment: ${config.env.padEnd(31)}│
│  Port: ${String(config.port).padEnd(38)}│
│  API: http://localhost:${config.port}/api/v1${' '.repeat(13)}│
│  Health: http://localhost:${config.port}/health${' '.repeat(10)}│
└────────────────────────────────────────────────┘
  `);
});

// ===========================================
// Graceful Shutdown
// ===========================================

const shutdown = (signal) => {
  // eslint-disable-next-line no-console
  console.log(`\n${signal} received. Shutting down...`);
  
  server.close(async () => {
    try {
      await notesModule.service.closePool();
      await closeRateLimiter();
      // eslint-disable-next-line no-console
      console.log('Cleanup complete.');
      process.exit(0);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Shutdown error:', error);
      process.exit(1);
    }
  });

  setTimeout(() => {
    // eslint-disable-next-line no-console
    console.error('Forced shutdown');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('uncaughtException', (error) => {
  // eslint-disable-next-line no-console
  console.error('Uncaught Exception:', error);
  shutdown('uncaughtException');
});
process.on('unhandledRejection', (reason) => {
  // eslint-disable-next-line no-console
  console.error('Unhandled Rejection:', reason);
});

module.exports = app;
