/**
 * Authentication Logic
 * Handles login and signup form submissions.
 */

async function handleLogin(e) {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    
    // Use specific IDs to avoid null errors
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');

    if (!emailInput || !passwordInput) return;

    const email = emailInput.value;
    const password = passwordInput.value;

    // Simulate loading
    btn.innerHTML = `<span class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span> Signing in...`;
    btn.disabled = true;

    try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.data.token);
            localStorage.setItem('user', JSON.stringify(data.data.user));
            window.location.href = 'dashboard.html';
        } else {
            showToast(data.message || 'Login failed', 'error');
            form.querySelector('input[type="password"]').value = ''; // Clear password on error
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Server connection failed. Ensure backend is running.', 'error');
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

async function handleSignup(e) {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;

    // Use specific IDs to ensure elements are found
    const nameInput = document.getElementById('signup-name');
    const emailInput = document.getElementById('signup-email');
    const passwordInput = document.getElementById('signup-password');
    const classInput = document.getElementById('student-class');
    const streamInput = document.getElementById('student-stream');

    if (!nameInput || !emailInput || !passwordInput || !classInput || !streamInput) {
        showToast('Error: Form fields missing. Please refresh.', 'error');
        return;
    }

    const name = nameInput.value;
    const email = emailInput.value;
    const password = passwordInput.value;
    const studentClass = classInput.value;
    const stream = streamInput.value;

    // Simulate loading
    btn.innerHTML = `<span class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span> Creating Account...`;
    btn.disabled = true;

    try {
        const response = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, studentClass, stream })
        });

        const data = await response.json();

        if (response.ok) {
            showToast('Account created! Please login.', 'success');
            window.location.href = 'login.html';
        } else {
            showToast(data.message || 'Signup failed', 'error');
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Server connection failed.', 'error');
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

async function handleAdminLogin(e) {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;

    // Simulate loading
    btn.innerHTML = `<span class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span> Verifying...`;
    btn.disabled = true;

    try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            if (data.data.user.role === 'admin') {
                localStorage.setItem('adminToken', data.data.token);
                localStorage.setItem('adminUser', JSON.stringify(data.data.user));
                window.location.href = 'admin-dashboard.html';
            } else {
                showToast('Access Denied: You do not have admin privileges.', 'error');
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        } else {
            showToast(data.message || 'Login failed', 'error');
            document.getElementById('admin-password').value = '';
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Server connection failed.', 'error');
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}