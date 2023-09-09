const express = require("express");
const cors = require("cors");

// Import the dotenv package
require('dotenv').config();

// Import the db config
const config = require("./database_config/mssql");

// DB Operaitons
const dbOperation = require('./batabase_operations/notes_app');

// Import entites
const Note = require('./entites/note');

const API_PORT = 5000;
const app = express();
app.use(express.json());
app.use(express.urlencoded());
app.use(cors());

// Test REST API
app.get("/api/test", async function (req, res) {
  res.send({ result: "REST API works fine ...!" });
});

// Get all notes
app.get('/api/all-notes', async function(req, res){    
  const allNotes = await dbOperation.getNotes();
  res.send({result: allNotes.recordset})
});

// Add new note
app.post('/api/add-note', async function(req, res){  
  const note = new Note(req.body.note_title, req.body.note_description, req.body.created_at);
  const result = await dbOperation.addNote(note);
  if(result) res.send({result: 'Note is added scuccessfully...!'});
});

// Delete note
app.post('/api/delete-note', async function(req, res){ 
  const result = await dbOperation.deleteNote(req.body.note_id);
  if(result) res.send({result: 'Note is deleted scuccessfully...!'});
});

// Update note
app.post('/api/update-note', async function(req, res){  
  const note = new Note(req.body.note_title, req.body.note_description, req.body.created_at);
  const result = await dbOperation.updateNote(note, req.body.note_id);
  if(result) res.send({result: 'Note is updated scuccessfully...!'});
});

app.listen(API_PORT, () =>
  console.log(`Server is running on ${API_PORT} 
    \n visit http://localhost:5000/api/test`)
);
