const fs = require('fs');
const path = require('path');

// Configuration for file moves
const fileMoves = [
    // --- Frontend Assets ---
    { src: 'frontend_result.js', dest: 'assets/js/result.js' },
    { src: 'main.js', dest: 'assets/js/main.js' },
    { src: 'frontend_exam.js', dest: 'assets/js/exam.js' },
    { src: 'assets/js/exams.js', dest: 'assets/js/exams.js' },
    { src: 'dashboard.js', dest: 'assets/js/dashboard.js' },
    { src: 'auth.js', dest: 'assets/js/auth.js' },
    { src: 'admin.js', dest: 'assets/js/admin.js' },
    { src: 'style.css', dest: 'assets/css/style.css' },
    { src: 'frontend/style.css', dest: 'assets/css/style.css' },
    { src: 'src/output.css', dest: 'assets/css/output.css' }, // Handle Tailwind output
    // Ensure output.css is moved if it exists in root
    { src: 'output.css', dest: 'assets/css/output.css' },     // Handle if already in root
    { src: 'logo.svg', dest: 'assets/images/logo.svg' },
    { src: 'frontend/logo.svg', dest: 'assets/images/logo.svg' },
    { src: 'empty-state.json', dest: 'assets/animations/empty-state.json' },

    // --- Move Frontend Pages to Root ---
    { src: 'frontend/index.html', dest: 'index.html' },
    { src: 'frontend/login.html', dest: 'login.html' },
    { src: 'frontend/signup.html', dest: 'signup.html' },
    { src: 'frontend/dashboard.html', dest: 'dashboard.html' },
    { src: 'frontend/exam.html', dest: 'exam.html' },
    { src: 'take-exam.html', dest: 'take-exam.html' },
    { src: 'frontend/result.html', dest: 'result.html' },
    { src: 'frontend/profile.html', dest: 'profile.html' },
    { src: 'frontend/settings.html', dest: 'settings.html' },
    { src: 'frontend/leaderboard.html', dest: 'leaderboard.html' },
    { src: 'frontend/forgot-password.html', dest: 'forgot-password.html' },
    { src: 'frontend/404.html', dest: '404.html' },
    { src: 'frontend/student-notes.html', dest: 'notes.html' },
    { src: 'assets/js/student-notes.html', dest: 'notes.html' },

    // --- Admin Pages ---
    { src: 'frontend/admin/admin-login.html', dest: 'admin/admin-login.html' },
    { src: 'frontend/admin/users.html', dest: 'admin/users.html' },
    { src: 'frontend/admin/questions.html', dest: 'admin/questions.html' },
    { src: 'frontend/admin/admin-dashboard.html', dest: 'admin/admin-dashboard.html' },
    { src: 'frontend/notes.html', dest: 'admin/notes.html' },

    // --- Backend Structure ---
    // Config
    { src: 'db.js', dest: 'backend/src/config/db.js' },
    { src: 'roles.js', dest: 'backend/src/config/roles.js' },
    // Models
    { src: 'User.js', dest: 'backend/src/models/User.js' },
    { src: 'Exam.js', dest: 'backend/src/models/Exam.js' },
    { src: 'Question.js', dest: 'backend/src/models/Question.js' },
    { src: 'Result.js', dest: 'backend/src/models/Result.js' },
    { src: 'Note.js', dest: 'backend/src/models/Note.js' },
    { src: 'Subject.js', dest: 'backend/src/models/Subject.js' },
    { src: 'Leaderboard.js', dest: 'backend/src/models/Leaderboard.js' },
    // Controllers
    { src: 'auth.controller.js', dest: 'backend/src/controllers/auth.controller.js' },
    { src: 'exam.controller.js', dest: 'backend/src/controllers/exam.controller.js' },
    { src: 'admin.controller.js', dest: 'backend/src/controllers/admin.controller.js' },
    { src: 'user.controller.js', dest: 'backend/src/controllers/user.controller.js' },
    { src: 'note.controller.js', dest: 'backend/src/controllers/note.controller.js' },
    { src: 'leaderboard.controller.js', dest: 'backend/src/controllers/leaderboard.controller.js' },
    // Routes
    { src: 'auth.routes.js', dest: 'backend/src/routes/auth.routes.js' },
    { src: 'exam.routes.js', dest: 'backend/src/routes/exam.routes.js' },
    { src: 'admin.routes.js', dest: 'backend/src/routes/admin.routes.js' },
    { src: 'user.routes.js', dest: 'backend/src/routes/user.routes.js' },
    { src: 'note.routes.js', dest: 'backend/src/routes/note.routes.js' },
    { src: 'leaderboard.routes.js', dest: 'backend/src/routes/leaderboard.routes.js' },
    // Middlewares
    { src: 'auth.middleware.js', dest: 'backend/src/middlewares/auth.middleware.js' },
    { src: 'rateLimit.middleware.js', dest: 'backend/src/middlewares/rateLimit.middleware.js' },
    { src: 'error.middleware.js', dest: 'backend/src/middlewares/error.middleware.js' },
    // Utils
    { src: 'jwt.js', dest: 'backend/src/utils/jwt.js' },
    { src: 'response.js', dest: 'backend/src/utils/response.js' },
    // Root Backend Files
    { src: 'server.js', dest: 'backend/src/server.js' },
    { src: 'app.js', dest: 'backend/src/app.js' },
    { src: 'seed.js', dest: 'backend/src/scripts/seed.js' },
    { src: '.env', dest: 'backend/.env' },
    { src: 'package.json', dest: 'backend/package.json' },
    { src: 'package-lock.json', dest: 'backend/package-lock.json' },
    { src: 'nodemon.json', dest: 'backend/nodemon.json' },
    { src: 'Dockerfile', dest: 'backend/Dockerfile' },
    { src: 'setup_structure.js', dest: 'backend/setup_structure.js' }
];

// Directories to ensure exist
const directories = [
    'assets/js',
    'assets/css',
    'assets/images',
    'assets/animations',
    'admin',
    'backend/src/config',
    'backend/src/models',
    'backend/src/controllers',
    'backend/src/routes',
    'backend/src/middlewares',
    'backend/src/utils',
    'backend/src/scripts'
];

// Execution
console.log('🚀 Starting Project Organization...');

// 1. Create Directories
directories.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`   Created directory: ${dir}`);
    }
});

// 2. Move Files
let movedCount = 0;
fileMoves.forEach(move => {
    const oldPath = path.join(__dirname, move.src);
    const newPath = path.join(__dirname, move.dest);

    if (oldPath === newPath) {
        return;
    }

    if (fs.existsSync(oldPath)) {
        // If destination exists, delete it first to avoid errors
        if (fs.existsSync(newPath)) {
            fs.unlinkSync(newPath);
        }
        
        // Ensure destination directory exists (extra safety)
        const destDir = path.dirname(newPath);
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }

        fs.renameSync(oldPath, newPath);
        console.log(`   ✅ Moved: ${move.src} -> ${move.dest}`);
        movedCount++;
    }
});

// 3. Cleanup Empty Directories (Optional)
const dirsToClean = ['src']; // 'src' might be empty after moving output.css
dirsToClean.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (fs.existsSync(dirPath) && fs.readdirSync(dirPath).length === 0) {
        fs.rmdirSync(dirPath);
        console.log(`   🗑️  Removed empty directory: ${dir}`);
    }
});

console.log(`\n✨ Organization Complete! Moved ${movedCount} files.`);
console.log('👉 Next Step: Run "npm install" inside the "backend" folder.');