var DisposeAsset = {
    asset: null,
    isOpen: false,
    onClose: null,
    disposeStatus: '',
    
    init: function(asset, onClose) {
        this.asset = asset;
        console.log("Disposing asset:", this.asset); // For debugging
        this.onClose = onClose || function() {};
        this.disposeStatus = '';
        this.render();
        this.setupEventListeners();
        return this;
    },
    
    cleanup: function() {
        Utils.cleanup('disposeAssetModal');
    },
    
    render: function() {
        // Clean up any existing modal
        this.cleanup();
        
        var modal = document.createElement('div');
        modal.id = 'disposeAssetModal';
        modal.className = 'modal';
        
        // Create the modal markup with base fields
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Dispose Asset</h2>
                    <button type="button" class="close-btn" id="closeDisposeAssetModal">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="disposeAssetForm">
                        <div class="modal-form-grid">
                            <div class="form-group">
                                ${Utils.createLabel('disposeStatus', 'Action', true)}
                                <select id="disposeStatus" name="dispose_status" class="form-control" required>
                                    <option value="">Select Disposed Status</option>
                                    <option value="Sell">Sell</option>
                                    <option value="Gift">Gift</option>
                                    <option value="Lost/Missing">Lost/Missing</option>
                                    <option value="Move">Move</option>
                                </select>
                                <div class="error-message" id="disposeStatusError"></div>
                            </div>
                            
                            <!-- Dynamic fields will be inserted here based on selected action -->
                            <div id="dynamicFields"></div>
                            
                            <div class="form-group">
                                ${Utils.createLabel('disposedReason', 'Reason', true)}
                                <input type="text" id="disposedReason" name="disposed_reason" class="form-control" placeholder="Enter reason" required>
                                <div class="error-message" id="disposedReasonError"></div>
                            </div>
                            
                            <div class="form-group">
                                ${Utils.createLabel('disposedDate', 'Disposed Date', true)}
                                <input type="date" id="disposedDate" name="disposed_date" class="form-control" required>
                                <div class="error-message" id="disposedDateError"></div>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" id="saveDisposeBtn" class="btn btn-primary">Save</button>
                    <button type="button" id="cancelDisposeBtn" class="btn btn-secondary">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.isOpen = true;
        
        // Set current date for the disposed date field
        var dateInput = document.getElementById('disposedDate');
        if (dateInput) {
            Utils.setCurrentDate(dateInput);
        }
        
        // Show the modal
        setTimeout(function() {
            modal.style.display = 'flex';
        }, 10);
    },
    
    renderDisposeFields: function() {
        var dynamicFields = document.getElementById('dynamicFields');
        if (!dynamicFields) return;
        
        dynamicFields.innerHTML = '';
        
        switch (this.disposeStatus) {
            case 'Sell':
                dynamicFields.innerHTML = `
                    <div class="form-group">
                        ${Utils.createLabel('sellPrice', 'Price', true)}
                        <input type="number" id="sellPrice" name="sell_price" class="form-control" placeholder="0000.00" step="0.01" min="0.01" required>
                        <div class="error-message" id="sellPriceError"></div>
                    </div>
                    <div class="form-group">
                        ${Utils.createLabel('soldTo', 'Sold to', true)}
                        <input type="text" id="soldTo" name="sold_to" class="form-control" placeholder="Enter details" required>
                        <div class="error-message" id="soldToError"></div>
                    </div>
                `;
                break;
            case 'Gift':
                dynamicFields.innerHTML = `
                    <div class="form-group">
                        ${Utils.createLabel('giftTo', 'Gifted to', true)}
                        <input type="text" id="giftTo" name="gift_to" class="form-control" placeholder="Enter details" required>
                        <div class="error-message" id="giftToError"></div>
                    </div>
                `;
                break;
            default:
                // No additional fields for other options
                break;
        }
        
        // Re-attach validation for new fields
        var newFields = dynamicFields.querySelectorAll('input[required]');
        newFields.forEach(function(input) {
            input.onblur = function() {
                this.validateField(input);
            }.bind(this);
        }, this);
    },
    
    setupEventListeners: function() {
        var self = this;
        
        // Close button event
        var closeBtn = document.getElementById('closeDisposeAssetModal');
        if (closeBtn) {
            closeBtn.onclick = this.close.bind(this);
        }
        
        // Cancel button event
        var cancelBtn = document.getElementById('cancelDisposeBtn');
        if (cancelBtn) {
            cancelBtn.onclick = this.close.bind(this);
        }
        
        // Save button event
        var saveBtn = document.getElementById('saveDisposeBtn');
        if (saveBtn) {
            saveBtn.onclick = this.handleSubmit.bind(this);
        }
        
        // Close modal when clicking outside
        var modal = document.getElementById('disposeAssetModal');
        if (modal) {
            window.onclick = function(event) {
                if (event.target === modal) {
                    self.close();
                }
            };
        }
        
        // Dispose status change event
        var disposeStatusSelect = document.getElementById('disposeStatus');
        if (disposeStatusSelect) {
            disposeStatusSelect.onchange = function() {
                self.disposeStatus = disposeStatusSelect.value;
                self.renderDisposeFields();
            };
        }
        
        // Form validation on blur
        var form = document.getElementById('disposeAssetForm');
        if (form) {
            var inputs = form.querySelectorAll('input[required], select[required]');
            inputs.forEach(function(input) {
                input.onblur = function() {
                    self.validateField(input);
                };
            });
        }
        
        // Prevent invalid characters in numeric input
        var numericInputs = form.querySelectorAll('input[type="number"]');
        numericInputs.forEach(function(input) {
            input.onkeydown = function(e) {
                // Allow: backspace, delete, tab, escape, enter, decimal point, arrows
                if ([46, 8, 9, 27, 13, 110, 190, 37, 38, 39, 40].indexOf(e.keyCode) !== -1 ||
                    // Allow: Ctrl+A
                    (e.keyCode === 65 && e.ctrlKey === true) ||
                    // Allow: Ctrl+C
                    (e.keyCode === 67 && e.ctrlKey === true) ||
                    // Allow: Ctrl+V
                    (e.keyCode === 86 && e.ctrlKey === true) ||
                    // Allow: Ctrl+X
                    (e.keyCode === 88 && e.ctrlKey === true) ||
                    // Allow: home, end
                    (e.keyCode >= 35 && e.keyCode <= 39)) {
                    // Let it happen
                    return;
                }
                // Ensure that it's a number and stop the keypress if not
                if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                    e.preventDefault();
                }
            };
        });
    },
    
    validateField: function(field) {
        var errorElement = document.getElementById(field.id + 'Error');
        if (!field.value.trim() && field.required) {
            field.classList.add('is-invalid');
            if (errorElement) {
                var fieldName = field.name.split('_').map(function(word) {
                    return word.charAt(0).toUpperCase() + word.slice(1);
                }).join(' ');
                errorElement.textContent = fieldName + ' is required';
                errorElement.style.display = 'block';
            }
            return false;
        } else if (field.type === 'number' && parseFloat(field.value) <= 0 && field.required) {
            field.classList.add('is-invalid');
            if (errorElement) {
                errorElement.textContent = 'Amount must be greater than 0';
                errorElement.style.display = 'block';
            }
            return false;
        } else {
            field.classList.remove('is-invalid');
            if (errorElement) {
                errorElement.textContent = '';
                errorElement.style.display = 'none';
            }
            return true;
        }
    },
    
    validateForm: function() {
        var form = document.getElementById('disposeAssetForm');
        var isValid = true;
        
        if (form) {
            var inputs = form.querySelectorAll('input[required], select[required]');
            inputs.forEach(function(input) {
                if (!this.validateField(input)) {
                    isValid = false;
                }
            }, this);
        }
        
        return isValid;
    },
    
    getFormData: function() {
        var form = document.getElementById('disposeAssetForm');
        var formData = {};
        
        if (form) {
            var inputs = form.querySelectorAll('input, select');
            inputs.forEach(function(input) {
                // Only include relevant fields based on dispose status
                if (input.name === 'sell_price' || input.name === 'sold_to') {
                    if (this.disposeStatus === 'Sell') {
                        if (input.type === 'number') {
                            formData[input.name] = input.value ? parseFloat(input.value) : null;
                        } else {
                            formData[input.name] = input.value.trim();
                        }
                    }
                } else if (input.name === 'gift_to') {
                    if (this.disposeStatus === 'Gift') {
                        formData[input.name] = input.value.trim();
                    }
                } else {
                    // Always include other fields
                    if (input.type === 'number') {
                        formData[input.name] = input.value ? parseFloat(input.value) : null;
                    } else {
                        formData[input.name] = input.value.trim();
                    }
                }
            }, this);
            
            // Add the asset ID
            formData.asset_id = this.asset.id;
        }
        
        return formData;
    },
    
    isDirty: function() {
        // Consider the form dirty if any values are filled in
        var form = document.getElementById('disposeAssetForm');
        if (!form) return false;
        
        var inputs = form.querySelectorAll('input, select');
        for (var i = 0; i < inputs.length; i++) {
            if (inputs[i].type === 'select-one' && inputs[i].value !== '') {
                return true;
            } else if ((inputs[i].type === 'text' || inputs[i].type === 'number' || inputs[i].type === 'date') && 
                      inputs[i].value.trim() !== '') {
                return true;
            }
        }
        
        return false;
    },
    
    close: function() {
        var modal = document.getElementById('disposeAssetModal');
        if (modal) {
            modal.style.display = 'none';
            this.cleanup();
        }
        this.isOpen = false;
        if (typeof this.onClose === 'function') {
            this.onClose();
        }
    },
    
    handleSubmit: function() {
        if (!this.validateForm()) {
            return;
        }
        
        if (!this.isDirty()) {
            this.close();
            return;
        }
        
        var self = this;
        var saveBtn = document.getElementById('saveDisposeBtn');
        
        // Disable the save button and show loading state
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<span class="spinner"></span> Saving...';
        }
        
        var formData = this.getFormData();
        
        // Call the API to dispose the asset
        ApiClient.disposeAsset(this.asset.id, formData)
            .then(function(response) {
                // Show success message
                Utils.onSuccess('edit', 'Asset disposal');
                
                // Refresh the assets list
                if (typeof AssetsApp !== 'undefined' && typeof AssetsApp.loadAssetsData === 'function') {
                    AssetsApp.loadAssetsData();
                }
                
                // Close the modal
                self.close();
            })
            .catch(function(error) {
                console.error('Error disposing asset:', error);
                
                // Show error message
                var errorMessage = error.message || 'Failed to dispose asset. Please try again.';
                var errorDiv = document.createElement('div');
                errorDiv.className = 'alert alert-error';
                errorDiv.innerHTML = errorMessage;
                
                var modalBody = document.querySelector('#disposeAssetModal .modal-body');
                if (modalBody) {
                    modalBody.insertBefore(errorDiv, modalBody.firstChild);
                    
                    // Remove error message after 5 seconds
                    setTimeout(function() {
                        if (errorDiv.parentNode) {
                            errorDiv.parentNode.removeChild(errorDiv);
                        }
                    }, 5000);
                }
            })
            .finally(function() {
                // Re-enable the save button
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = 'Save';
                }
            });
    },
    
    open: function(asset, onClose) {
        if (asset) {
            this.asset = asset;
        }
        if (onClose) {
            this.onClose = onClose;
        }
        this.render();
        this.setupEventListeners();
        this.isOpen = true;
    }
};

// Make DisposeAsset globally available
window.DisposeAsset = DisposeAsset;
