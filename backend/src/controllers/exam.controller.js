const mongoose = require('mongoose');
const Exam = require('../models/Exam');
const User = require('../models/User');
const Question = require('../models/Question');
const Result = require('../models/Result');
const Leaderboard = require('../models/Leaderboard');
const sendResponse = require('../utils/response');

// @desc    Get public landing page stats
// @route   GET /api/exams/public/stats
exports.getLandingStats = async (req, res) => {
    try {
        const totalStudents = await User.countDocuments({ role: 'user' });
        const totalExams = await Exam.countDocuments({ isActive: true });
        const subjects = await Exam.find({ isActive: true }).distinct('subject');
        
        sendResponse(res, 200, true, {
            totalStudents,
            totalExams,
            subjects
        });
    } catch (err) {
        sendResponse(res, 500, false, null, err.message);
    }
};

// @desc    Get all active exams
// @route   GET /api/exams
exports.getExams = async (req, res) => {
    try {
        const exams = await Exam.find({ isActive: true }).sort('-createdAt');
        sendResponse(res, 200, true, exams);
    } catch (err) {
        sendResponse(res, 500, false, null, err.message);
    }
};

// @desc    Start an exam (Fetch questions)
// @route   POST /api/exams/:id/start
exports.startExam = async (req, res) => {
    try {
        const examId = req.params.id;
        const userId = req.user.id;

        // 0. Check if user exists
        const user = await User.findById(userId);
        if (!user) return sendResponse(res, 404, false, null, 'User not found');

        // 1. Check if exam exists
        const exam = await Exam.findById(examId);
        if (!exam) {
            return sendResponse(res, 404, false, null, 'Exam not found');
        }

        // 2. Check if user already attempted
        const existingResult = await Result.findOne({ userId, examId });
        if (existingResult) {
            return sendResponse(res, 400, false, null, 'You have already attempted this exam');
        }

        // 3. Fetch questions (Sequential)
        // Note: We explicitly exclude 'correctOption' for security
        const limit = (exam.totalQuestions && exam.totalQuestions > 0) ? exam.totalQuestions : 100;
        const questions = await Question.aggregate([
            { $match: { examId: new mongoose.Types.ObjectId(examId) } },
            { $sort: { _id: 1 } }, // Ensure serial order (as uploaded)
            { $limit: limit },
            { $project: { correctOption: 0 } } // Security: Hide answer
        ]);

        sendResponse(res, 200, true, { exam, questions }, 'Exam started');
    } catch (err) {
        sendResponse(res, 500, false, null, err.message);
    }
};

