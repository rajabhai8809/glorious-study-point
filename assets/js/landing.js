document.addEventListener('DOMContentLoaded', () => {
    // --- Branding Update for Landing Page ---
    const appName = 'Glorious Study Point';
    const logoPath = 'assets/images/logo.jpeg';

    // 1. Update Page Title
    document.title = document.title.replace(/EduSecure/g, appName);

    // 2. Universal Text Replacement (Walks the entire DOM tree)
    function replaceText(node) {
        if (node.nodeType === 3) { // Text Node
            if (node.nodeValue.includes('EduSecure')) {
                node.nodeValue = node.nodeValue.replace(/EduSecure/g, appName);
            }
        } else if (node.nodeType === 1 && node.tagName !== 'SCRIPT' && node.tagName !== 'STYLE') { // Element Node
            node.childNodes.forEach(replaceText);
        }
    }
    replaceText(document.body);

    // 3. Aggressive Logo Replacement
    const logos = document.querySelectorAll('img');
    logos.forEach(img => {
        // Check src, alt, class, or id for "logo" keyword
        if (img.src.includes('logo') || 
            (img.alt && img.alt.toLowerCase().includes('logo')) || 
            (img.className && typeof img.className === 'string' && img.className.toLowerCase().includes('logo'))) {
            
            img.src = logoPath;
            img.alt = `${appName} Logo`;
            
            // Mobile Friendly Sizing
            img.style.maxHeight = '50px'; 
            img.style.width = 'auto';
            img.style.objectFit = 'contain';
        }
    });

    const grid = document.getElementById('subjects-grid');
    if (!grid) return;

    const subjects = [
        { name: 'Physics', icon: 'atom', count: '120+ Questions' },
        { name: 'Chemistry', icon: 'flask-conical', count: '150+ Questions' },
        { name: 'Mathematics', icon: 'calculator', count: '200+ Questions' },
        { name: 'Biology', icon: 'dna', count: '180+ Questions' },
        { name: 'English', icon: 'book-open', count: '100+ Questions' },
        { name: 'Computer Science', icon: 'monitor', count: '90+ Questions' },
        { name: 'History', icon: 'landmark', count: '80+ Questions' },
        { name: 'Geography', icon: 'globe', count: '85+ Questions' },
        { name: 'Economics', icon: 'bar-chart', count: '70+ Questions' },
        { name: 'Political Science', icon: 'scale', count: '60+ Questions' }
    ];

    grid.setAttribute('role', 'list'); // Semantic list for accessibility
    grid.innerHTML = subjects.map(subject => `
        <div role="listitem" tabindex="0" class="p-6 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg transition-all cursor-pointer group focus:ring-2 focus:ring-primary focus:outline-none">
            <div class="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform" aria-hidden="true">
                <i data-lucide="${subject.icon}" class="w-6 h-6"></i>
            </div>
            <h3 class="font-bold text-lg text-slate-900 dark:text-white mb-1 truncate" title="${subject.name}">${subject.name}</h3>
            <p class="text-sm text-slate-500 dark:text-slate-400">${subject.count}</p>
        </div>
    `).join('');

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});

window.toggleMobileMenu = function() {
    const menu = document.getElementById('mobile-menu');
    if (menu) {
        menu.classList.toggle('hidden');
    }
};