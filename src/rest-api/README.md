# REST API Endpoints

1. http://localhost:5000/api/v1/all-notes
2. http://localhost:5000/api/v1/add-note
   ```
    Payload: {
       "note_title": "6 Notes",
      "note_description": "6 This is the content of the first note.",
      "created_at": "2023-09-09T16:58:34.857Z"
   }
   ```
3. http://localhost:5000/api/v1/delete-note
   ```
   Payload: {
      "note_id": 4
   }
   ```
4. http://localhost:5000/api/v1/update-note

   ```
   Payload: {
      "note_id": 5,
      "note_title": "5 Updated",
      "note_description": "5 Updated",
      "created_at": "2023-09-09T17:58:34.857Z"
      }
   ```
5. http://localhost:5000/api/v1/delete-all-notes

