# Notes API - Production Setup Guide

## Overview

This document covers the changes made to make the REST API production-ready. The main focus was on security, proper error handling, and following REST conventions.

## What Changed

### Security

The original code had SQL injection vulnerabilities - queries were built using string interpolation. All database queries now use parameterized statements:

```javascript
// Before (vulnerable)
.query(`SELECT * from notes_app where note_id='${id}'`)

// After (safe)
.input('note_id', sql.Int, id)
.query("SELECT * FROM notes_app WHERE note_id = @note_id")
```

Other security additions:
- Helmet for HTTP security headers
- Rate limiting (100 requests per 15 minutes, with Redis support)
- Input validation and sanitization
- CORS configuration via environment variables

### API Design

The endpoints now follow REST conventions. The HTTP method indicates the action, the URL is just the resource:

```
GET    /api/v1/notes        List all notes
GET    /api/v1/notes/:id    Get one note
POST   /api/v1/notes        Create a note
PUT    /api/v1/notes/:id    Update a note
DELETE /api/v1/notes/:id    Delete a note
DELETE /api/v1/notes        Delete all notes
```

All responses follow a consistent format:

```json
{
  "success": true,
  "message": "Note created successfully",
  "data": { ... },
  "timestamp": "2026-02-06T10:30:00.000Z"
}
```

Pagination is available on the list endpoint with `?page=1&limit=10`.

### Error Handling

Errors are now handled centrally instead of scattered try-catch blocks. The API returns appropriate HTTP status codes (400, 404, 429, 500) with consistent error responses. Stack traces are only included in development mode.

### Performance

- Database connections are pooled instead of creating new connections for each request
- Gzip compression is enabled
- The server shuts down gracefully, closing database and Redis connections properly

## Getting Started

1. Create your environment file:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your database credentials and JWT secret.

3. Install dependencies:
   ```bash
   npm install
   ```

4. Run the server:
   ```bash
   npm run dev    # development
   npm start      # production
   ```

## Authentication

All notes endpoints require a JWT token. Include it in your request headers:

```
Authorization: Bearer <token>
```

Get a token by logging in at `POST /api/v1/users/login`.

## New Files

```
src/middleware/
  errorHandler.js   - Global error handling
  validator.js      - Input validation
  rateLimiter.js    - Rate limiting with Redis fallback
  requestLogger.js  - Request logging

src/utils/
  responseHandler.js - Standardized responses
```

## Notes

- Redis is optional. If not configured, rate limiting uses in-memory storage (works fine for single-server deployments).
- The `/health` endpoint is available for monitoring and doesn't require authentication.
