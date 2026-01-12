/**
 * Dashboard Logic
 * Handles user dashboard interactions.
 */

// 🔒 Security Check: Redirect immediately if not logged in
(function() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
    }
})();

document.addEventListener('DOMContentLoaded', () => {
    updateGreeting();
    loadDashboardData();
    loadNotifications();
});

function updateGreeting() {
    const hour = new Date().getHours();
    const greetingElement = document.querySelector('h1');
    let greeting = 'Welcome back';
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const name = user.name ? user.name.split(' ')[0] : 'Student';
    if (greetingElement) greetingElement.innerHTML = `${greeting}, ${name}! 👋`;
}

async function loadDashboardData() {
    const token = localStorage.getItem('token');
    if (!token) window.location.href = 'login.html';

    try {
        const response = await fetch('/api/users/dashboard', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (data.success) {
            // Update Stats
            if (data.data.stats) {
                document.getElementById('stat-total-exams').innerText = data.data.stats.totalExams;
                document.getElementById('stat-avg-score').innerText = data.data.stats.avgScore + '%';
            }
            if (data.data.analytics && data.data.analytics.weeklyProgress) {
                document.getElementById('stat-weekly-exams').innerText = data.data.analytics.weeklyProgress.current;
            }

            renderPendingExams(data.data.pendingExams || []);
            renderCompletedExams(data.data.completedExams || []);
            
            // Render New Features
            if (data.data.analytics) {
                renderAnalytics(data.data.analytics);
            }
        } else {
            const errHtml = `<div class="col-span-full text-center text-red-500 py-4">${data.message || 'Failed to load data.'}</div>`;
            const pending = document.getElementById('pending-exams-container');
            const completed = document.getElementById('completed-exams-container');
            if(pending) pending.innerHTML = errHtml;
            if(completed) completed.innerHTML = errHtml;
            
            // Clear loading states for analytics
            const recContainer = document.getElementById('recommendations-container');
            if (recContainer) recContainer.innerHTML = '<div class="text-slate-500 text-sm">Failed to load recommendations.</div>';
            
            const badgeContainer = document.getElementById('badges-container');
            if (badgeContainer) badgeContainer.innerHTML = '<div class="col-span-2 text-slate-500 text-sm text-center">Failed to load badges.</div>';
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
        const errHtml = '<div class="col-span-full text-center text-red-500 py-4">Error connecting to server.</div>';
        const pending = document.getElementById('pending-exams-container');
        const completed = document.getElementById('completed-exams-container');
        if(pending) pending.innerHTML = errHtml;
        if(completed) completed.innerHTML = errHtml;
        
        // Clear loading states for analytics
        const recContainer = document.getElementById('recommendations-container');
        if (recContainer) recContainer.innerHTML = '<div class="text-slate-500 text-sm">Connection error.</div>';
        
        const badgeContainer = document.getElementById('badges-container');
        if (badgeContainer) badgeContainer.innerHTML = '<div class="col-span-2 text-slate-500 text-sm text-center">Connection error.</div>';
    }
}

function renderAnalytics(analytics) {
    // 1. Weekly Goal
    const { current, target } = analytics.weeklyProgress || { current: 0, target: 5 };
    const pct = Math.min(100, Math.round((current / target) * 100));
    
    const progressText = document.getElementById('weekly-progress-text');
    if (progressText) {
        progressText.innerText = `${current}/${target} Completed`;
        progressText.classList.remove('text-white', 'text-gray-200');
        progressText.classList.add('text-slate-500', 'dark:text-slate-400');
    }
    const progressPct = document.getElementById('weekly-progress-pct');
    if (progressPct) {
        progressPct.innerText = `${pct}%`;
        progressPct.classList.remove('text-white', 'text-gray-200');
        progressPct.classList.add('text-slate-900', 'dark:text-white');
    }
    
    const progressBar = document.getElementById('weekly-progress-bar');
    if (progressBar) {
        progressBar.style.width = `${pct}%`;
        progressBar.setAttribute('aria-valuenow', pct);
        progressBar.setAttribute('aria-valuemin', 0);
        progressBar.setAttribute('aria-valuemax', 100);
    }

    // 2. Subject Chart
    const ctx = document.getElementById('subjectChart');
    if (ctx && analytics.subjectPerformance.length > 0) {
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: analytics.subjectPerformance.map(s => s.subject),
                datasets: [{
                    label: 'Avg Score (%)',
                    data: analytics.subjectPerformance.map(s => s.average),
                    backgroundColor: '#2563EB',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, max: 100, grid: { display: false } },
                    x: { grid: { display: false } }
                }
            }
        });
    } else if (ctx) {
        ctx.parentElement.innerHTML = '<div class="flex items-center justify-center h-full text-slate-400 text-sm">Take exams to see performance stats</div>';
    }

    // 3. Recommendations
    const recContainer = document.getElementById('recommendations-container');
    if (analytics.recommendations.length > 0) {
        recContainer.innerHTML = analytics.recommendations.map(exam => `
            <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex justify-between items-center hover:shadow-md transition-shadow">
                <div>
                    <h4 class="font-bold text-slate-900 dark:text-white">${exam.title}</h4>
                    <p class="text-xs text-slate-500">${exam.subject} • ${exam.duration}m</p>
                </div>
                <a href="exam.html?id=${exam._id}" class="text-primary hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2 rounded-lg transition-colors">
                    <i data-lucide="arrow-right" class="w-5 h-5"></i>
                </a>
            </div>
        `).join('');
    } else {
        recContainer.innerHTML = '<div class="text-slate-500 text-sm">No recommendations available right now.</div>';
    }

    // 4. Badges
    const badgeContainer = document.getElementById('badges-container');
    if (analytics.badges.length > 0) {
        badgeContainer.innerHTML = analytics.badges.map(badge => `
            <div class="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-${badge.color}-100 dark:bg-${badge.color}-900/30 flex items-center justify-center text-${badge.color}-600">
                    <i data-lucide="${badge.icon}" class="w-5 h-5"></i>
                </div>
                <div>
                    <p class="font-bold text-sm text-slate-900 dark:text-white">${badge.name}</p>
                    <p class="text-[10px] text-slate-500">${badge.desc}</p>
                </div>
            </div>
        `).join('');
    } else {
        badgeContainer.innerHTML = `
            <div class="col-span-2 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl text-center border border-dashed border-slate-300 dark:border-slate-700">
                <p class="text-sm text-slate-500">Complete exams to earn badges!</p>
            </div>
        `;
    }
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// --- Notification Logic ---

