const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Subject = require('../models/Subject');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const User = require('../models/User');

dotenv.config({ path: path.join(__dirname, '../../.env') });

mongoose.connect(process.env.MONGO_URI);

const seedData = async () => {
    try {
        // Clear DB
        await Subject.deleteMany();
        await Exam.deleteMany();
        await Question.deleteMany();
        await User.deleteMany();

        console.log('Data Destroyed...');

        // Create Subjects
        const physics = await Subject.create({ name: 'Physics', description: 'Physics for Class 12' });
        const math = await Subject.create({ name: 'Math', description: 'Mathematics for Class 12' });

        // Create Exam
        const exam = await Exam.create({
            title: 'Thermodynamics Test',
            description: 'A comprehensive test covering the laws of thermodynamics, entropy, and heat transfer.',
            subject: 'Physics',
            duration: 45,
            totalMarks: 2, // 2 Questions * 1 Mark
            totalQuestions: 2
        });

        // Create Questions
        await Question.create([
            {
                examId: exam._id,
                questionText: 'Which law states energy cannot be created or destroyed?',
                options: [{id: 0, text: 'Zeroth'}, {id: 1, text: 'First'}, {id: 2, text: 'Second'}, {id: 3, text: 'Third'}],
                correctOption: 1,
                difficulty: 'Easy',
                marks: 1
            },
            {
                examId: exam._id,
                questionText: 'Entropy of a perfect crystal at absolute zero is?',
                options: [{id: 0, text: 'Zero'}, {id: 1, text: 'Infinite'}, {id: 2, text: 'One'}, {id: 3, text: 'Negative'}],
                correctOption: 0,
                difficulty: 'Medium',
                marks: 1
            }
        ]);

        // Create Admin User
        await User.create({
            name: 'Super Admin',
            email: 'tauseef.nucon@gmail.com',
            password: 'tauseefalam9906', // Password for login
            role: 'admin'
        });

        console.log('Data Imported!');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedData();