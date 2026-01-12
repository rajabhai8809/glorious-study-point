/**
 * Result Page Logic
 * Handles charts and score visualization.
 */

function initResultPage() {
    if (typeof lucide !== 'undefined') lucide.createIcons();
    loadResultData();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initResultPage);
} else {
    initResultPage();
}

let resultData = null;

async function loadResultData() {
    const urlParams = new URLSearchParams(window.location.search);
    const examId = urlParams.get('examId');
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    if (!examId) {
        loadAnalyticsView(token);
        return;
    }

    try {
        const response = await fetch(`/api/exams/${examId}/result`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (data.success) {
            resultData = data.data;
            updateUI(resultData);
        } else {
            showError(data.message || 'Failed to load result.');
        }
    } catch (error) {
        console.error('Error loading result:', error);
        showError('Connection error. Please try again.');
    }
}

async function loadAnalyticsView(token) {
    // Toggle Views
    document.getElementById('single-result-view').classList.add('hidden');
    document.getElementById('analytics-view').classList.remove('hidden');

    try {
        const response = await fetch('/api/users/history', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (data.success && data.data.length > 0) {
            const history = data.data.reverse(); // Oldest first for graph
            
            // 1. Calculate Stats
            const totalTests = history.length;
            const totalScorePct = history.reduce((acc, curr) => {
                const pct = curr.totalMarks > 0 ? (curr.score / curr.totalMarks) * 100 : 0;
                return acc + pct;
            }, 0);
            const avgScore = Math.round(totalScorePct / totalTests);

            // Find Best Subject
            const subjectScores = {};
            history.forEach(h => {
                const sub = h.examId?.subject || 'General';
                if (!subjectScores[sub]) subjectScores[sub] = { total: 0, count: 0 };
                const pct = h.totalMarks > 0 ? (h.score / h.totalMarks) * 100 : 0;
                subjectScores[sub].total += pct;
                subjectScores[sub].count += 1;
            });

            let bestSub = '-';
            let maxAvg = -1;
            for (const [sub, stats] of Object.entries(subjectScores)) {
                const avg = stats.total / stats.count;
                if (avg > maxAvg) {
                    maxAvg = avg;
                    bestSub = sub;
                }
            }

            // Update UI
            document.getElementById('avg-score').innerText = `${avgScore}%`;
            document.getElementById('total-tests').innerText = totalTests;
            document.getElementById('best-subject').innerText = bestSub;

            // 2. Render Progress Chart
            const ctx = document.getElementById('progressChart');
            if (ctx) {
                new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: history.map(h => new Date(h.submittedAt).toLocaleDateString(undefined, {month:'short', day:'numeric'})),
                        datasets: [{
                            label: 'Score (%)',
                            data: history.map(h => h.totalMarks > 0 ? Math.round((h.score / h.totalMarks) * 100) : 0),
                            borderColor: '#2563EB',
                            backgroundColor: 'rgba(37, 99, 235, 0.1)',
                            tension: 0.4,
                            fill: true
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: { beginAtZero: true, max: 100 }
                        }
                    }
                });
            }
        } else {
            document.getElementById('analytics-view').innerHTML = 
                '<div class="text-center py-20 text-slate-500">No exam history found. Take an exam to see analytics!</div>';
        }
    } catch (error) {
        console.error('Analytics error:', error);
    }
}

function showError(msg) {
    const title = document.getElementById('result-exam-title');
    const date = document.getElementById('result-date');
    if (title) title.innerText = 'Error';
    if (date) {
        date.innerText = msg;
        date.classList.add('text-red-500');
    }
}

