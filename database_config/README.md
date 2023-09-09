# Database configurations

# Steps 
1. Create .env file
2. Provide your MSSQL database credentials as mentioned in the `.env-example` file
3. Install `npm install dotenv` package to read the `.env` file properties
4. Create mssql.js file and access the properties from the `.env` file
5. Copy-Pase the code below to acces the data
```
    // Import the dotenv package
    require('dotenv').config();
    const config = require("./database_config/mssql");
```
