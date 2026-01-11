const mongoose = require('mongoose');

const ResultSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    examId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exam',
        required: true
    },
    score: {
        type: Number,
        required: true
    },
    totalMarks: {
        type: Number,
        required: true
    },
    correctAnswers: {
        type: Number,
        default: 0
    },
    wrongAnswers: {
        type: Number,
        default: 0
    },
    accuracy: {
        type: Number,
        default: 0
    },
    skippedAnswers: {
        type: Number,
        default: 0
    },
    answers: [{
        questionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Question',
            required: true
        },
        selectedOption: {
            type: Number,
            required: true
        }
    }],
    submittedAt: {
        type: Date,
        default: Date.now
    }
});

// Prevent multiple attempts for the same exam by the same user
ResultSchema.index({ userId: 1, examId: 1 }, { unique: true });

module.exports = mongoose.model('Result', ResultSchema);