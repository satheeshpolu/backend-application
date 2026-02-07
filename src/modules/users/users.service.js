/**
 * Users Service
 * Handles database operations for users
 */
const sql = require("mssql");
const config = require("../../config/database");
const { ApiError } = require("../../middleware/errorHandler");

let pool = null;

const getPool = async () => {
  if (!pool) {
    pool = await sql.connect(config);
  }
  return pool;
};

/**
 * Create a new user
 */
const create = async (userData) => {
  try {
    const db = await getPool();
    const result = await db.request()
      .input('firstName', sql.NVarChar(100), userData.firstName)
      .input('lastName', sql.NVarChar(100), userData.lastName)
      .input('email', sql.NVarChar(255), userData.email)
      .input('password', sql.NVarChar(255), userData.password)
      .query(`
        INSERT INTO Registration (firstName, lastName, email, password) 
        OUTPUT INSERTED.id, INSERTED.firstName, INSERTED.lastName, INSERTED.email
        VALUES (@firstName, @lastName, @email, @password)
      `);
    return result.recordset[0];
  } catch (error) {
    if (error.number === 2627) { // Unique constraint violation
      throw new ApiError(409, "Email already exists");
    }
    console.error("Error creating user:", error);
    throw new ApiError(500, "Failed to create user");
  }
};

/**
 * Find user by email
 */
const findByEmail = async (email) => {
  try {
    const db = await getPool();
    const result = await db.request()
      .input('email', sql.NVarChar(255), email)
      .query("SELECT * FROM Registration WHERE email = @email");
    return result.recordset[0] || null;
  } catch (error) {
    console.error("Error fetching user:", error);
    throw new ApiError(500, "Failed to find user");
  }
};

/**
 * Find user by ID
 */
const findById = async (id) => {
  try {
    const db = await getPool();
    const result = await db.request()
      .input('id', sql.Int, id)
      .query("SELECT id, firstName, lastName, email FROM Registration WHERE id = @id");
    return result.recordset[0] || null;
  } catch (error) {
    console.error("Error fetching user:", error);
    throw new ApiError(500, "Failed to find user");
  }
};

module.exports = {
  create,
  findByEmail,
  findById,
};
