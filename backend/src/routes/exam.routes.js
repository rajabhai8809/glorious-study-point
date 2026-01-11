const express = require('express');
const { getExams, startExam, submitExam, deleteExam, updateExam, getLandingStats, getExamResult } = require('../controllers/exam.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');
const roles = require('../config/roles');

const router = express.Router();

router.get('/public/stats', getLandingStats);

router.use(protect); // All exam routes require login

router.get('/', getExams);
router.post('/:id/start', startExam);
router.post('/:id/submit', submitExam);
router.get('/:id/result', getExamResult);
router.delete('/:id', protect, authorize(roles.ADMIN), deleteExam);
router.put('/:id', protect, authorize(roles.ADMIN), updateExam);

module.exports = router;