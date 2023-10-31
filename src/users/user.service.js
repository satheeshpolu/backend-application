const getNotes = require("../batabase_operations/notes_app");
const sql = require("mssql");
const config = require("../database_config/mssql");

const createUser = async (data, callBack) => {
  const pool = await sql.connect(config);
  const users = await pool.request()
    .query(`INSERT INTO Registration(firstName, lastName, email, password) VALUES
    ('${data.firstName}', '${data.lastName}', '${data.email}', '${data.password}')`);
    console.log(users);
  return callBack(null, users);
};

module.exports = {
  create: createUser,
  // create: async (data, callBack) => {
  //   const pool = await sql.connect(config);
  //   const users = await pool.request()
  //     .query(`INSERT INTO Registration(firstName, lastName, email, password) VALUES
  //     ('${data.firstName}', '${data.lastName}', '${data.email}', '${data.password}')`);
  //   return callBack(null, users);
  // },
  getUserByEmailId: async (email, callBack) => {
    const pool = await sql.connect(config);
    const results = await pool.query(
      `select * from Registration where email = '${email}'`
    );
    return callBack(null, results?.recordset[0]);
  },
};
