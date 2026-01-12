/**
 * Main Application Logic
 * Handles global interactions like theme toggling.
 */

// Dark Mode Initialization
if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
} else {
    document.documentElement.classList.remove('dark');
}

document.addEventListener('DOMContentLoaded', () => {
    // Inject CSS for smooth theme transition
    const transitionStyle = document.createElement('style');
    transitionStyle.textContent = `
        .theme-transition, .theme-transition *, .theme-transition *:before, .theme-transition *:after {
            transition-property: background-color, border-color, color, fill, stroke, opacity, box-shadow !important;
            transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1) !important;
            transition-duration: 300ms !important;
        }
    `;
    document.head.appendChild(transitionStyle);

    // Initialize any global tooltips or state here
    console.log('Glorious Study Point App Initialized');

    // --- Branding & Logo Update (Glorious Study Point) ---
    const appName = 'Glorious Study Point';
    const logoPath = 'assets/images/logo.jpeg';

    // 1. Update Page Title
    document.title = document.title.replace(/EduSecure/g, appName);
    if (!document.title.includes(appName)) document.title += ` | ${appName}`;

    // 2. Universal Text Replacement
    function replaceText(node) {
        if (node.nodeType === 3) { // Text Node
            if (node.nodeValue.includes('EduSecure')) {
                node.nodeValue = node.nodeValue.replace(/EduSecure/g, appName);
            }
        } else if (node.nodeType === 1 && node.tagName !== 'SCRIPT' && node.tagName !== 'STYLE') {
            node.childNodes.forEach(replaceText);
        }
    }
    if (document.body) replaceText(document.body);

    // 3. Update Logo & Ensure Mobile Friendliness
    const logos = document.querySelectorAll('img');
    logos.forEach(img => {
        // Skip user profile images
        if (img.id === 'profile-image' || img.id === 'sidebar-user-img') return;
        
        if (img.src.includes('logo') || (img.alt && img.alt.toLowerCase().includes('logo')) || (img.className && img.className.includes('logo'))) {
            img.src = logoPath;
            img.alt = `${appName} Logo`;
            // Mobile friendly styles
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
            img.style.maxHeight = '50px'; // Keep navbar logo size reasonable
            img.style.objectFit = 'contain';
        }
    });

    // Example: Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Load saved profile image
    const profileImg = document.getElementById('profile-image');
    const savedImage = localStorage.getItem('profileImage');
    if (savedImage && profileImg) {
        profileImg.src = savedImage;
    }

    // Update Sidebar Profile
    const sidebarName = document.getElementById('sidebar-user-name');
    const sidebarImg = document.getElementById('sidebar-user-img');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (user.name) {
        if (sidebarName) sidebarName.textContent = user.name;
        if (sidebarImg) {
            // Use saved profile image or generate avatar
            sidebarImg.src = savedImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=2563EB&color=fff`;
            sidebarImg.alt = `${user.name}'s Profile Picture`;
        }
    }

    // Load Profile Data from DB
    const profileName = document.getElementById('profile-name');
    const profileDetails = document.getElementById('profile-details');
    
    if (profileName || sidebarName) {
        const token = localStorage.getItem('token');
        if (!token) {
            // Redirect to login if no token
            alert('You must be logged in to view this page.');
            window.location.href = 'login.html';
            return;
        }

        fetch('/api/users/profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(res => {
            if (res.status === 401) {
                localStorage.removeItem('token');
                window.location.href = 'login.html';
                throw new Error('Session expired');
            }
            if (!res.ok) throw new Error('Server Error');
            return res.json();
        })
        .then(res => {
            if (res.success) {
                const user = res.data;
                
                if (profileName) profileName.textContent = user.name;
                if (profileDetails) {
                    profileDetails.textContent = `Class ${user.studentClass || 'N/A'} • ${user.stream || 'General'} Stream`;
                    if (document.getElementById('profile-bio')) {
                        document.getElementById('profile-bio').textContent = user.bio || 'No bio added yet.';
                    }
                }
                
                // Populate Edit Form Fields if they exist
                if (document.getElementById('edit-name')) document.getElementById('edit-name').value = user.name;
                if (document.getElementById('edit-class')) document.getElementById('edit-class').value = user.studentClass;
                if (document.getElementById('edit-stream')) document.getElementById('edit-stream').value = user.stream;
                if (document.getElementById('edit-bio')) document.getElementById('edit-bio').value = user.bio || '';

                if (user.profileImage && profileImg) {
                    profileImg.src = user.profileImage;
                    localStorage.setItem('profileImage', user.profileImage);
                } else if (user.name && profileImg) {
                    // Fallback to UI Avatars with user's name if no custom image
                    profileImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=2563EB&color=fff&size=128`;
                }

                // Update Sidebar (Global)
                if (sidebarName) sidebarName.textContent = user.name;
                if (sidebarImg) {
                    if (user.profileImage) {
                        sidebarImg.src = user.profileImage;
                    } else {
                        sidebarImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=2563EB&color=fff`;
                    }
                    sidebarImg.alt = `${user.name}'s Profile Picture`;
                }

                // Update Local Storage
                localStorage.setItem('user', JSON.stringify(user));
            } else {
                if (profileName) profileName.textContent = 'Error';
                if (profileDetails) profileDetails.textContent = 'Could not load profile data.';
            }
        })
        .catch(err => {
            console.error('Error loading profile:', err);
            if (err.message === 'Session expired') return;

            if (err.message === 'Server Error') {
                if (profileName) profileName.textContent = 'Server Error';
                if (profileDetails) profileDetails.textContent = 'Something went wrong on the server.';
            } else {
                if (profileName) profileName.textContent = 'Connection Error';
                if (profileDetails) profileDetails.textContent = 'Ensure backend is running.';
            }
        });
    }
});

