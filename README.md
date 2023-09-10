# Backend Application

MSSQL + ExpressJS + REST API

# Steps

1. Clone the repo `https://github.com/satheeshpolu/backend-application`
2. Go to root-directory of the `backend-application` in the terminal/cmd prompt
3. Run commands below and It will install all the dependencies
   `npm i` or `npm install`

## Setup MSSQL Server in your machine

Note: Please adhere to the instructions provided on the official website to complete the setup.

## Setup Database config

1. Create `.env` file
2. Copy-Pase the `.env-example` content into the `.env` file
3. Provide all the information mentioned in the `.env` file
4. Restart the backend server by pressing CTL+C
5. Run `npm start` command
6. If Database is set properly configured then we should have access to `http://localhost:5000/api/v1/test` endpoint
7. Before we dive deep into all other endpoints please try to run schema mentioned at `src\batabase_operations\notes_app.schema.README.md`
8. All REST API endpoints are mentioned at `src\rest-api\README.md`
