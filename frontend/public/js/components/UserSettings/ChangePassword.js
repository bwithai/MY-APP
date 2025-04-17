var ChangePassword = {
    init: function(container) {
        this.container = container;
        this.formErrors = {};
        this.render();
        this.addStyles();
    },
    
    render: function() {
        this.container.innerHTML = `
            <div class="password-card-container">
                <div class="password-card">
                    <div class="password-card-header">
                        <h2 class="section-title">Change Password</h2>
                    </div>
                    <div class="password-card-body">
                        <form id="changePasswordForm">
                            <div class="form-group">
                                <label for="current_password" class="form-label">Current Password</label>
                                <input type="password" id="current_password" class="form-control" placeholder="Current password" />
                                <div id="current_password_error" class="form-error-message ${this.formErrors.current_password ? 'visible' : ''}">
                                    ${this.formErrors.current_password || ''}
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="new_password" class="form-label">Set Password</label>
                                <input type="password" id="new_password" class="form-control" placeholder="New password" />
                                <div id="new_password_error" class="form-error-message ${this.formErrors.new_password ? 'visible' : ''}">
                                    ${this.formErrors.new_password || ''}
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="confirm_password" class="form-label">Confirm Password</label>
                                <input type="password" id="confirm_password" class="form-control" placeholder="Confirm password" />
                                <div id="confirm_password_error" class="form-error-message ${this.formErrors.confirm_password ? 'visible' : ''}">
                                    ${this.formErrors.confirm_password || ''}
                                </div>
                            </div>
                            <div class="form-actions">
                                <button type="button" id="savePassword" class="btn btn-primary">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        // Setup event listeners
        this.setupEventListeners();
    },
    
    addStyles: function() {
        // Check if styles already exist
        if (document.getElementById('password-change-styles')) {
            return;
        }
        
        // Create and add custom styles
        var styleElement = document.createElement('style');
        styleElement.id = 'password-change-styles';
        styleElement.textContent = `
            .password-card-container {
                display: flex;
                justify-content: center;
                align-items: flex-start;
                padding: 20px;
            }
            
            .password-card {
                background-color: #ffffff;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                width: 100%;
                max-width: 500px;
                overflow: hidden;
                border: 1px solid #e2e8f0;
            }
            
            .password-card-header {
                background-color: #f8f9fa;
                padding: 20px;
                border-bottom: 1px solid #e2e8f0;
            }
            
            .section-title {
                margin: 0;
                font-size: 1.5rem;
                font-weight: 600;
                color: #2d3748;
            }
            
            .password-card-body {
                padding: 24px;
            }
            
            .form-group {
                margin-bottom: 20px;
            }
            
            .form-label {
                display: block;
                margin-bottom: 8px;
                font-weight: 500;
                color: #4a5568;
            }
            
            .form-control {
                width: 100%;
                padding: 10px 12px;
                border: 1px solid #e2e8f0;
                border-radius: 4px;
                font-size: 1rem;
                transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
            }
            
            .form-control:focus {
                border-color: #3182ce;
                outline: none;
                box-shadow: 0 0 0 1px #3182ce;
            }
            
            .form-error-message {
                color: #e53e3e;
                font-size: 0.875rem;
                margin-top: 4px;
                display: none;
            }
            
            .form-error-message.visible {
                display: block;
            }
            
            .form-actions {
                margin-top: 24px;
                display: flex;
                justify-content: flex-end;
            }
            
            .btn {
                padding: 10px 16px;
                border-radius: 4px;
                font-size: 1rem;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .btn-primary:disabled {
                background-color: #a0aec0;
                cursor: not-allowed;
            }
            
            @media (max-width: 576px) {
                .password-card {
                    max-width: 100%;
                }
            }
        `;
        
        document.head.appendChild(styleElement);
    },
    
    setupEventListeners: function() {
        // Save button
        var saveBtn = document.getElementById('savePassword');
        if (saveBtn) {
            saveBtn.addEventListener('click', this.handleChangePassword.bind(this));
        }
        
        // Input validation on blur
        var currentPasswordInput = document.getElementById('current_password');
        var newPasswordInput = document.getElementById('new_password');
        var confirmPasswordInput = document.getElementById('confirm_password');
        
        if (currentPasswordInput) {
            currentPasswordInput.addEventListener('blur', this.validateField.bind(this));
        }
        
        if (newPasswordInput) {
            newPasswordInput.addEventListener('blur', this.validateField.bind(this));
        }
        
        if (confirmPasswordInput) {
            confirmPasswordInput.addEventListener('blur', this.validateField.bind(this));
        }
    },
    
    validateField: function(event) {
        var field = event.target;
        var fieldId = field.id;
        var value = field.value;
        
        switch(fieldId) {
            case 'current_password':
                if (!value) {
                    this.formErrors.current_password = 'Current password is required';
                } else {
                    delete this.formErrors.current_password;
                }
                break;
                
            case 'new_password':
                if (!value) {
                    this.formErrors.new_password = 'New password is required';
                } else if (value.length < 8) {
                    this.formErrors.new_password = 'Password must be at least 8 characters long';
                } else if (!/[A-Z]/.test(value)) {
                    this.formErrors.new_password = 'Password must contain at least one uppercase letter';
                } else if (!/[a-z]/.test(value)) {
                    this.formErrors.new_password = 'Password must contain at least one lowercase letter';
                } else if (!/[0-9]/.test(value)) {
                    this.formErrors.new_password = 'Password must contain at least one number';
                } else {
                    delete this.formErrors.new_password;
                }
                
                // Also validate confirm password if it's not empty
                var confirmPassword = document.getElementById('confirm_password').value;
                if (confirmPassword) {
                    if (confirmPassword !== value) {
                        this.formErrors.confirm_password = 'Passwords do not match';
                    } else {
                        delete this.formErrors.confirm_password;
                    }
                }
                break;
                
            case 'confirm_password':
                var newPassword = document.getElementById('new_password').value;
                if (!value) {
                    this.formErrors.confirm_password = 'Please confirm your password';
                } else if (value !== newPassword) {
                    this.formErrors.confirm_password = 'Passwords do not match';
                } else {
                    delete this.formErrors.confirm_password;
                }
                break;
        }
        
        // Update error message display
        this.updateErrorDisplay(fieldId);
    },
    
    updateErrorDisplay: function(fieldId) {
        var errorElement = document.getElementById(fieldId + '_error');
        if (errorElement) {
            errorElement.textContent = this.formErrors[fieldId] || '';
            errorElement.classList.toggle('visible', !!this.formErrors[fieldId]);
        }
    },
    
    validateForm: function() {
        var currentPassword = document.getElementById('current_password').value;
        var newPassword = document.getElementById('new_password').value;
        var confirmPassword = document.getElementById('confirm_password').value;
        
        // Clear previous errors
        this.formErrors = {};
        
        // Validate current password
        if (!currentPassword) {
            this.formErrors.current_password = 'Current password is required';
        }
        
        // Validate new password
        if (!newPassword) {
            this.formErrors.new_password = 'New password is required';
        } else if (newPassword.length < 8) {
            this.formErrors.new_password = 'Password must be at least 8 characters long';
        } else if (!/[A-Z]/.test(newPassword)) {
            this.formErrors.new_password = 'Password must contain at least one uppercase letter';
        } else if (!/[a-z]/.test(newPassword)) {
            this.formErrors.new_password = 'Password must contain at least one lowercase letter';
        } else if (!/[0-9]/.test(newPassword)) {
            this.formErrors.new_password = 'Password must contain at least one number';
        }
        
        // Validate confirm password
        if (!confirmPassword) {
            this.formErrors.confirm_password = 'Please confirm your password';
        } else if (confirmPassword !== newPassword) {
            this.formErrors.confirm_password = 'Passwords do not match';
        }
        
        // Update all error displays
        this.updateErrorDisplay('current_password');
        this.updateErrorDisplay('new_password');
        this.updateErrorDisplay('confirm_password');
        
        // Form is valid if there are no errors
        return Object.keys(this.formErrors).length === 0;
    },
    
    handleChangePassword: function(event) {
        event.preventDefault();
        
        // Validate form
        if (!this.validateForm()) {
            return;
        }
        
        var currentPassword = document.getElementById('current_password').value;
        var newPassword = document.getElementById('new_password').value;
        
        // Disable the submit button and show loading state
        var saveBtn = document.getElementById('savePassword');
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span> Saving...';
        }
        
        // Show loading indicator
        Utils.showLoading(true);
        
        // Send API request to change password
        ApiClient.updatePasswordMe({
            current_password: currentPassword,
            new_password: newPassword
        })
        .then(function(response) {
            // Show success message
            Utils.onSuccess('edit', 'Password');
            
            // Reset form
            this.resetForm();
        }.bind(this))
        .catch(function(error) {
            // Show error message
            Utils.onSuccess('error', (error.message || 'Unknown error to update password'));
            
            // If the error is related to current password, show it in the form
            if (error.message && error.message.toLowerCase().includes('current password')) {
                this.formErrors.current_password = 'Current password is incorrect';
                this.updateErrorDisplay('current_password');
            }
        }.bind(this))
        .finally(function() {
            // Hide loading indicator
            Utils.showLoading(false);
            
            // Re-enable the submit button
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Save';
            }
        });
    },
    
    resetForm: function() {
        // Clear form values
        var form = document.getElementById('changePasswordForm');
        if (form) {
            form.reset();
        }
        
        // Clear errors
        this.formErrors = {};
        this.updateErrorDisplay('current_password');
        this.updateErrorDisplay('new_password');
        this.updateErrorDisplay('confirm_password');
    }
};

// Make ChangePassword globally available
window.ChangePassword = ChangePassword;