// Global Theme Toggle Function
window.toggleTheme = function() {
    document.documentElement.classList.add('theme-transition');

    if (document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark');
        localStorage.theme = 'light';
    } else {
        document.documentElement.classList.add('dark');
        localStorage.theme = 'dark';
    }

    setTimeout(() => {
        document.documentElement.classList.remove('theme-transition');
    }, 300);
};

// Toggle Password Visibility
window.togglePassword = function(inputId) {
    const input = document.getElementById(inputId);
    if (input) {
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        
        // Toggle Icon
        const btn = input.nextElementSibling;
        if (btn && btn.tagName === 'BUTTON') {
            btn.innerHTML = isPassword ? '<i data-lucide="eye-off" class="w-5 h-5"></i>' : '<i data-lucide="eye" class="w-5 h-5"></i>';
            lucide.createIcons();
        }
    }
};

// Toggle Notification Dropdown
window.toggleNotifications = function() {
    const dropdown = document.getElementById('notification-dropdown');
    if (dropdown) {
        dropdown.classList.toggle('hidden');
    }
};

// Profile Image Upload Logic
window.triggerProfileUpload = function() {
    document.getElementById('profile-upload').click();
};

window.previewProfileImage = function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const base64Image = e.target.result;
            const img = document.getElementById('profile-image');
            if (img) img.src = base64Image;
            
            localStorage.setItem('profileImage', base64Image);
            // Save to DB
            const token = localStorage.getItem('token');
            if (token) {
                fetch('/api/users/profile', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ profileImage: base64Image })
                })
                .then(res => res.json())
                .then(data => {
                    if(data.success) console.log('Profile image saved to DB');
                })
                .catch(err => console.error('Error saving image:', err));
            }
        };
        reader.readAsDataURL(file);
    }
};

// --- Profile Edit Logic ---

window.toggleEditProfile = function() {
    const viewMode = document.getElementById('profile-view-mode');
    const editMode = document.getElementById('profile-edit-mode');
    
    if (viewMode && editMode) {
        viewMode.classList.toggle('hidden');
        editMode.classList.toggle('hidden');
    }
};

window.saveProfileChanges = async function(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerText;
    btn.innerText = 'Saving...';
    btn.disabled = true;

    const name = document.getElementById('edit-name').value;
    const studentClass = document.getElementById('edit-class').value;
    const stream = document.getElementById('edit-stream').value;
    const bio = document.getElementById('edit-bio').value;
    const token = localStorage.getItem('token');

    try {
        const response = await fetch('/api/users/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name, studentClass, stream, bio })
        });
        const data = await response.json();

        if (data.success) {
            // Update Local Storage
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            user.name = name;
            user.studentClass = studentClass;
            user.stream = stream;
            user.bio = bio;
            localStorage.setItem('user', JSON.stringify(user));

            // Reload page to reflect changes
            window.location.reload();
        } else {
            alert(data.message || 'Failed to update profile');
        }
    } catch (error) {
        console.error('Profile update error:', error);
        alert('Server error');
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
};

// --- Student Notes Logic ---

