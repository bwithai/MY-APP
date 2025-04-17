var EditAppt = {
    init: function() {
        // This function doesn't render anything initially
        // It will be called from other components that want to use this modal
    },
    
    open: function(appointment, onUpdated) {
        // Store appointment data and callback
        this.appointment = appointment;
        this.onUpdated = onUpdated;
        
        // Create the modal HTML
        var modalHtml = `
            <div class="modal" id="editApptModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Edit Appointment</h2>
                        <button type="button" class="close-btn">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="editApptForm">
                            <div class="form-group">
                                <label for="apptName" class="form-label">Name *</label>
                                <input type="text" id="apptName" class="form-control" placeholder="Enter appointment name" value="${appointment.name || ''}" required>
                                <div id="apptNameError" class="form-error-message">Name is required.</div>
                            </div>
                            <div class="form-group">
                                <label for="apptDescription" class="form-label">Description</label>
                                <input type="text" id="apptDescription" class="form-control" placeholder="Enter description" value="${appointment.description || ''}">
                                <div id="apptDescriptionError" class="form-error-message"></div>
                            </div>
                            <input type="hidden" id="apptId" value="${appointment.id || ''}">
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
        var modal = document.getElementById('editApptModal');
        modal.style.display = 'flex';
        
        // Add CSS styles if not already added
        this.addStyles();
        
        // Setup event listeners
        this.setupEventListeners();
    },
    
    addStyles: function() {
        // Check if styles already exist
        if (document.getElementById('appt-modal-styles')) {
            return;
        }
        
        // Create and add custom styles for modal
        var styleElement = document.createElement('style');
        styleElement.id = 'appt-modal-styles';
        styleElement.textContent = `
            .modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                z-index: 1000;
                justify-content: center;
                align-items: center;
            }
            
            .modal-content {
                background-color: #fff;
                border-radius: 8px;
                width: 90%;
                max-width: 500px;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            
            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px 20px;
                border-bottom: 1px solid #e2e8f0;
            }
            
            .modal-header h2 {
                margin: 0;
                font-size: 1.5rem;
                font-weight: 600;
            }
            
            .close-btn {
                background: none;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                color: #718096;
            }
            
            .modal-body {
                padding: 20px;
            }
            
            .modal-footer {
                display: flex;
                justify-content: flex-end;
                padding: 15px 20px;
                border-top: 1px solid #e2e8f0;
            }
            
            .modal-footer button {
                margin-left: 10px;
            }
            
            .form-group {
                margin-bottom: 20px;
            }
            
            .form-label {
                display: block;
                margin-bottom: 8px;
                font-weight: 500;
            }
            
            .form-control {
                width: 100%;
                padding: 8px 12px;
                border: 1px solid #e2e8f0;
                border-radius: 4px;
                font-size: 1rem;
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
            
            .btn {
                padding: 8px 16px;
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
            
            .btn-secondary {
                background-color: #e2e8f0;
                color: #4a5568;
                border: none;
            }
            
            .btn-secondary:hover {
                background-color: #cbd5e0;
            }
        `;
        
        document.head.appendChild(styleElement);
    },
    
    close: function() {
        Utils.cleanup('editApptModal');
    },
    
    setupEventListeners: function() {
        // Close button event
        var closeBtn = document.querySelector('#editApptModal .close-btn');
        closeBtn.addEventListener('click', this.close.bind(this));
        
        // Cancel button event
        var cancelBtn = document.getElementById('cancelApptBtn');
        cancelBtn.addEventListener('click', this.close.bind(this));
        
        // Save button event
        var saveBtn = document.getElementById('saveApptBtn');
        saveBtn.addEventListener('click', this.handleSave.bind(this));
        
        // Click outside to close
        var modal = document.getElementById('editApptModal');
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
        
        // Track dirty state
        this.initialValues = {
            name: this.appointment.name || '',
            description: this.appointment.description || ''
        };
        
        // Check for changes to enable/disable save button
        var formInputs = document.querySelectorAll('#editApptForm input:not([type="hidden"])');
        formInputs.forEach(function(input) {
            input.addEventListener('input', this.checkDirtyState.bind(this));
        }.bind(this));
        
        // Initial check for dirty state
        this.checkDirtyState();
    },
    
    checkDirtyState: function() {
        var nameInput = document.getElementById('apptName');
        var descInput = document.getElementById('apptDescription');
        var saveBtn = document.getElementById('saveApptBtn');
        
        var isDirty = 
            nameInput.value !== this.initialValues.name || 
            descInput.value !== this.initialValues.description;
        
        saveBtn.disabled = !isDirty;
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
        var apptId = document.getElementById('apptId').value;
        var updatedData = {
            name: document.getElementById('apptName').value.trim(),
            description: document.getElementById('apptDescription').value.trim() || null
        };
        
        // Call API to update appointment
        ApiClient.updateAppt({
            id: apptId,
            requestBody: updatedData
        })
        .then(function(response) {
            // Close modal
            this.close();
            
            // Show success message
            Utils.onSuccess('update', 'Appointment');
            
            // Call the callback function if provided
            if (typeof this.onUpdated === 'function') {
                this.onUpdated();
            }
            
            // Invalidate cache or reload appointments
            if (window.AppointmentList && typeof window.AppointmentList.loadAppointments === 'function') {
                window.AppointmentList.loadAppointments();
            }
        }.bind(this))
        .catch(function(error) {
            // Show error message
            Utils.showMessage('error', 'Failed to update appointment: ' + (error.message || 'Unknown error'));
        })
        .finally(function() {
            // Reset button state
            saveBtn.disabled = false;
            saveBtn.textContent = originalText;
        });
    }
};

// Make EditAppt globally available
window.EditAppt = EditAppt;
