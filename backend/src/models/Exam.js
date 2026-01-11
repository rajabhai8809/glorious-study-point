const mongoose = require('mongoose');

const ExamSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    subject: {
        type: String,
        required: true
    },
    studentClass: {
        type: String,
        default: '12'
    },
    duration: {
        type: Number,
        required: true // in minutes
    },
    totalMarks: {
        type: Number,
        required: true
    },
    totalQuestions: {
        type: Number,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Exam', ExamSchema);