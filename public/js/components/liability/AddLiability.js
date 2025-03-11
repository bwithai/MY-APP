var AddLiability = {
    init: function(onSuccess) {
        this.cleanup();
        this.onSuccess = onSuccess;
        this.render();
  
        var self = this;
        setTimeout(function() {
            self.setupEventListeners();
            
            // Load heads data if Utils is available
            if (typeof Utils !== 'undefined' && typeof Utils.loadHeadsData === 'function') {
                Utils.loadHeadsData(1);
            } else {
                self.loadHeadsData(1);
            }
        }, 0);
    },
  
    cleanup: function() {
        if (typeof Utils !== 'undefined' && typeof Utils.cleanup === 'function') {
            Utils.cleanup('addLiabilityModal');
        } else {
            var existingModal = document.getElementById('addLiabilityModal');
            if (existingModal && existingModal.parentNode) {
                existingModal.parentNode.removeChild(existingModal);
            }
        }
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
        
        var modalHtml =
            '<div class="modal" id="addLiabilityModal">' +
                '<div class="modal-content">' +
                    '<div class="modal-header">' +
                        '<h2>Add Liability</h2>' +
                        '<button type="button" class="close-btn">&times;</button>' +
                    '</div>' +
                    '<div class="modal-body">' +
                        '<form id="addLiabilityForm" class="modal-form-grid">' +
                            // Head field
                            '<div class="form-group">' +
                                createLabel('head', 'Head', true) +
                                '<select id="head" name="head_id" required>' +
                                    '<option value="">Select a head</option>' +
                                '</select>' +
                            '</div>' +
                            
                            // Sub Head field (conditionally shown)
                            '<div class="form-group" id="subHeadContainer" style="display: none;">' +
                                createLabel('subhead', 'Sub Head', false) +
                                '<select id="subhead" name="subhead_id">' +
                                    '<option value="">Select a sub-head</option>' +
                                '</select>' +
                            '</div>' +
                            
                            // Fund Details field
                            '<div class="form-group full-width">' +
                                createLabel('fund_details', 'Fund Details', true) +
                                '<textarea id="fund_details" name="fund_details" required placeholder="Enter details..." rows="3"></textarea>' +
                            '</div>' +
                            
                            // Amount field
                            '<div class="form-group">' +
                                createLabel('amount', 'Amount', true) +
                                '<input type="number" id="amount" name="amount" step="0.01" min="0.01" required>' +
                            '</div>' +
                            
                            // Type field
                            '<div class="form-group">' +
                                createLabel('type', 'Type', true) +
                                '<select id="type" name="type" required>' +
                                    '<option value="">Select type</option>' +
                                    '<option value="Miscellaneous">Miscellaneous</option>' +
                                    '<option value="Security">Security</option>' +
                                    '<option value="Other">Other</option>' +
                                '</select>' +
                            '</div>' +
                            
                            // Payment To field
                            '<div class="form-group">' +
                                createLabel('payment_to', 'Payment To', true) +
                                '<input type="text" id="payment_to" name="payment_to" required>' +
                            '</div>' +
                            
                            // Payment Method field
                            '<div class="form-group">' +
                                createLabel('payment_method', 'Payment Method', true) +
                                '<select id="payment_method" name="payment_method" required>' +
                                    '<option value="">Select payment method</option>' +
                                    '<option value="Bank Transfer">Bank Transfer</option>' +
                                    '<option value="Cash Transfer">Cash Transfer</option>' +
                                '</select>' +
                            '</div>' +
                            
                            // Date of Entry field
                            '<div class="form-group">' +
                                createLabel('date', 'Date of Entry', true) +
                                '<input type="text" id="date" name="date" required placeholder="YYYY-MM-DD" readonly>' +
                            '</div>' +
                        '</form>' +
                    '</div>' +
                    '<div class="modal-footer">' +
                        '<button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>' +
                        '<button type="submit" form="addLiabilityForm" class="btn btn-primary" id="submitLiability">Save</button>' +
                    '</div>' +
                '</div>' +
            '</div>';
  
        document.body.insertAdjacentHTML('beforeend', modalHtml);
  
        // Show the modal with a slight delay for CSS transition
        var modal = document.getElementById('addLiabilityModal');
        if (modal) {
            setTimeout(function() {
                modal.classList.add('show');
            }, 10);
        }
  
        // Set default date to today using utility function
        var dateInput = document.getElementById('date');
        if (dateInput) {
            Utils.setCurrentDate(dateInput);
        }
    },
  
    setupEventListeners: function() {
        var self = this;
        var modal = document.getElementById('addLiabilityModal');
        if (!modal) {
            console.error('Modal not found');
            return;
        }
  
        var form = document.getElementById('addLiabilityForm');
        var headSelect = document.getElementById('head');
        var closeBtn = modal.querySelector('.close-btn');
        var cancelBtn = modal.querySelector('[data-dismiss="modal"]');
  
        if (closeBtn) {
            closeBtn.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                self.close();
            };
        }
        
        if (cancelBtn) {
            cancelBtn.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                self.close();
            };
        }
        
        if (headSelect) {
            headSelect.onchange = function() {
                if (typeof Utils !== 'undefined' && typeof Utils.loadSubHeads === 'function') {
                    Utils.loadSubHeads(this.value);
                } else {
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
  
        // Initialize the datepicker component on the date input using Utils
        var dateInput = document.getElementById('date');
        if (dateInput) {
            Utils.initDatePicker(dateInput);
        }
    },
  
    close: function() {
        var modal = document.getElementById('addLiabilityModal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(function() {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
            }, 300);
        }
    },
  
    handleSubmit: function(formData) {
        var self = this;
        var submitButton = document.getElementById('submitLiability');
        if (submitButton && submitButton.disabled) {
            return;
        }
        if (submitButton) {
            submitButton.disabled = true;
        }
  
        // Build an object from formData
        var data = {};
        formData.forEach(function(value, key) { data[key] = value; });
  
        // Validate and format amount values
        var amount = Number(parseFloat(data.amount).toFixed(2));
        
        if (isNaN(amount) || amount <= 0) {
            alert('Amount must be greater than 0');
            if (submitButton) {
                submitButton.disabled = false;
            }
            return;
        }
  
        var formattedData = {
            head_id: parseInt(data.head_id),
            subhead_id: parseInt(data.subhead_id),
            fund_details: data.fund_details,
            amount: amount,
            type: data.type,
            payment_to: data.payment_to,
            payment_method: data.payment_method,
            date: data.date
        };
  
        // Add subhead_id if present
        if (data.subhead_id) {
            formattedData.subhead_id = parseInt(data.subhead_id, 10);
        }
  
        ApiClient.createLiability(formattedData)
            .then(function(response) {
                self.close();
                self.showSuccessMessage('add', 'Liability');
                if (typeof self.onSuccess === 'function') {
                    self.onSuccess();
                }
            })
            .catch(function(error) {
                console.error('Failed to create liability:', error);
                alert('Failed to create liability: ' + (error.message || 'Unknown error'));
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
        var message = (action === 'add') ? type + ' added successfully!' : 'Error adding ' + type;
        var messageClass = (action === 'add') ? 'success-message' : 'error-message';
        
        var messageElement = document.createElement('div');
        messageElement.className = messageClass;
        messageElement.textContent = message;
        document.body.appendChild(messageElement);
        
        setTimeout(function() {
            if (messageElement.parentNode) {
                messageElement.parentNode.removeChild(messageElement);
            }
        }, 3000);
    }
};

// Make AddLiability globally available
window.AddLiability = AddLiability; 