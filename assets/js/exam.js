/**
 * Exam Interface Logic
 * Handles Exam Listing (Dashboard) and Exam Taking Interface.
 */

let currentExamId = null;
let examQuestions = [];
let userAnswers = {};
let allExams = []; // Store for client-side filtering
let examHistory = [];
let currentLanguage = 'en'; // Default language

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
    document.getElementById('mobile-bottom-nav')?.classList.add('hidden');
    document.getElementById('exam-mode-container')?.classList.remove('hidden');

    // Show Instructions Modal
    const modal = document.getElementById('instructions-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        modal.style.zIndex = '100'; // Force high z-index via JS as backup
    } else {
        // Fallback if modal missing
        startExamSession(examId);
        initializeSecurity();
    }
}

window.startExamAfterInstructions = function() {
    const modal = document.getElementById('instructions-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
    
    // Request Fullscreen
    if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(e => console.log(e));
    }

    const urlParams = new URLSearchParams(window.location.search);
    const examId = urlParams.get('id');
    
    if (!examId) {
        showToast('Exam ID is missing. Returning to dashboard.', 'error');
        window.location.href = 'dashboard.html';
        return;
    }
    
    // Get Selected Language
    const langInput = document.querySelector('input[name="exam-lang"]:checked');
    currentLanguage = langInput ? langInput.value : 'en';

    startExamSession(examId);
    initializeSecurity();
};

function initializeSecurity() {
    // 1. Disable Right Click
    document.addEventListener('contextmenu', (e) => { e.preventDefault(); return false; });

    // 2. Disable Copy/Paste
    document.addEventListener('copy', (e) => e.preventDefault());
    document.addEventListener('paste', (e) => e.preventDefault());
    document.addEventListener('cut', (e) => e.preventDefault());

    // 3. Strict Auto-Submit on Visibility Change (Minimize/Tab Switch)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            handleSecurityViolation("Tab Switch / Minimize Detected");
        }
    });

    // 4. Strict Auto-Submit on Blur (Focus Lost)
    window.addEventListener('blur', () => {
        handleSecurityViolation("Window Focus Lost");
    });
    
    // 5. Prevent Back Button
    history.pushState(null, null, location.href);
    window.onpopstate = function () {
        history.go(1);
        handleSecurityViolation("Back Button Pressed");
    };

    // 6. Detect Fullscreen Exit
    document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement) {
            handleSecurityViolation("Exited Fullscreen");
        }
    });
}

function handleSecurityViolation(reason) {
    // Using toast instead of alert for better UX
    console.warn(`Security Violation: ${reason}. Auto-submitting...`);
    // Force submit without confirmation
    submitExam(true);
}

// --- Dashboard Logic (Listing & History) ---

async function initExamDashboard() {
    const token = localStorage.getItem('token');
    if (!token) window.location.href = 'login.html';

    // Ensure UI is in Dashboard Mode
    document.getElementById('dashboard-mode-container')?.classList.remove('hidden');
    document.getElementById('exam-navbar')?.classList.remove('hidden');
    document.getElementById('mobile-bottom-nav')?.classList.remove('hidden');
    document.getElementById('exam-mode-container')?.classList.add('hidden');

    // Event Listeners for Filters
    document.getElementById('search-exams').addEventListener('input', filterExams);
    document.getElementById('filter-subject').addEventListener('change', filterExams);
    document.getElementById('filter-class').addEventListener('change', filterExams);

    await loadAvailableExams();
}

