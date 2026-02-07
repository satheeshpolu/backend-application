/**
 * Notes Module Index
 * Exports all notes-related components
 */
const router = require('./notes.router');
const controller = require('./notes.controller');
const service = require('./notes.service');
const Note = require('./notes.model');

module.exports = {
  router,
  controller,
  service,
  Note,
};
