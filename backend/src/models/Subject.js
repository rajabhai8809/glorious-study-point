const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: String,
    isActive: {
        type: Boolean,
        default: true
    }
});

module.exports = mongoose.model('Subject', SubjectSchema);