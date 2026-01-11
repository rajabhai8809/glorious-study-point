/**
 * Exam Interface Logic
 * Handles Exam Listing (Dashboard) and Exam Taking Interface.
 */

let currentExamId = null;
let examQuestions = [];
let userAnswers = {};
let allExams = []; // Store for client-side filtering
let examHistory = [];

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const examId = urlParams.get('id');

    if (examId) {
        // Mode: Take Exam
        initExamInterface(examId);
    } else {
        // Mode: List Exams
        initExamDashboard();
    }
});

function initExamInterface(examId) {
    // Show Exam UI, Hide Dashboard
    document.getElementById('dashboard-mode-container')?.classList.add('hidden');
    document.getElementById('exam-navbar')?.classList.add('hidden');
    document.getElementById('exam-mode-container')?.classList.remove('hidden');

    startExamSession(examId);
    
    // Initialize Security
    const overlay = document.getElementById('security-overlay');
    let warnings = 0;

    // 1. Disable Right Click
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
    });

    // 2. Disable Copy/Paste/Cut
    document.addEventListener('copy', (e) => e.preventDefault());
    document.addEventListener('paste', (e) => e.preventDefault());
    document.addEventListener('cut', (e) => e.preventDefault());

    // 3. Tab Switch / Visibility Detection
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            triggerSecurityViolation("Tab Switch Detected");
        }
    });

    // 4. Window Blur Detection (Alt+Tab)
    window.addEventListener('blur', () => {
        triggerSecurityViolation("Window Focus Lost");
    });

    function triggerSecurityViolation(reason) {
        warnings++;
        console.warn(`Security Violation: ${reason}. Warning count: ${warnings}`);
        
        if (overlay) {
            overlay.classList.remove('hidden');
            overlay.classList.add('flex');
        }
    }

    // Global function to resume exam (exposed to window)
    window.resumeExam = function() {
        overlay.classList.add('hidden');
        overlay.classList.remove('flex');
    };
}

// --- Dashboard Logic (Listing & History) ---

async function initExamDashboard() {
    const token = localStorage.getItem('token');
    if (!token) window.location.href = 'login.html';

    // Event Listeners for Filters
    document.getElementById('search-exams').addEventListener('input', filterExams);
    document.getElementById('filter-subject').addEventListener('change', filterExams);

    await loadAvailableExams();
}

async function loadAvailableExams() {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch('http://localhost:5000/api/exams', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (data.success) {
            allExams = data.data;
            renderExams(allExams);
        }
    } catch (error) {
        console.error('Error loading exams:', error);
    }
}

