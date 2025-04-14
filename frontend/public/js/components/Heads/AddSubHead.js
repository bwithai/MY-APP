var AddSubHead = {
    init: function() {
        // This function doesn't render anything initially
        // It will be called from other components that want to use this modal
    },
    
    open: function(head, onCreated) {
        // Store head data and callback
        this.head = head;
        this.onCreated = onCreated;
        
        // Get current user from localStorage
        var currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        
        // Create the modal HTML
        var modalHtml = `
            <div class="modal" id="addSubHeadModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Add Sub Head</h2>
                        <button type="button" class="close-btn">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="addSubHeadForm">
                            <div class="form-group">
                                <label for="subHeadName" class="form-label">Name *</label>
                                <input type="text" id="subHeadName" class="form-control" placeholder="Enter sub head name" required>
                                <div id="subHeadNameError" class="form-error-message">Name is required.</div>
                            </div>
                            <input type="hidden" id="headId" value="${head.id || ''}">
                            <input type="hidden" id="headType" value="${head.type || ''}">
                            <input type="hidden" id="userId" value="${currentUser.id || ''}">
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" id="saveSubHeadBtn" class="btn btn-primary">Save</button>
                        <button type="button" id="cancelSubHeadBtn" class="btn btn-secondary">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to body
        var modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHtml;
        document.body.appendChild(modalContainer.firstElementChild);
        
        // Show modal
        var modal = document.getElementById('addSubHeadModal');
        modal.style.display = 'flex';
        
        // Setup event listeners
        this.setupEventListeners();
    },
    
    close: function() {
        Utils.cleanup('addSubHeadModal');
    },
    
    setupEventListeners: function() {
        // Close button event
        var closeBtn = document.querySelector('#addSubHeadModal .close-btn');
        closeBtn.addEventListener('click', this.close.bind(this));
        
        // Cancel button event
        var cancelBtn = document.getElementById('cancelSubHeadBtn');
        cancelBtn.addEventListener('click', this.close.bind(this));
        
        // Save button event
        var saveBtn = document.getElementById('saveSubHeadBtn');
        saveBtn.addEventListener('click', this.handleSave.bind(this));
        
        // Click outside to close
        var modal = document.getElementById('addSubHeadModal');
        modal.addEventListener('click', function(event) {
            if (event.target === modal) {
                this.close();
            }
        }.bind(this));
        
        // Form validation
        var subHeadNameInput = document.getElementById('subHeadName');
        
        subHeadNameInput.addEventListener('blur', function() {
            this.validateField('subHeadName');
        }.bind(this));
        
        // Enable/disable save button based on input
        subHeadNameInput.addEventListener('input', function() {
            var saveBtn = document.getElementById('saveSubHeadBtn');
            saveBtn.disabled = !subHeadNameInput.value.trim();
        });
    },
    
    validateField: function(fieldId) {
        var field = document.getElementById(fieldId);
        var errorElement = document.getElementById(fieldId + 'Error');
        var isValid = true;
        
        if (fieldId === 'subHeadName') {
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
        var isSubHeadNameValid = this.validateField('subHeadName');
        return isSubHeadNameValid;
    },
    
    handleSave: function() {
        // Validate form
        if (!this.validateForm()) {
            return;
        }
        
        // Disable save button and show loading state
        var saveBtn = document.getElementById('saveSubHeadBtn');
        var originalText = saveBtn.textContent;
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';
        
        // Get form data
        var subHeadData = {
            subheads: document.getElementById('subHeadName').value.trim(),
            head_id: parseInt(document.getElementById('headId').value),
            type: parseInt(document.getElementById('headType').value),
            user_id: parseInt(document.getElementById('userId').value) || null
        };
        
        // Call API to create sub head
        ApiClient.createSubHead(subHeadData)
            .then(function(response) {
                // Close modal
                this.close();
                // Show success message
                Utils.onSuccess('add', 'Sub Head');
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
                Utils.showMessage('error', 'Failed to create sub head: ' + (error.message || 'Unknown error'));
            })
            .finally(function() {
                // Reset button state
                saveBtn.disabled = false;
                saveBtn.textContent = originalText;
            });
    }
};

// Make AddSubHead globally available
window.AddSubHead = AddSubHead;
