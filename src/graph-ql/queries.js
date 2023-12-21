const sql = require("mssql");

const getDBConfig = require("../utils/db-config");

const Query = {
  getUser: async (_, { user_id }) => {
    const pool = await sql.connect(getDBConfig());
    try {
      const user = await pool
        .request()
        .query(`SELECT * FROM users WHERE user_id = '${user_id}'`);
      if (user?.rowsAffected[0] === 0) {
        console.log(`User ${user_id} not found.`);
        return;
      }
      return user.recordset[0];
    } catch (error) {
      // Make sure to release the connection back to the pool
      if (pool) {
        await pool.close();
      }
    }
  },
  getAllUsers: async () => {
    const pool = await sql.connect(getDBConfig());
    try {
      const users = await pool.request().query("SELECT * from users");
      console.log(users);
      if (users?.rowsAffected[0] === 0) {
        console.log(`Users not found.`);
        return;
      }
      return users.recordset;
    } catch (error) {
      console.log("Error while add getting the getAllUsers => ", error);
    } finally {
      // Make sure to release the connection back to the pool
      if (pool) {
        await pool.close();
      }
    }
  },
};

module.exports = Query;
