var EditHeads = {
    init: function() {
        // This function doesn't render anything initially
        // It will be called from other components that want to use this modal
    },
    
    open: function(head, onUpdated) {
        // Store head data and callback
        this.head = head;
        this.onUpdated = onUpdated;
        this.originalData = {
            heads: head.heads || head.name || '',
            type: head.type || 1
        };
        
        // Create the modal HTML
        var modalHtml = `
            <div class="modal" id="editHeadModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Edit Head</h2>
                        <button type="button" class="close-btn">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="editHeadForm">
                            <div class="form-group">
                                <label for="editHeadName" class="form-label">Name *</label>
                                <input type="text" id="editHeadName" class="form-control" value="${this.originalData.heads}" required>
                                <div id="editHeadNameError" class="form-error-message">Name is required.</div>
                            </div>
                            <div class="form-group">
                                <label for="editHeadType" class="form-label">Type *</label>
                                <input type="number" id="editHeadType" class="form-control" placeholder="1: Inflow, 2: Outflow" 
                                    value="${this.originalData.type}" min="1" max="2" required>
                                <div id="editHeadTypeError" class="form-error-message">Type must be 1 (Inflow) or 2 (Outflow).</div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" id="updateHeadBtn" class="btn btn-primary" disabled>Save</button>
                        <button type="button" id="cancelEditBtn" class="btn btn-secondary">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to body
        var modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHtml;
        document.body.appendChild(modalContainer.firstElementChild);
        
        // Show modal
        var modal = document.getElementById('editHeadModal');
        modal.style.display = 'flex';
        
        // Limit input to 1 or 2 for type field
        var typeInput = document.getElementById('editHeadType');
        typeInput.addEventListener('keypress', function(e) {
            if (e.key !== '1' && e.key !== '2') {
                e.preventDefault();
            }
        });
        
        // Setup event listeners
        this.setupEventListeners();
    },
    
    close: function() {
        var modal = document.getElementById('editHeadModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.removeChild(modal);
        }
    },
    
    setupEventListeners: function() {
        // Close button event
        var closeBtn = document.querySelector('#editHeadModal .close-btn');
        closeBtn.addEventListener('click', this.close.bind(this));
        
        // Cancel button event
        var cancelBtn = document.getElementById('cancelEditBtn');
        cancelBtn.addEventListener('click', this.close.bind(this));
        
        // Save button event
        var updateBtn = document.getElementById('updateHeadBtn');
        updateBtn.addEventListener('click', this.handleUpdate.bind(this));
        
        // Click outside to close
        var modal = document.getElementById('editHeadModal');
        modal.addEventListener('click', function(event) {
            if (event.target === modal) {
                this.close();
            }
        }.bind(this));
        
        // Form validation
        var headNameInput = document.getElementById('editHeadName');
        var headTypeInput = document.getElementById('editHeadType');
        
        headNameInput.addEventListener('blur', function() {
            this.validateField('editHeadName');
        }.bind(this));
        
        headTypeInput.addEventListener('blur', function() {
            this.validateField('editHeadType');
        }.bind(this));
        
        // Enable/disable save button based on form changes
        var self = this;
        function checkFormChanges() {
            var currentName = document.getElementById('editHeadName').value.trim();
            var currentType = document.getElementById('editHeadType').value;
            var isDirty = (currentName !== self.originalData.heads || 
                          parseInt(currentType) !== self.originalData.type);
            
            document.getElementById('updateHeadBtn').disabled = !isDirty;
        }
        
        headNameInput.addEventListener('input', checkFormChanges);
        headTypeInput.addEventListener('input', checkFormChanges);
    },
    
    validateField: function(fieldId) {
        var field = document.getElementById(fieldId);
        var errorElement = document.getElementById(fieldId + 'Error');
        var isValid = true;
        
        if (fieldId === 'editHeadName') {
            if (!field.value.trim()) {
                errorElement.textContent = 'Name is required.';
                errorElement.classList.add('visible');
                isValid = false;
            } else {
                errorElement.classList.remove('visible');
            }
        } else if (fieldId === 'editHeadType') {
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
        var isHeadNameValid = this.validateField('editHeadName');
        var isHeadTypeValid = this.validateField('editHeadType');
        
        return isHeadNameValid && isHeadTypeValid;
    },
    
    handleUpdate: function() {
        // Validate form
        if (!this.validateForm()) {
            return;
        }
        
        // Disable update button and show loading state
        var updateBtn = document.getElementById('updateHeadBtn');
        var originalText = updateBtn.textContent;
        updateBtn.disabled = true;
        updateBtn.textContent = 'Saving...';
        
        // Get form data
        var headData = {
            heads: document.getElementById('editHeadName').value.trim(),
            type: parseInt(document.getElementById('editHeadType').value)
        };
        
        // Call API to update head
        ApiClient.updateHead(this.head.id, headData)
            .then(function(response) {
                // Show success message
                Utils.showMessage('success', 'Head updated successfully');
                
                // Close modal
                this.close();
                
                // Call the callback function if provided
                if (typeof this.onUpdated === 'function') {
                    this.onUpdated();
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
                Utils.showMessage('error', 'Failed to update head: ' + (error.message || 'Unknown error'));
            })
            .finally(function() {
                // Reset button state
                updateBtn.disabled = false;
                updateBtn.textContent = originalText;
            });
    }
};

// Make EditHeads globally available
window.EditHeads = EditHeads;
