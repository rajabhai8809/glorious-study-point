const Note = require('../models/Note');
const User = require('../models/User');
const Notification = require('../models/Notification');
const sendResponse = require('../utils/response');

exports.createNote = async (req, res) => {
    try {
        const note = await Note.create(req.body);

        // Send Notification to all users
        const users = await User.find({ role: 'user', notificationsEnabled: { $ne: false } }).select('_id');
        if (users.length > 0) {
            const notifications = users.map(user => ({
                userId: user._id,
                title: 'New Study Material',
                message: `New notes "${note.title}" for ${note.subject} have been uploaded.`
            }));
            await Notification.insertMany(notifications);
        }

        sendResponse(res, 201, true, note, 'Note uploaded successfully');
    } catch (err) {
        sendResponse(res, 500, false, null, err.message);
    }
};

exports.getNotes = async (req, res) => {
    try {
        const { subject, search } = req.query;
        let query = {};

        if (subject && subject !== 'all') {
            query.subject = subject;
        }
        if (search) {
            query.title = { $regex: search, $options: 'i' };
        }

        const notes = await Note.find(query).sort('-createdAt');
        sendResponse(res, 200, true, notes);
    } catch (err) {
        sendResponse(res, 500, false, null, err.message);
    }
};

exports.deleteNote = async (req, res) => {
    try {
        await Note.findByIdAndDelete(req.params.id);
        sendResponse(res, 200, true, null, 'Note deleted');
    } catch (err) {
        sendResponse(res, 500, false, null, err.message);
    }
};

exports.updateNote = async (req, res) => {
    try {
        const note = await Note.findByIdAndUpdate(req.params.id, req.body, { new: true });
        sendResponse(res, 200, true, note, 'Note updated');
    } catch (err) {
        sendResponse(res, 500, false, null, err.message);
    }
};

exports.trackDownload = async (req, res) => {
    try {
        await Note.findByIdAndUpdate(req.params.id, { $inc: { downloads: 1 } });
        sendResponse(res, 200, true, null, 'Download tracked');
    } catch (err) {
        sendResponse(res, 500, false, null, err.message);
    }
};