// auth-modal.js
let isLoginMode = true;

// Definir funciones primero
function closeAuthModal() {
    const modal = document.getElementById('authModal');
    const overlay = document.getElementById('modalOverlay');
    if (modal) modal.style.display = 'none';
    if (overlay) overlay.style.display = 'none';
    const messageDiv = document.getElementById('authMessage');
    if (messageDiv) messageDiv.textContent = '';
}

function showAuthModal() {
    const modal = document.getElementById('authModal');
    const overlay = document.getElementById('modalOverlay');
    if (modal) modal.style.display = 'block';
    if (overlay) overlay.style.display = 'block';
}

function updateAuthMode() {
    const authTitle = document.getElementById('authTitle');
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const switchBtn = document.getElementById('switchAuthBtn');
    const confirmGroup = document.getElementById('confirmPasswordGroup');
    
    if (isLoginMode) {
        if (authTitle) authTitle.textContent = 'Login';
        if (loginBtn) loginBtn.style.display = 'inline-block';
        if (registerBtn) registerBtn.style.display = 'none';
        if (switchBtn) switchBtn.textContent = 'Create Account';
        if (confirmGroup) confirmGroup.style.display = 'none';
    } else {
        if (authTitle) authTitle.textContent = 'Register';
        if (loginBtn) loginBtn.style.display = 'none';
        if (registerBtn) registerBtn.style.display = 'inline-block';
        if (switchBtn) switchBtn.textContent = 'Back to Login';
        if (confirmGroup) confirmGroup.style.display = 'block';
    }
}

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    updateAuthMode();
}

async function handleLogin() {
    const username = document.getElementById('username')?.value.trim();
    const password = document.getElementById('password')?.value;
    const messageDiv = document.getElementById('authMessage');
    
    if (!username || !password) {
        if (messageDiv) messageDiv.textContent = 'Please enter username and password';
        return;
    }
    
    const result = await loginUser(username, password);
    
    if (result.success) {
        if (messageDiv) {
            messageDiv.textContent = 'Login successful!';
            messageDiv.style.color = '#99ff99';
        }
        setTimeout(() => {
            closeAuthModal();
            location.reload();
        }, 1000);
    } else {
        if (messageDiv) {
            messageDiv.textContent = result.error;
            messageDiv.style.color = '#ff9999';
        }
    }
}

async function handleRegister() {
    const username = document.getElementById('username')?.value.trim();
    const password = document.getElementById('password')?.value;
    const confirmPassword = document.getElementById('confirmPassword')?.value;
    const messageDiv = document.getElementById('authMessage');
    
    if (!username || !password || !confirmPassword) {
        if (messageDiv) messageDiv.textContent = 'Please fill all fields';
        return;
    }
    
    if (password !== confirmPassword) {
        if (messageDiv) messageDiv.textContent = 'Passwords do not match';
        return;
    }
    
    if (password.length < 3) {
        if (messageDiv) messageDiv.textContent = 'Password must be at least 3 characters';
        return;
    }
    
    const result = await registerUser(username, password);
    
    if (result.success) {
        if (messageDiv) {
            messageDiv.textContent = 'Registration successful! You can now login.';
            messageDiv.style.color = '#99ff99';
        }
        setTimeout(() => {
            isLoginMode = true;
            updateAuthMode();
            const usernameInput = document.getElementById('username');
            const passwordInput = document.getElementById('password');
            const confirmInput = document.getElementById('confirmPassword');
            if (usernameInput) usernameInput.value = '';
            if (passwordInput) passwordInput.value = '';
            if (confirmInput) confirmInput.value = '';
            if (messageDiv) messageDiv.textContent = '';
        }, 2000);
    } else {
        if (messageDiv) {
            messageDiv.textContent = result.error;
            messageDiv.style.color = '#ff9999';
        }
    }
}

function setupAuthModal() {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const switchBtn = document.getElementById('switchAuthBtn');
    const closeBtn = document.getElementById('closeAuthBtn');
    
    if (loginBtn) loginBtn.onclick = handleLogin;
    if (registerBtn) registerBtn.onclick = handleRegister;
    if (switchBtn) switchBtn.onclick = toggleAuthMode;
    if (closeBtn) closeBtn.onclick = closeAuthModal;
    
    if (registerBtn) registerBtn.style.display = 'none';
    updateAuthMode();
}