async function loadNotifications() {
    const token = localStorage.getItem('token');
    const badge = document.getElementById('notification-badge');
    const list = document.getElementById('notification-list');

    try {
        const response = await fetch('/api/users/notifications', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (data.success) {
            const notifications = data.data;
            const unreadCount = notifications.filter(n => !n.isRead).length;

            // Update Badge
            if (unreadCount > 0) {
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }

            // Render List
            if (notifications.length === 0) {
                list.innerHTML = '<div class="p-4 text-center text-slate-500 text-sm">No notifications</div>';
            } else {
                list.innerHTML = notifications.map(n => `
                    <div class="flex justify-between items-start p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-b border-slate-100 dark:border-slate-700/50 ${!n.isRead ? 'bg-blue-50/60 dark:bg-blue-900/20' : ''}">
                        <div class="flex-1 pr-3">
                            <p class="text-sm font-semibold text-slate-900 dark:text-white">${n.title}</p>
                            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">${n.message}</p>
                            <p class="text-[10px] text-slate-400 mt-2 flex items-center gap-1"><i data-lucide="clock" class="w-3 h-3"></i> ${new Date(n.createdAt).toLocaleDateString()}</p>
                        </div>
                        <button onclick="deleteNotification('${n._id}')" class="text-slate-400 hover:text-red-500 transition-colors p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

window.deleteNotification = async function(id) {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`/api/users/notifications/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            loadNotifications(); // Reload list
        }
    } catch (error) {
        console.error('Error deleting notification:', error);
    }
};

window.markAllRead = async function() {
    const token = localStorage.getItem('token');
    try {
        await fetch('/api/users/notifications/read', {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        document.getElementById('notification-badge').classList.add('hidden');
        loadNotifications();
    } catch (error) {
        console.error('Error marking all read:', error);
    }
};

window.clearAllNotifications = async function() {
    showConfirm('Are you sure you want to clear all notifications?', async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch('/api/users/notifications', {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                document.getElementById('notification-badge').classList.add('hidden');
                loadNotifications();
                showToast('Notifications cleared', 'success');
            }
        } catch (error) {
            console.error('Error clearing notifications:', error);
        }
    });
};

// Override global toggle to mark as read
const originalToggleNotifications = window.toggleNotifications;
window.toggleNotifications = async function() {
    originalToggleNotifications();
    
    const dropdown = document.getElementById('notification-dropdown');
    if (!dropdown.classList.contains('hidden')) {
        // Mark as read when opened
        const token = localStorage.getItem('token');
        const badge = document.getElementById('notification-badge');
        
        if (!badge.classList.contains('hidden')) {
            try {
                await fetch('/api/users/notifications/read', {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                badge.classList.add('hidden');
            } catch (e) { console.error(e); }
        }
    }
};

function renderPendingExams(exams) {
    const container = document.getElementById('pending-exams-container');
    if (!exams || exams.length === 0) {
        container.innerHTML = '<div class="col-span-full text-center text-slate-500 py-4">No pending exams. Great job!</div>';
        return;
    }

    container.innerHTML = exams.map(exam => `
        <div class="card border-l-4 border-l-primary hover:shadow-md transition-shadow">
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h3 class="font-bold text-lg text-slate-900 dark:text-white">${exam.title}</h3>
                    <p class="text-slate-500 dark:text-slate-400 text-sm">${exam.duration} Mins • ${exam.totalQuestions} Questions</p>
                </div>
                <span class="bg-blue-100 text-primary text-xs font-bold px-2 py-1 rounded">${exam.subject}</span>
            </div>
            <a href="exam.html?id=${exam._id}" class="btn-primary w-full block text-center py-2" aria-label="Start Exam: ${exam.title}">Start Exam</a>
        </div>
    `).join('');
}

function renderCompletedExams(results) {
    const container = document.getElementById('completed-exams-container');
    if (!results || results.length === 0) {
        container.innerHTML = '<div class="col-span-full text-center text-slate-500 py-4">You haven\'t taken any exams yet.</div>';
        return;
    }

    container.innerHTML = results.map(result => {
        const totalQs = result.examId?.totalQuestions || result.answers?.length || 0;
        const totalMarks = result.totalMarks || 0;
        const score = result.score || 0;
        const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;

        return `
        <div class="card border-l-4 border-l-green-500 hover:shadow-md transition-shadow opacity-90">
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h3 class="font-bold text-lg text-slate-900 dark:text-white">${result.examId?.title || 'Unknown Exam'}</h3>
                    <p class="text-slate-500 dark:text-slate-400 text-sm">Score: <span class="font-bold text-slate-900 dark:text-white">${score}/${totalMarks} (${percentage}%)</span></p>
                    <p class="text-xs text-slate-500 mt-1"><span class="text-green-600">${result.correctAnswers || 0} Correct</span> • <span class="text-red-500">${result.wrongAnswers || 0} Wrong</span></p>
                </div>
                <span class="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">Completed</span>
            </div>
            ${result.examId?._id ? `<a href="result.html?examId=${result.examId._id}" class="btn-secondary w-full block text-center py-2">View Result</a>` : '<button disabled class="btn-secondary w-full block text-center py-2 opacity-50 cursor-not-allowed">Exam Deleted</button>'}
        </div>
    `}).join('');
}