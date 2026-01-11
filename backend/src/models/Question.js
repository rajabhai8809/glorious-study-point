const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
    examId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exam',
        required: true
    },
    questionText: {
        type: String,
        required: true
    },
    questionTextHindi: {
        type: String,
        default: ''
    },
    options: [{
        id: Number,
        text: String,
        textHindi: String
    }],
    correctOption: {
        type: Number, // ID of the correct option (0-3)
        required: true,
        select: false // Security: Never send correct answer to frontend during exam
    },
    marks: {
        type: Number,
        default: 1
    },
    negativeMarks: {
        type: Number,
        default: 0
    },
    difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard'],
        default: 'Medium'
    }
});

module.exports = mongoose.model('Question', QuestionSchema);