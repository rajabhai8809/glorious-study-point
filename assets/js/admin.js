/**
 * Admin Panel Logic
 * Handles admin-specific interactions.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Security Check: Ensure user is Admin
    const token = localStorage.getItem('adminToken');
    const user = JSON.parse(localStorage.getItem('adminUser') || '{}');

    if (!token || user.role !== 'admin') {
        window.location.href = 'admin-login.html';
        return;
    }

    // Initialize delete buttons
    const deleteBtns = document.querySelectorAll('button i[data-lucide="trash-2"]');
    
    deleteBtns.forEach(btn => {
        btn.closest('button').addEventListener('click', function() {
            showConfirm('Are you sure you want to delete this item?', () => {
                const row = this.closest('tr');
                row.style.opacity = '0';
                setTimeout(() => row.remove(), 300);
            });
        });
    });

    // Load Dashboard Stats if on dashboard page
    if (document.getElementById('stat-students')) {
        loadDashboardStats();
    }

    // Load Notes if on notes page
    if (document.getElementById('admin-notes-table')) {
        loadAdminNotes();
    }

    // Load Exams if on exams page
    if (document.getElementById('admin-exams-table')) {
        loadAdminExams();
    }

    // Load Users if on users page
    if (document.getElementById('admin-users-table')) {
        loadAdminUsers();
    }

    // Load Analytics if on analytics page
    if (document.getElementById('analytics-table')) {
        loadAnalytics();
    }

    // --- Dynamic Form Injection for Upload Modal ---
    const subjectSelect = document.getElementById('exam-subject');
    if (subjectSelect) {
        // 1. Populate Subjects
        const subjects = ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'English', 'Hindi', 'Computer Science', 'History', 'Geography', 'Economics'];
        subjectSelect.innerHTML = '<option value="">Select Subject</option>' + 
            subjects.map(s => `<option value="${s}">${s}</option>`).join('');

        // 2. Inject Class Dropdown if missing
        if (!document.getElementById('exam-class')) {
            const classWrapper = document.createElement('div');
            classWrapper.className = "space-y-2 mt-4";
            classWrapper.innerHTML = `
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Class</label>
                <div class="relative">
                    <select id="exam-class" class="w-full pl-3 pr-10 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 dark:text-white appearance-none">
                        <option value="11">Class 11</option>
                        <option value="12" selected>Class 12</option>
                    </select>
                </div>
            `;
            subjectSelect.closest('div').after(classWrapper);
        }

        // 3. Inject Title Input if missing
        if (!document.getElementById('exam-title-input')) {
            const titleWrapper = document.createElement('div');
            titleWrapper.className = "space-y-2 mb-4";
            titleWrapper.innerHTML = `
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Exam Title</label>
                <div class="relative">
                    <input type="text" id="exam-title-input" placeholder="Enter exam title (Optional)" class="w-full pl-3 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 dark:text-white">
                </div>
                <p class="text-xs text-slate-500">If empty, title from HTML file will be used.</p>
            `;
            subjectSelect.closest('div').before(titleWrapper);
        }
    }
});

async function loadDashboardStats() {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = 'admin-login.html';
        return;
    }

    try {
        const response = await fetch('/api/admin/dashboard', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (data.success) {
            // Update Stats
            document.getElementById('stat-students').innerText = data.data.stats.totalStudents;
            document.getElementById('stat-exams').innerText = data.data.stats.totalExams;
            document.getElementById('stat-questions').innerText = data.data.stats.totalQuestions;
            document.getElementById('stat-attempts').innerText = data.data.stats.totalAttempts;

            // Render Pass/Fail Chart
            if (typeof Chart !== 'undefined') {
                renderPassFailChart(data.data.stats.passed, data.data.stats.failed);
            }

            // Update Recent Users Table
            const tbody = document.getElementById('recent-users-table');
            tbody.innerHTML = data.data.recentUsers.map(user => `
                <tr class="border-b border-slate-50 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td class="py-3 font-medium text-slate-900 dark:text-white">${user.name}</td>
                    <td class="py-3 text-slate-500 dark:text-slate-400">${user.email}</td>
                    <td class="py-3 text-slate-500 dark:text-slate-400">${new Date(user.createdAt).toLocaleDateString()}</td>
                    <td class="py-3"><span class="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded text-xs font-bold">Active</span></td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading admin stats:', error);
    }
}

let passFailChartInstance = null;

function renderPassFailChart(passed, failed) {
    const ctx = document.getElementById('passFailChart');
    if (!ctx) return;

    if (passFailChartInstance) {
        passFailChartInstance.destroy();
    }

    passFailChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Passed', 'Failed'],
            datasets: [{
                data: [passed, failed],
                backgroundColor: ['#22C55E', '#EF4444'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { usePointStyle: true, padding: 20 }
                }
            },
            cutout: '70%'
        }
    });
}

// Modal Functions
window.openAddQuestionModal = function() {
    const modal = document.getElementById('add-question-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        loadExamsForDropdown();
    }
};

window.closeAddQuestionModal = function() {
    const modal = document.getElementById('add-question-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
};

// Load Exams for Dropdown
async function loadExamsForDropdown() {
    const token = localStorage.getItem('adminToken');
    const select = document.getElementById('question-exam');
    if (!select) return;
    
    try {
        const response = await fetch('/api/exams', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (data.success) {
            select.innerHTML = '<option value="">Select Exam</option>' + 
                data.data.map(exam => `<option value="${exam._id}">${exam.title}</option>`).join('');
        }
    } catch (error) {
        console.error('Error loading exams:', error);
    }
}

// Handle Add Question
window.handleAddQuestion = async function(e) {
    e.preventDefault();
    const token = localStorage.getItem('adminToken');
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerText;
    
    btn.disabled = true;
    btn.innerText = 'Saving...';

    const examId = document.getElementById('question-exam').value;
    const questionText = document.getElementById('question-text').value;
    const marks = document.getElementById('question-marks').value;
    const difficulty = document.getElementById('question-difficulty').value;
    const correctOption = document.getElementById('question-correct').value;
    
    const options = Array.from(document.querySelectorAll('.option-input')).map((input, index) => ({
        id: index,
        text: input.value
    }));

    try {
        const response = await fetch('/api/admin/questions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                examId,
                questionText,
                options,
                correctOption: parseInt(correctOption),
                marks: parseInt(marks),
                difficulty
            })
        });

        const data = await response.json();

        if (data.success) {
            showToast('Question added successfully!', 'success');
            closeAddQuestionModal();
            e.target.reset();
        } else {
            showToast(data.message || 'Failed to add question', 'error');
        }
    } catch (error) {
        console.error('Error adding question:', error);
        showToast('Server error', 'error');
    } finally {
        btn.disabled = false;
        btn.innerText = originalText;
    }
};

// Handle Exam HTML Upload
window.handleExamUpload = async function(e) {
    e.preventDefault();
    const token = localStorage.getItem('adminToken');
    const fileInput = document.getElementById('exam-file');
    const file = fileInput.files[0];
    
    if (!file) {
        showToast("Please select an HTML file first.", 'warning');
        return;
    }

    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span> Processing...';
    btn.disabled = true;

    try {
        const text = await file.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');

        // 1. Extract Exam Details
        const manualTitle = document.getElementById('exam-title-input')?.value;
        const title = manualTitle || doc.querySelector('title')?.innerText || 'Untitled Exam';
        const subject = document.getElementById('exam-subject').value;
        const studentClass = document.getElementById('exam-class')?.value || '12'; // Default to 12 if input missing
        const duration = document.getElementById('exam-duration').value;
        const description = document.getElementById('exam-description').value;

        // 2. Extract Questions
        const questionElements = doc.querySelectorAll('.question');
        const questions = [];
        const optionMap = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
        let totalMarks = 0;

        questionElements.forEach(qEl => {
            const type = qEl.dataset.type || 'mcq';
            const marks = 1; // Force 1 mark per question
            totalMarks += 1; // Total Marks = Total Questions
            
            // Extract English and Hindi Text
            const qTextEl = qEl.querySelector('.q-text');
            let textEn = '';
            let textHi = '';

            if (qTextEl) {
                // Get English (First text node)
                for (let node of qTextEl.childNodes) {
                    if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
                        textEn = node.textContent.trim().replace(/^\d+[\.\)]\s+/, '');
                        break;
                    }
                }
                // Get Hindi
                const hindiSpan = qTextEl.querySelector('.q-hindi');
                if (hindiSpan) textHi = hindiSpan.innerText.trim().replace(/^\d+[\.\)]\s+/, '');
            }

            // Extract correct answer from hidden input value
            const correctAnswerRaw = qEl.querySelector('.correct-answer')?.value;

            let options = [];
            let correctOption = null;

            if (type === 'numeric') {
                correctOption = parseFloat(correctAnswerRaw); // Store numeric answer directly
            } else {
                // MCQ Logic
                const optLabels = qEl.querySelectorAll('.options label');
                optLabels.forEach(label => {
                    const input = label.querySelector('input[type="radio"]');
                    const span = label.querySelector('span');
                    if (input && span) {
                        // Split "RBC / लाल रक्त कण" into English and Hindi
                        const fullText = span.innerText.trim();
                        const parts = fullText.split('/').map(s => s.trim());
                        const optEn = parts[0];
                        const optHi = parts.length > 1 ? parts[1] : optEn; // Fallback to English if no Hindi

                        options.push({
                            id: optionMap[input.value], // Map 'A' -> 0
                            text: optEn,
                            textHindi: optHi
                        });
                    }
                });
                correctOption = optionMap[correctAnswerRaw];
            }

            questions.push({
                questionText: textEn || 'Question Text Missing',
                questionTextHindi: textHi,
                options,
                correctOption,
                marks,
                negativeMarks: 0, // Default
                type,
                difficulty: 'Medium'
            });
        });

        if (questions.length === 0) {
            throw new Error("No questions found in the HTML file.");
        }

        // 3. Create Exam
        const examResponse = await fetch('/api/admin/exams', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                title,
                subject,
                studentClass,
                description,
                duration: parseInt(duration),
                totalMarks,
                totalQuestions: questions.length
            })
        });

        const examData = await examResponse.json();
        if (!examData.success) throw new Error(examData.message || 'Failed to create exam');

        const examId = examData.data._id;

        // 4. Upload Questions
        const questionsWithId = questions.map(q => ({ ...q, examId }));
        
        const questionsResponse = await fetch('/api/admin/questions/bulk', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ questions: questionsWithId })
        });

        const questionsData = await questionsResponse.json();
        if (!questionsData.success) throw new Error(questionsData.message || 'Failed to upload questions');

        showToast(`Success! Exam "${title}" created with ${questions.length} questions.`, 'success');
        window.location.href = 'exams.html';
        
    } catch (error) {
        console.error('Upload error:', error);
        if (error.message === 'User not found' || error.message.includes('jwt expired')) {
            showToast('Session expired. Please login again.', 'error');
            localStorage.removeItem('adminToken');
            window.location.href = 'admin-login.html';
            return;
        }
        showToast(error.message || 'Error processing file', 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
};

// --- Note Upload Logic ---

window.openUploadNoteModal = function() {
    const modal = document.getElementById('upload-note-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
};

window.closeUploadNoteModal = function() {
    const modal = document.getElementById('upload-note-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
};

// Update file name display
document.addEventListener('change', function(e) {
    if (e.target && e.target.id === 'note-file') {
        const fileName = e.target.files[0]?.name || 'Click to select PDF';
        document.getElementById('file-name-display').textContent = fileName;
    }
});

window.handleNoteUpload = async function(e) {
    e.preventDefault();
    const token = localStorage.getItem('adminToken');
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerText;
    
    btn.disabled = true;
    btn.innerText = 'Uploading...';

    const title = document.getElementById('note-title').value;
    const subject = document.getElementById('note-subject').value;
    const fileInput = document.getElementById('note-file');
    const file = fileInput.files[0];

    if (!title || !subject || !file) {
        showToast('Please fill all fields', 'warning');
        btn.disabled = false;
        btn.innerText = originalText;
        return;
    }

    // Convert file to Base64
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async function () {
        const base64File = reader.result;

        try {
            const response = await fetch('/api/notes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ title, subject, fileUrl: base64File, type: 'PDF' })
            });
            const data = await response.json();
            if (data.success) {
                showToast('Note uploaded successfully!', 'success');
                closeUploadNoteModal();
                if (document.getElementById('admin-notes-table')) {
                    loadAdminNotes();
                }
            } else {
                showToast(data.message || 'Upload failed', 'error');
            }
        } catch (error) {
            console.error('Upload error:', error);
            showToast('Server error', 'error');
        } finally {
            btn.disabled = false;
            btn.innerText = originalText;
        }
    };
};

// --- Admin Notes Management ---

let adminNotesData = []; // Store notes locally for editing

window.loadAdminNotes = async function() {
    const btn = document.getElementById('refresh-notes-btn');
    const originalContent = btn ? btn.innerHTML : '';
    
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span class="animate-spin inline-block w-4 h-4 border-2 border-primary border-t-transparent rounded-full mr-2"></span> Loading...`;
    }

    const tbody = document.getElementById('admin-notes-table');
    const token = localStorage.getItem('adminToken');
    
    try {
        const response = await fetch('/api/notes', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (data.success) {
            adminNotesData = data.data; // Save for edit modal
            if (data.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-slate-500">No notes found.</td></tr>';
            } else {
                tbody.innerHTML = data.data.map(note => `
                    <tr class="border-b border-slate-50 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td class="p-4 font-medium text-dark dark:text-white">${note.title}</td>
                        <td class="p-4"><span class="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-xs">${note.subjectId?.name || 'General'}</span></td>
                        <td class="p-4 text-slate-500">${note.type || 'PDF'}</td>
                        <td class="p-4 font-bold text-slate-700 dark:text-slate-300">${note.downloads || 0}</td>
                        <td class="p-4 flex gap-2">
                            <a href="${note.content}" target="_blank" class="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded" title="View" aria-label="View Note"><i data-lucide="eye" class="w-4 h-4"></i></a>
                            <a href="${note.content}" download="${note.title}.pdf" class="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded" title="Download" aria-label="Download Note"><i data-lucide="download" class="w-4 h-4"></i></a>
                            <button onclick="openEditNoteModal('${note._id}')" class="p-1 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded" title="Edit" aria-label="Edit Note"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
                            <button onclick="deleteNote('${note._id}')" class="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded" title="Delete" aria-label="Delete Note"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                        </td>
                    </tr>
                `).join('');
                lucide.createIcons();
            }
        } else {
            tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-red-500">${data.message || 'Failed to load notes.'}</td></tr>`;
        }
    } catch (error) {
        console.error('Error loading notes:', error);
        tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-red-500">Error loading notes.</td></tr>';
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalContent;
            lucide.createIcons();
        }
    }
};

window.deleteNote = async function(id) {
    showConfirm('Are you sure you want to delete this note?', async () => {
        const token = localStorage.getItem('adminToken');
        try {
            const response = await fetch(`/api/notes/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            
            if (data.success) {
                loadAdminNotes(); // Reload table
                showToast('Note deleted successfully', 'success');
            } else {
                showToast(data.message || 'Failed to delete note', 'error');
            }
        } catch (error) {
            console.error('Delete error:', error);
            showToast('Server error', 'error');
        }
    });
};

// --- Edit Note Logic ---

window.openEditNoteModal = function(id) {
    const note = adminNotesData.find(n => n._id === id);
    if (!note) return;

    document.getElementById('edit-note-id').value = note._id;
    document.getElementById('edit-note-title').value = note.title;
    document.getElementById('edit-note-subject').value = note.subjectId?.name || '';

    const modal = document.getElementById('edit-note-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
};

window.closeEditNoteModal = function() {
    const modal = document.getElementById('edit-note-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
};

window.handleNoteUpdate = async function(e) {
    e.preventDefault();
    const id = document.getElementById('edit-note-id').value;
    const title = document.getElementById('edit-note-title').value;
    const subject = document.getElementById('edit-note-subject').value;
    const token = localStorage.getItem('adminToken');

    try {
        const response = await fetch(`/api/notes/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ title, subject })
        });
        const data = await response.json();

        if (data.success) {
            closeEditNoteModal();
            loadAdminNotes();
        } else {
            showToast(data.message || 'Update failed', 'error');
        }
    } catch (error) {
        console.error('Update error:', error);
    }
};

// --- Analytics Logic ---

async function loadAnalytics() {
    const tbody = document.getElementById('analytics-table');
    const token = localStorage.getItem('adminToken');

    try {
        const response = await fetch('/api/admin/analytics', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (data.success) {
            if (data.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-slate-500">No data available.</td></tr>';
            } else {
                tbody.innerHTML = data.data.map((student, index) => `
                    <tr class="border-b border-slate-50 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td class="p-4 font-bold text-slate-400">#${index + 1}</td>
                        <td class="p-4">
                            <div class="font-medium text-dark dark:text-white">${student.name}</div>
                            <div class="text-xs text-slate-500">${student.email}</div>
                        </td>
                        <td class="p-4 text-center font-bold">${student.totalExams}</td>
                        <td class="p-4 text-center"><span class="px-2 py-1 rounded text-xs font-bold ${student.avgScore >= 80 ? 'bg-green-100 text-green-700' : student.avgScore >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}">${student.avgScore}%</span></td>
                        <td class="p-4 text-green-600 font-medium">${student.strongestSubject}</td>
                        <td class="p-4 text-red-500 font-medium">${student.weakestSubject}</td>
                        <td class="p-4">
                            <button onclick="openStudentAnalyticsModal('${student.id}', '${student.name}')" class="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="View Detailed Analysis"><i data-lucide="pie-chart" class="w-5 h-5"></i></button>
                        </td>
                    </tr>
                `).join('');
                lucide.createIcons();
            }
        }
    } catch (error) {
        console.error('Error loading analytics:', error);
        tbody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-red-500">Error loading data.</td></tr>';
    }
}

// --- Student Detailed Analytics Modal ---

let studentProgressChart = null;
let studentSubjectChart = null;

window.openStudentAnalyticsModal = async function(userId, userName) {
    const modal = document.getElementById('student-analytics-modal');
    const title = document.getElementById('modal-student-name');
    const token = localStorage.getItem('adminToken');

    title.innerText = `${userName}'s Analysis`;
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    try {
        // Reuse the existing endpoint to get results
        const response = await fetch(`/api/admin/users/${userId}/results`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (data.success) {
            renderStudentCharts(data.data);
        } else {
            showToast('Failed to load student data', 'error');
        }
    } catch (error) {
        console.error('Error fetching student details:', error);
        showToast('Error loading data', 'error');
    }
};

window.closeStudentAnalyticsModal = function() {
    const modal = document.getElementById('student-analytics-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
};

function renderStudentCharts(results) {
    // Prepare Data
    // 1. Progress (Chronological)
    const sortedResults = [...results].sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt));
    const labels = sortedResults.map(r => new Date(r.submittedAt).toLocaleDateString(undefined, {month:'short', day:'numeric'}));
    const scores = sortedResults.map(r => r.totalMarks > 0 ? Math.round((r.score / r.totalMarks) * 100) : 0);

    // 2. Subject Performance
    const subjectStats = {};
    results.forEach(r => {
        const sub = r.examId?.subject || 'General';
        if (!subjectStats[sub]) subjectStats[sub] = { total: 0, count: 0 };
        const pct = r.totalMarks > 0 ? (r.score / r.totalMarks) * 100 : 0;
        subjectStats[sub].total += pct;
        subjectStats[sub].count++;
    });
    
    const subjects = Object.keys(subjectStats);
    const subjectScores = subjects.map(s => Math.round(subjectStats[s].total / subjectStats[s].count));

    // Render Progress Chart
    const ctx1 = document.getElementById('studentProgressChart');
    if (studentProgressChart) studentProgressChart.destroy();
    
    studentProgressChart = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Score (%)',
                data: scores,
                borderColor: '#2563EB',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, max: 100 } }
        }
    });

    // Render Subject Chart
    const ctx2 = document.getElementById('studentSubjectChart');
    if (studentSubjectChart) studentSubjectChart.destroy();

    studentSubjectChart = new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: subjects,
            datasets: [{
                label: 'Average Score (%)',
                data: subjectScores,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(153, 102, 255, 0.7)'
                ],
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, max: 100 } }
        }
    });
}

// --- Admin Users Management ---

let adminUsersData = [];

window.loadAdminUsers = async function() {
    const btn = document.getElementById('refresh-users-btn');
    const originalContent = btn ? btn.innerHTML : '';
    
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span class="animate-spin inline-block w-4 h-4 border-2 border-primary border-t-transparent rounded-full mr-2"></span> Loading...`;
    }

    const tbody = document.getElementById('admin-users-table');
    const token = localStorage.getItem('adminToken');
    
    try {
        const response = await fetch('/api/admin/users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (data.success) {
            adminUsersData = data.data;
            if (data.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-slate-500">No students found.</td></tr>';
            } else {
                tbody.innerHTML = data.data.map(user => {
                    // Escape quotes in name to prevent JS errors in onclick
                    const safeName = user.name ? user.name.replace(/'/g, "\\'").replace(/"/g, "&quot;") : 'Student';
                    return `
                        <tr class="border-b border-slate-50 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                            <td class="p-4 font-medium text-dark dark:text-white">${user.name}</td>
                            <td class="p-4 text-slate-500">${user.email}</td>
                            <td class="p-4 text-slate-500">${user.studentClass || 'N/A'}</td>
                            <td class="p-4 text-slate-500">${user.stream || 'N/A'}</td>
                            <td class="p-4 text-slate-500">${new Date(user.createdAt).toLocaleDateString()}</td>
                            <td class="p-4 flex gap-2">
                                <button onclick="viewUserResults('${user._id}', '${safeName}')" class="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded" title="View Results" aria-label="View Results for ${safeName}"><i data-lucide="file-text" class="w-4 h-4"></i></button>
                                <button onclick="deleteUser('${user._id}')" class="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded" title="Delete User" aria-label="Delete User ${safeName}"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                            </td>
                        </tr>
                    `;
                }).join('');
                if (typeof lucide !== 'undefined') lucide.createIcons();
            }
        } else {
            tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-red-500">${data.message || 'Failed to load students.'}</td></tr>`;
        }
    } catch (error) {
        console.error('Error loading users:', error);
        tbody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-red-500">Error loading students.</td></tr>';
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalContent;
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    }
};

window.deleteUser = async function(id) {
    showConfirm('Are you sure you want to delete this student? This will also delete their exam results.', async () => {
        const token = localStorage.getItem('adminToken');
        try {
            const response = await fetch(`/api/admin/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            
            if (data.success) {
                loadAdminUsers();
                showToast('User deleted successfully', 'success');
            } else {
                showToast(data.message || 'Failed to delete user', 'error');
            }
        } catch (error) {
            console.error('Delete error:', error);
            showToast('Server error', 'error');
        }
    });
};

window.exportUsersCSV = function() {
    if (!adminUsersData.length) return showToast("No data to export", 'warning');
    
    const headers = ["Name", "Email", "Class", "Stream", "Joined Date"];
    const csvContent = [
        headers.join(","),
        ...adminUsersData.map(u => [
            `"${u.name}"`,
            `"${u.email}"`,
            `"${u.studentClass || ''}"`,
            `"${u.stream || ''}"`,
            `"${new Date(u.createdAt).toLocaleDateString()}"`
        ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "students_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// --- User Results Modal Logic ---

window.viewUserResults = async function(userId, userName) {
    const modal = document.getElementById('user-results-modal');
    const tbody = document.getElementById('user-results-table');
    const title = document.getElementById('modal-user-name');
    const token = localStorage.getItem('adminToken');

    title.innerText = `${userName}'s Results`;
    tbody.innerHTML = '<tr><td colspan="4" class="p-4 text-center">Loading...</td></tr>';
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    try {
        const response = await fetch(`/api/admin/users/${userId}/results`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (data.success && data.data.length > 0) {
            tbody.innerHTML = data.data.map(result => {
                const totalQs = result.examId?.totalQuestions || result.answers?.length || 0;
                const correct = result.correctAnswers || 0;
                const percentage = Math.round((result.score / result.totalMarks) * 100) || 0;
                
                return `
                <tr class="border-b border-slate-100 dark:border-slate-700">
                    <td class="p-3 font-medium">${result.examId?.title || 'Unknown Exam'}</td>
                    <td class="p-3">${new Date(result.submittedAt).toLocaleDateString()}</td>
                    <td class="p-3"><div class="font-bold ${percentage >= 40 ? 'text-green-600' : 'text-red-500'}">${result.score}/${result.totalMarks}</div><div class="text-xs text-slate-500">Correct: ${correct}/${totalQs}</div></td>
                    <td class="p-3 text-xs"><span class="px-2 py-1 rounded ${percentage >= 40 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">${percentage >= 40 ? 'Pass' : 'Fail'}</span></td>
                </tr>
            `}).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-slate-500">No exams taken yet.</td></tr>';
        }
    } catch (error) {
        console.error('Error fetching results:', error);
        tbody.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-red-500">Error loading results.</td></tr>';
    }
};

window.closeUserResultsModal = function() {
    document.getElementById('user-results-modal').classList.add('hidden');
    document.getElementById('user-results-modal').classList.remove('flex');
};

// --- Admin Exams Management ---

let adminExamsData = [];

window.loadAdminExams = async function() {
    const btn = document.getElementById('refresh-exams-btn');
    const originalContent = btn ? btn.innerHTML : '';
    
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span class="animate-spin inline-block w-4 h-4 border-2 border-primary border-t-transparent rounded-full mr-2"></span> Loading...`;
    }

    const tbody = document.getElementById('admin-exams-table');
    const token = localStorage.getItem('adminToken');
    
    try {
        const response = await fetch('/api/exams', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (data.success) {
            adminExamsData = data.data;
            if (data.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-slate-500">No exams found.</td></tr>';
            } else {
                tbody.innerHTML = data.data.map(exam => `
                    <tr class="border-b border-slate-50 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td class="p-4 font-medium text-dark dark:text-white">${exam.title}</td>
                        <td class="p-4"><span class="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-xs">${exam.subject}</span></td>
                        <td class="p-4 text-slate-500">${exam.duration} mins</td>
                        <td class="p-4 font-bold text-slate-700 dark:text-slate-300">${exam.totalQuestions || 0}</td>
                        <td class="p-4 flex gap-2">
                            <button onclick="openEditExamModal('${exam._id}')" class="p-1 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded" title="Edit" aria-label="Edit Exam"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
                            <button onclick="deleteExam('${exam._id}')" class="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded" title="Delete" aria-label="Delete Exam"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                        </td>
                    </tr>
                `).join('');
                if (typeof lucide !== 'undefined') lucide.createIcons();
            }
        } else {
            tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-red-500">${data.message || 'Failed to load exams.'}</td></tr>`;
        }
    } catch (error) {
        console.error('Error loading exams:', error);
        tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-red-500">Error loading exams.</td></tr>';
        if (error.message === 'User not found') {
            localStorage.removeItem('adminToken');
            window.location.href = 'admin-login.html';
        }
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalContent;
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    }
};

window.deleteExam = async function(id) {
    showConfirm('Are you sure? This will delete the exam and all associated questions/results.', async () => {
        const token = localStorage.getItem('adminToken');
        try {
            const response = await fetch(`/api/exams/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            
            if (data.success) {
                loadAdminExams();
                showToast('Exam deleted successfully', 'success');
            } else {
                showToast(data.message || 'Failed to delete exam', 'error');
            }
        } catch (error) {
            console.error('Delete error:', error);
            showToast('Server error', 'error');
        }
    });
};

window.openEditExamModal = function(id) {
    const exam = adminExamsData.find(e => e._id === id);
    if (!exam) return;

    document.getElementById('edit-exam-id').value = exam._id;
    document.getElementById('edit-exam-title').value = exam.title;
    document.getElementById('edit-exam-description').value = exam.description || '';
    document.getElementById('edit-exam-subject').value = exam.subject;
    document.getElementById('edit-exam-duration').value = exam.duration;

    const modal = document.getElementById('edit-exam-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
};

window.closeEditExamModal = function() {
    const modal = document.getElementById('edit-exam-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
};

window.handleExamUpdate = async function(e) {
    e.preventDefault();
    const id = document.getElementById('edit-exam-id').value;
    const title = document.getElementById('edit-exam-title').value;
    const description = document.getElementById('edit-exam-description').value;
    const subject = document.getElementById('edit-exam-subject').value;
    const duration = document.getElementById('edit-exam-duration').value;
    const token = localStorage.getItem('adminToken');

    try {
        const response = await fetch(`/api/exams/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ title, description, subject, duration })
        });
        const data = await response.json();

        if (data.success) {
            closeEditExamModal();
            loadAdminExams();
        } else {
            showToast(data.message || 'Update failed', 'error');
        }
    } catch (error) {
        console.error('Update error:', error);
    }
};