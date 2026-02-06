const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");

// Import the dotenv package
require("dotenv").config();

// Import the db config
const config = require("./src/database_config/mssql");

// DB Operations
const dbOperation = require("./src/batabase_operations/notes_app");

// Import entities
const Note = require("./src/entites/note");

// Import middleware
const { errorHandler, asyncHandler, notFoundHandler, createError } = require("./src/middleware/errorHandler");
const { validateBody, validateNoteId, sanitizeBody, validatePagination } = require("./src/middleware/validator");
const { rateLimiter, strictRateLimiter, closeRateLimiter } = require("./src/middleware/rateLimiter");
const { requestLogger } = require("./src/middleware/requestLogger");
const { authenticate, optionalAuth } = require("./src/auth/validateToken");

// Import utilities
const dateUtils = require("./src/utils/date-utils");
const { successResponse, createdResponse, paginatedResponse, noContentResponse } = require("./src/utils/responseHandler");

const API_ENDPOINT = require("./src/rest-api/api");
const API_PORT = process.env.PORT || 5000;
const app = express();
const userRouter = require("./src/users/user.router");

// ===========================================
// Security & Performance Middleware
// ===========================================

// Security headers
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production',
  crossOriginEmbedderPolicy: false,
}));

// Enable gzip compression
app.use(compression());

// Parse JSON with size limit
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400, // 24 hours
};
app.use(cors(corsOptions));

// Request logging
app.use(requestLogger({ logBody: process.env.NODE_ENV === 'development' }));

// Rate limiting
app.use(rateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 100 }));

// Sanitize all request bodies
app.use(sanitizeBody);

// ===========================================
// Health Check Endpoint
// ===========================================

app.get("/health", (req, res) => {
  successResponse(res, { 
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  }, "Service is healthy");
});

// ===========================================
// User Routes
// ===========================================

app.use("/api/v1/users", userRouter);

// ===========================================
// Test Endpoints
// ===========================================

app.get("/api/v1/test", (req, res) => {
  successResponse(res, { version: "1.0.0" }, "REST API works fine!");
});

// ===========================================
// Notes API Routes - RESTful Design (Protected)
// ===========================================

// Get note by ID - Use URL params instead of body for GET requests
app.get(
  API_ENDPOINT.ROOT + "/notes/:id",
  authenticate,
  validateNoteId,
  asyncHandler(async (req, res) => {
    const result = await dbOperation.getNoteByID(req.validatedNoteId);
    
    if (!result.recordset || result.recordset.length === 0) {
      throw createError.notFound(`Note with ID ${req.validatedNoteId} not found`);
    }
    
    successResponse(res, result.recordset[0], "Note retrieved successfully");
  })
);

// Get all notes with pagination
app.get(
  API_ENDPOINT.ROOT + API_ENDPOINT.NOTES,
  authenticate,
  validatePagination,
  asyncHandler(async (req, res) => {
    const { page, limit, offset } = req.pagination;
    const result = await dbOperation.getNotes({ limit, offset });
    
    if (result.total !== undefined) {
      paginatedResponse(res, result.recordset, { page, limit, total: result.total }, "Notes retrieved successfully");
    } else {
      successResponse(res, result.recordset, "Notes retrieved successfully");
    }
  })
);

// Create new note - POST /notes
app.post(
  API_ENDPOINT.ROOT + API_ENDPOINT.NOTES,
  authenticate,
  validateBody(['note_title', 'note_description']),
  asyncHandler(async (req, res) => {
    const note = new Note(req.body.note_title, req.body.note_description);
    const result = await dbOperation.addNote(note, dateUtils.getISODateString());
    
    if (result && result.recordset && result.recordset.length > 0) {
      createdResponse(res, result.recordset[0], "Note created successfully");
    } else {
      createdResponse(res, null, "Note created successfully");
    }
  })
);

