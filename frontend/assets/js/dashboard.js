/**
 * Dashboard Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    updateGreeting();
    
    // Example: Animate progress bars on load
    const progressBars = document.querySelectorAll('.progress-bar-fill');
    progressBars.forEach(bar => {
        const width = bar.getAttribute('data-width');
        setTimeout(() => {
            bar.style.width = width;
        }, 300);
    });
});

function updateGreeting() {
    const hour = new Date().getHours();
    const greetingElement = document.querySelector('h1');
    let greeting = 'Welcome back';
    if (greetingElement) greetingElement.innerHTML = `${greeting}, John! 👋`;
}