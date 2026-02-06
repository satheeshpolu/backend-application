const sql = require("mssql");
const config = require("../database_config/mssql");

// Connection pool management
let pool = null;

const getPool = async () => {
  if (!pool) {
    pool = await sql.connect(config);
  }
  return pool;
};

/**
 * Create a new user with parameterized query (SQL injection safe)
 */
const createUser = async (data, callBack) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('firstName', sql.NVarChar(100), data.firstName)
      .input('lastName', sql.NVarChar(100), data.lastName)
      .input('email', sql.NVarChar(255), data.email)
      .input('password', sql.NVarChar(255), data.password)
      .query(`
        INSERT INTO Registration (firstName, lastName, email, password) 
        OUTPUT INSERTED.id, INSERTED.firstName, INSERTED.lastName, INSERTED.email
        VALUES (@firstName, @lastName, @email, @password)
      `);
    return callBack(null, result);
  } catch (error) {
    return callBack(error, null);
  }
};

/**
 * Get user by email with parameterized query (SQL injection safe)
 */
const getUserByEmailId = async (email, callBack) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('email', sql.NVarChar(255), email)
      .query("SELECT * FROM Registration WHERE email = @email");
    return callBack(null, result?.recordset[0]);
  } catch (error) {
    return callBack(error, null);
  }
};

module.exports = {
  create: createUser,
  getUserByEmailId,
};
