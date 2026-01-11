const mongoose = require('mongoose');

const LeaderboardSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    totalScore: {
        type: Number,
        default: 0
    },
    examsAttempted: {
        type: Number,
        default: 0
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Leaderboard', LeaderboardSchema);