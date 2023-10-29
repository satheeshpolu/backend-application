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

app.post("/api/v1/jwt-test", async function (req, res) {
  const user = { name: "User" };
  const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);
  res.send({ accessToken: accessToken });
});
app.get("/api/v1/test", async function (req, res) {
  res.send({ result: "REST API works fine ...!" });
});

// Get note by note_id
app.get(API_ENDPOINT.ROOT + API_ENDPOINT.NOTE_BY_ID, async function (req, res) {
  const allNotes = await dbOperation.getNoteByID(req.body.note_id);
  res.send({ result: allNotes.recordset });
});

// Get all notes
app.get(API_ENDPOINT.ROOT + API_ENDPOINT.ALL_NOTES, async function (req, res) {
  const allNotes = await dbOperation.getNotes();
  res.send({ result: allNotes.recordset });
});

// Add new note
app.post(API_ENDPOINT.ROOT + API_ENDPOINT.ADD_NOTE, async function (req, res) {
  const note = new Note(req.body.note_title, req.body.note_description);
  const result = await dbOperation.addNote(note, dateUtils.getISODateString());
  if (result) res.send({ result: "Note is added scuccessfully...!" });
});

// Delete note
app.post(
  API_ENDPOINT.ROOT + API_ENDPOINT.DELETE_NOTE,
  async function (req, res) {
    const result = await dbOperation.deleteNote(req.body.note_id);
    if (result) res.send({ result: "Note is deleted scuccessfully...!" });
  }
);

// Update note
app.post(
  API_ENDPOINT.ROOT + API_ENDPOINT.UPDATE_NOTE,
  async function (req, res) {
    const note = new Note(req.body.note_title, req.body.note_description);
    const result = await dbOperation.updateNote(
      note,
      req.body.note_id,
      dateUtils.getISODateString()
    );
    if (result) res.send({ result: result });
  }
);

// Delete all note
app.post(
  API_ENDPOINT.ROOT + API_ENDPOINT.DELETE_ALL_NOTES,
  async function (req, res) {
    const result = await dbOperation.deleteAllNotes();
    if (result) res.send({ result: "All notes are deleted scuccessfully...!" });
  }
);

// Test REST API
app.get("/api/v1/test", async function (req, res) {
  res.send({ result: "REST API works fine ...!" });
});

// Docker test REST API
app.get("/test-api", async function (req, res) {
  res.send({
    result: "Docker image works fine. It's a test REST API for docker...!",
  });
});

function authenticateToken(req, res, next){
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if(token === null) return res.sendStatus(401);

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if(err) return res.sendStatus(403);
    res.user = user;
    next();
  });
};

app.listen(API_PORT, () =>
  console.log(`Server is running on ${API_PORT} 
    \nVisit http://localhost:5000/api/v1/test
    \nVisit http://localhost:5001/api/v1/test-api`)
);
