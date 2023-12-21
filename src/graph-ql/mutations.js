const sql = require("mssql");

const getDBConfig = require("../utils/db-config");

const Mutation = {
  createUser: async (_, { username, email }) => {
    const pool = await sql.connect(getDBConfig());
    try {
      const newUserInfo = await pool
        .request()
        .input("username", sql.VarChar, username)
        .input("email", sql.VarChar, email)
        .query(
          "INSERT INTO users (username, email) VALUES (@username, @email)"
        );
      console.log(newUserInfo);
      if (newUserInfo.rowsAffected[0] === 1) {
        console.log("User created successfully.");
      }
      return { username, email };
    } catch (error) {
      console.error("Error while creating user:", error);
      throw error;
    } finally {
      // Make sure to release the connection back to the pool
      if (pool) {
        await pool.close();
      }
    }
  },
  updateUser: async (_, { user_id, username, email }) => {
    const pool = await sql.connect(getDBConfig());
    try {
      const updatedUserInfo = await pool
        .request()
        .input("user_id", sql.VarChar, user_id)
        .input("username", sql.VarChar, username)
        .input("email", sql.VarChar, email)
        .query(
          "UPDATE users SET username = @username, email = @email WHERE user_id = @user_id"
        );
      if (updatedUserInfo.rowsAffected[0] === 1) {
        console.log("User updated successfully.");
      }
      return { user_id, username, email };
    } catch (error) {
      console.error("Error while creating user:", error);
      throw error;
    } finally {
      // Make sure to release the connection back to the pool
      if (pool) {
        await pool.close();
      }
    }
  },
  deleteUser: async (_, { user_id }) => {
    const pool = await sql.connect(getDBConfig());
    try {
      const deletedUserInfo = await pool
        .request()
        .input("user_id", sql.VarChar, user_id)
        .query(`DELETE FROM users WHERE USER_ID = (@user_id)`);
      if (deletedUserInfo.rowsAffected[0] === 1) {
        console.log("User deleted successfully.");
        return { user_id };
      } else {
        console.log(`User ${user_id} not found.`);
      }
    } catch (error) {
      console.error("Error while delete user:", error);
      throw error;
    } finally {
      // Make sure to release the connection back to the pool
      if (pool) {
        await pool.close();
      }
    }
  },
  deleteAllUsers: async (_, {}) => {
    const pool = await sql.connect(getDBConfig());
    try {
      const deleteAllUsersInfo = await pool
        .request()
        .query(`DELETE FROM users`);
      if (deleteAllUsersInfo.rowsAffected[0] === 0) {
        console.log("All users are deleted successfully.");
      }
    } catch (error) {
      console.error("Error while delete user:", error);
      throw error;
    } finally {
      // Make sure to release the connection back to the pool
      if (pool) {
        await pool.close();
      }
    }
  },
};

module.exports = Mutation;