async function loadExamHistory() {
    const token = localStorage.getItem('token');
    const grid = document.getElementById('exams-grid');
    grid.innerHTML = '<div class="col-span-full text-center py-12"><div class="animate-spin inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div></div>';

    try {
        // Assuming endpoint exists based on user controller
        const response = await fetch('http://localhost:5000/api/users/history', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (data.success) {
            examHistory = data.data;
            renderHistory(examHistory);
        }
    } catch (error) {
        console.error('Error loading history:', error);
        grid.innerHTML = '<p class="text-center text-red-500">Failed to load history.</p>';
    }
}

function renderExams(exams) {
    const grid = document.getElementById('exams-grid');
    if (exams.length === 0) {
        grid.innerHTML = '<div class="col-span-full text-center text-slate-500 py-10">No exams found matching your criteria.</div>';
        return;
    }

    grid.innerHTML = exams.map(exam => `
        <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 hover:shadow-md transition-shadow">
            <div class="flex justify-between items-start mb-4">
                <span class="bg-blue-100 dark:bg-blue-900/30 text-primary text-xs font-bold px-2 py-1 rounded uppercase">${exam.subject || 'General'}</span>
                <span class="text-slate-400 text-xs flex items-center gap-1"><i data-lucide="clock" class="w-3 h-3"></i> ${exam.duration}m</span>
            </div>
            <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2">${exam.title}</h3>
            <p class="text-slate-500 dark:text-slate-400 text-sm mb-6 line-clamp-2">${exam.description || 'No description available.'}</p>
            
            <div class="flex items-center justify-between mt-auto">
                <div class="text-sm text-slate-500">
                    <span class="font-bold text-slate-700 dark:text-slate-300">${exam.totalQuestions || 0}</span> Qs
                </div>
                <a href="exam.html?id=${exam._id}" class="btn-primary py-2 px-4 text-sm">Start Exam</a>
            </div>
        </div>
    `).join('');
    lucide.createIcons();
}

function renderHistory(history) {
    const grid = document.getElementById('exams-grid');
    if (history.length === 0) {
        grid.innerHTML = '<div class="col-span-full text-center text-slate-500 py-10">You haven\'t taken any exams yet.</div>';
        return;
    }

    grid.innerHTML = history.map(record => `
        <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 opacity-90">
            <div class="flex justify-between items-start mb-4">
                <span class="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold px-2 py-1 rounded uppercase">Completed</span>
                <span class="text-slate-400 text-xs">${new Date(record.submittedAt).toLocaleDateString()}</span>
            </div>
            <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-1">${record.examId?.title || 'Unknown Exam'}</h3>
            <p class="text-sm text-slate-500 mb-4">Score: <span class="font-bold ${record.score >= (record.totalMarks * 0.4) ? 'text-green-600' : 'text-red-500'}">${record.score}/${record.totalMarks}</span></p>
            
            <a href="result.html?examId=${record.examId?._id}" class="w-full block text-center border border-slate-200 dark:border-slate-700 rounded-lg py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">View Result</a>
        </div>
    `).join('');
}

window.switchTab = function(tab) {
    const btnAvailable = document.getElementById('tab-available');
    const btnHistory = document.getElementById('tab-history');
    
    if (tab === 'available') {
        btnAvailable.classList.replace('text-slate-600', 'text-white');
        btnAvailable.classList.replace('bg-transparent', 'bg-primary'); // Add active styles
        btnAvailable.classList.add('bg-primary', 'text-white');
        btnAvailable.classList.remove('text-slate-600');
        
        btnHistory.classList.remove('bg-primary', 'text-white');
        btnHistory.classList.add('text-slate-600');
        
        renderExams(allExams);
    } else {
        btnHistory.classList.add('bg-primary', 'text-white');
        btnHistory.classList.remove('text-slate-600');
        
        btnAvailable.classList.remove('bg-primary', 'text-white');
        btnAvailable.classList.add('text-slate-600');
        
        loadExamHistory();
    }
};

window.filterExams = function() {
    const search = document.getElementById('search-exams').value.toLowerCase();
    const subject = document.getElementById('filter-subject').value;

    const filtered = allExams.filter(exam => {
        const matchesSearch = exam.title.toLowerCase().includes(search) || (exam.subject && exam.subject.toLowerCase().includes(search));
        const matchesSubject = subject === 'all' || exam.subject === subject;
        return matchesSearch && matchesSubject;
    });

    renderExams(filtered);
};

// --- Exam Taking Logic ---

async function startExamSession(examId) {
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    currentExamId = examId;

    try {
        const response = await fetch(`http://localhost:5000/api/exams/${examId}/start`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (data.success) {
            const { exam, questions } = data.data;
            examQuestions = questions;
            
            // Setup UI
            document.getElementById('exam-title').innerText = exam.title;
            document.getElementById('exam-subject').innerText = exam.subject;
            
            // Start Timer
            startTimer(exam.duration * 60);
            
            // Render Questions
            renderQuestions(questions);
        } else {
            alert(data.message);
            window.location.href = 'dashboard.html';
        }
    } catch (error) {
        console.error('Error starting exam:', error);
    }
}

function startTimer(duration) {
    const timerDisplay = document.getElementById('timer');
    const timerInterval = setInterval(() => {
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        if (--duration < 0) {
            clearInterval(timerInterval);
            alert("Time's up! Submitting exam...");
            submitExam();
        }
    }, 1000);
}

function renderQuestions(questions) {
    const container = document.getElementById('question-container');
    container.innerHTML = questions.map((q, index) => `
        <div class="bg-white dark:bg-slate-950 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-8 mb-6">
            <div class="flex justify-between items-center mb-6">
                <span class="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Question ${index + 1} of ${questions.length}</span>
                <span class="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">+${q.marks} / -${q.negativeMarks}</span>
            </div>
            <div class="prose dark:prose-invert max-w-none mb-8">
                <p class="text-lg md:text-xl font-medium text-slate-800 dark:text-slate-100 leading-relaxed">${q.questionText}</p>
            </div>
            <div class="space-y-3">
                ${q.options.map(opt => `
                    <label class="flex items-center p-4 border-2 border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all">
                        <input type="radio" name="q_${q._id}" value="${opt.id}" class="w-5 h-5 text-primary" onchange="userAnswers['${q._id}'] = ${opt.id}; saveAnswer()">
                        <span class="ml-4 text-slate-700 dark:text-slate-300 font-medium">${opt.text}</span>
                    </label>
                `).join('')}
            </div>
        </div>
    `).join('');
}

// Auto-save simulation
window.saveAnswer = function() {
    const status = document.getElementById('auto-save-status');
    if (status) {
        status.innerHTML = '<i data-lucide="loader-2" class="w-3 h-3 animate-spin"></i> Saving...';
        status.classList.remove('opacity-0');
        
        setTimeout(() => {
            status.innerHTML = '<i data-lucide="cloud-upload" class="w-3 h-3"></i> Answer saved';
            lucide.createIcons();
            setTimeout(() => status.classList.add('opacity-0'), 2000);
        }, 800);
    }
};

window.submitExam = async function() {
    if(!confirm('Are you sure you want to submit?')) return;
    
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`http://localhost:5000/api/exams/${currentExamId}/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ answers: userAnswers })
        });
        const data = await response.json();
        if (data.success) {
            window.location.href = `result.html?examId=${currentExamId}`;
        }
    } catch (error) {
        console.error('Submission error:', error);
    }
};