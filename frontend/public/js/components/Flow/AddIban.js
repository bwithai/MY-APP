var AddIban = {
    isOpen: false,
    
    init: function() {
        // Create modal container if it doesn't exist
        if (!document.getElementById('addIbanModal')) {
            var modalContainer = document.createElement('div');
            modalContainer.id = 'addIbanModal';
            modalContainer.className = 'modal';
            modalContainer.style.display = 'none';
            document.body.appendChild(modalContainer);
        }
    },
    
    open: function(directAdd) {
        // Don't open if already open
        if (this.isOpen) return;
        
        // Check if we should show the modal based on directAdd or storage
        if (directAdd || !sessionStorage.getItem('IbanDisclaimerShown')) {
            this.isOpen = true;
            this.render();
            
            // Mark as shown
            if (!directAdd) {
                sessionStorage.setItem('IbanDisclaimerShown', 'true');
            }
        }
    },
    
    close: function() {
        this.isOpen = false;
        var modal = document.getElementById('addIbanModal');
        if (modal) {
            modal.style.display = 'none';
        }
    },
    
    render: function() {
        var currentUser = JSON.parse(localStorage.getItem('currentUser'));
        var modal = document.getElementById('addIbanModal');
        
        if (!modal) {
            this.init();
            modal = document.getElementById('addIbanModal');
        }
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Enter IBAN</h2>
                    <button type="button" class="close-btn" id="closeIbanModal">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="ibanForm">
                        <div class="form-group">
                            <label for="ibn" class="form-label">IBAN</label>
                            <input type="text" id="ibn" class="form-control" placeholder="Enter your IBAN">
                            <div id="ibnError" class="form-error-message"></div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" id="saveIbanBtn" class="btn btn-primary">Save</button>
                    <button type="button" id="cancelIbanBtn" class="btn btn-secondary">Cancel</button>
                </div>
            </div>
        `;
        
        modal.style.display = 'flex';
        
        // Setup event listeners
        this.setupEventListeners();
    },
    
    setupEventListeners: function() {
        // Close button
        var closeBtn = document.getElementById('closeIbanModal');
        if (closeBtn) {
            closeBtn.addEventListener('click', this.close.bind(this));
        }
        
        // Cancel button
        var cancelBtn = document.getElementById('cancelIbanBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', this.close.bind(this));
        }
        
        // Save button
        var saveBtn = document.getElementById('saveIbanBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', this.handleSave.bind(this));
        }
        
        // IBAN input validation
        var ibanInput = document.getElementById('ibn');
        if (ibanInput) {
            ibanInput.addEventListener('blur', this.validateIban.bind(this));
        }
        
        // Close when clicking outside the modal content
        var modal = document.getElementById('addIbanModal');
        if (modal) {
            modal.addEventListener('click', function(event) {
                if (event.target === modal) {
                    this.close();
                }
            }.bind(this));
        }
    },
    
    validateIban: function(event) {
        var ibanInput = document.getElementById('ibn');
        var ibanError = document.getElementById('ibnError');
        var value = ibanInput ? ibanInput.value.trim() : '';
        
        // Clear previous error
        if (ibanError) {
            ibanError.textContent = '';
            ibanError.classList.remove('visible');
        }
        
        // Validate IBAN
        if (!value) {
            if (ibanError) {
                ibanError.textContent = 'IBAN is required';
                ibanError.classList.add('visible');
            }
            return false;
        }
        
        // Check format: 2 letters + 2 digits + 11-30 alphanumeric chars
        var ibanPattern = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$/;
        if (!ibanPattern.test(value)) {
            if (ibanError) {
                ibanError.textContent = 'Invalid IBAN format. Ensure it starts with two uppercase letters followed by two digits, and contains only alphanumeric characters.';
                ibanError.classList.add('visible');
            }
            return false;
        }
        
        // Check length
        if (value.length < 15 || value.length > 34) {
            if (ibanError) {
                ibanError.textContent = 'IBAN must be between 15 and 34 characters long.';
                ibanError.classList.add('visible');
            }
            return false;
        }
        
        return true;
    },
    
    handleSave: function(event) {
        event.preventDefault();
        
        // Validate IBAN
        if (!this.validateIban()) {
            return;
        }
        
        var ibanInput = document.getElementById('ibn');
        var ibanValue = ibanInput ? ibanInput.value.trim() : '';
        var currentUser = JSON.parse(localStorage.getItem('currentUser'));
        
        // Prepare data for API call
        var ibanData = {
            ibn: ibanValue,
            user_id: currentUser.id
        };
        
        // Show loading state
        Utils.showLoading(true);
        
        // Call API to create IBAN
        ApiClient.createIban(ibanData)
            .then(function(response) {
                // Show success message
                Utils.showMessage('success', 'IBAN created successfully!');
                
                // Reset form and close modal
                var ibanForm = document.getElementById('ibanForm');
                if (ibanForm) {
                    ibanForm.reset();
                }
                this.close();
                
                // Invalidate cached data
                if (typeof QueryCache !== 'undefined') {
                    QueryCache.invalidate('outflows');
                }
            }.bind(this))
            .catch(function(error) {
                // Show error message
                Utils.showMessage('error', 'Failed to create IBAN: ' + (error.message || 'Unknown error'));
            })
            .finally(function() {
                // Hide loading state
                Utils.showLoading(false);
            });
    }
};

// Initialize AddIban
AddIban.init();

// Make AddIban globally available
window.AddIban = AddIban;
