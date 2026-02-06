/**
 * API Endpoint Configuration
 * All API routes are versioned and follow RESTful conventions
 */
const API = {
    // API Version
    ROOT: '/api/v1',
    
    // Notes endpoints (RESTful)
    // POST   /notes      - Create a note
    // GET    /notes      - List all notes
    // GET    /notes/:id  - Get a note
    // PUT    /notes/:id  - Update a note
    // DELETE /notes/:id  - Delete a note
    // DELETE /notes      - Delete all notes
    NOTES: '/notes',
    
    // SSE endpoints
    SSE: '/sse',
    EVENTS: '/events',
    
    // Health & Utility
    HEALTH: '/health',
    TEST: '/test',
};

module.exports = API;
