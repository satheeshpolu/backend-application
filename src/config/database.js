/**
 * Database Configuration
 * Exports MSSQL connection config from centralized config
 */
const config = require('./index');

module.exports = config.database;
