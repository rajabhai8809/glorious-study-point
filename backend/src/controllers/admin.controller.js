const Question = require('../models/Question');
const Exam = require('../models/Exam');
const User = require('../models/User');
const Result = require('../models/Result');
const Notification = require('../models/Notification');
const sendResponse = require('../utils/response');

// @desc    Create a new Exam
// @route   POST /api/admin/exams
exports.createExam = async (req, res) => {
    try {
        const exam = await Exam.create(req.body);

        // Send Notification to all users who have enabled notifications
        const users = await User.find({ role: 'user', notificationsEnabled: { $ne: false } }).select('_id');
        if (users.length > 0) {
            const notifications = users.map(user => ({
                userId: user._id,
                title: 'New Exam Added',
                message: `A new exam "${exam.title}" is now available in ${exam.subject}.`
            }));
            await Notification.insertMany(notifications);
        }

        sendResponse(res, 201, true, exam, 'Exam created');
    } catch (err) {
        sendResponse(res, 500, false, null, err.message);
    }
};

// @desc    Get Admin Dashboard Stats
// @route   GET /api/admin/dashboard
exports.getDashboardStats = async (req, res) => {
    try {
        const totalStudents = await User.countDocuments({ role: 'user' });
        const totalExams = await Exam.countDocuments();
        const totalQuestions = await Question.countDocuments();
        const totalAttempts = await Result.countDocuments();

        // Calculate Pass/Fail Stats
        const passFailStats = await Result.aggregate([
            {
                $addFields: {
                    isPass: { $gte: ["$score", { $multiply: ["$totalMarks", 0.4] }] }
                }
            },
            {
                $group: {
                    _id: "$isPass",
                    count: { $sum: 1 }
                }
            }
        ]);

        let passed = 0;
        let failed = 0;
        passFailStats.forEach(stat => {
            if (stat._id === true) passed = stat.count;
            else failed = stat.count;
        });

        const recentUsers = await User.find({ role: 'user' })
            .sort('-createdAt')
            .limit(5)
            .select('name email createdAt');

        sendResponse(res, 200, true, {
            stats: {
                totalStudents,
                totalExams,
                totalQuestions,
                totalAttempts,
                passed,
                failed
            },
            recentUsers
        });
    } catch (err) {
        sendResponse(res, 500, false, null, err.message);
    }
};

// @desc    Add a question to an exam
// @route   POST /api/admin/questions
exports.addQuestion = async (req, res) => {
    try {
        const question = await Question.create(req.body);

        // Notify users about update
        const exam = await Exam.findById(question.examId);
        if (exam) {
             const users = await User.find({ role: 'user', notificationsEnabled: { $ne: false } }).select('_id');
             if (users.length > 0) {
                const notifications = users.map(user => ({
                    userId: user._id,
                    title: 'Exam Updated',
                    message: `New questions added to "${exam.title}".`
                }));
                await Notification.insertMany(notifications);
             }
        }

        sendResponse(res, 201, true, question, 'Question added');
    } catch (err) {
        sendResponse(res, 500, false, null, err.message);
    }
};

// @desc    Bulk upload questions
// @route   POST /api/admin/questions/bulk
exports.bulkUploadQuestions = async (req, res) => {
    try {
        const { questions } = req.body; // Array of question objects
        if (!Array.isArray(questions)) {
            return sendResponse(res, 400, false, null, 'Input must be an array of questions');
        }
        const createdQuestions = await Question.insertMany(questions);
        sendResponse(res, 201, true, createdQuestions, `${createdQuestions.length} questions added`);
    } catch (err) {
        sendResponse(res, 500, false, null, err.message);
    }
};

// @desc    Get all users (students)
// @route   GET /api/admin/users
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ role: 'user' }).select('-password').sort('-createdAt');
        sendResponse(res, 200, true, users);
    } catch (err) {
        sendResponse(res, 500, false, null, err.message);
    }
};

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
exports.deleteUser = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        // Also delete their results to keep DB clean
        await Result.deleteMany({ userId: req.params.id });
        sendResponse(res, 200, true, null, 'User deleted successfully');
    } catch (err) {
        sendResponse(res, 500, false, null, err.message);
    }
};

// @desc    Get specific user results
// @route   GET /api/admin/users/:id/results
exports.getUserResults = async (req, res) => {
    try {
        const results = await Result.find({ userId: req.params.id })
            .populate('examId', 'title totalMarks totalQuestions subject')
            .sort('-submittedAt');
        sendResponse(res, 200, true, results);
    } catch (err) {
        sendResponse(res, 500, false, null, err.message);
    }
};

// @desc    Get detailed student analytics
// @route   GET /api/admin/analytics
exports.getStudentAnalytics = async (req, res) => {
    try {
        const users = await User.find({ role: 'user' }).select('name email');
        const results = await Result.find().populate('examId', 'subject totalMarks');

        const userStats = {};

        // Initialize user stats
        users.forEach(user => {
            userStats[user._id] = {
                id: user._id,
                name: user.name,
                email: user.email,
                totalExams: 0,
                totalScorePct: 0,
                subjects: {}
            };
        });

        // Process results
        results.forEach(result => {
            const userId = result.userId.toString();
            if (!userStats[userId]) return;

            const stats = userStats[userId];
            stats.totalExams++;
            
            const pct = result.totalMarks > 0 ? (result.score / result.totalMarks) * 100 : 0;
            stats.totalScorePct += pct;

            const subject = result.examId?.subject || 'General';
            if (!stats.subjects[subject]) {
                stats.subjects[subject] = { totalPct: 0, count: 0 };
            }
            stats.subjects[subject].totalPct += pct;
            stats.subjects[subject].count++;
        });

        // Finalize stats
        const analytics = Object.values(userStats).map(stat => {
            const avgScore = stat.totalExams > 0 ? Math.round(stat.totalScorePct / stat.totalExams) : 0;
            
            let strongest = { subject: 'N/A', avg: -1 };
            let weakest = { subject: 'N/A', avg: 101 };

            Object.entries(stat.subjects).forEach(([sub, data]) => {
                const subAvg = data.totalPct / data.count;
                if (subAvg > strongest.avg) strongest = { subject: sub, avg: subAvg };
                if (subAvg < weakest.avg) weakest = { subject: sub, avg: subAvg };
            });

            if (strongest.avg === -1) strongest.subject = 'N/A';
            if (weakest.avg === 101) weakest.subject = 'N/A';

            return {
                id: stat.id,
                name: stat.name,
                email: stat.email,
                totalExams: stat.totalExams,
                avgScore,
                strongestSubject: strongest.subject,
                weakestSubject: weakest.subject
            };
        });

        // Sort by Average Score (Best Students First)
        analytics.sort((a, b) => b.avgScore - a.avgScore);

        sendResponse(res, 200, true, analytics);
    } catch (err) {
        sendResponse(res, 500, false, null, err.message);
    }
};