// Delete note by ID - Use URL params
app.delete(
  API_ENDPOINT.ROOT + "/notes/:id",
  authenticate,
  validateNoteId,
  asyncHandler(async (req, res) => {
    // Check if note exists
    const exists = await dbOperation.noteExists(req.validatedNoteId);
    if (!exists) {
      throw createError.notFound(`Note with ID ${req.validatedNoteId} not found`);
    }
    
    await dbOperation.deleteNote(req.validatedNoteId);
    noContentResponse(res);
  })
);

// Update note by ID - Use URL params
app.put(
  API_ENDPOINT.ROOT + "/notes/:id",
  authenticate,
  validateNoteId,
  validateBody(['note_title', 'note_description']),
  asyncHandler(async (req, res) => {
    // Check if note exists
    const exists = await dbOperation.noteExists(req.validatedNoteId);
    if (!exists) {
      throw createError.notFound(`Note with ID ${req.validatedNoteId} not found`);
    }
    
    const note = new Note(req.body.note_title, req.body.note_description);
    const result = await dbOperation.updateNote(
      note,
      req.validatedNoteId,
      dateUtils.getISODateString()
    );
    
    successResponse(res, result.recordset[0], "Note updated successfully");
  })
);

// Delete all notes (protected with stricter rate limit) - DELETE /notes
app.delete(
  API_ENDPOINT.ROOT + API_ENDPOINT.NOTES,
  authenticate,
  strictRateLimiter,
  asyncHandler(async (req, res) => {
    await dbOperation.deleteAllNotes();
    noContentResponse(res);
  })
);

// Docker test REST API
app.get("/test-api", (req, res) => {
  successResponse(res, { environment: "Docker" }, "Docker image works fine. It's a test REST API for docker!");
});

// ===========================================
// SSE (Server-Sent Events) Endpoints
// ===========================================

// SSE REST API
app.get(API_ENDPOINT.ROOT + "/sse", asyncHandler(async (req, res) => {
  console.log("Client is connected...!");
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  
  const intervalId = setInterval(() => {
    const date = new Date().toISOString();
    res.write(`data: ${JSON.stringify({ timestamp: date })}\n\n`);
  }, 1000);

  res.on("close", () => {
    clearInterval(intervalId);
    console.log("Client is disconnected...!");
    res.end();
  });
}));

app.get(API_ENDPOINT.ROOT + "/events", asyncHandler(async (req, res) => {
  console.log('Client is connected...!');
  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const allNotes = await dbOperation.getNotes();
  // Send the initial data to the client
  res.write(`data: ${JSON.stringify(allNotes.recordset)}\n\n`);

  // Poll the database for updates every X seconds
  const pollInterval = 5000; // 5 seconds (adjust as needed)
  const pollTimer = setInterval(async () => {
    try {
      const updatedData = await dbOperation.getNotes();
      res.write(`data: ${JSON.stringify(updatedData.recordset)}\n\n`);
    } catch (error) {
      console.error('Error fetching notes for SSE:', error);
    }
  }, pollInterval);

  // Close the connection when the client disconnects
  res.on('close', () => {
    clearInterval(pollTimer);
    console.log("Client is disconnected...!");
    res.end();
  });
}));

// ===========================================
// Error Handling
// ===========================================

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// ===========================================
// Server Startup & Graceful Shutdown
// ===========================================

const server = app.listen(API_PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                  Server Started Successfully                  ║
╠══════════════════════════════════════════════════════════════╣
║  Environment: ${(process.env.NODE_ENV || 'development').padEnd(44)}║
║  Port: ${String(API_PORT).padEnd(51)}║
║  API: http://localhost:${API_PORT}/api/v1                          ║
║  Health: http://localhost:${API_PORT}/health                       ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  server.close(async () => {
    console.log('HTTP server closed.');
    
    try {
      await dbOperation.closePool();
      console.log('Database connections closed.');
      await closeRateLimiter();
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  });

  // Force close after 30 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
};

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = app;
