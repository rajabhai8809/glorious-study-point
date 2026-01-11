let currentTimeframe = 'weekly';

document.addEventListener('DOMContentLoaded', () => {
    loadLeaderboard();

    // Subject Filter Listener
    document.getElementById('leaderboard-subject')?.addEventListener('change', () => {
        loadLeaderboard();
    });
});

window.switchTab = function(timeframe) {
    currentTimeframe = timeframe;
    const weeklyBtn = document.getElementById('tab-weekly');
    const allTimeBtn = document.getElementById('tab-alltime');
    
    // Update Button Styles
    const activeClass = 'bg-primary text-white shadow-sm';
    const inactiveClass = 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700';

    if (timeframe === 'weekly') {
        weeklyBtn.className = `flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${activeClass}`;
        allTimeBtn.className = `flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${inactiveClass}`;
    } else {
        allTimeBtn.className = `flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${activeClass}`;
        weeklyBtn.className = `flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${inactiveClass}`;
    }

    loadLeaderboard();
};

async function loadLeaderboard() {
    const timeframe = currentTimeframe;
    const subject = document.getElementById('leaderboard-subject')?.value || 'all';
    const listContainer = document.getElementById('leaderboard-list');
    const podiumContainer = document.getElementById('podium-container');
    
    // Show loading
    listContainer.innerHTML = '<div class="text-center py-8 text-slate-500">Loading...</div>';

    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`http://localhost:5000/api/leaderboard?timeframe=${timeframe}&subject=${subject}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        const data = await response.json();

        if (data.success) {
            renderLeaderboard(data.data);
        } else {
            listContainer.innerHTML = `<div class="text-center py-8 text-red-500">${data.message || 'Failed to load.'}</div>`;
        }
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        listContainer.innerHTML = '<div class="text-center py-8 text-red-500">Connection error.</div>';
    }
}

function getRankChangeHtml(change) {
    if (change === 'new') return '<span class="text-xs font-bold text-blue-500 bg-blue-100 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">NEW</span>';
    if (change === 0) return '<span class="text-slate-400 dark:text-slate-600">-</span>';
    
    if (change > 0) {
        return `<span class="text-green-500 flex items-center text-xs font-bold"><i data-lucide="chevron-up" class="w-3 h-3 mr-0.5"></i>${change}</span>`;
    }
    return `<span class="text-red-500 flex items-center text-xs font-bold"><i data-lucide="chevron-down" class="w-3 h-3 mr-0.5"></i>${Math.abs(change)}</span>`;
}

function renderLeaderboard(data) {
    const { topThree, rest, userRank } = data;
    const podiumContainer = document.getElementById('podium-container');
    const listContainer = document.getElementById('leaderboard-list');

    // 1. Render Podium (Top 3)
    if (topThree && topThree.length > 0) {
        const first = topThree[0] || {};
        const second = topThree[1] || {};
        const third = topThree[2] || {};

        podiumContainer.innerHTML = `
            <!-- 2nd Place -->
            <div class="flex flex-col items-center animate-slide-up" style="animation-delay: 0.1s; opacity: ${second.name ? 1 : 0}">
                <div class="w-16 h-16 rounded-full border-2 border-slate-300 bg-slate-200 mb-2 overflow-hidden">
                    <img src="${second.avatar || `https://ui-avatars.com/api/?name=${second.name || '?'}&background=random`}" alt="2nd" class="w-full h-full object-cover">
                </div>
                <div class="bg-white dark:bg-slate-800 text-dark dark:text-white font-bold px-3 py-1 rounded-full text-xs shadow mb-1">#2</div>
                <span class="font-semibold text-sm text-dark dark:text-white">${second.name || '-'}</span>
                <span class="text-xs opacity-80 text-slate-500 dark:text-slate-400">${second.score || 0} pts</span>
                <div class="mt-1">${getRankChangeHtml(second.rankChange || 0)}</div>
            </div>
            
            <!-- 1st Place -->
            <div class="flex flex-col items-center animate-slide-up">
                <div class="w-20 h-20 rounded-full border-4 border-yellow-400 bg-yellow-100 mb-2 overflow-hidden relative">
                    <i data-lucide="crown" class="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 text-yellow-400 fill-yellow-400"></i>
                    <img src="${first.avatar || `https://ui-avatars.com/api/?name=${first.name || '?'}&background=random`}" alt="1st" class="w-full h-full object-cover">
                </div>
                <div class="bg-yellow-400 text-dark font-bold px-3 py-1 rounded-full text-xs shadow mb-1">#1</div>
                <span class="font-bold text-lg text-dark dark:text-white">${first.name || '-'}</span>
                <span class="text-xs opacity-80 text-slate-500 dark:text-slate-400">${first.score || 0} pts</span>
                <div class="mt-1">${getRankChangeHtml(first.rankChange || 0)}</div>
            </div>

            <!-- 3rd Place -->
            <div class="flex flex-col items-center animate-slide-up" style="animation-delay: 0.2s; opacity: ${third.name ? 1 : 0}">
                <div class="w-16 h-16 rounded-full border-2 border-orange-300 bg-orange-100 mb-2 overflow-hidden">
                    <img src="${third.avatar || `https://ui-avatars.com/api/?name=${third.name || '?'}&background=random`}" alt="3rd" class="w-full h-full object-cover">
                </div>
                <div class="bg-white dark:bg-slate-800 text-dark dark:text-white font-bold px-3 py-1 rounded-full text-xs shadow mb-1">#3</div>
                <span class="font-semibold text-sm text-dark dark:text-white">${third.name || '-'}</span>
                <span class="text-xs opacity-80 text-slate-500 dark:text-slate-400">${third.score || 0} pts</span>
                <div class="mt-1">${getRankChangeHtml(third.rankChange || 0)}</div>
            </div>
        `;
    }

    // 2. Render List (Rest)
    let listHtml = '';
    
    if (rest && rest.length > 0) {
        listHtml += rest.map((user, index) => `
            <div class="bg-white dark:bg-slate-800 rounded-xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                <span class="font-bold text-slate-400 w-6">${index + 4}</span>
                <img src="${user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random`}" class="w-10 h-10 rounded-full">
                <div class="flex-1">
                    <h3 class="font-semibold text-dark dark:text-white">${user.name}</h3>
                </div>
                <div class="text-right">
                    <div class="font-bold text-slate-600 dark:text-slate-300">${user.score} pts</div>
                    <div class="flex justify-end mt-1">${getRankChangeHtml(user.rankChange || 0)}</div>
                </div>
            </div>
        `).join('');
    } else {
        listHtml = '<div class="text-center py-8 text-slate-500">No other players yet.</div>';
    }

    listContainer.innerHTML = listHtml;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}