window.loadStudentNotes = async function() {
    const container = document.getElementById('notes-container');
    if (!container) return;

    const subject = document.getElementById('filter-subject')?.value || 'all';
    const search = document.getElementById('search-notes')?.value || '';
    const token = localStorage.getItem('token');
    
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
        const response = await fetch(`/api/notes?subject=${subject}&search=${search}`, {
            headers: headers
        });
        const data = await response.json();

        if (data.success) {
            if (data.data.length === 0) {
                container.innerHTML = '<div class="col-span-full text-center py-12 text-slate-500">No notes found.</div>';
                return;
            }

            container.innerHTML = data.data.map(note => `
                <div class="card hover:shadow-md transition-shadow">
                    <div class="flex items-start justify-between mb-4">
                        <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-primary">
                            <i data-lucide="file-text" class="w-5 h-5"></i>
                        </div>
                        <span class="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold px-2 py-1 rounded">${note.subjectId?.name || 'General'}</span>
                    </div>
                    <h3 class="font-bold text-lg mb-2 text-dark dark:text-white">${note.title}</h3>
                    <p class="text-slate-500 dark:text-slate-400 text-sm mb-4">Uploaded on ${new Date(note.createdAt).toLocaleDateString()}</p>
                    <a href="${note.content || note.fileUrl}" download="${note.title}.pdf" onclick="trackDownload('${note._id}')" class="btn-primary w-full py-2 flex items-center justify-center gap-2 shadow-sm">
                        <i data-lucide="download" class="w-4 h-4"></i> Download PDF
                    </a>
                </div>
            `).join('');
            if (typeof lucide !== 'undefined') lucide.createIcons();
        } else {
            container.innerHTML = `<div class="col-span-full text-center py-12 text-red-500">${data.message || 'Failed to load notes.'}</div>`;
        }
    } catch (error) {
        console.error('Error loading notes:', error);
        container.innerHTML = '<div class="col-span-full text-center py-12 text-red-500">Failed to load notes.</div>';
    }
};

window.trackDownload = async function(noteId) {
    const token = localStorage.getItem('token');
    try {
        await fetch(`/api/notes/${noteId}/download`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            keepalive: true // Ensures request completes even if page unloads
        });
    } catch (error) {
        console.error('Error tracking download:', error);
    }
};

window.logout = function() {
    showConfirm('Are you sure you want to logout?', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    });
};

// Auto-load notes if on notes page
function initNotes() {
    if (document.getElementById('notes-container')) {
        loadStudentNotes();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNotes);
} else {
    initNotes();
}

// --- Global Security (Anti-Screenshot/Copy) ---

// Disable Right Click
document.addEventListener('contextmenu', e => e.preventDefault());

// Disable Keyboard Shortcuts (PrintScreen, Ctrl+P, Ctrl+S)
document.addEventListener('keydown', e => {
    if (e.key === 'PrintScreen') {
        try { navigator.clipboard.writeText(''); } catch(err) {}
        alert('Screenshots are disabled!');
        e.preventDefault();
    }
    if (e.ctrlKey && (e.key === 'p' || e.key === 's' || (e.shiftKey && e.key === 's'))) {
        e.preventDefault();
    }
});

// Disable Copy/Cut (Allow Paste for login forms)
document.addEventListener('copy', e => e.preventDefault());
document.addEventListener('cut', e => e.preventDefault());

// --- Custom Toast & Confirm Logic ---

// Create Toast Container
const toastContainer = document.createElement('div');
toastContainer.id = 'toast-container';
document.body.appendChild(toastContainer);

window.showToast = function(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = '';
    if (type === 'success') icon = '<i data-lucide="check-circle" class="w-5 h-5 text-green-500"></i>';
    else if (type === 'error') icon = '<i data-lucide="alert-circle" class="w-5 h-5 text-red-500"></i>';
    else if (type === 'warning') icon = '<i data-lucide="alert-triangle" class="w-5 h-5 text-yellow-500"></i>';
    else icon = '<i data-lucide="info" class="w-5 h-5 text-blue-500"></i>';

    toast.innerHTML = `
        ${icon}
        <span class="text-sm font-medium">${message}</span>
    `;

    toastContainer.appendChild(toast);
    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Auto remove
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease-out forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

// Custom Confirm Modal
window.showConfirm = function(message, onConfirm) {
    // Remove existing modal if any
    const existing = document.getElementById('custom-confirm-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'custom-confirm-modal';
    modal.className = 'fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in';
    
    modal.innerHTML = `
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-700 transform scale-100 transition-transform">
            <div class="flex flex-col items-center text-center mb-6">
                <div class="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center text-yellow-600 mb-4">
                    <i data-lucide="help-circle" class="w-6 h-6"></i>
                </div>
                <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2">Are you sure?</h3>
                <p class="text-slate-500 dark:text-slate-400 text-sm">${message}</p>
            </div>
            <div class="flex gap-3">
                <button id="confirm-cancel" class="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                <button id="confirm-yes" class="flex-1 py-2.5 rounded-xl bg-primary text-white font-medium hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20">Yes, Proceed</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    if (typeof lucide !== 'undefined') lucide.createIcons();

    document.getElementById('confirm-cancel').onclick = () => modal.remove();
    document.getElementById('confirm-yes').onclick = () => {
        modal.remove();
        onConfirm();
    };
};

// Override default alert
window.alert = function(message) {
    showToast(message, 'info');
};