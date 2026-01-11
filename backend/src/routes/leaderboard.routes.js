const express = require('express');
const { getLeaderboard } = require('../controllers/leaderboard.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/', protect, getLeaderboard);

module.exports = router;