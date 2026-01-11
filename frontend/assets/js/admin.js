/**
 * Admin Panel Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize delete buttons
    const deleteBtns = document.querySelectorAll('button i[data-lucide="trash-2"]');
    
    deleteBtns.forEach(btn => {
        btn.closest('button').addEventListener('click', function() {
            if(confirm('Are you sure you want to delete this item?')) {
                const row = this.closest('tr');
                row.style.opacity = '0';
                setTimeout(() => row.remove(), 300);
            }
        });
    });

    // Load Dashboard Stats if on dashboard page
    if (document.getElementById('stat-students')) {
        loadDashboardStats();
    }
});

async function loadDashboardStats() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'admin-login.html';
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/api/admin/dashboard', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (data.success) {
            // Update Stats
            document.getElementById('stat-students').innerText = data.data.stats.totalStudents;
            document.getElementById('stat-exams').innerText = data.data.stats.totalExams;
            document.getElementById('stat-questions').innerText = data.data.stats.totalQuestions;
            document.getElementById('stat-attempts').innerText = data.data.stats.totalAttempts;

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
    const token = localStorage.getItem('token');
    const select = document.getElementById('question-exam');
    if (!select) return;
    
    try {
        const response = await fetch('http://localhost:5000/api/exams', {
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
    const token = localStorage.getItem('token');
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
        const response = await fetch('http://localhost:5000/api/admin/questions', {
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
            alert('Question added successfully!');
            closeAddQuestionModal();
            e.target.reset();
        } else {
            alert(data.message || 'Failed to add question');
        }
    } catch (error) {
        console.error('Error adding question:', error);
        alert('Server error');
    } finally {
        btn.disabled = false;
        btn.innerText = originalText;
    }
};