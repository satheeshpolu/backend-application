// Import the db config
const config = require("../database_config/mssql");
const sql = require("mssql");
const { ApiError } = require("../middleware/errorHandler");

// Connection pool management
let pool = null;

/**
 * Get or create database connection pool
 * Uses connection pooling for better performance
 */
const getPool = async () => {
  if (!pool) {
    pool = await sql.connect(config);
  }
  return pool;
};

/**
 * Close the connection pool (for graceful shutdown)
 */
const closePool = async () => {
  if (pool) {
    await pool.close();
    pool = null;
  }
};

/**
 * Add new note with parameterized query (SQL injection safe)
 * @param {Object} note - Note object with note_title and note_description
 * @param {string} created_at - ISO date string
 * @returns {Object} - Created note with ID
 */
const addNote = async (note, created_at) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('note_title', sql.NVarChar(255), note.note_title)
      .input('note_description', sql.NVarChar(sql.MAX), note.note_description)
      .input('created_at', sql.DateTime, new Date(created_at))
      .query(`
        INSERT INTO notes_app (note_title, note_description, created_at) 
        OUTPUT INSERTED.note_id, INSERTED.note_title, INSERTED.note_description, INSERTED.created_at
        VALUES (@note_title, @note_description, @created_at)
      `);
    return result;
  } catch (error) {
    console.error("Error while adding the note:", error);
    throw new ApiError(500, "Failed to add note");
  }
};

/**
 * Get all notes with optional pagination
 * @param {Object} pagination - Optional { limit, offset } for pagination
 * @returns {Object} - Notes array and total count
 */
const getNotes = async (pagination = null) => {
  try {
    const pool = await getPool();
    
    if (pagination) {
      const { limit, offset } = pagination;
      
      // Get total count
      const countResult = await pool.request()
        .query("SELECT COUNT(*) as total FROM notes_app");
      const total = countResult.recordset[0].total;
      
      // Get paginated results
      const result = await pool.request()
        .input('limit', sql.Int, limit)
        .input('offset', sql.Int, offset)
        .query(`
          SELECT * FROM notes_app 
          ORDER BY created_at DESC 
          OFFSET @offset ROWS 
          FETCH NEXT @limit ROWS ONLY
        `);
      
      return { recordset: result.recordset, total };
    }
    
    // Return all notes if no pagination
    const result = await pool.request()
      .query("SELECT * FROM notes_app ORDER BY created_at DESC");
    return result;
  } catch (error) {
    console.error("Error while getting the notes:", error);
    throw new ApiError(500, "Failed to retrieve notes");
  }
};

/**
 * Get note by ID with parameterized query
 * @param {number} id - Note ID
 * @returns {Object} - Note object or null
 */
const getNoteByID = async (id) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('note_id', sql.Int, id)
      .query("SELECT * FROM notes_app WHERE note_id = @note_id");
    return result;
  } catch (error) {
    console.error("Error while getting the note:", error);
    throw new ApiError(500, "Failed to retrieve note");
  }
};

/**
 * Delete note by ID with parameterized query
 * @param {number} id - Note ID
 * @returns {Object} - Result with rowsAffected
 */
const deleteNote = async (id) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('note_id', sql.Int, id)
      .query("DELETE FROM notes_app WHERE note_id = @note_id");
    return result;
  } catch (error) {
    console.error("Error while deleting the note:", error);
    throw new ApiError(500, "Failed to delete note");
  }
};

/**
 * Update existing note by ID with parameterized query
 * @param {Object} note - Note object with note_title and note_description
 * @param {number} id - Note ID to update
 * @param {string} updated_at - ISO date string
 * @returns {Object} - Updated note
 */
const updateNote = async (note, id, updated_at) => {
  try {
    const pool = await getPool();
    
    // Update the note
    await pool.request()
      .input('note_id', sql.Int, id)
      .input('note_title', sql.NVarChar(255), note.note_title)
      .input('note_description', sql.NVarChar(sql.MAX), note.note_description)
      .input('updated_at', sql.DateTime, new Date(updated_at))
      .query(`
        UPDATE notes_app 
        SET note_title = @note_title, 
            note_description = @note_description, 
            updated_at = @updated_at 
        WHERE note_id = @note_id
      `);
    
    // Return the updated note
    const latestNote = await getNoteByID(id);
    return latestNote;
  } catch (error) {
    console.error("Error while updating the note:", error);
    throw new ApiError(500, "Failed to update note");
  }
};

/**
 * Delete all notes (dangerous operation - consider adding safeguard)
 * @returns {Object} - Result with rowsAffected
 */
const deleteAllNotes = async () => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .query("DELETE FROM notes_app");
    return result;
  } catch (error) {
    console.error("Error while deleting all notes:", error);
    throw new ApiError(500, "Failed to delete notes");
  }
};

/**
 * Check if note exists
 * @param {number} id - Note ID
 * @returns {boolean} - True if note exists
 */
const noteExists = async (id) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('note_id', sql.Int, id)
      .query("SELECT COUNT(*) as count FROM notes_app WHERE note_id = @note_id");
    return result.recordset[0].count > 0;
  } catch (error) {
    console.error("Error checking note existence:", error);
    throw new ApiError(500, "Failed to check note existence");
  }
};

module.exports = {
  addNote,
  deleteNote,
  getNotes,
  updateNote,
  deleteAllNotes,
  getNoteByID,
  noteExists,
  closePool,
};
