document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
});

async function loadSettings() {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch('/api/users/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
            document.getElementById('notification-toggle').checked = data.data.notificationsEnabled;
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

async function toggleNotificationSettings() {
    const token = localStorage.getItem('token');
    try {
        await fetch('/api/users/notifications/toggle', {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
    } catch (error) {
        console.error('Error toggling notifications:', error);
    }
}

async function handleChangePassword(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerText;

    if (newPassword !== confirmPassword) {
        alert("New passwords do not match!");
        return;
    }

    btn.innerText = 'Updating...';
    btn.disabled = true;

    const token = localStorage.getItem('token');

    try {
        const response = await fetch('/api/users/change-password', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ currentPassword, newPassword })
        });
        const data = await response.json();

        alert(data.message);
        if (data.success) {
            e.target.reset();
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Server error');
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}