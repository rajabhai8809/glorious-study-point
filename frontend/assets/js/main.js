/**
 * Main Application Logic
 */

// Dark Mode Initialization
if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
} else {
    document.documentElement.classList.remove('dark');
}

document.addEventListener('DOMContentLoaded', () => {
    // Initialize any global tooltips or state here
    console.log('EduSecure App Initialized');

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

    // Load Profile Data from DB
    const profileName = document.getElementById('profile-name');
    const profileDetails = document.getElementById('profile-details');
    
    if (profileName && profileDetails) {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('You must be logged in to view this page.');
            window.location.href = 'login.html';
            return;
        }

        fetch('http://localhost:5000/api/users/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => {
            if (res.status === 401) {
                localStorage.removeItem('token');
                alert('Session expired. Please login again.');
                window.location.href = 'login.html';
                throw new Error('Session expired');
            }
            if (!res.ok) throw new Error('Failed to fetch profile');
            return res.json();
        })
        .then(res => {
            if (res.success) {
                const user = res.data;
                profileName.textContent = user.name;
                profileDetails.textContent = `Class ${user.studentClass || 'N/A'} • ${user.stream || 'General'} Stream`;
                if (user.profileImage && profileImg) {
                    profileImg.src = user.profileImage;
                    localStorage.setItem('profileImage', user.profileImage);
                }
            } else {
                profileName.textContent = 'Error';
                profileDetails.textContent = 'Could not load profile data.';
            }
        })
        .catch(err => {
            console.error('Error loading profile:', err);
            profileName.textContent = 'Connection Error';
            profileDetails.textContent = 'Ensure backend is running.';
        });
    }
});

// Global Theme Toggle Function
window.toggleTheme = function() {
    if (document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark');
        localStorage.theme = 'light';
    } else {
        document.documentElement.classList.add('dark');
        localStorage.theme = 'dark';
    }
};

// Toggle Password Visibility
window.togglePassword = function(inputId) {
    const input = document.getElementById(inputId);
    if (input) {
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        
        const btn = input.nextElementSibling;
        if (btn && btn.tagName === 'BUTTON') {
            btn.innerHTML = isPassword ? '<i data-lucide="eye-off" class="w-5 h-5"></i>' : '<i data-lucide="eye" class="w-5 h-5"></i>';
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
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
            
            // Save to DB
            const token = localStorage.getItem('token');
            if (token) {
                fetch('http://localhost:5000/api/users/profile', {
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