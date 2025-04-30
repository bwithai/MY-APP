var AddHead = {
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
            <div class="modal" id="addHeadModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Add Head</h2>
                        <button type="button" class="close-btn">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="addHeadForm">
                            <div class="form-group">
                                <label for="headName" class="form-label">Name *</label>
                                <input type="text" id="headName" class="form-control" placeholder="Enter head name" required>
                                <div id="headNameError" class="form-error-message">Name is required.</div>
                            </div>
                            <div class="form-group">
                                <label for="headType" class="form-label">Type *</label>
                                <input type="number" id="headType" class="form-control" placeholder="1: Inflow, 2: Outflow" 
                                    min="1" max="2" required>
                                <div id="headTypeError" class="form-error-message">Type must be 1 (Inflow) or 2 (Outflow).</div>
                            </div>
                            <input type="hidden" id="userId" value="${currentUser.id || ''}">
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" id="saveHeadBtn" class="btn btn-primary">Save</button>
                        <button type="button" id="cancelHeadBtn" class="btn btn-secondary">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to body
        var modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHtml;
        document.body.appendChild(modalContainer.firstElementChild);
        
        // Show modal
        var modal = document.getElementById('addHeadModal');
        modal.style.display = 'flex';
        
        // Limit input to 1 or 2 for type field
        var typeInput = document.getElementById('headType');
        typeInput.addEventListener('keypress', function(e) {
            if (e.key !== '1' && e.key !== '2') {
                e.preventDefault();
            }
        });
        
        // Setup event listeners
        this.setupEventListeners();
    },
    
    close: function() {
        Utils.cleanup('addHeadModal');
    },
    
    setupEventListeners: function() {
        // Close button event
        var closeBtn = document.querySelector('#addHeadModal .close-btn');
        closeBtn.addEventListener('click', this.close.bind(this));
        
        // Cancel button event
        var cancelBtn = document.getElementById('cancelHeadBtn');
        cancelBtn.addEventListener('click', this.close.bind(this));
        
        // Save button event
        var saveBtn = document.getElementById('saveHeadBtn');
        saveBtn.addEventListener('click', this.handleSave.bind(this));
        
        // Click outside to close
        var modal = document.getElementById('addHeadModal');
        modal.addEventListener('click', function(event) {
            if (event.target === modal) {
                this.close();
            }
        }.bind(this));
        
        // Form validation
        var headNameInput = document.getElementById('headName');
        var headTypeInput = document.getElementById('headType');
        
        headNameInput.addEventListener('blur', function() {
            this.validateField('headName');
        }.bind(this));
        
        headTypeInput.addEventListener('blur', function() {
            this.validateField('headType');
        }.bind(this));
    },
    
    validateField: function(fieldId) {
        var field = document.getElementById(fieldId);
        var errorElement = document.getElementById(fieldId + 'Error');
        var isValid = true;
        
        if (fieldId === 'headName') {
            if (!field.value.trim()) {
                errorElement.textContent = 'Name is required.';
                errorElement.classList.add('visible');
                isValid = false;
            } else {
                errorElement.classList.remove('visible');
            }
        } else if (fieldId === 'headType') {
            if (!field.value) {
                errorElement.textContent = 'Type is required.';
                errorElement.classList.add('visible');
                isValid = false;
            } else if (field.value !== '1' && field.value !== '2') {
                errorElement.textContent = 'Type must be 1 (Inflow) or 2 (Outflow).';
                errorElement.classList.add('visible');
                isValid = false;
            } else {
                errorElement.classList.remove('visible');
            }
        }
        
        return isValid;
    },
    
    validateForm: function() {
        var isHeadNameValid = this.validateField('headName');
        var isHeadTypeValid = this.validateField('headType');
        
        return isHeadNameValid && isHeadTypeValid;
    },
    
    handleSave: function() {
        // Validate form
        if (!this.validateForm()) {
            return;
        }
        
        // Disable save button and show loading state
        var saveBtn = document.getElementById('saveHeadBtn');
        var originalText = saveBtn.textContent;
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';
        
        // Get form data
        var headData = {
            heads: document.getElementById('headName').value.trim(),
            type: parseInt(document.getElementById('headType').value),
            user_id: parseInt(document.getElementById('userId').value) || null
        };
        
        // Call API to create head
        ApiClient.createHead(headData)
            .then(function(response) {
                // Close modal
                this.close();
                // Show success message
                Utils.onSuccess('add', 'Head');
                
                
                
                // Call the callback function if provided
                if (typeof this.onCreated === 'function') {
                    this.onCreated();
                }
                
                // Invalidate cache or reload heads
                if (HeadsManagement && typeof HeadsManagement.loadHeads === 'function') {
                    var activeTab = document.querySelector('.tab-btn.active');
                    var type = activeTab ? parseInt(activeTab.dataset.type) : 1;
                    HeadsManagement.loadHeads(type);
                }
            }.bind(this))
            .catch(function(error) {
                // Show error message
                Utils.onSuccess('error', 'Failed to create head: ' + (error.message || 'Unknown error'));
            })
            .finally(function() {
                // Reset button state
                saveBtn.disabled = false;
                saveBtn.textContent = originalText;
            });
    }
};

// Make AddHead globally available
window.AddHead = AddHead;
