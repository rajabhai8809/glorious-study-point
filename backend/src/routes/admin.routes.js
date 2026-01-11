const express = require('express');
const { createExam, addQuestion, bulkUploadQuestions, getDashboardStats, getAllUsers, deleteUser, getUserResults, getStudentAnalytics } = require('../controllers/admin.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');
const roles = require('../config/roles');

const router = express.Router();

router.use(protect);
router.use(authorize(roles.ADMIN)); // All routes require Admin role

router.get('/dashboard', getDashboardStats);
router.get('/analytics', getStudentAnalytics);
router.post('/exams', createExam);
router.post('/questions', addQuestion);
router.post('/questions/bulk', bulkUploadQuestions);
router.get('/users', getAllUsers);
router.get('/users/:id/results', getUserResults);
router.delete('/users/:id', deleteUser);

module.exports = router;