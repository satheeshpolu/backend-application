const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");

// Import the dotenv package
require("dotenv").config();

// Import the db config
const config = require("./src/database_config/mssql");

// DB Operaitons
const dbOperation = require("./src/batabase_operations/notes_app");

// Import entites
const Note = require("./src/entites/note");

const dateUtils = require("./src/utils/date-utils");
const API_ENDPOINT = require("./src/rest-api/api");
const API_PORT = 5000;
const app = express();
app.use(express.json());
app.use(express.urlencoded());
app.use(cors());

let refreshTokens = [];
app.post('/api/v1/token', (req, res) => {
  const refreshToken = req.body.token;
  if(refreshToken === null) return res.sendStatus(401);
  if(!refreshTokens.includes(refreshToken)) return res.sendStatus(403);
  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
    if(err) return res.sendStatus(403);
    const accessToken = generateToken({ name: user.name});
    return res.send({ accessToken: accessToken});
  });
});

app.post("/api/v1/jwt-test", async function (req, res) {
  const user = { name: "User" };
  const accessToken = generateToken(user);
  const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET);
  refreshTokens,push(refreshToken);
  res.send({ accessToken: accessToken, refreshToken:refreshToken });
});

function generateToken(user) {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '15s'});
}

app.listen(2000, () =>
  console.log('Authentication Server is running on 2000')
);
