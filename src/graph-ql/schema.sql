-- Create a new database if it doesn't exist
CREATE DATABASE IF NOT EXISTS YourDatabaseName;

-- Use the created database
USE YourDatabaseName;

-- Create a new users table with phone_number column
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) -- Change the length according to your requirements
);

-- Update the username and email for a user with a specific user_id
UPDATE users
SET username = 'new_username', email = 'new_email@example.com'
WHERE user_id = 123;

-- Drop all primary key constraints from a table:

DECLARE @tableName NVARCHAR(255) = 'YourTableName';

DECLARE @sql NVARCHAR(MAX) = '';

SELECT @sql += 'ALTER TABLE ' + @tableName + ' DROP CONSTRAINT ' + name + ';
'
FROM sys.key_constraints
WHERE type = 'PK'
  AND parent_object_id = OBJECT_ID(@tableName);

-- Print the generated SQL statements (optional)
PRINT @sql;

-- Uncomment the line below to execute the generated SQL statements
-- EXEC sp_executesql @sql;