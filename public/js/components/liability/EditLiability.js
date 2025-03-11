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
        Utils.cleanup('editLiabilityModal');
    },
  
    loadLiabilityData: function() {
        var self = this;
        ApiClient.getLiability(this.liabilityId)
            .then(function(liability) {
                self.liability = liability; // Store liability data
                self.render(); // Render with data
                self.setupEventListeners();
            })
            .catch(function(error) {
                console.error('Failed to load liability:', error);
                alert('Failed to load liability: ' + (error.message || 'Unknown error'));
            });
    },
  
    render: function() {
        // Format date for input if we have liability data
        var formattedDate = '';
        if (this.liability && this.liability.date) {
            formattedDate = Utils.formatDateForInput(this.liability.date);
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
                            Utils.createLabel('head', 'Head', true) +
                            '<select id="head" name="head_id" required></select>' +
                        '</div>' +
                        
                        // Sub Head field (conditionally shown)
                        '<div class="form-group" id="subHeadContainer" style="display: ' + 
                            (this.liability && this.liability.subhead_id ? 'block' : 'none') + ';">' +
                            Utils.createLabel('subhead', 'Sub Head', false) +
                            '<select id="subhead" name="subhead_id">' +
                                '<option value="">Select a sub-head</option>' +
                            '</select>' +
                        '</div>' +
                        
                        // Fund Details field
                        '<div class="form-group full-width">' +
                            Utils.createLabel('fund_details', 'Fund Details', true) +
                            '<textarea ' +
                                'id="fund_details" ' +
                                'name="fund_details" ' +
                                'required ' +
                                'placeholder="Enter details..." ' +
                                'rows="3"' +
                            '>' + (this.liability ? (this.liability.fund_details || '') : '') + '</textarea>' +
                        '</div>' +
                        
                        // Amount field
                        '<div class="form-group">' +
                            Utils.createLabel('amount', 'Amount', false) +
                            '<input ' +
                                'type="number" ' +
                                'id="amount" ' +
                                'name="amount" ' +
                                'step="0.01" ' +
                                'value="' + (this.liability ? (this.liability.amount || '') : '') + '" ' +
                                'readonly' +
                            '>' +
                        '</div>' +
                        
                        // Remaining Balance field
                        '<div class="form-group">' +
                            Utils.createLabel('remaining_balance', 'Remaining Balance', false) +
                            '<input ' +
                                'type="number" ' +
                                'id="remaining_balance" ' +
                                'name="remaining_balance" ' +
                                'step="0.01" ' +
                                'value="' + (this.liability ? (this.liability.remaining_balance || '') : '') + '" ' +
                                'readonly' +
                            '>' +
                        '</div>' +
                        
                        // Type field
                        '<div class="form-group">' +
                            Utils.createLabel('type', 'Type', true) +
                            '<select id="type" name="type" required>' +
                                '<option value="">Select type</option>' +
                                '<option value="Miscellaneous"' + 
                                    (this.liability && this.liability.type === 'Miscellaneous' ? ' selected' : '') +
                                    '>Miscellaneous</option>' +
                                '<option value="Security"' +
                                    (this.liability && this.liability.type === 'Security' ? ' selected' : '') +
                                    '>Security</option>' +
                                '<option value="Other"' +
                                    (this.liability && this.liability.type === 'Other' ? ' selected' : '') +
                                    '>Other</option>' +
                            '</select>' +
                        '</div>' +
                        
                        // Payment To field
                        '<div class="form-group">' +
                            Utils.createLabel('payment_to', 'Payment To', true) +
                            '<input type="text" id="payment_to" name="payment_to" value="' + 
                                (this.liability ? (this.liability.payment_to || '') : '') + '" required>' +
                        '</div>' +
                        
                        // Payment Method field
                        '<div class="form-group">' +
                            Utils.createLabel('payment_method', 'Payment Method', true) +
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
                            Utils.createLabel('date', 'Date of Entry', true) +
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
        var modal = document.getElementById('editLiabilityModal');
        var form = document.getElementById('editLiabilityForm');
        var headSelect = document.getElementById('head');
        var dateInput = document.getElementById('date');
        
        // Close button event handlers
        var closeButtons = modal.querySelectorAll('.close-btn');
        closeButtons.forEach(function(button) {
            button.onclick = function(e) {
                e.preventDefault();
                self.close();
            };
        });
        
        // Form submit handler
        if (form) {
            form.onsubmit = function(e) {
                e.preventDefault();
                var formData = new FormData(form);
                self.handleSubmit(formData);
            };
        }
        
        // Head select change handler
        if (headSelect) {
            headSelect.addEventListener('change', function() {
                try{
                    Utils.loadSubHeads(this.value);
                } catch (error) {
                    console.error('Error loading sub-heads:', error);
                }
            });
        }
        
        // Initialize datepicker on date input
        if (dateInput) {
            Utils.initDatePicker(dateInput);
        }
        
        // Load heads data for liability (type 3)
        Utils.loadHeadsData(1);
        
        // If we have liability data, set head and subhead values after heads are loaded
        if (this.liability && this.liability.head_id && headSelect) {
            var checkHeadsLoaded = setInterval(function() {
                if (headSelect.options.length > 1) {
                    clearInterval(checkHeadsLoaded);
                    
                    // Set head value
                    headSelect.value = self.liability.head_id;
                    
                    // Load subheads based on selected head
                    Utils.loadSubHeads(self.liability.head_id);
                    
                    // Set subhead value after a delay to allow subheads to load
                    if (self.liability.subhead_id) {
                        setTimeout(function() {
                            var subheadSelect = document.getElementById('subhead');
                            if (subheadSelect) {
                                subheadSelect.value = self.liability.subhead_id;
                            }
                        }, 60);
                    }
                }
            }, 50);
        }
    },
  
    close: function() {
        Utils.cleanup('editLiabilityModal');
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

        var data = {};
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
                Utils.onSuccess('edit', 'Liability');
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
    }
};

// Make EditLiability globally available
window.EditLiability = EditLiability; 