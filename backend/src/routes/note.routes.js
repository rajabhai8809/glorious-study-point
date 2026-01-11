const express = require('express');
const { createNote, getNotes, deleteNote, updateNote, trackDownload } = require('../controllers/note.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');
const roles = require('../config/roles');

const router = express.Router();

router.get('/', getNotes);
router.post('/:id/download', protect, trackDownload);

router.post('/', protect, authorize(roles.ADMIN), createNote);
router.delete('/:id', protect, authorize(roles.ADMIN), deleteNote);
router.put('/:id', protect, authorize(roles.ADMIN), updateNote);

module.exports = router;