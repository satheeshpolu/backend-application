// Import the db config
const config = require("../database_config/mssql");
const sql = require("mssql");

// Add new note
const addNote = async (note, created_at) => {
  try {
    const pool = await sql.connect(config);
    const notes = await pool.request()
      .query(`INSERT INTO notes_app (note_title, note_description, created_at) VALUES
            ('${note.note_title}', '${note.note_description}',  '${created_at}')`);
    return notes;
  } catch (error) {
    console.log("Error while add the note => ", error);
  }
};

// Get all notes
const getNotes = async () => {
  try {
    const pool = await sql.connect(config);
    const notes = await pool.request().query("SELECT * from notes_app");
    return notes;
  } catch (error) {
    console.log("Error while add getting the notes => ", error);
  }
};

// Delete note by ID
const deleteNote = async (id) => {
  try {
    const pool = await sql.connect(config);
    const notes = await pool
      .request()
      .query(`DELETE FROM notes_app WHERE note_id='${id}'`);
    return notes;
  } catch (error) {
    console.log("Error while deleting the note => ", error);
  }
};

// update existing note by ID
const updateNote = async (note, id, updated_at) => {
  try {
    const pool = await sql.connect(config);
    const notes = await pool.request()
      .query(`UPDATE notes_app SET note_title = '${note.note_title}', note_description = '${note.note_description}', updated_at = '${updated_at}' 
       WHERE note_id = '${id}'`);
    return notes;
  } catch (error) {
    console.log("Error while updating the note => ", error);
  }
};

// Delete all note
const deleteAllNotes = async () => {
  try {
    const pool = await sql.connect(config);
    const notes = await pool
      .request()
      .query("DELETE FROM notes_app");
    return notes;
  } catch (error) {
    console.log("Error while deleting the note => ", error);
  }
};

module.exports = {
  addNote: addNote,
  deleteNote: deleteNote,
  getNotes: getNotes,
  updateNote: updateNote,
  deleteAllNotes: deleteAllNotes
};
