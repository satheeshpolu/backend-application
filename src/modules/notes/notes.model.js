/**
 * Note Entity/Model
 */
class Note {
  constructor(title, description, createdAt = null) {
    this.note_title = title;
    this.note_description = description;
    this.created_at = createdAt || new Date().toISOString();
  }

  static fromRequest(body) {
    return new Note(body.note_title, body.note_description);
  }

  toJSON() {
    return {
      note_title: this.note_title,
      note_description: this.note_description,
      created_at: this.created_at,
    };
  }
}

module.exports = Note;
