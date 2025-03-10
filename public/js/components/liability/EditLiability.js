var EditLiability = {
    init: function(type, id, onClose) {
        this.type = type;
        this.liabilityId = id;
        this.onClose = onClose;
        this.cleanup();
        
        // Load liability data first, then render
        if (id) {
            this.loadLiabilityData();
        } else {
            this.render();
            this.setupEventListeners();
        }
    },
  
    cleanup: function() {
        if (typeof Utils !== 'undefined' && typeof Utils.cleanup === 'function') {
            Utils.cleanup('editLiabilityModal');
        } else {
            var existingModal = document.getElementById('editLiabilityModal');
            if (existingModal && existingModal.parentNode) {
                existingModal.parentNode.removeChild(existingModal);
            }
        }
    },
  
    loadLiabilityData: function() {
        var self = this;
        ApiClient.getLiability(this.liabilityId)
            .then(function(liability) {
                self.liability = liability; // Store liability data
                self.render(); // Render with data
                self.setupEventListeners();
                
                // Set head value and trigger change to load subheads
                var headSelect = document.getElementById('head');
                if (headSelect && self.liability.head_id) {
                    // Wait for heads to be loaded
                    var checkHeadsLoaded = setInterval(function() {
                        if (headSelect.options.length > 1) {
                            clearInterval(checkHeadsLoaded);
                            headSelect.value = self.liability.head_id;
                            
                            // Trigger change event to load subheads
                            if (typeof Utils !== 'undefined' && typeof Utils.loadSubHeads === 'function') {
                                Utils.loadSubHeads(self.liability.head_id);
                            } else {
                                self.loadSubHeads(self.liability.head_id);
                            }
                            
                            // Set subhead after a delay
                            setTimeout(function() {
                                var subheadSelect = document.getElementById('subhead');
                                if (subheadSelect && self.liability.subhead_id) {
                                    subheadSelect.value = self.liability.subhead_id;
                                }
                            }, 500);
                        }
                    }, 100);
                }
            })
            .catch(function(error) {
                console.error('Failed to load liability:', error);
                alert('Failed to load liability: ' + (error.message || 'Unknown error'));
            });
    },
    
    // Fallback method if Utils is not available
    loadHeadsData: function(type) {
        if (typeof ApiClient !== 'undefined') {
            ApiClient.getHeads(type)
                .then(function(response) {
                    var headSelect = document.getElementById('head');
                    if (headSelect) {
                        headSelect.innerHTML = '<option value="">Select a head</option>';
                        response.data.forEach(function(head) {
                            var option = document.createElement('option');
                            option.value = head.id;
                            option.textContent = head.heads;
                            option.dataset.subheads = JSON.stringify(head.sub_heads || []);
                            headSelect.appendChild(option);
                        });
                    }
                })
                .catch(function(error) {
                    console.error('Failed to load heads:', error);
                });
        }
    },
    
    // Fallback method if Utils is not available
    loadSubHeads: function(headId) {
        var subHeadContainer = document.getElementById('subHeadContainer');
        var subHeadSelect = document.getElementById('subhead');
        var selectedHead = document.querySelector('#head option[value="' + headId + '"]');
        
        if (subHeadSelect) {
            subHeadSelect.innerHTML = '<option value="">Select a sub-head</option>';
            var subHeads = selectedHead && selectedHead.dataset.subheads ? JSON.parse(selectedHead.dataset.subheads) : [];
            
            if (subHeads.length > 0) {
                subHeads.forEach(function(subHead) {
                    var option = document.createElement('option');
                    option.value = subHead.id;
                    option.textContent = subHead.subheads;
                    subHeadSelect.appendChild(option);
                });
                if (subHeadContainer) {
                    subHeadContainer.style.display = 'block';
                }
            } else if (subHeadContainer) {
                subHeadContainer.style.display = 'none';
            }
        }
    },
  
    render: function() {
        // Helper function to create labels (fallback if Utils is not available)
        var createLabel = function(forId, text, isRequired) {
            if (typeof Utils !== 'undefined' && typeof Utils.createLabel === 'function') {
                return Utils.createLabel(forId, text, isRequired);
            }
            var requiredAttr = isRequired ? ' data-required="*"' : '';
            return '<label for="' + forId + '"' + requiredAttr + '>' + text + '</label>';
        };
        
        // Format date for input if we have liability data
        var formattedDate = '';
        if (this.liability && this.liability.date) {
            if (typeof Utils !== 'undefined' && typeof Utils.formatDateForInput === 'function') {
                formattedDate = Utils.formatDateForInput(this.liability.date);
            } else {
                formattedDate = this.liability.date.split('T')[0];
            }
        }
        
        var modalHtml = '<div class="modal" id="editLiabilityModal">' +
            '<div class="modal-content">' +
                '<div class="modal-header">' +
                    '<h2>Edit Liability</h2>' +
                    '<button type="button" class="close-btn">&times;</button>' +
                '</div>' +
                '<div class="modal-body">' +
                    '<form id="editLiabilityForm" class="modal-form-grid">' +
                        // Head field
                        '<div class="form-group">' +
                            createLabel('head', 'Head', true) +
                            '<select id="head" name="head_id" required></select>' +
                        '</div>' +
                        
                        // Sub Head field (conditionally shown)
                        '<div class="form-group" id="subHeadContainer" style="display: ' + 
                            (this.liability && this.liability.subhead_id ? 'block' : 'none') + ';">' +
                            createLabel('subhead', 'Sub Head', false) +
                            '<select id="subhead" name="subhead_id">' +
                                '<option value="">Select a sub-head</option>' +
                            '</select>' +
                        '</div>' +
                        
                        // Fund Details field
                        '<div class="form-group full-width">' +
                            createLabel('fund_details', 'Fund Details', true) +
                            '<textarea ' +
                                'id="fund_details" ' +
                                'name="fund_details" ' +
                                'required ' +
                                'placeholder="Enter fund details..." ' +
                                'rows="3"' +
                            '>' + (this.liability ? (this.liability.fund_details || '') : '') + '</textarea>' +
                        '</div>' +
                        
                        // Amount field
                        '<div class="form-group">' +
                            createLabel('amount', 'Amount', true) +
                            '<input ' +
                                'type="number" ' +
                                'id="amount" ' +
                                'name="amount" ' +
                                'step="0.01" ' +
                                'min="0.01" ' +
                                'value="' + (this.liability ? (this.liability.amount || '') : '') + '" ' +
                                'required' +
                            '>' +
                        '</div>' +
                        
                        // Remaining Balance field
                        '<div class="form-group">' +
                            createLabel('remaining_balance', 'Remaining Balance', true) +
                            '<input ' +
                                'type="number" ' +
                                'id="remaining_balance" ' +
                                'name="remaining_balance" ' +
                                'step="0.01" ' +
                                'min="0" ' +
                                'value="' + (this.liability ? (this.liability.remaining_balance || '') : '') + '" ' +
                                'required' +
                            '>' +
                        '</div>' +
                        
                        // Type field
                        '<div class="form-group">' +
                            createLabel('type', 'Type', true) +
                            '<select id="type" name="type" required>' +
                                '<option value="">Select type</option>' +
                                '<option value="Short Term"' +
                                    (this.liability && this.liability.type === 'Short Term' ? ' selected' : '') +
                                    '>Short Term</option>' +
                                '<option value="Long Term"' +
                                    (this.liability && this.liability.type === 'Long Term' ? ' selected' : '') +
                                    '>Long Term</option>' +
                            '</select>' +
                        '</div>' +
                        
                        // Payment To field
                        '<div class="form-group">' +
                            createLabel('payment_to', 'Payment To', true) +
                            '<input type="text" id="payment_to" name="payment_to" value="' + 
                                (this.liability ? (this.liability.payment_to || '') : '') + '" required>' +
                        '</div>' +
                        
                        // Payment Method field
                        '<div class="form-group">' +
                            createLabel('payment_method', 'Payment Method', true) +
                            '<select id="payment_method" name="payment_method" required>' +
                                '<option value="">Select payment method</option>' +
                                '<option value="Bank Transfer"' +
                                    (this.liability && this.liability.payment_method === 'Bank Transfer' ? ' selected' : '') +
                                    '>Bank Transfer</option>' +
                                '<option value="Cash Transfer"' +
                                    (this.liability && this.liability.payment_method === 'Cash Transfer' ? ' selected' : '') +
                                    '>Cash Transfer</option>' +
                            '</select>' +
                        '</div>' +
                        
                        // Date field
                        '<div class="form-group">' +
                            createLabel('date', 'Date of Entry', true) +
                            '<input type="text" id="date" name="date" value="' + formattedDate + 
                                '" required placeholder="YYYY-MM-DD" readonly>' +
                        '</div>' +
                    '</form>' +
                '</div>' +
                '<div class="modal-footer">' +
                    '<button type="button" class="btn btn-secondary close-btn">Cancel</button>' +
                    '<button type="submit" form="editLiabilityForm" class="btn btn-primary">Update</button>' +
                '</div>' +
            '</div>' +
        '</div>';
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Show the modal with a slight delay for CSS transition
        var modal = document.getElementById('editLiabilityModal');
        if (modal) {
            setTimeout(function() {
                modal.classList.add('show');
            }, 10);
        }
    },
  
    setupEventListeners: function() {
        var self = this;
        
        // Use the common form modal setup function if available
        if (typeof Utils !== 'undefined' && typeof Utils.setupFormModal === 'function') {
            Utils.setupFormModal({
                component: this,
                modalId: 'editLiabilityModal',
                formId: 'editLiabilityForm',
                dateInputId: 'date',
                loadHeads: true,
                headType: 3, // Assuming 3 is the type code for liability heads
                isEditMode: true,
                additionalListeners: function() {
                    // Set up listeners specific to EditLiability
                    var headSelect = document.getElementById('head');
                    
                    // Head select change handler
                    if (headSelect) {
                        headSelect.onchange = function() {
                            if (typeof Utils !== 'undefined' && typeof Utils.loadSubHeads === 'function') {
                                Utils.loadSubHeads(this.value);
                            } else if (typeof self.loadSubHeads === 'function') {
                                self.loadSubHeads(this.value);
                            }
                        };
                    }
                }
            });
        } else {
            // Fallback to manual event listeners setup
            var modal = document.getElementById('editLiabilityModal');
            var form = document.getElementById('editLiabilityForm');
            var headSelect = document.getElementById('head');
            var closeBtn = modal.querySelector('.close-btn');
            var cancelBtn = modal.querySelector('[data-dismiss="modal"]');
      
            if (closeBtn) {
                closeBtn.onclick = function() {
                    self.close();
                };
            }
      
            if (cancelBtn) {
                cancelBtn.onclick = function() {
                    self.close();
                };
            }
      
            if (headSelect) {
                headSelect.onchange = function() {
                    if (typeof Utils !== 'undefined' && typeof Utils.loadSubHeads === 'function') {
                        Utils.loadSubHeads(this.value);
                    } else if (typeof self.loadSubHeads === 'function') {
                        self.loadSubHeads(this.value);
                    }
                };
            }
      
            if (form) {
                form.onsubmit = function(e) {
                    e.preventDefault();
                    var formData = new FormData(form);
                    self.handleSubmit(formData);
                };
            }
            
            // Initialize the restricted datepicker component on the date input
            var dateInput = document.getElementById('date');
            if (dateInput) {
                if (typeof Utils !== 'undefined' && typeof Utils.initDatePicker === 'function') {
                    Utils.initDatePicker(dateInput);
                } else if (typeof RestrictedDatePicker === 'function') {
                    RestrictedDatePicker(dateInput);
                } else {
                    // Fallback: use the native date input if supported
                    dateInput.type = 'date';
                    dateInput.readOnly = false;
                }
            }
            
            // Load heads data
            if (typeof Utils !== 'undefined' && typeof Utils.loadHeadsData === 'function') {
                Utils.loadHeadsData(3); // Assuming 3 is the type code for liability heads
            } else if (typeof self.loadHeadsData === 'function') {
                self.loadHeadsData(3);
            }
        }
    },
  
    close: function() {
        var modal = document.getElementById('editLiabilityModal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(function() {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
            }, 300);
        }
        
        if (typeof this.onClose === 'function') {
            this.onClose();
        }
    },
  
    handleSubmit: function(formData) {
        var self = this;
        var submitButton = document.querySelector('button[type="submit"]');

        if (submitButton && submitButton.disabled) {
            return;
        }

        if (submitButton) {
            submitButton.disabled = true;
        }

        var data;
        // Use the processFormData utility if available
        if (typeof Utils !== 'undefined' && typeof Utils.processFormData === 'function') {
            data = Utils.processFormData(formData, {
                numericFields: ['amount', 'remaining_balance'],
                integerFields: ['head_id', 'subhead_id']
            });
        } else {
            // Build an object from formData
            data = {};
            formData.forEach(function(value, key) { data[key] = value; });
    
            // Format amount values
            data.amount = Number(parseFloat(data.amount).toFixed(2));
            data.remaining_balance = Number(parseFloat(data.remaining_balance).toFixed(2));
            
            // Convert IDs to integers
            if (data.head_id) {
                data.head_id = parseInt(data.head_id, 10);
            }
            if (data.subhead_id) {
                data.subhead_id = parseInt(data.subhead_id, 10);
            }
        }
        
        // Validate amount fields
        if (isNaN(data.amount) || data.amount <= 0) {
            alert('Amount must be greater than 0');
            if (submitButton) {
                submitButton.disabled = false;
            }
            return;
        }

        if (isNaN(data.remaining_balance) || data.remaining_balance < 0) {
            alert('Remaining balance cannot be negative');
            if (submitButton) {
                submitButton.disabled = false;
            }
            return;
        }

        ApiClient.updateLiability(this.liabilityId, data)
            .then(function() {
                self.close();
                
                // Use Utils.onSuccess if available
                if (typeof Utils !== 'undefined' && typeof Utils.onSuccess === 'function') {
                    Utils.onSuccess('edit', 'Liability');
                } else {
                    self.showSuccessMessage('edit', 'Liability');
                }
            })
            .catch(function(error) {
                console.error('Failed to update liability:', error);
                alert('Failed to update liability: ' + (error.message || 'Unknown error'));
            })
            .finally(function() {
                if (submitButton) {
                    submitButton.disabled = false;
                }
            });
    },
  
    showSuccessMessage: function(action, type) {
        // Use Utils.onSuccess if available
        if (typeof Utils !== 'undefined' && typeof Utils.onSuccess === 'function') {
            Utils.onSuccess(action, type);
            return;
        }
        
        // Fallback implementation
        var message = '';
        switch (action) {
            case 'add':
                message = 'Added ' + type + ' successfully!';
                break;
            case 'edit':
                message = 'Updated ' + type + ' successfully!';
                break; 
            case 'delete':
                message = 'Deleted ' + type + ' successfully!';
                break;
        }
    
        var successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        
        if (action === 'delete') {
            successDiv.style.backgroundColor = '#d63031';
        }
        
        successDiv.innerText = message;
    
        document.body.appendChild(successDiv);
    
        setTimeout(function() {
            if (successDiv.parentNode) {
                successDiv.parentNode.removeChild(successDiv);
            }
        }, 3000);
    }
};

// Make EditLiability globally available
window.EditLiability = EditLiability; 