function updateUI(data) {
    // Ensure Single Result View is visible
    document.getElementById('single-result-view').classList.remove('hidden');
    document.getElementById('analytics-view').classList.add('hidden');

    // Update Score
    const percentage = Math.round((data.score / data.totalMarks) * 100) || 0;
    const scoreEl = document.getElementById('score-percentage');
    if (scoreEl) {
        scoreEl.innerText = `${percentage}%`;
        // Animate Circle
        const circle = document.getElementById('score-circle-stroke');
        if (circle) {
            const circumference = 552;
            const offset = circumference - (percentage / 100) * circumference;
            setTimeout(() => {
                circle.style.strokeDashoffset = offset;
                if(percentage < 40) circle.style.stroke = '#EF4444';
                else if(percentage < 70) circle.style.stroke = '#EAB308';
                else circle.style.stroke = '#22C55E';
            }, 100);
        }
    }
    
    // Update Text
    const titleEl = document.getElementById('result-exam-title');
    if (titleEl) titleEl.innerText = data.examId?.title || 'Exam Result';
    
    const dateEl = document.getElementById('result-date');
    if (dateEl) dateEl.innerText = `Completed on ${new Date(data.submittedAt).toLocaleDateString()}`;
    
    // Update Stats Grid
    const totalQs = data.examId?.totalQuestions || data.answers.length;
    const skipped = data.skippedAnswers !== undefined ? data.skippedAnswers : (totalQs - (data.correctAnswers + data.wrongAnswers));
    
    document.getElementById('stat-correct').innerText = `${data.correctAnswers}/${totalQs}`;
    document.getElementById('stat-wrong').innerText = `${data.wrongAnswers}/${totalQs}`;
    document.getElementById('stat-skipped').innerText = `${skipped}/${totalQs}`;
    
    // Use backend accuracy if available, else calculate
    const accuracy = data.accuracy !== undefined ? data.accuracy : percentage;
    document.getElementById('stat-accuracy').innerText = `${accuracy}%`;

    // Update Rank Display
    if (data.rank) {
        document.getElementById('rank-display').innerText = `#${data.rank}`;
        document.getElementById('rank-percentile').innerText = `Top ${100 - data.percentile}% of students`;
        document.getElementById('rank-points').innerText = `${data.score} pts`;
        document.getElementById('rank-bar').style.width = `${data.percentile}%`;
    }

    // Render Chart
    renderChart(data.correctAnswers, data.wrongAnswers, skipped);

    // Confetti if passed (assuming 40% pass)
    if (percentage >= 40) startConfetti();
}

function renderChart(correct, wrong, skipped) {
    const ctx = document.getElementById('performanceChart');
    if (ctx) {
        new Chart(ctx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Correct', 'Wrong', 'Skipped'],
                datasets: [{
                    data: [correct, wrong, skipped],
                    backgroundColor: ['#22C55E', '#EF4444', '#94A3B8'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } }
                },
                cutout: '70%'
            }
        });
    }
}

function startConfetti() {
    const canvas = document.getElementById('confetti');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const particles = Array.from({length: 150}, () => ({
            x: canvas.width / 2, y: canvas.height / 2,
            color: ['#2563EB', '#22C55E', '#EAB308', '#EF4444'][Math.floor(Math.random() * 4)],
            size: Math.random() * 5 + 2,
            speedX: (Math.random() - 0.5) * 15,
            speedY: (Math.random() - 0.5) * 15,
            gravity: 0.5
        }));
        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach((p, i) => {
                p.x += p.speedX; p.y += p.speedY; p.speedY += p.gravity; p.size *= 0.96;
                ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size);
                if(p.size < 0.5) particles.splice(i, 1);
            });
            if(particles.length) requestAnimationFrame(animate);
        }
        animate();
    }
}

window.toggleReview = function() {
    const container = document.getElementById('review-container');
    if (container.classList.contains('hidden')) {
        container.classList.remove('hidden');
        renderReview();
    } else {
        container.classList.add('hidden');
    }
};

function renderReview() {
    const container = document.getElementById('review-container');
    if (!resultData || !resultData.answers) return;

    container.innerHTML = resultData.answers.map((ans, index) => {
        const q = ans.questionId;
        if (!q) return ''; // Handle deleted questions
        const isSkipped = Number(ans.selectedOption) === -1;
        const isCorrect = !isSkipped && Number(ans.selectedOption) === Number(q.correctOption);
        const userOption = q.options.find(o => o.id === Number(ans.selectedOption));
        const correctOption = q.options.find(o => o.id === Number(q.correctOption));

        return `
            <div class="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-xl border-l-4 ${isCorrect ? 'border-green-500' : isSkipped ? 'border-slate-400' : 'border-red-500'} shadow-sm">
                <p class="font-medium text-slate-900 dark:text-white mb-4">
                    <span class="text-slate-500 mr-2">Q${index + 1}.</span> ${q.questionText}
                </p>
                
                <div class="space-y-2 text-sm">
                    <div class="flex items-start gap-2 ${isCorrect ? 'text-green-600 font-bold' : isSkipped ? 'text-slate-500 font-bold' : 'text-red-500 font-bold'}">
                        <i data-lucide="${isCorrect ? 'check-circle' : isSkipped ? 'minus-circle' : 'x-circle'}" class="w-4 h-4 mt-0.5 shrink-0"></i>
                        Your Answer: ${userOption ? userOption.text : 'Skipped'}
                    </div>
                    ${!isCorrect ? `
                        <div class="flex items-start gap-2 text-green-600 font-medium">
                            <i data-lucide="check" class="w-4 h-4 mt-0.5 shrink-0"></i>
                            Correct Answer: ${correctOption.text}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
    lucide.createIcons();
}