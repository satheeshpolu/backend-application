/**
 * Notes Service
 * Handles all database operations for notes
 */
const sql = require("mssql");
const config = require("../../config/database");
const { ApiError } = require("../../middleware/errorHandler");

// Connection pool management
let pool = null;

/**
 * Get or create database connection pool
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
 * Create a new note
 */
const create = async (note, createdAt) => {
  try {
    const db = await getPool();
    const result = await db.request()
      .input('note_title', sql.NVarChar(255), note.note_title)
      .input('note_description', sql.NVarChar(sql.MAX), note.note_description)
      .input('created_at', sql.DateTime, new Date(createdAt))
      .query(`
        INSERT INTO notes_app (note_title, note_description, created_at) 
        OUTPUT INSERTED.note_id, INSERTED.note_title, INSERTED.note_description, INSERTED.created_at
        VALUES (@note_title, @note_description, @created_at)
      `);
    return result.recordset[0];
  } catch (error) {
    console.error("Error creating note:", error);
    throw new ApiError(500, "Failed to create note");
  }
};

/**
 * Get all notes with optional pagination
 */
const findAll = async (pagination = null) => {
  try {
    const db = await getPool();
    
    if (pagination) {
      const { limit, offset } = pagination;
      
      const countResult = await db.request()
        .query("SELECT COUNT(*) as total FROM notes_app");
      const total = countResult.recordset[0].total;
      
      const result = await db.request()
        .input('limit', sql.Int, limit)
        .input('offset', sql.Int, offset)
        .query(`
          SELECT * FROM notes_app 
          ORDER BY created_at DESC 
          OFFSET @offset ROWS 
          FETCH NEXT @limit ROWS ONLY
        `);
      
      return { data: result.recordset, total };
    }
    
    const result = await db.request()
      .query("SELECT * FROM notes_app ORDER BY created_at DESC");
    return { data: result.recordset };
  } catch (error) {
    console.error("Error fetching notes:", error);
    throw new ApiError(500, "Failed to retrieve notes");
  }
};

/**
 * Find note by ID
 */
const findById = async (id) => {
  try {
    const db = await getPool();
    const result = await db.request()
      .input('note_id', sql.Int, id)
      .query("SELECT * FROM notes_app WHERE note_id = @note_id");
    return result.recordset[0] || null;
  } catch (error) {
    console.error("Error fetching note:", error);
    throw new ApiError(500, "Failed to retrieve note");
  }
};

/**
 * Update note by ID
 */
const update = async (id, note, updatedAt) => {
  try {
    const db = await getPool();
    
    await db.request()
      .input('note_id', sql.Int, id)
      .input('note_title', sql.NVarChar(255), note.note_title)
      .input('note_description', sql.NVarChar(sql.MAX), note.note_description)
      .input('updated_at', sql.DateTime, new Date(updatedAt))
      .query(`
        UPDATE notes_app 
        SET note_title = @note_title, 
            note_description = @note_description, 
            updated_at = @updated_at 
        WHERE note_id = @note_id
      `);
    
    return await findById(id);
  } catch (error) {
    console.error("Error updating note:", error);
    throw new ApiError(500, "Failed to update note");
  }
};

/**
 * Delete note by ID
 */
const remove = async (id) => {
  try {
    const db = await getPool();
    const result = await db.request()
      .input('note_id', sql.Int, id)
      .query("DELETE FROM notes_app WHERE note_id = @note_id");
    return result.rowsAffected[0] > 0;
  } catch (error) {
    console.error("Error deleting note:", error);
    throw new ApiError(500, "Failed to delete note");
  }
};

/**
 * Delete all notes
 */
const removeAll = async () => {
  try {
    const db = await getPool();
    const result = await db.request().query("DELETE FROM notes_app");
    return result.rowsAffected[0];
  } catch (error) {
    console.error("Error deleting notes:", error);
    throw new ApiError(500, "Failed to delete notes");
  }
};

/**
 * Check if note exists
 */
const exists = async (id) => {
  try {
    const db = await getPool();
    const result = await db.request()
      .input('note_id', sql.Int, id)
      .query("SELECT COUNT(*) as count FROM notes_app WHERE note_id = @note_id");
    return result.recordset[0].count > 0;
  } catch (error) {
    console.error("Error checking note:", error);
    throw new ApiError(500, "Failed to check note");
  }
};

module.exports = {
  create,
  findAll,
  findById,
  update,
  remove,
  removeAll,
  exists,
  closePool,
};
