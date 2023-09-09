const config = {
    user: process.env.USER,
    password: process.env.PASSWORD,
    server: process.env.SERVER,
    database: process.env.DATABASE_NAME,
    options: {
        trustServerCertificate: process.env.TRUST_SERVER_CERTIFICATE,
        trustedConnection: process.env.TRUSTED_CONNECTION,
        enableArithAbort: process.env.ENABLE_ARITHABORT,
        instancename: process.env.DATABASE_INSTANCE_NAME,
    },
    port: process.env.PORT
}
console.log(config);
module.exports = config;
