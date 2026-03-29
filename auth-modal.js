// auth-modal.js
let isLoginMode = true;

function setupAuthModal() {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const switchBtn = document.getElementById('switchAuthBtn');
    const closeBtn = document.getElementById('closeAuthBtn');
    const authTitle = document.getElementById('authTitle');
    const confirmGroup = document.getElementById('confirmPasswordGroup');
    
    loginBtn.onclick = handleLogin;
    registerBtn.onclick = handleRegister;
    switchBtn.onclick = toggleAuthMode;
    closeBtn.onclick = closeAuthModal;
    
    registerBtn.style.display = 'none';
    updateAuthMode();
}

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    updateAuthMode();
}

function updateAuthMode() {
    const authTitle = document.getElementById('authTitle');
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const switchBtn = document.getElementById('switchAuthBtn');
    const confirmGroup = document.getElementById('confirmPasswordGroup');
    
    if (isLoginMode) {
        authTitle.textContent = 'Login';
        loginBtn.style.display = 'inline-block';
        registerBtn.style.display = 'none';
        switchBtn.textContent = 'Create Account';
        confirmGroup.style.display = 'none';
    } else {
        authTitle.textContent = 'Register';
        loginBtn.style.display = 'none';
        registerBtn.style.display = 'inline-block';
        switchBtn.textContent = 'Back to Login';
        confirmGroup.style.display = 'block';
    }
}

async function handleLogin() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const messageDiv = document.getElementById('authMessage');
    
    if (!username || !password) {
        messageDiv.textContent = 'Please enter username and password';
        return;
    }
    
    const result = await loginUser(username, password);
    
    if (result.success) {
        messageDiv.textContent = 'Login successful!';
        messageDiv.style.color = '#99ff99';
        closeAuthModal();
        location.reload(); // Recargar para mostrar la interfaz correcta
    } else {
        messageDiv.textContent = result.error;
        messageDiv.style.color = '#ff9999';
    }
}

async function handleRegister() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const messageDiv = document.getElementById('authMessage');
    
    if (!username || !password || !confirmPassword) {
        messageDiv.textContent = 'Please fill all fields';
        return;
    }
    
    if (password !== confirmPassword) {
        messageDiv.textContent = 'Passwords do not match';
        return;
    }
    
    if (password.length < 3) {
        messageDiv.textContent = 'Password must be at least 3 characters';
        return;
    }
    
    const result = await registerUser(username, password);
    
    if (result.success) {
        messageDiv.textContent = 'Registration successful! You can now login.';
        messageDiv.style.color = '#99ff99';
        setTimeout(() => {
            isLoginMode = true;
            updateAuthMode();
            document.getElementById('username').value = '';
            document.getElementById('password').value = '';
            document.getElementById('confirmPassword').value = '';
        }, 2000);
    } else {
        messageDiv.textContent = result.error;
        messageDiv.style.color = '#ff9999';
    }
}