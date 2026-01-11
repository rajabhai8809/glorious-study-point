const express = require('express');
const { getDashboard, getProfile, updateProfile, getExamHistory, getResultDetails, deleteExamResult, changePassword, getNotifications, markNotificationsRead, toggleNotificationSettings, deleteNotification, deleteAllNotifications } = require('../controllers/user.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);
router.get('/dashboard', getDashboard);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/history', getExamHistory);
router.get('/results/:examId', getResultDetails);
router.delete('/history/:id', deleteExamResult);
router.put('/change-password', changePassword);
router.get('/notifications', getNotifications);
router.put('/notifications/read', markNotificationsRead);
router.put('/notifications/toggle', toggleNotificationSettings);
router.delete('/notifications/:id', deleteNotification);
router.delete('/notifications', deleteAllNotifications);

module.exports = router;