async function loadAvailableExams() {
    const token = localStorage.getItem('token');
    const grid = document.getElementById('exams-grid');

    try {
        // 1. Fetch All Exams
        const examsResponse = await fetch('http://localhost:5000/api/exams', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const examsData = await examsResponse.json();
        
        // 2. Fetch User History to filter out taken exams
        const historyResponse = await fetch('http://localhost:5000/api/users/history', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const historyData = await historyResponse.json();

        if (examsData.success) {
            let exams = examsData.data;
            if (historyData.success) {
                const takenExamIds = new Set(historyData.data.map(record => record.examId?._id));
                exams = exams.filter(exam => !takenExamIds.has(exam._id));
            }
            allExams = exams;
            renderExams(allExams);
        } else {
            if (examsData.message === 'User not found') {
                localStorage.removeItem('token');
                window.location.href = 'login.html';
                return;
            }
            grid.innerHTML = `<div class="col-span-full text-center text-red-500 py-10">${examsData.message || 'Failed to load exams.'}</div>`;
        }
    } catch (error) {
        console.error('Error loading exams:', error);
        grid.innerHTML = '<div class="col-span-full text-center text-red-500 py-10">Error connecting to server.</div>';
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
        } else {
            grid.innerHTML = `<p class="text-center text-red-500">${data.message || 'Failed to load history.'}</p>`;
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
                <span class="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-bold px-2 py-1 rounded">Class ${exam.studentClass || 'N/A'}</span>
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

    grid.innerHTML = history.map(record => {
        const totalQs = record.examId?.totalQuestions || record.answers?.length || 0;
        const totalMarks = record.totalMarks || 0;
        const score = record.score || 0;
        const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;
        const isPass = percentage >= 40;
        const skipped = record.skippedAnswers !== undefined ? record.skippedAnswers : (totalQs - ((record.correctAnswers||0) + (record.wrongAnswers||0)));

        return `
        <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 opacity-90">
            <div class="flex justify-between items-start mb-4">
                <span class="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold px-2 py-1 rounded uppercase">Completed</span>
                <span class="text-slate-400 text-xs">${new Date(record.submittedAt).toLocaleDateString()}</span>
            </div>
            <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-1">${record.examId?.title || 'Unknown Exam'}</h3>
            <p class="text-sm text-slate-500 mb-2">Score: <span class="font-bold ${isPass ? 'text-green-600' : 'text-red-500'}">${score}/${totalMarks} (${percentage}%)</span></p>
            <div class="flex gap-3 text-xs text-slate-500 mb-4">
                <span class="flex items-center gap-1"><i data-lucide="check-circle" class="w-3 h-3 text-green-500"></i> ${record.correctAnswers || 0}</span>
                <span class="flex items-center gap-1"><i data-lucide="x-circle" class="w-3 h-3 text-red-500"></i> ${record.wrongAnswers || 0}</span>
                <span class="flex items-center gap-1"><i data-lucide="minus-circle" class="w-3 h-3 text-slate-400"></i> ${skipped}</span>
            </div>
            
            <div class="flex gap-2">
                ${record.examId?._id ? `<a href="result.html?examId=${record.examId._id}" class="flex-1 block text-center border border-slate-200 dark:border-slate-700 rounded-lg py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">View Result</a>` : '<button disabled class="flex-1 block text-center border border-slate-200 dark:border-slate-700 rounded-lg py-2 text-sm font-medium text-slate-400 cursor-not-allowed">Exam Deleted</button>'}
                <button onclick="deleteHistory('${record._id}')" class="px-3 py-2 border border-red-200 dark:border-red-900/30 text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Delete Record"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            </div>
        </div>
    `}).join('');
    lucide.createIcons();
}

window.deleteHistory = async function(resultId) {
    if (!confirm('Are you sure you want to delete this exam record? This cannot be undone.')) return;

    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`http://localhost:5000/api/users/history/${resultId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (data.success) {
            loadExamHistory(); // Reload history list
        } else {
            alert(data.message || 'Failed to delete record');
        }
    } catch (error) {
        console.error('Error deleting history:', error);
        alert('Server error');
    }
};

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
    const studentClass = document.getElementById('filter-class').value;

    const filtered = allExams.filter(exam => {
        const matchesSearch = exam.title.toLowerCase().includes(search) || (exam.subject && exam.subject.toLowerCase().includes(search));
        const matchesSubject = subject === 'all' || exam.subject === subject;
        const matchesClass = studentClass === 'all' || (exam.studentClass && exam.studentClass.toString() === studentClass);
        return matchesSearch && matchesSubject && matchesClass;
    });

    renderExams(filtered);
};

// --- Exam Taking Logic ---

async function startExamSession(examId) {
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.href = 'login.html'; // No toast needed, redirecting
        return;
    }

    currentExamId = examId;

    // Update UI to show loading state
    document.getElementById('exam-title').innerText = 'Loading Exam...';
    document.getElementById('exam-subject').innerText = 'Please wait...';

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
            if (data.message === 'User not found') {
                showToast('Session expired. Please login again.', 'error');
                localStorage.removeItem('token');
                window.location.href = 'login.html';
                return;
            }
            showToast(data.message, 'error');
            window.location.href = 'exam.html';
        }
    } catch (error) {
        console.error('Error starting exam:', error);
        showToast('Failed to load exam. Please check your connection.', 'error');
        window.location.href = 'dashboard.html';
    }
}

function startTimer(duration) {
    const timerDisplay = document.getElementById('timer');
    let timerInterval;

    const updateTimer = () => {
        const hours = Math.floor(duration / 3600);
        const minutes = Math.floor((duration % 3600) / 60);
        const seconds = duration % 60;
        
        if (hours > 0) {
            timerDisplay.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
            timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }

        if (duration <= 0) {
            clearInterval(timerInterval);
            showToast("Time's up! Submitting exam...", 'warning');
            submitExam();
        }
        duration--;
    };

    updateTimer();
    timerInterval = setInterval(updateTimer, 1000);
}

function renderQuestions(questions) {
    const container = document.getElementById('question-container');
    container.innerHTML = questions.map((q, index) => `
        <div class="bg-white dark:bg-slate-950 rounded-xl md:rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 md:p-8 mb-4 md:mb-6">
            <div class="flex justify-between items-center mb-4 md:mb-6">
                <span class="text-xs md:text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Question ${index + 1} of ${questions.length}</span>
                <span class="text-[10px] md:text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">+${q.marks} / -${q.negativeMarks}</span>
            </div>
            <div class="prose dark:prose-invert max-w-none mb-6">
                <p class="text-base md:text-xl font-medium text-slate-800 dark:text-slate-100 leading-relaxed">
                    ${currentLanguage === 'hi' && q.questionTextHindi ? q.questionTextHindi : q.questionText}
                </p>
            </div>
            <div class="space-y-3 input-area">
                ${q.type === 'numeric' ? `
                    <div class="relative">
                        <input type="number" step="any" class="w-full p-3 md:p-4 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-transparent text-base md:text-lg focus:border-primary focus:outline-none dark:text-white" 
                        placeholder="Enter answer"
                        onchange="userAnswers['${q._id}'] = this.value; saveAnswer()">
                    </div>
                ` : `
                    ${q.options.map(opt => `
                        <label class="flex items-center p-3 md:p-4 border-2 border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all active:scale-[0.99]">
                            <input type="radio" name="q_${q._id}" value="${opt.id}" class="w-4 h-4 md:w-5 md:h-5 text-primary" onchange="userAnswers['${q._id}'] = ${opt.id}; saveAnswer()">
                            <span class="ml-3 md:ml-4 text-sm md:text-base text-slate-700 dark:text-slate-300 font-medium">
                                ${currentLanguage === 'hi' && opt.textHindi ? opt.textHindi : opt.text}
                            </span>
                        </label>
                    `).join('')}
                `}
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

window.submitExam = async function(force = false) {
    if (!force) {
        showConfirm('Are you sure you want to submit the exam?', () => {
            processSubmission();
        });
        return;
    }
    
    processSubmission();
};

async function processSubmission() {
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

window.toggleQuestionPalette = function() {
    const sidebar = document.querySelector('aside');
    if (sidebar) {
        sidebar.classList.toggle('hidden');
        sidebar.classList.toggle('fixed');
        sidebar.classList.toggle('inset-0');
        sidebar.classList.toggle('z-50');
    }
};