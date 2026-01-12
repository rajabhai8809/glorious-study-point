let currentTimeframe = 'weekly';
let currentLeaderboardData = { topThree: [], rest: [] };

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
        const response = await fetch(`/api/leaderboard?timeframe=${timeframe}&subject=${subject}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        const data = await response.json();

        if (data.success) {
            currentLeaderboardData = data.data;
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
            <div onclick="openUserProfile('${second._id || second.id}')" class="flex flex-col items-center animate-slide-up cursor-pointer group" style="animation-delay: 0.1s; opacity: ${second.name ? 1 : 0}">
                <div class="w-16 h-16 rounded-full border-2 border-slate-300 bg-slate-200 mb-2 overflow-hidden group-hover:scale-105 transition-transform">
                    <img src="${second.avatar || `https://ui-avatars.com/api/?name=${second.name || '?'}&background=random`}" alt="2nd" class="w-full h-full object-cover">
                </div>
                <div class="bg-white dark:bg-slate-800 text-dark dark:text-white font-bold px-3 py-1 rounded-full text-xs shadow mb-1">#2</div>
                <span class="font-semibold text-sm text-dark dark:text-white text-center truncate w-20 sm:w-24 block group-hover:text-primary transition-colors">${second.name || '-'}</span>
                <span class="text-xs opacity-80 text-slate-500 dark:text-slate-400 whitespace-nowrap">${second.score || 0} pts</span>
                <div class="mt-1">${getRankChangeHtml(second.rankChange || 0)}</div>
            </div>
            
            <!-- 1st Place -->
            <div onclick="openUserProfile('${first._id || first.id}')" class="flex flex-col items-center animate-slide-up cursor-pointer group">
                <div class="w-20 h-20 rounded-full border-4 border-yellow-400 bg-yellow-100 mb-2 overflow-hidden relative group-hover:scale-105 transition-transform">
                    <i data-lucide="crown" class="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 text-yellow-400 fill-yellow-400"></i>
                    <img src="${first.avatar || `https://ui-avatars.com/api/?name=${first.name || '?'}&background=random`}" alt="1st" class="w-full h-full object-cover">
                </div>
                <div class="bg-yellow-400 text-dark font-bold px-3 py-1 rounded-full text-xs shadow mb-1">#1</div>
                <span class="font-bold text-lg text-dark dark:text-white text-center truncate w-24 sm:w-32 block group-hover:text-primary transition-colors">${first.name || '-'}</span>
                <span class="text-xs opacity-80 text-slate-500 dark:text-slate-400 whitespace-nowrap">${first.score || 0} pts</span>
                <div class="mt-1">${getRankChangeHtml(first.rankChange || 0)}</div>
            </div>

            <!-- 3rd Place -->
            <div onclick="openUserProfile('${third._id || third.id}')" class="flex flex-col items-center animate-slide-up cursor-pointer group" style="animation-delay: 0.2s; opacity: ${third.name ? 1 : 0}">
                <div class="w-16 h-16 rounded-full border-2 border-orange-300 bg-orange-100 mb-2 overflow-hidden group-hover:scale-105 transition-transform">
                    <img src="${third.avatar || `https://ui-avatars.com/api/?name=${third.name || '?'}&background=random`}" alt="3rd" class="w-full h-full object-cover">
                </div>
                <div class="bg-white dark:bg-slate-800 text-dark dark:text-white font-bold px-3 py-1 rounded-full text-xs shadow mb-1">#3</div>
                <span class="font-semibold text-sm text-dark dark:text-white text-center truncate w-20 sm:w-24 block group-hover:text-primary transition-colors">${third.name || '-'}</span>
                <span class="text-xs opacity-80 text-slate-500 dark:text-slate-400 whitespace-nowrap">${third.score || 0} pts</span>
                <div class="mt-1">${getRankChangeHtml(third.rankChange || 0)}</div>
            </div>
        `;
    }

    // 2. Render List (Rest)
    let listHtml = '';
    
    if (rest && rest.length > 0) {
        listHtml += rest.map((user, index) => `
            <div onclick="openUserProfile('${user._id || user.id}')" class="bg-white dark:bg-slate-800 rounded-xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                <span class="font-bold text-slate-400 w-5 sm:w-6 text-sm sm:text-base">${index + 4}</span>
                <img src="${user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random`}" class="w-8 h-8 sm:w-10 sm:h-10 rounded-full">
                <div class="flex-1 min-w-0">
                    <h3 class="font-semibold text-dark dark:text-white truncate group-hover:text-primary transition-colors text-sm sm:text-base">${user.name}</h3>
                </div>
                <div class="text-right shrink-0">
                    <div class="font-bold text-slate-600 dark:text-slate-300 text-sm sm:text-base whitespace-nowrap">${user.score} pts</div>
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

window.openUserProfile = function(userId) {
    const allUsers = [...(currentLeaderboardData.topThree || []), ...(currentLeaderboardData.rest || [])];
    const user = allUsers.find(u => (u._id || u.id) === userId);
    
    if (!user) return;

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in';
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
    
    modal.innerHTML = `
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-700 transform scale-100 transition-transform relative">
            <button onclick="this.closest('.fixed').remove()" class="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <i data-lucide="x" class="w-5 h-5"></i>
            </button>
            
            <div class="flex flex-col items-center text-center">
                <div class="w-24 h-24 rounded-full border-4 border-white dark:border-slate-700 shadow-lg mb-4 overflow-hidden">
                    <img src="${user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random`}" class="w-full h-full object-cover">
                </div>
                
                <h2 class="text-xl font-bold text-slate-900 dark:text-white mb-1">${user.name}</h2>
                <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">${user.email || 'Student'}</p>
                
                <div class="grid grid-cols-2 gap-4 w-full mb-6">
                    <div class="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl">
                        <p class="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Score</p>
                        <p class="text-lg font-bold text-primary">${user.score}</p>
                    </div>
                    <div class="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl">
                        <p class="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Rank Change</p>
                        <div class="flex justify-center items-center gap-1 mt-0.5">
                            ${getRankChangeHtml(user.rankChange || 0)}
                        </div>
                    </div>
                </div>
                
                <div class="w-full pt-4 border-t border-slate-100 dark:border-slate-700">
                     <div class="text-xs text-slate-400 italic">Keep learning to improve your rank!</div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    if (typeof lucide !== 'undefined') lucide.createIcons();
};