var PayLiability = {
    init: function(liability, onClose) {
        this.liability = liability;
        this.onClose = onClose;
        this.cleanup();
        this.render();
        this.setupEventListeners();
    },
  
    cleanup: function() {
        Utils.cleanup('payLiabilityModal');
    },
  
    render: function() {
        var formattedDate = '';
        if (this.liability && this.liability.date) {
            formattedDate = Utils.formatDateForInput(this.liability.date);
        }
        // Create modal HTML structure
        var modalHtml = '<div class="modal" id="payLiabilityModal">' +
            '<div class="modal-content" style="max-width: 800px;">' +
                '<div class="modal-header">' +
                    '<h2>Pay Liability</h2>' +
                    '<button type="button" class="close-btn">&times;</button>' +
                '</div>' +
                '<div class="modal-body">' +
                    '<form id="payLiabilityForm" class="modal-form-grid">' +
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
                        
                        // Pay field (required)
                        '<div class="form-group">' +
                            Utils.createLabel('pay', 'Pay', true) +
                            '<input ' +
                                'type="number" ' +
                                'id="pay" ' +
                                'name="pay" ' +
                                'step="0.01" ' +
                                'min="0.01" ' +
                                'max="' + (this.liability ? this.liability.remaining_balance : 0) + '" ' +
                                'required' +
                                'oninput="PayLiability.validatePayAmount(this)"' +
                            '>' +
                            '<span id="pay-error" class="error-message"></span>' +
                        '</div>' +
                        
                        // Description field
                        '<div class="form-group full-width">' +
                            Utils.createLabel('description', 'Description', true) +
                            '<textarea ' +
                                'id="description" ' +
                                'name="description" ' +
                                'required ' +
                                'placeholder="Describe in details" ' +
                                'rows="2"' +
                            '>' + (this.liability ? (this.liability.description || '') : '') + '</textarea>' +
                        '</div>' +
                        
                        // Payment To field
                        '<div class="form-group">' +
                            Utils.createLabel('payment_to', 'Payment To', true) +
                            '<input ' +
                                'type="text" ' +
                                'id="payment_to" ' +
                                'name="payment_to" ' +
                                'value="' + (this.liability ? (this.liability.payment_to || '') : '') + '" ' +
                                'required' +
                            '>' +
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
                    '<button type="submit" form="payLiabilityForm" class="btn btn-primary">Pay</button>' +
                '</div>' +
            '</div>' +
        '</div>';
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Show the modal with a slight delay for CSS transition
        var modal = document.getElementById('payLiabilityModal');
        if (modal) {
            setTimeout(function() {
                modal.classList.add('show');
            }, 10);
        }
    },
  
    setupEventListeners: function() {
        var self = this;
        var modal = document.getElementById('payLiabilityModal');
        var form = document.getElementById('payLiabilityForm');
        var payInput = document.getElementById('pay');
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
                if (self.validateForm(form)) {
                    var formData = new FormData(form);
                    self.handleSubmit(formData);
                }
            };
        }
        
        // Pay input validation
        if (payInput) {
            payInput.addEventListener('input', function() {
                self.validatePayAmount(this);
            });
        }

        // Set default date to today using utility function
        if (dateInput) {
            Utils.setCurrentDate(dateInput);
        }
        
        // Initialize datepicker on date input
        if (dateInput) {
            Utils.initDatePicker(dateInput);
        }
    },
    
    validatePayAmount: function(input) {
        var errorSpan = document.getElementById('pay-error');
        if (!errorSpan) {
            errorSpan = document.createElement('span');
            errorSpan.id = 'pay-error';
            errorSpan.className = 'error-message';
            input.parentNode.appendChild(errorSpan);
        }
        
        var remainingBalance = parseFloat(document.getElementById('remaining_balance').value);
        var payAmount = parseFloat(input.value);
        
        if (isNaN(payAmount) || payAmount <= 0) {
            errorSpan.textContent = 'Payment must be a positive amount.';
            input.setCustomValidity('Payment must be a positive amount.');
            return false;
        } else if (payAmount > remainingBalance) {
            errorSpan.textContent = 'But remaining balance is ' + remainingBalance.toFixed(2) + '.';
            input.setCustomValidity('Amount exceeds remaining balance.');
            return false;
        } else {
            errorSpan.textContent = '';
            input.setCustomValidity('');
            return true;
        }
    },
    
    validateForm: function(form) {
        var isValid = form.checkValidity();
        
        // Manually validate pay amount
        var payInput = document.getElementById('pay');
        if (payInput) {
            isValid = this.validatePayAmount(payInput) && isValid;
        }
        
        // Show validation messages for all fields
        var inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(function(input) {
            if (!input.validity.valid) {
                input.classList.add('invalid');
                
                // Create or update error message
                var errorId = input.id + '-error';
                var errorSpan = document.getElementById(errorId);
                if (!errorSpan) {
                    errorSpan = document.createElement('span');
                    errorSpan.id = errorId;
                    errorSpan.className = 'error-message';
                    input.parentNode.appendChild(errorSpan);
                }
                
                if (input.validity.valueMissing) {
                    errorSpan.textContent = 'This field is required.';
                } else if (input.validity.typeMismatch) {
                    errorSpan.textContent = 'Please enter a valid value.';
                } else if (input.validity.rangeUnderflow) {
                    errorSpan.textContent = 'Value must be greater than ' + input.min + '.';
                } else if (input.validity.customError) {
                    errorSpan.textContent = input.validationMessage;
                }
            } else {
                input.classList.remove('invalid');
                var errorSpan = document.getElementById(input.id + '-error');
                if (errorSpan) {
                    errorSpan.textContent = '';
                }
            }
        });
        
        return isValid;
    },
  
    handleSubmit: function(formData) {
        var self = this;
        var submitButton = document.querySelector('button[type="submit"]');

        if (submitButton && submitButton.disabled) {
            return;
        }

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Saving...';
        }

        var data = {};
        formData.forEach(function(value, key) { data[key] = value; });

        // Format number values
        data.amount = Number(parseFloat(data.amount).toFixed(2));
        data.pay = Number(parseFloat(data.pay).toFixed(2));
        
        // Call API to pay liability
        ApiClient.payLiability(this.liability.id, data)
            .then(function() {
                self.close();
                Utils.onSuccess('edit', 'Liability');
                if (typeof self.onClose === 'function') {
                    self.onClose();
                }
            })
            .catch(function(error) {
                console.error('Failed to pay liability:', error);
                Utils.onSuccess('error', (error.message || 'Unknown error: Failed to pay liability'));
            })
            .finally(function() {
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = 'Save';
                }
            });
    },
    
    close: function() {
        Utils.cleanup('payLiabilityModal');
    }
};

// Make PayLiability globally available
window.PayLiability = PayLiability;
