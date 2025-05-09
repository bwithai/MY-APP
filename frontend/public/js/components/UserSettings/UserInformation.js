var UserInformation = {
    init: function(container, currentUser) {
        this.container = container;
        this.currentUser = currentUser;
        this.editMode = false;
        this.isDirty = false;
        this.formErrors = {};
        this.render();
    },
    
    render: function() {
        this.container.innerHTML = `
            <div class="settings-panel">
                <h2 class="section-title">User Information</h2>
                <form id="userInfoForm">
                    <div class="form-group">
                        <label for="name" class="form-label">Full name</label>
                        ${this.editMode ? 
                            `<input type="text" id="name" class="form-control" value="${this.currentUser.name || ''}" maxlength="30">` : 
                            `<p class="form-text ${!this.currentUser.name ? 'text-muted' : ''}">${this.currentUser.name || 'N/A'}</p>`
                        }
                    </div>
                    <div class="form-group">
                        <label for="email" class="form-label">Email</label>
                        ${this.editMode ? 
                            `<input type="email" id="email" class="form-control" value="${this.currentUser.email || ''}">
                             <div id="emailError" class="form-error-message ${this.formErrors.email ? 'visible' : ''}">
                                ${this.formErrors.email || ''}
                             </div>` : 
                            `<p class="form-text">${this.currentUser.email || ''}</p>`
                        }
                    </div>
                    <div class="form-actions">
                        <button type="button" id="editSaveButton" class="btn btn-primary">
                            ${this.editMode ? 'Save' : 'Edit'}
                        </button>
                        ${this.editMode ? 
                            `<button type="button" id="cancelButton" class="btn btn-secondary">Cancel</button>` : 
                            ''
                        }
                    </div>
                    <button type="button" id="addIbanButton" class="btn btn-primary btn-full-width">Add IBAN</button>
                </form>
            </div>
        `;
        
        // Setup event listeners
        this.setupEventListeners();
    },
    
    setupEventListeners: function() {
        // Edit/Save button
        var editSaveButton = document.getElementById('editSaveButton');
        if (editSaveButton) {
            editSaveButton.addEventListener('click', this.handleEditSave.bind(this));
        }
        
        // Cancel button (only in edit mode)
        var cancelButton = document.getElementById('cancelButton');
        if (cancelButton) {
            cancelButton.addEventListener('click', this.handleCancel.bind(this));
        }
        
        // Add IBAN button
        var addIbanButton = document.getElementById('addIbanButton');
        if (addIbanButton) {
            addIbanButton.addEventListener('click', this.handleAddIban.bind(this));
        }
        
        // Form input change events (only in edit mode)
        if (this.editMode) {
            var nameInput = document.getElementById('name');
            var emailInput = document.getElementById('email');
            
            if (nameInput) {
                nameInput.addEventListener('input', this.handleInputChange.bind(this));
                nameInput.addEventListener('blur', this.validateField.bind(this));
            }
            
            if (emailInput) {
                emailInput.addEventListener('input', this.handleInputChange.bind(this));
                emailInput.addEventListener('blur', this.validateField.bind(this));
            }
        }
    },
    
    handleEditSave: function(event) {
        event.preventDefault();
        
        if (this.editMode) {
            // Save mode - validate and submit form
            var isValid = this.validateForm();
            if (isValid) {
                this.submitForm();
            }
        } else {
            // Edit mode - toggle to edit mode
            this.editMode = true;
            this.render();
        }
    },
    
    handleCancel: function(event) {
        event.preventDefault();
        this.editMode = false;
        this.isDirty = false;
        this.formErrors = {};
        this.render();
    },
    
    handleAddIban: function(event) {
        event.preventDefault();
        
        // Check if AddIban component exists
        if (typeof AddIban !== 'undefined') {
            AddIban.open(true);
        } else {
            console.error('AddIban component not found');
            Utils.showMessage('error', 'IBAN feature is not available');
        }
    },
    
    handleInputChange: function(event) {
        // Mark form as dirty when input changes
        this.isDirty = true;
        
        // Enable/disable save button based on validation
        this.updateSaveButtonState();
    },
    
    validateField: function(event) {
        var field = event.target;
        var fieldName = field.id;
        var value = field.value;
        
        if (fieldName === 'email') {
            // Email validation
            if (!value) {
                this.formErrors.email = 'Email is required';
            } else if (!this.isValidEmail(value)) {
                this.formErrors.email = 'Please enter a valid email address';
            } else {
                delete this.formErrors.email;
            }
            
            // Update error message display
            var emailError = document.getElementById('emailError');
            if (emailError) {
                emailError.textContent = this.formErrors.email || '';
                emailError.classList.toggle('visible', !!this.formErrors.email);
            }
        }
        
        this.updateSaveButtonState();
    },
    
    validateForm: function() {
        var emailInput = document.getElementById('email');
        var emailValue = emailInput ? emailInput.value : '';
        
        // Clear previous errors
        this.formErrors = {};
        
        // Validate email
        if (!emailValue) {
            this.formErrors.email = 'Email is required';
        } else if (!this.isValidEmail(emailValue)) {
            this.formErrors.email = 'Please enter a valid email address';
        }
        
        // Update UI with errors
        var emailError = document.getElementById('emailError');
        if (emailError) {
            emailError.textContent = this.formErrors.email || '';
            emailError.classList.toggle('visible', !!this.formErrors.email);
        }
        
        // Form is valid if there are no errors
        return Object.keys(this.formErrors).length === 0;
    },
    
    updateSaveButtonState: function() {
        var saveButton = document.getElementById('editSaveButton');
        if (saveButton && this.editMode) {
            var emailInput = document.getElementById('email');
            var emailValue = emailInput ? emailInput.value : '';
            
            // Button is disabled if form has errors, is not dirty, or email is empty
            var hasErrors = Object.keys(this.formErrors).length > 0;
            var isDisabled = hasErrors || !this.isDirty || !emailValue;
            
            saveButton.disabled = isDisabled;
        }
    },
    
    isValidEmail: function(email) {
        // Email validation regex pattern
        var emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailPattern.test(email);
    },
    
    submitForm: function() {
        var nameInput = document.getElementById('name');
        var emailInput = document.getElementById('email');
        
        var name = nameInput ? nameInput.value : '';
        var email = emailInput ? emailInput.value : '';
        
        // Show loading state
        Utils.showLoading(true);
        
        // Create data to send to API
        var userData = {
            name: name,
            email: email
        };
        
        // Call API to update user
        ApiClient.updateUserProfile(userData)
            .then(function(response) {
                // Update currentUser in localStorage
                var currentUser = JSON.parse(localStorage.getItem('currentUser'));
                currentUser.name = name;
                currentUser.email = email;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                
                // Update this component's currentUser reference
                this.currentUser = currentUser;
                
                // Show success message
                Utils.showMessage('success', 'User information updated successfully!');
                
                // Exit edit mode
                this.editMode = false;
                this.isDirty = false;
                this.formErrors = {};
                
                // Re-render component
                this.render();
            }.bind(this))
            .catch(function(error) {
                // Show error message
                Utils.showMessage('error', 'Failed to update user information: ' + (error.message || 'Unknown error'));
            })
            .finally(function() {
                // Hide loading state
                Utils.showLoading(false);
            });
    }
};

// Make UserInformation globally available
window.UserInformation = UserInformation;
