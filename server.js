const express = require("express");
const cors = require("cors");

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
const userRouter = require("./src/users/user.router");

app.use(express.json());
app.use(express.urlencoded());
app.use(cors());

app.use("/api/v1/users", userRouter);
app.use("/api/v1/users/login", userRouter);

app.get("/api/v1/test", async function (req, res) {
  res.send({ result: "REST API works fine ...!" });
  //res.json({msg: "REST API works fine ...!"})
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
app.delete(
  API_ENDPOINT.ROOT + API_ENDPOINT.DELETE_NOTE,
  async function (req, res) {
    const result = await dbOperation.deleteNote(req.body.note_id);
    if (result) res.send({ result: "Note is deleted scuccessfully...!" });
  }
);

// Update note
app.put(
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
app.delete(
  API_ENDPOINT.ROOT + API_ENDPOINT.DELETE_ALL_NOTES,
  async function (req, res) {
    const result = await dbOperation.deleteAllNotes();
    if (result) res.send({ result: "All notes are deleted scuccessfully...!" });
  }
);

// Test REST API
// app.get("/api/v1/test", async function (req, res) {
//   res.send({ result: "REST API works fine ...!111" });
// });

// Docker test REST API
app.get("/test-api", async function (req, res) {
  res.send({
    result: "Docker image works fine. It's a test REST API for docker...!",
  });
});

// SSE REST API
app.get(API_ENDPOINT.ROOT + "/sse", async (req, res) => {
  //res.send('Connected....!');
  try {
    console.log("Client is connected...!");
    res.setHeader("Content-type", "text/event-stream");
    res.setHeader("Access-Controll-Allow-Origin", "*");
    const intervalId = setInterval(() => {
      const date = new Date().toDateString();
      res.write(`Data: ${date} \n`);
    }, 1000);

    res.on("close", () => {
      clearInterval(intervalId);
      console.log("Client is disconnected...!");
      res.end();
    });
  } catch (error) {
    console.log("Encounter an issue with SSE...!");
  }
});

app.get(API_ENDPOINT.ROOT + "/events", async (req, res) => {
  try {
    console.log('Client is connected...!');
    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const allNotes = await dbOperation.getNotes();
    // Send the initial data to the client
    res.write(`data: ${JSON.stringify(allNotes.recordset)}\n\n`);

    // Poll the database for updates every X seconds
    const pollInterval = 5000; // 5 seconds (adjust as needed)
    const pollTimer = setInterval(async () => {
      const updatedData = await dbOperation.getNotes();;
      res.write(`data: ${JSON.stringify(updatedData.recordset)}\n\n`);
    }, pollInterval);

    // Close the connection when the client disconnects
    res.on('close', () => {
      clearInterval(pollTimer);
      console.log("Client is disconnected...!");
      res.end();
    });
  } catch (error) {
    console.error('Encountered an issue with SSE:', error);
  }
});
app.listen(API_PORT, () =>
  console.log(`Server is running on ${API_PORT} 
    \nVisit http://localhost:5000/api/v1/test
    \nVisit http://localhost:5001/api/v1/test-api`)
);
