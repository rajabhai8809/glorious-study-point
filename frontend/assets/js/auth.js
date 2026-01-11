/**
 * Authentication Logic
 */

async function handleLogin(e) {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    const email = form.querySelector('input[type="email"]').value;
    const password = form.querySelector('input[type="password"]').value;
    
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

        if (data.success) {
            localStorage.setItem('token', data.data.token);
            localStorage.setItem('user', JSON.stringify(data.data.user));
            window.location.href = 'dashboard.html';
        } else {
            alert(data.message || 'Login failed');
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Server error during login');
        btn.disabled = false;
        btn.innerHTML = originalText;
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

        if (data.success) {
            if (data.data.user.role === 'admin') {
                localStorage.setItem('token', data.data.token);
                localStorage.setItem('user', JSON.stringify(data.data.user));
                window.location.href = 'admin-dashboard.html';
            } else {
                alert('Access Denied: You do not have admin privileges.');
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        } else {
            alert(data.message || 'Login failed');
            document.getElementById('admin-password').value = '';
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    } catch (error) {
        console.error('Admin Login error:', error);
        alert('Server connection failed');
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

async function handleSignup(e) {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;

    const name = form.querySelector('input[placeholder="John Doe"]')?.value || form.querySelector('input[type="text"]').value;
    const email = form.querySelector('input[type="email"]').value;
    const password = form.querySelector('input[type="password"]').value;
    const studentClass = document.getElementById('student-class')?.value;
    const stream = document.getElementById('student-stream')?.value;

    btn.innerHTML = `<span class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span> Creating Account...`;
    btn.disabled = true;

    try {
        const response = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, studentClass, stream })
        });
        const data = await response.json();

        if (data.success) {
            alert("Account created successfully! Redirecting to login...");
            window.location.href = 'login.html';
        } else {
            alert(data.message || 'Signup failed');
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    } catch (error) {
        console.error('Signup error:', error);
        alert('Server error during signup');
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}