const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const sendResponse = require('../utils/response');

// @desc    Register user
// @route   POST /api/auth/register
exports.register = async (req, res) => {
    try {
        const { name, email, password, role, studentClass, stream } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return sendResponse(res, 400, false, null, 'User already exists');
        }

        // Create user
        const user = await User.create({
            name,
            email,
            password,
            role: role || 'user', // Default to user if not specified
            studentClass,
            stream
        });

        const token = generateToken(user._id, user.role);

        sendResponse(res, 201, true, { token, user: { id: user._id, name: user.name, email: user.email, role: user.role, studentClass: user.studentClass, stream: user.stream } }, 'User registered successfully');
    } catch (err) {
        sendResponse(res, 500, false, null, err.message);
    }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate email & password
        if (!email || !password) {
            return sendResponse(res, 400, false, null, 'Please provide an email and password');
        }

        // Check for user
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return sendResponse(res, 401, false, null, 'Invalid credentials');
        }

        // Check if password matches
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return sendResponse(res, 401, false, null, 'Invalid credentials');
        }

        const token = generateToken(user._id, user.role);

        sendResponse(res, 200, true, { token, user: { id: user._id, name: user.name, email: user.email, role: user.role } }, 'Login successful');
    } catch (err) {
        sendResponse(res, 500, false, null, err.message);
    }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user) {
        return sendResponse(res, 404, false, null, 'User not found');
    }
    sendResponse(res, 200, true, user);
};