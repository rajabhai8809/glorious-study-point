const User = require('../models/User');
const Exam = require('../models/Exam');
const Result = require('../models/Result');
const Notification = require('../models/Notification');
const sendResponse = require('../utils/response');

exports.getDashboard = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // 1. Get all active exams
        const allExams = await Exam.find({ isActive: true }).sort('-createdAt');

        // 2. Get user's results
        const userResults = await Result.find({ userId }).populate('examId', 'title subject duration totalQuestions');

        // 3. Separate Pending and Completed
        const takenExamIds = new Set();
        userResults.forEach(r => {
            if (r && r.examId && r.examId._id) {
                takenExamIds.add(r.examId._id.toString());
            }
        });
        
        const pendingExams = allExams.filter(e => !takenExamIds.has(e._id.toString()));
        const completedExams = userResults.map(r => r); // Already populated

        // Calculate stats
        const totalExams = await Result.countDocuments({ userId });
        
        // Calculate average score
        const results = await Result.find({ userId });
        const totalScore = results.reduce((acc, curr) => acc + curr.score, 0);
        const avgScore = totalExams > 0 ? (totalScore / totalExams).toFixed(1) : 0;

        // --- NEW ANALYTICS FEATURES ---

        // 1. Subject-wise Performance
        const subjectStats = {};
        userResults.forEach(r => {
            if (!r) return;
            const sub = r.examId?.subject || 'General';
            if (!subjectStats[sub]) subjectStats[sub] = { total: 0, count: 0 };
            const pct = r.totalMarks > 0 ? (r.score / r.totalMarks) * 100 : 0;
            subjectStats[sub].total += pct;
            subjectStats[sub].count++;
        });
        const subjectPerformance = Object.keys(subjectStats).map(sub => ({
            subject: sub,
            average: Math.round(subjectStats[sub].total / subjectStats[sub].count)
        }));

        // 2. Recommendations (Suggest exams for weakest subjects)
        const weakSubjects = subjectPerformance.sort((a, b) => a.average - b.average).map(s => s.subject);
        let recommendations = [];
        if (weakSubjects.length > 0) {
            recommendations = pendingExams.filter(e => e.subject === weakSubjects[0]).slice(0, 2);
        }
        // Fallback: Suggest latest pending exams
        if (recommendations.length === 0 && pendingExams.length > 0) {
            recommendations = pendingExams.slice(0, 2);
        }

        // 3. Weekly Progress (Exams taken in last 7 days)
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const examsThisWeek = userResults.filter(r => new Date(r.submittedAt) > oneWeekAgo).length;
        const weeklyGoal = 5; // Static goal for now

        // 4. Badges (Gamification)
        const badges = [];
        if (userResults.length >= 1) badges.push({ icon: 'award', name: 'First Step', color: 'blue', desc: 'Completed 1st Exam' });
        if (userResults.length >= 5) badges.push({ icon: 'star', name: 'Dedicated', color: 'yellow', desc: 'Completed 5 Exams' });
        if (userResults.some(r => (r.score / r.totalMarks) >= 0.9)) badges.push({ icon: 'zap', name: 'High Flyer', color: 'purple', desc: 'Scored 90%+' });
        if (examsThisWeek >= weeklyGoal) badges.push({ icon: 'flame', name: 'On Fire', color: 'red', desc: 'Hit Weekly Goal' });

        sendResponse(res, 200, true, {
            pendingExams,
            completedExams,
            stats: {
                totalExams,
                avgScore
            },
            analytics: {
                subjectPerformance,
                weeklyProgress: { current: examsThisWeek, target: weeklyGoal },
                recommendations,
                badges
            }
        });
    } catch (err) {
        sendResponse(res, 500, false, null, err.message);
    }
};

exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.user.id })
            .sort('-createdAt')
            .limit(20);
        sendResponse(res, 200, true, notifications);
    } catch (err) {
        sendResponse(res, 500, false, null, err.message);
    }
};

exports.markNotificationsRead = async (req, res) => {
    try {
        await Notification.updateMany({ userId: req.user.id, isRead: false }, { isRead: true });
        sendResponse(res, 200, true, null, 'Notifications marked as read');
    } catch (err) {
        sendResponse(res, 500, false, null, err.message);
    }
};

exports.toggleNotificationSettings = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        user.notificationsEnabled = !user.notificationsEnabled;
        await user.save();
        
        sendResponse(res, 200, true, { enabled: user.notificationsEnabled }, 'Settings updated');
    } catch (err) {
        sendResponse(res, 500, false, null, err.message);
    }
};

exports.getResultDetails = async (req, res) => {
    try {
        const { examId } = req.params;
        const userId = req.user.id;

        const result = await Result.findOne({ userId, examId })
            .populate('examId', 'title subject')
            .populate('answers.questionId', 'questionText options correctOption type');

        if (!result) return sendResponse(res, 404, false, null, 'Result not found');

        sendResponse(res, 200, true, result);
    } catch (err) {
        sendResponse(res, 500, false, null, err.message);
    }
};

exports.getExamHistory = async (req, res) => {
    try {
        const results = await Result.find({ userId: req.user.id })
            .populate('examId', 'title subject totalMarks duration totalQuestions')
            .sort('-submittedAt');
        sendResponse(res, 200, true, results);
    } catch (err) {
        sendResponse(res, 500, false, null, err.message);
    }
};

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return sendResponse(res, 404, false, null, 'User not found');
        }
        sendResponse(res, 200, true, user);
    } catch (err) {
        sendResponse(res, 500, false, null, err.message);
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { name, studentClass, stream, profileImage, bio } = req.body;
        const fieldsToUpdate = {};
        
        if (name) fieldsToUpdate.name = name;
        if (studentClass) fieldsToUpdate.studentClass = studentClass;
        if (stream) fieldsToUpdate.stream = stream;
        if (profileImage) fieldsToUpdate.profileImage = profileImage;
        if (bio) fieldsToUpdate.bio = bio;

        const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
            new: true,
            runValidators: true
        });
        if (!user) {
            return sendResponse(res, 404, false, null, 'User not found');
        }
        sendResponse(res, 200, true, user, 'Profile updated successfully');
    } catch (err) {
        sendResponse(res, 500, false, null, err.message);
    }
};

exports.deleteExamResult = async (req, res) => {
    try {
        const result = await Result.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!result) return sendResponse(res, 404, false, null, 'Result not found');

        sendResponse(res, 200, true, null, 'Result deleted successfully');
    } catch (err) {
        sendResponse(res, 500, false, null, err.message);
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id).select('+password');

        if (!await user.matchPassword(currentPassword)) {
            return sendResponse(res, 400, false, null, 'Incorrect current password');
        }

        user.password = newPassword;
        await user.save();

        sendResponse(res, 200, true, null, 'Password updated successfully');
    } catch (err) {
        sendResponse(res, 500, false, null, err.message);
    }
};

exports.deleteNotification = async (req, res) => {
    try {
        await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        sendResponse(res, 200, true, null, 'Notification deleted');
    } catch (err) {
        sendResponse(res, 500, false, null, err.message);
    }
};

exports.deleteAllNotifications = async (req, res) => {
    try {
        await Notification.deleteMany({ userId: req.user.id });
        sendResponse(res, 200, true, null, 'All notifications cleared');
    } catch (err) {
        sendResponse(res, 500, false, null, err.message);
    }
};