// @desc    Submit exam and calculate score
// @route   POST /api/exams/:id/submit
exports.submitExam = async (req, res) => {
    try {
        const examId = req.params.id;
        const userId = req.user.id;
        const { answers } = req.body; // { questionId: optionId }

        if (!answers) {
            return sendResponse(res, 400, false, null, 'Answers are required');
        }

        // 0. Check if user exists
        const user = await User.findById(userId);
        if (!user) return sendResponse(res, 404, false, null, 'User not found');

        // 1. Validate Exam
        const exam = await Exam.findById(examId);
        if (!exam) return sendResponse(res, 404, false, null, 'Exam not found');

        // 2. Prevent Re-submission
        const existingResult = await Result.findOne({ userId, examId });
        if (existingResult) return sendResponse(res, 400, false, null, 'Exam already submitted');

        // 3. Calculate Score
        let score = 0;
        let correctCount = 0;
        let wrongCount = 0;
        let skippedCount = 0;
        const formattedAnswers = [];

        // Fetch all questions for this exam including correctOption
        const questions = await Question.find({ examId }).select('+correctOption');
        
        // Evaluate answers by iterating over ALL questions
        for (const question of questions) {
            const qId = question._id.toString();
            // Check if user provided an answer for this question
            const hasAnswer = Object.prototype.hasOwnProperty.call(answers, qId);
            const selectedOption = hasAnswer ? Number(answers[qId]) : -1; // -1 indicates skipped

            formattedAnswers.push({
                questionId: qId,
                selectedOption: selectedOption
            });

            if (selectedOption !== -1) {
                if (selectedOption === Number(question.correctOption)) {
                    score += 1; // Force 1 point per question
                    correctCount++;
                } else {
                    score -= (question.negativeMarks || 0);
                    wrongCount++;
                }
            } else {
                skippedCount++;
            }
        }

        // Ensure score isn't negative
        score = Math.max(0, score);

        // Calculate Accuracy
        const accuracy = questions.length > 0 ? (correctCount / questions.length) * 100 : 0;

        // 4. Save Result
        const result = await Result.create({
            userId,
            examId,
            score,
            totalMarks: questions.length, // Force Total Marks = Total Questions
            correctAnswers: correctCount,
            wrongAnswers: wrongCount,
            skippedAnswers: skippedCount,
            accuracy: Math.round(accuracy * 10) / 10, // Round to 1 decimal place
            answers: formattedAnswers
        });

        // 5. Update Leaderboard
        await Leaderboard.findOneAndUpdate(
            { userId },
            { 
                $inc: { totalScore: score, examsAttempted: 1 },
                $set: { updatedAt: Date.now() }
            },
            { upsert: true }
        );

        sendResponse(res, 200, true, {
            score,
            totalMarks: exam.totalMarks,
            correctAnswers: correctCount,
            wrongAnswers: wrongCount
        }, 'Exam submitted successfully');

    } catch (err) {
        sendResponse(res, 500, false, null, err.message);
    }
};

// @desc    Delete an exam
// @route   DELETE /api/exams/:id
exports.deleteExam = async (req, res) => {
    try {
        await Exam.findByIdAndDelete(req.params.id);
        // Optionally delete associated questions and results
        await Question.deleteMany({ examId: req.params.id });
        await Result.deleteMany({ examId: req.params.id });
        
        sendResponse(res, 200, true, null, 'Exam deleted successfully');
    } catch (err) {
        sendResponse(res, 500, false, null, err.message);
    }
};

// @desc    Update an exam
// @route   PUT /api/exams/:id
exports.updateExam = async (req, res) => {
    try {
        const exam = await Exam.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!exam) return sendResponse(res, 404, false, null, 'Exam not found');
        sendResponse(res, 200, true, exam, 'Exam updated successfully');
    } catch (err) {
        sendResponse(res, 500, false, null, err.message);
    }
};

// @desc    Get exam result for a user
// @route   GET /api/exams/:id/result
exports.getExamResult = async (req, res) => {
    try {
        const result = await Result.findOne({ 
            examId: req.params.id, 
            userId: req.user.id 
        })
        .populate('examId', 'title totalMarks totalQuestions')
        .populate({
            path: 'answers.questionId',
            select: 'questionText options correctOption marks negativeMarks'
        });

        if (!result) {
            return sendResponse(res, 404, false, null, 'Result not found');
        }

        // Calculate Rank for this specific exam
        // Rank = Count of people with (Higher Score) OR (Same Score AND More Correct Answers) + 1
        const betterResultsCount = await Result.countDocuments({
            examId: req.params.id,
            $or: [
                { score: { $gt: result.score } },
                { score: result.score, correctAnswers: { $gt: result.correctAnswers } }
            ]
        });

        const rank = betterResultsCount + 1;
        const totalParticipants = await Result.countDocuments({ examId: req.params.id });
        const percentile = totalParticipants > 0 ? Math.round(((totalParticipants - rank) / totalParticipants) * 100) : 100;

        const resultData = result.toObject();
        resultData.rank = rank;
        resultData.percentile = percentile;

        sendResponse(res, 200, true, resultData);
    } catch (err) {
        sendResponse(res, 500, false, null, err.message);
    }
};