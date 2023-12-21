// Import the dotenv package
require("dotenv").config();

const getDBConfig = () => {
  const config = {
    user: process.env.USER,
    password: process.env.PASSWORD,
    server: process.env.SERVER,
    database: process.env.DATABASE_NAME,
    options: {
      trustServerCertificate: process.env.TRUST_SERVER_CERTIFICATE === "true",
      trustedConnection: process.env.TRUSTED_CONNECTION === "true",
      enableArithAbort: process.env.ENABLE_ARITHABORT === "true",
      instancename: process.env.DATABASE_INSTANCE_NAME,
    },
    port: parseInt(process.env.PORT),
  };
  return config;
};

module.exports = getDBConfig;
