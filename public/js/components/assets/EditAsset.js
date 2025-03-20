var EditAsset = {
    asset: null,
    isOpen: false,
    onClose: null,
    
    init: function(asset, onClose) {
        this.asset = asset;
        console.log("Editing asset:", this.asset); // For debugging
        this.onClose = onClose || function() {};
        this.render();
        this.setupEventListeners();
        return this;
    },
    
    cleanup: function() {
        Utils.cleanup('editAssetModal');
    },
    
    render: function() {
        // Clean up any existing modal
        this.cleanup();
        
        var modal = document.createElement('div');
        modal.id = 'editAssetModal';
        modal.className = 'modal';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Edit Asset</h2>
                    <button type="button" class="close-btn" id="closeEditAssetModal">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="editAssetForm">
                        <div class="modal-form-grid">
                            <div class="form-group">
                                ${Utils.createLabel('assetTitle', 'Title', true)}
                                <input type="text" id="assetTitle" name="name" class="form-control" value="${this.asset.name || ''}" required>
                                <div class="error-message" id="titleError"></div>
                            </div>
                            
                            <div class="form-group">
                                ${Utils.createLabel('assetModel', 'Model', true)}
                                <input type="text" id="assetModel" name="model" class="form-control" value="${this.asset.model || ''}" placeholder="Enter model" required>
                                <div class="error-message" id="modelError"></div>
                            </div>
                            
                            <div class="form-group">
                                ${Utils.createLabel('assetBrand', 'Brand', true)}
                                <input type="text" id="assetBrand" name="brand" class="form-control" value="${this.asset.brand || ''}" placeholder="Enter brand" required>
                                <div class="error-message" id="brandError"></div>
                            </div>
                            
                            <div class="form-group">
                                ${Utils.createLabel('assetUsefulLife', 'Useful Life', true)}
                                <input type="number" id="assetUsefulLife" name="useful_life" class="form-control" value="${this.asset.useful_life || ''}" placeholder="Enter useful life (years)" required>
                                <div class="error-message" id="usefulLifeError"></div>
                            </div>
                            
                            <div class="form-group">
                                ${Utils.createLabel('assetRemarks', 'Remarks', true)}
                                <input type="text" id="assetRemarks" name="remarks" class="form-control" value="${this.asset.remarks || ''}" placeholder="Enter remarks" required>
                                <div class="error-message" id="remarksError"></div>
                            </div>
                            
                            <div class="form-group">
                                ${Utils.createLabel('assetPlaceType', 'Place Type', false)}
                                <input type="text" id="assetPlaceType" name="place_type" class="form-control" value="${this.asset.place_type || ''}" placeholder="Enter place type">
                                <div class="error-message" id="placeTypeError"></div>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" id="saveAssetBtn" class="btn btn-primary">Save</button>
                    <button type="button" id="cancelAssetBtn" class="btn btn-secondary">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.isOpen = true;
        
        // Show the modal
        setTimeout(function() {
            modal.style.display = 'flex';
        }, 10);
    },
    
    setupEventListeners: function() {
        var self = this;
        
        // Close button event
        var closeBtn = document.getElementById('closeEditAssetModal');
        if (closeBtn) {
            closeBtn.onclick = this.close.bind(this);
        }
        
        // Cancel button event
        var cancelBtn = document.getElementById('cancelAssetBtn');
        if (cancelBtn) {
            cancelBtn.onclick = this.close.bind(this);
        }
        
        // Save button event
        var saveBtn = document.getElementById('saveAssetBtn');
        if (saveBtn) {
            saveBtn.onclick = this.handleSubmit.bind(this);
        }
        
        // Close modal when clicking outside
        var modal = document.getElementById('editAssetModal');
        if (modal) {
            window.onclick = function(event) {
                if (event.target === modal) {
                    self.close();
                }
            };
        }
        
        // Form validation on blur
        var form = document.getElementById('editAssetForm');
        if (form) {
            var inputs = form.querySelectorAll('input[required]');
            inputs.forEach(function(input) {
                input.onblur = function() {
                    self.validateField(input);
                };
            });
        }
    },
    
    validateField: function(field) {
        var errorElement = document.getElementById(field.id.replace('asset', '') + 'Error');
        if (!field.value.trim() && field.required) {
            field.classList.add('is-invalid');
            if (errorElement) {
                errorElement.textContent = field.name.charAt(0).toUpperCase() + field.name.slice(1) + ' is required';
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
        var form = document.getElementById('editAssetForm');
        var isValid = true;
        
        if (form) {
            var inputs = form.querySelectorAll('input[required]');
            inputs.forEach(function(input) {
                if (!this.validateField(input)) {
                    isValid = false;
                }
            }, this);
        }
        
        return isValid;
    },
    
    getFormData: function() {
        var form = document.getElementById('editAssetForm');
        var formData = {};
        
        if (form) {
            var inputs = form.querySelectorAll('input');
            inputs.forEach(function(input) {
                // Convert number fields to numbers
                if (input.type === 'number') {
                    formData[input.name] = input.value ? Number(input.value) : null;
                } else {
                    formData[input.name] = input.value.trim();
                }
            });
        }
        
        return formData;
    },
    
    isDirty: function() {
        var currentData = this.getFormData();
        var originalData = this.asset;
        
        // Check if any field has changed
        return Object.keys(currentData).some(function(key) {
            return currentData[key] !== originalData[key];
        });
    },
    
    close: function() {
        var modal = document.getElementById('editAssetModal');
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
        var saveBtn = document.getElementById('saveAssetBtn');
        
        // Disable the save button and show loading state
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<span class="spinner"></span> Saving...';
        }
        
        var formData = this.getFormData();
        
        // Call the API to update the asset
        ApiClient.updateAsset(this.asset.id, formData)
            .then(function(response) {
                // Show success message
                Utils.onSuccess('edit', 'Asset');
                
                // Invalidate assets cache (refresh the assets list)
                if (typeof AssetsComponent !== 'undefined' && typeof AssetsComponent.loadAssets === 'function') {
                    AssetsComponent.loadAssets();
                }
                
                // Close the modal
                self.close();
            })
            .catch(function(error) {
                console.error('Error updating asset:', error);
                
                // Show error message
                var errorMessage = error.message || 'Failed to update asset. Please try again.';
                var errorDiv = document.createElement('div');
                errorDiv.className = 'alert alert-error';
                errorDiv.innerHTML = errorMessage;
                
                var modalBody = document.querySelector('#editAssetModal .modal-body');
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

// Make EditAsset globally available
window.EditAsset = EditAsset;
