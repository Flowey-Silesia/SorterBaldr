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

// Al hacer login exitoso, guardar y mostrar
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
        
        // Cerrar modal
        closeAuthModal();
        
        // NO hacer location.reload()
        // En su lugar, actualizar la UI manualmente
        setTimeout(() => {
            // Actualizar la interfaz para mostrar el usuario logueado
            if (typeof configureLoadButton === 'function') {
                configureLoadButton();
            }
            // Limpiar campos
            document.getElementById('username').value = '';
            document.getElementById('password').value = '';
            if (messageDiv) messageDiv.textContent = '';
        }, 500);
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
        
        // Cambiar a modo login automáticamente
        setTimeout(() => {
            isLoginMode = true;
            updateAuthMode();
            document.getElementById('username').value = username;
            document.getElementById('password').value = '';
            document.getElementById('confirmPassword').value = '';
            if (messageDiv) messageDiv.textContent = '';
            
            // Opcional: hacer login automático después de registrar
            // loginUser(username, password).then(() => {
            //     closeAuthModal();
            //     configureLoadButton();
            // });
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

function updateUserDisplay() {
    const user = getCurrentUser();
    const container = document.querySelector('.button-container');
    
    // Eliminar botón de login si existe
    const oldLoginBtn = document.getElementById('cloudLoginBtn');
    if (oldLoginBtn) oldLoginBtn.remove();
    
    if (user) {
        // Crear indicador de usuario logueado
        let userDisplay = document.getElementById('userDisplay');
        if (!userDisplay) {
            userDisplay = document.createElement('div');
            userDisplay.id = 'userDisplay';
            userDisplay.className = 'user-display';
            container.insertBefore(userDisplay, container.firstChild);
        }
        userDisplay.innerHTML = `✅ ${user.username} | <span onclick="logout()" style="cursor:pointer; color:#ff9999;">🚪 Logout</span>`;
        
        // Cambiar color del botón cloud load
        const cloudLoadBtn = document.getElementById('cloudLoadBtn');
        if (cloudLoadBtn) {
            cloudLoadBtn.style.backgroundColor = '#2d6a4f';
            cloudLoadBtn.textContent = '☁️ Load Cloud';
        }
    } else {
        const userDisplay = document.getElementById('userDisplay');
        if (userDisplay) userDisplay.remove();
        
        // Volver a agregar botón de login
        if (!document.getElementById('cloudLoginBtn')) {
            const loginBtn = document.createElement('button');
            loginBtn.id = 'cloudLoginBtn';
            loginBtn.className = 'basic-button';
            loginBtn.textContent = '☁️ Login';
            loginBtn.style.backgroundColor = '#1e3a8a';
            loginBtn.onclick = showAuthModal;
            container.appendChild(loginBtn);
        }
    }
}
