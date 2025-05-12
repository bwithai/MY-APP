var AddAppt = {
    init: function() {
        // This function doesn't render anything initially
        // It will be called from other components that want to use this modal
    },
    
    open: function(onCreated) {
        // Store callback to be called after successful creation
        this.onCreated = onCreated;
        
        // Get current user from localStorage
        var currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        
        // Create the modal HTML
        var modalHtml = `
            <div class="modal" id="addApptModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Add Appointment</h2>
                        <button type="button" class="close-btn">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="addApptForm">
                            <div class="form-group">
                                <label for="apptName" class="form-label">Name *</label>
                                <input type="text" id="apptName" class="form-control" placeholder="Enter appointment name" required>
                                <div id="apptNameError" class="form-error-message">Name is required.</div>
                            </div>
                            <div class="form-group">
                                <label for="apptDescription" class="form-label">Description</label>
                                <input type="text" id="apptDescription" class="form-control" placeholder="Enter description">
                                <div id="apptDescriptionError" class="form-error-message"></div>
                            </div>
                            <input type="hidden" id="userId" value="${currentUser.id || ''}">
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" id="saveApptBtn" class="btn btn-primary">Save</button>
                        <button type="button" id="cancelApptBtn" class="btn btn-secondary">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to body
        var modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHtml;
        document.body.appendChild(modalContainer.firstElementChild);
        
        // Show modal
        var modal = document.getElementById('addApptModal');
        modal.style.display = 'flex';
        
        // Setup event listeners
        this.setupEventListeners();
    },
    
    close: function() {
        Utils.cleanup('addApptModal');
    },
    
    setupEventListeners: function() {
        // Close button event
        var closeBtn = document.querySelector('#addApptModal .close-btn');
        closeBtn.addEventListener('click', this.close.bind(this));
        
        // Cancel button event
        var cancelBtn = document.getElementById('cancelApptBtn');
        cancelBtn.addEventListener('click', this.close.bind(this));
        
        // Save button event
        var saveBtn = document.getElementById('saveApptBtn');
        saveBtn.addEventListener('click', this.handleSave.bind(this));
        
        // Click outside to close
        var modal = document.getElementById('addApptModal');
        modal.addEventListener('click', function(event) {
            if (event.target === modal) {
                this.close();
            }
        }.bind(this));
        
        // Form validation
        var apptNameInput = document.getElementById('apptName');
        
        apptNameInput.addEventListener('blur', function() {
            this.validateField('apptName');
        }.bind(this));
    },
    
    validateField: function(fieldId) {
        var field = document.getElementById(fieldId);
        var errorElement = document.getElementById(fieldId + 'Error');
        var isValid = true;
        
        if (fieldId === 'apptName') {
            if (!field.value.trim()) {
                errorElement.textContent = 'Name is required.';
                errorElement.classList.add('visible');
                isValid = false;
            } else {
                errorElement.classList.remove('visible');
            }
        }
        
        return isValid;
    },
    
    validateForm: function() {
        var isApptNameValid = this.validateField('apptName');
        
        return isApptNameValid;
    },
    
    handleSave: function() {
        // Validate form
        if (!this.validateForm()) {
            return;
        }
        
        // Disable save button and show loading state
        var saveBtn = document.getElementById('saveApptBtn');
        var originalText = saveBtn.textContent;
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';
        
        // Get form data
        var apptData = {
            name: document.getElementById('apptName').value.trim(),
            description: document.getElementById('apptDescription').value.trim() || null,
            user_id: parseInt(document.getElementById('userId').value) || null
        };
        
        // Call API to create appointment
        ApiClient.createAppt({ requestBody: apptData })
            .then(function(response) {
                // Close modal
                this.close();
                // Show success message
                Utils.onSuccess('add', 'Appointment');
                
                // Call the callback function if provided
                if (typeof this.onCreated === 'function') {
                    this.onCreated();
                }
                
                // Invalidate cache or reload appointments
                if (window.AppointmentList && typeof window.AppointmentList.loadAppointments === 'function') {
                    window.AppointmentList.loadAppointments();
                }
            }.bind(this))
            .catch(function(error) {
                // Show error message
                Utils.onSuccess('error', (error.message || 'Unknown error to create appointment'));
            })
            .finally(function() {
                // Reset button state
                saveBtn.disabled = false;
                saveBtn.textContent = originalText;
            });
    }
};

// Make AddAppt globally available
window.AddAppt = AddAppt;
