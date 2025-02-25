var LoginApp = {
    init: function() {
        this.baseUrl = 'http://localhost:8001/api/v1/';
        // Check if already logged in
        if (localStorage.getItem('access_token')) {
            window.location.href = '/index.html';
            return;
        }
        this.showLoginPage();
        this.setupEventListeners();
    },

    showLoginPage: function() {
        var content = document.getElementById('content');
        content.innerHTML = `
            <div class="login-container">
                <div class="text-center mb-4">
                    <img src="/assets/images/fastapi-logo.svg" alt="Logo" class="login-logo">
                </div>
                <h2 class="login-title text-center">Command Fund Management</h2>
                <form id="loginForm" class="login-form">
                    <div class="form-group">
                        <label class="form-label">Username</label>
                        <div class="input-group">
                            <span class="input-group-text">
                                <svg class="icon" viewBox="0 0 24 24">
                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                </svg>
                            </span>
                            <input 
                                type="text" 
                                id="username"
                                class="form-control" 
                                placeholder="Enter your username"
                                required
                            >
                        </div>
                        <div class="error-message username-error"></div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Password</label>
                        <div class="input-group">
                            <span class="input-group-text">
                                <svg class="icon" viewBox="0 0 24 24">
                                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                                </svg>
                            </span>
                            <input 
                                type="password" 
                                id="password"
                                class="form-control" 
                                placeholder="Enter your password"
                                required
                            >
                            <button type="button" class="btn btn-outline toggle-password">Show</button>
                        </div>
                        <div class="error-message password-error"></div>
                    </div>
                    <div class="form-group text-end">
                        <a href="/recover-password" class="forgot-link">Forgot password?</a>
                    </div>
                    <button type="submit" class="btn btn-primary btn-block">
                        <span class="normal-text">Login</span>
                        <span class="loading-text d-none">
                            <span class="spinner"></span>
                        </span>
                    </button>
                    <div class="signup-link text-center">
                        Don't have an account? <a href="/signup">Sign up</a>
                    </div>
                </form>
            </div>
        `;
    },

    setupEventListeners: function() {
        var form = document.getElementById('loginForm');
        var togglePasswordBtn = form.querySelector('.toggle-password');
        var passwordInput = document.getElementById('password');

        form.onsubmit = this.handleLogin.bind(this);
        
        // Toggle password visibility
        togglePasswordBtn.onclick = function() {
            var isPassword = passwordInput.type === 'password';
            passwordInput.type = isPassword ? 'text' : 'password';
            togglePasswordBtn.textContent = isPassword ? 'Hide' : 'Show';
        };

        // Input validation
        form.querySelectorAll('input').forEach(function(input) {
            input.addEventListener('blur', function() {
                if (!input.value && input.required) {
                    input.classList.add('is-invalid');
                    var errorDiv = input.parentElement.querySelector('.invalid-feedback') || 
                                 input.parentElement.parentElement.querySelector('.invalid-feedback');
                    errorDiv.textContent = input.id.charAt(0).toUpperCase() + input.id.slice(1) + ' is required';
                }
            });

            input.addEventListener('input', function() {
                input.classList.remove('is-invalid');
            });
        });
    },

    handleLogin: function(event) {
        event.preventDefault();
        var self = this;
        var form = event.target;
        var submitBtn = form.querySelector('button[type="submit"]');
        var normalText = submitBtn.querySelector('.normal-text');
        var loadingText = submitBtn.querySelector('.loading-text');

        // Clear previous errors
        form.querySelectorAll('.is-invalid').forEach(function(el) {
            el.classList.remove('is-invalid');
        });
        form.querySelectorAll('.error-message').forEach(function(el) {
            el.textContent = '';
        });

        var username = form.username.value;
        var password = form.password.value;

        // Validate inputs
        if (!username || !password) {
            if (!username) {
                form.username.classList.add('is-invalid');
                form.querySelector('.username-error').textContent = 'Username is required';
            }
            if (!password) {
                form.password.classList.add('is-invalid');
                form.querySelector('.password-error').textContent = 'Password is required';
            }
            return;
        }

        // Show loading state
        submitBtn.disabled = true;
        normalText.classList.add('d-none');
        loadingText.classList.remove('d-none');

        ApiClient.login(username, password)
            .then(function(response) {
                if (response.access_token) {
                    localStorage.setItem('access_token', response.access_token);
                    return ApiClient.getMe();
                } else {
                    throw new Error('Invalid response format');
                }
            })
            .then(function(userData) {
                localStorage.setItem('currentUser', JSON.stringify(userData));
                sessionStorage.setItem("selectedUserId", userData.id);
                sessionStorage.setItem("selectedUserName", userData.username);
                window.location.href = '/index.html';
            })
            .catch(function(error) {
                console.error('Login error:', error);
                var errorMessage;

                if (error.message.includes('422')) {
                    errorMessage = 'Invalid username or password format';
                } else if (error.message.includes('401')) {
                    errorMessage = 'Incorrect username or password';
                } else {
                    errorMessage = 'Login failed. Please try again.';
                }

                self.showFormError(errorMessage);
            })
            .finally(function() {
                submitBtn.disabled = false;
                normalText.classList.remove('d-none');
                loadingText.classList.add('d-none');
            });
    },

    // Add this new method to show form-level errors
    showFormError: function(message) {
        var form = document.getElementById('loginForm');
        var existingAlert = form.querySelector('.alert');
        if (existingAlert) {
            existingAlert.remove();
        }

        var alert = document.createElement('div');
        alert.className = 'alert alert-error';
        alert.innerHTML = `
            <div class="alert-content">
                <svg class="icon" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
                <span>${message}</span>
            </div>
            <button type="button" class="alert-close" onclick="this.parentElement.remove()">×</button>
        `;
        
        form.insertBefore(alert, form.firstChild);

        // Auto-remove alert after 5 seconds
        setTimeout(function() {
            if (alert.parentElement) {
                alert.remove();
            }
        }, 5000);
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    LoginApp.init();
}); 