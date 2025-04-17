var ChangePassword = {
    init: function(container) {
        this.container = container;
        this.formErrors = {};
        this.render();
    },
    
    render: function() {
        this.container.innerHTML = `
            <div class="settings-panel">
                <h2 class="section-title">Change Password</h2>
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
                    <button type="button" id="savePassword" class="btn btn-primary">Save</button>
                </form>
            </div>
        `;
        
        // Setup event listeners
        this.setupEventListeners();
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
            Utils.onSuccess('error', 'Failed to change password: ' + (error.message || 'Unknown error'));
            
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
