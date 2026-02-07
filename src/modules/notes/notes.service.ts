/**
 * Notes Service - Business Logic Layer
 */
import { getPool, sql } from '../../config/database';
import { CreateNoteInput, UpdateNoteInput, Note } from '../../schemas/note.schema';
import { Pagination } from '../../schemas/common.schema';

interface NoteRow {
  id: number;
  title: string;
  content: string;
  user_id: number;
  created_at: Date;
  updated_at: Date | null;
}

const mapNoteRow = (row: NoteRow): Note => ({
  id: row.id,
  title: row.title,
  content: row.content,
  userId: row.user_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at ?? undefined,
});

export const notesService = {
  /**
   * Get all notes with pagination
   */
  async findAll(pagination: Pagination, userId?: number): Promise<{ notes: Note[]; total: number }> {
    const pool = await getPool();

    // Count query
    const countQuery = userId
      ? `SELECT COUNT(*) as total FROM notes WHERE user_id = @userId`
      : `SELECT COUNT(*) as total FROM notes`;

    const countRequest = pool.request();
    if (userId) {
      countRequest.input('userId', sql.Int, userId);
    }
    const countResult = await countRequest.query(countQuery);
    const total = countResult.recordset[0].total;

    // Data query with pagination
    const dataQuery = userId
      ? `SELECT id, title, content, user_id, created_at, updated_at 
         FROM notes 
         WHERE user_id = @userId 
         ORDER BY created_at DESC 
         OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`
      : `SELECT id, title, content, user_id, created_at, updated_at 
         FROM notes 
         ORDER BY created_at DESC 
         OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;

    const dataRequest = pool.request();
    dataRequest.input('offset', sql.Int, pagination.offset);
    dataRequest.input('limit', sql.Int, pagination.limit);
    if (userId) {
      dataRequest.input('userId', sql.Int, userId);
    }

    const dataResult = await dataRequest.query<NoteRow>(dataQuery);
    const notes = dataResult.recordset.map(mapNoteRow);

    return { notes, total };
  },

  /**
   * Get a single note by ID
   */
  async findById(id: number): Promise<Note | null> {
    const pool = await getPool();
    
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query<NoteRow>(`
        SELECT id, title, content, user_id, created_at, updated_at 
        FROM notes 
        WHERE id = @id
      `);

    if (result.recordset.length === 0) {
      return null;
    }

    return mapNoteRow(result.recordset[0]);
  },

  /**
   * Create a new note
   */
  async create(data: CreateNoteInput, userId: number): Promise<Note> {
    const pool = await getPool();

    const result = await pool
      .request()
      .input('title', sql.NVarChar(255), data.title)
      .input('content', sql.NVarChar(sql.MAX), data.content)
      .input('userId', sql.Int, userId)
      .query<NoteRow>(`
        INSERT INTO notes (title, content, user_id, created_at)
        OUTPUT INSERTED.id, INSERTED.title, INSERTED.content, 
               INSERTED.user_id, INSERTED.created_at, INSERTED.updated_at
        VALUES (@title, @content, @userId, GETDATE())
      `);

    return mapNoteRow(result.recordset[0]);
  },

  /**
   * Update an existing note
   */
  async update(id: number, data: UpdateNoteInput, userId: number): Promise<Note | null> {
    const pool = await getPool();

    // Build dynamic update query
    const updates: string[] = [];
    const request = pool.request();
    request.input('id', sql.Int, id);
    request.input('userId', sql.Int, userId);

    if (data.title !== undefined) {
      updates.push('title = @title');
      request.input('title', sql.NVarChar(255), data.title);
    }

    if (data.content !== undefined) {
      updates.push('content = @content');
      request.input('content', sql.NVarChar(sql.MAX), data.content);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    updates.push('updated_at = GETDATE()');

    const result = await request.query<NoteRow>(`
      UPDATE notes 
      SET ${updates.join(', ')}
      OUTPUT INSERTED.id, INSERTED.title, INSERTED.content, 
             INSERTED.user_id, INSERTED.created_at, INSERTED.updated_at
      WHERE id = @id AND user_id = @userId
    `);

    if (result.recordset.length === 0) {
      return null;
    }

    return mapNoteRow(result.recordset[0]);
  },

  /**
   * Delete a note
   */
  async delete(id: number, userId: number): Promise<boolean> {
    const pool = await getPool();

    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .input('userId', sql.Int, userId)
      .query(`DELETE FROM notes WHERE id = @id AND user_id = @userId`);

    return (result.rowsAffected[0] ?? 0) > 0;
  },

  /**
   * Check if user owns the note
   */
  async isOwner(noteId: number, userId: number): Promise<boolean> {
    const pool = await getPool();

    const result = await pool
      .request()
      .input('id', sql.Int, noteId)
      .input('userId', sql.Int, userId)
      .query(`SELECT 1 FROM notes WHERE id = @id AND user_id = @userId`);

    return result.recordset.length > 0;
  },
};

export default notesService;
