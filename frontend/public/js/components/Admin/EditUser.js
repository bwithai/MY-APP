var EditUser = {
    init: function(user, onSuccess) {
        // Store user data and callback
        this.user = user;
        this.onSuccess = onSuccess;
        
        // Clear any existing modal first
        this.cleanup();

        // Add CSS for form styling
        this.addStyles();
        
        // Render the modal with user data
        this.render();

        // Wait for DOM to be ready before setting up events
        var self = this;
        setTimeout(function() {
            self.setupEventListeners();
        }, 0);
    },

    cleanup: function() {
        Utils.cleanup('editUserModal');
        // Remove any added styles
        var styleElement = document.getElementById('editUserStyles');
        if (styleElement) {
            styleElement.remove();
        }
    },

    addStyles: function() {
        // Create a style element to add necessary CSS
        var style = document.createElement('style');
        style.id = 'editUserStyles';
        style.textContent = `
            .checkbox-group {
                display: flex;
                justify-content: space-between;
                width: 100%;
                margin-top: 20px;
                grid-column: 1 / -1;
            }
            .checkbox-container {
                display: flex;
                align-items: center;
            }
            .checkbox-container input[type="checkbox"] {
                margin-right: 5px;
            }
            .checkbox-container label {
                margin-bottom: 0;
                margin-left: 5px;
            }
            .form-text {
                font-size: 12px;
                margin-top: 5px;
            }
            .error {
                border-color: #ff0000 !important;
            }
        `;
        document.head.appendChild(style);
    },

    render: function() {
        var modalHtml = '<div class="modal" id="editUserModal">' +
            '<div class="modal-content">' +
                '<div class="modal-header">' +
                    '<h2>Edit User</h2>' +
                    '<button type="button" class="close-btn">&times;</button>' +
                '</div>' +
                '<div class="modal-body">' +
                    '<form id="editUserForm" class="modal-form-grid">' +
                        '<div class="form-group">' +
                            Utils.createLabel('email', 'Email', true) +
                            '<input type="email" id="email" name="email" required value="' + (this.user.email || '') + '">' +
                            '<small class="form-text email-error" style="display: none; color: red;">Please enter a valid email address</small>' +
                        '</div>' +

                        '<div class="form-group">' +
                            Utils.createLabel('full_name', 'Full name', false) +
                            '<input type="text" id="full_name" name="full_name" value="' + (this.user.full_name || '') + '">' +
                        '</div>' +

                        '<div class="form-group">' +
                            Utils.createLabel('password', 'Set Password', false) +
                            '<input type="password" id="password" name="password" minlength="8">' +
                            '<small class="form-text password-error" style="display: none; color: red;">Password must be at least 8 characters</small>' +
                        '</div>' +

                        '<div class="form-group">' +
                            Utils.createLabel('confirm_password', 'Confirm Password', false) +
                            '<input type="password" id="confirm_password" name="confirm_password">' +
                            '<small class="form-text password-match-error" style="display: none; color: red;">The passwords do not match</small>' +
                        '</div>' +

                        '<div class="checkbox-group">' +
                            '<div class="checkbox-container">' +
                                '<input type="checkbox" id="is_superuser" name="is_superuser" ' + (this.user.is_superuser ? 'checked' : '') + '>' +
                                '<label for="is_superuser">Is superuser?</label>' +
                            '</div>' +
                            '<div style="margin-left: 340px; margin-top: -20px;" class="checkbox-container">' +
                                '<input type="checkbox" id="is_active" name="is_active" ' + (this.user.is_active ? 'checked' : '') + '>' +
                                '<label for="is_active">Is active?</label>' +
                            '</div>' +
                        '</div>' +
                    '</form>' +
                '</div>' +
                '<div class="modal-footer">' +
                    '<button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>' +
                    '<button type="submit" form="editUserForm" class="btn btn-primary" id="saveUser">Save</button>' +
                '</div>' +
            '</div>' +
        '</div>';
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    setupEventListeners: function() {
        var self = this;
        var modal = document.getElementById('editUserModal');

        if (!modal) {
            console.error('Modal not found');
            return;
        }

        var form = document.getElementById('editUserForm');
        var emailInput = document.getElementById('email');
        var passwordInput = document.getElementById('password');
        var confirmPasswordInput = document.getElementById('confirm_password');
        var closeBtn = modal.querySelector('.close-btn');
        var cancelBtn = modal.querySelector('[data-dismiss="modal"]');

        if (closeBtn) {
            closeBtn.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                self.close();
            };
        }

        if (cancelBtn) {
            cancelBtn.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                self.close();
            };
        }

        if (emailInput) {
            emailInput.addEventListener('blur', function() {
                self.validateEmail();
            });
        }

        if (passwordInput) {
            passwordInput.addEventListener('input', function() {
                if (this.value) {
                    self.validatePasswordLength();
                } else {
                    document.querySelector('.password-error').style.display = 'none';
                }
            });
            
            passwordInput.addEventListener('blur', function() {
                if (this.value) {
                    self.validatePasswordLength();
                    if (confirmPasswordInput.value) {
                        self.validatePasswordsMatch();
                    }
                }
            });
        }

        if (confirmPasswordInput) {
            confirmPasswordInput.addEventListener('input', function() {
                if (passwordInput.value && this.value) {
                    self.validatePasswordsMatch();
                }
            });
            
            confirmPasswordInput.addEventListener('blur', function() {
                if (passwordInput.value && this.value) {
                    self.validatePasswordsMatch();
                }
            });
        }

        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                if (self.validateForm()) {
                    self.handleSubmit(new FormData(this));
                }
            });
        }
    },

    validateEmail: function() {
        var email = document.getElementById('email').value;
        var errorMsg = document.querySelector('.email-error');
        var emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        
        if (!emailPattern.test(email)) {
            errorMsg.style.display = 'block';
            return false;
        } else {
            errorMsg.style.display = 'none';
            return true;
        }
    },

    validatePasswordLength: function() {
        var password = document.getElementById('password').value;
        var errorMsg = document.querySelector('.password-error');
        
        if (password && password.length < 8) {
            errorMsg.style.display = 'block';
            return false;
        } else {
            errorMsg.style.display = 'none';
            return true;
        }
    },

    validatePasswordsMatch: function() {
        var password = document.getElementById('password').value;
        var confirmPassword = document.getElementById('confirm_password').value;
        var errorMsg = document.querySelector('.password-match-error');
        
        if (password && confirmPassword && password !== confirmPassword) {
            errorMsg.style.display = 'block';
            return false;
        } else {
            errorMsg.style.display = 'none';
            return true;
        }
    },

    validateForm: function() {
        var email = document.getElementById('email');
        var password = document.getElementById('password');
        var confirmPassword = document.getElementById('confirm_password');
        var isValid = true;
        
        // Validate email
        if (!this.validateEmail()) {
            email.classList.add('error');
            isValid = false;
        } else {
            email.classList.remove('error');
        }
        
        // Validate password only if it's provided
        if (password.value) {
            if (!this.validatePasswordLength()) {
                password.classList.add('error');
                isValid = false;
            } else {
                password.classList.remove('error');
            }
            
            // Validate password match only if password is provided
            if (!this.validatePasswordsMatch()) {
                confirmPassword.classList.add('error');
                isValid = false;
            } else {
                confirmPassword.classList.remove('error');
            }
        }
        
        return isValid;
    },

    handleSubmit: function(formData) {
        var self = this;
        var submitButton = document.querySelector('#saveUser');

        // Disable button to prevent multiple submissions
        if (submitButton.disabled) {
            return;
        }
        submitButton.disabled = true;
        submitButton.innerHTML = 'Saving...';

        // Initialize userData object with the structure expected by the API
        var userData = {
            email: formData.get('email'),
            full_name: formData.get('full_name'),
            is_active: formData.get('is_active') === 'on',
            is_superuser: formData.get('is_superuser') === 'on'
        };

        // Only include password if it's provided
        var password = formData.get('password');
        if (password) {
            userData.password = password;
        }

        // Call the API to update the user
        ApiClient.updateUser(this.user.id, userData)
            .then(function(response) {
                self.close();
                // Show success message
                Utils.onSuccess('update', 'User');
                if (self.onSuccess && typeof self.onSuccess === 'function') {
                    self.onSuccess();
                }
            })
            .catch(function(error) {
                console.error('Failed to update user:', error);
                Utils.onSuccess('error', (error.message || 'Unknown error updating user'));
            })
            .finally(function() {
                submitButton.disabled = false;
                submitButton.innerHTML = 'Save';
            });
    },

    close: function() {
        this.cleanup();
    }
};

// Make EditUser globally available
window.EditUser = EditUser;
