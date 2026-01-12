const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Import Models
const User = require('../models/User');
const Result = require('../models/Result');
const Exam = require('../models/Exam');

const seedLeaderboard = async () => {
    try {
        console.log('Connecting to MongoDB...');
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri || mongoUri.includes('<db_password>')) {
            throw new Error('MONGO_URI is invalid or contains <db_password>. Please check backend/.env');
        }
        console.log(`Target DB: ${mongoUri.includes('localhost') ? 'Localhost' : 'MongoDB Atlas (Cloud)'}`);
        await mongoose.connect(mongoUri);
        console.log('Connected!');

        // 1. Define Demo Users
        const demoUsers = [
            { name: 'Aarav Patel', email: 'aarav.p@example.com', score: 49, correct: 49 },
            { name: 'Zara Khan', email: 'zarak@example.com', score: 48, correct: 48 },
            { name: 'Ishaan Gupta', email: 'ishaan.g@example.com', score: 47, correct: 47 },
            { name: 'Vihaan Sharma', email: 'vihaan.s@example.com', score: 45, correct: 45 },
            { name: 'Aditya Verma', email: 'aditya.v@example.com', score: 44, correct: 44 },
            { name: 'Sanya Iyer', email: 'sanya.i@example.com', score: 42, correct: 42 },
            { name: 'Reyansh Kumar', email: 'reyansh.k@example.com', score: 40, correct: 40 },
            { name: 'Myra Singh', email: 'myra.s@example.com', score: 38, correct: 38 },
            { name: 'Kabir Das', email: 'kabir.d@example.com', score: 35, correct: 35 },
            { name: 'Anaya Malhotra', email: 'anaya.m@example.com', score: 30, correct: 30 },
            { name: 'Rohan Sharma', email: 'rohan.s@example.com', score: 25, correct: 25 },
            { name: 'Demo User', email: 'demo.user@example.com', score: 20, correct: 20 }
        ];

        // --- Create Admin User (For Admin Panel Access) ---
        const adminEmail = 'tauseef.nucon786@gmail.com';
        let admin = await User.findOne({ email: adminEmail });
        if (!admin) {
            await User.create({
                name: 'Super Admin',
                email: adminEmail,
                password: 'tauseefalam9906', // Default password for admin
                role: 'admin',
                studentClass: '12',
                stream: 'Science'
            });
            console.log('✅ Admin User Created: tauseef.nucon786@gmail.com / tauseefalam9906');
        } else {
            console.log('ℹ️ Admin user already exists.');
        }

        // 2. Create Users and Results
        console.log('Seeding users and results...');
        
        // Create Exams for different subjects
        const subjects = ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'English', 'Computer Science'];
        const exams = [];

        // Clear existing results for clean slate
        await Result.deleteMany({});
        console.log('🗑️  Cleared old results.');
        
        for (const sub of subjects) {
            // Create or find exam for this subject
            let exam = await Exam.findOne({ title: `${sub} Mock Test` });
            if (!exam) {
                exam = await Exam.create({
                title: `${sub} Mock Test`,
                subject: sub,
                description: `Practice test for ${sub}`,
                duration: 60,
                totalQuestions: 50,
                totalMarks: 50,
                isActive: true
            });
            }
            exams.push(exam);
        }

        for (const u of demoUsers) {
            // Find or Create User
            let user = await User.findOne({ email: u.email });
            if (!user) {
                user = await User.create({
                    name: u.name,
                    email: u.email,
                    password: 'password123', // Default password
                    role: 'user',
                    studentClass: '12',
                    stream: 'Science'
                });
            }

            // Assign results for 3 random exams per user
            const shuffledExams = exams.sort(() => 0.5 - Math.random()).slice(0, 3);
            
            let resultsAdded = 0;
            for (const exam of shuffledExams) {
                // Randomize score slightly around the user's base score
                const score = Math.max(0, Math.min(50, u.score + Math.floor(Math.random() * 5) - 2));
                
                await Result.create({
                    userId: user._id,
                    examId: exam._id,
                    score: score,
                    totalMarks: 50,
                    correctAnswers: score,
                    wrongAnswers: 50 - score,
                    skippedAnswers: 0,
                    answers: [],
                    submittedAt: new Date() // Today
                });
                resultsAdded++;
            }
            console.log(`✅ Added ${resultsAdded} results for ${u.name}`);
        }

        console.log('✅ Leaderboard seeded successfully!');
        process.exit(0);
    } catch (error) {
        if (error.codeName === 'AtlasError' || error.message.includes('authentication failed')) {
            console.error('\n❌ Authentication Failed: MongoDB Atlas password incorrect.');
            console.error('👉 Please update "MONGO_URI" in "backend/.env" with your new password.');
            console.error('   Note: If your password has special characters (@, :, /), use URL encoding (e.g., @ -> %40).');
        } else {
            console.error('❌ Error seeding data:', error);
        }
        process.exit(1);
    }
};

seedLeaderboard();