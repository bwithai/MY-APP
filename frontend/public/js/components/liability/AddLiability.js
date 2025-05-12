var AddLiability = {
    init: function(onSuccess) {
        this.cleanup();
        this.onSuccess = onSuccess;
        this.render();
  
        var self = this;
        setTimeout(function() {
            self.setupEventListeners();
        }, 0);
    },
  
    cleanup: function() {
        Utils.cleanup('addLiabilityModal');
    },
    
    render: function() {
        var modalHtml =
            '<div class="modal" id="addLiabilityModal">' +
                '<div class="modal-content" style="max-width: 800px;">' +
                    '<div class="modal-header">' +
                        '<h2>Add Liability</h2>' +
                        '<button type="button" class="close-btn">&times;</button>' +
                    '</div>' +
                    '<div class="modal-body">' +
                        '<form id="addLiabilityForm" class="modal-form-grid">' +
                            // Name field
                            '<div class="form-group">' +
                                Utils.createLabel('name', 'Name', true) +
                                '<input type="text" id="name" name="name" required placeholder="Enter name">' +
                            '</div>' +
                            
                            // Fund Details field
                            '<div class="form-group full-width">' +
                                Utils.createLabel('fund_details', 'Fund Details', true) +
                                '<textarea id="fund_details" name="fund_details" required placeholder="Enter details..." rows="3"></textarea>' +
                            '</div>' +
                            
                            // Amount field
                            '<div class="form-group">' +
                                Utils.createLabel('amount', 'Amount', true) +
                                '<input type="number" id="amount" name="amount" step="0.01" min="0.01" required>' +
                            '</div>' +
                            
                            // Type field
                            '<div class="form-group">' +
                                Utils.createLabel('type', 'Type', true) +
                                '<select id="type" name="type" required>' +
                                    '<option value="">Select type</option>' +
                                    '<option value="Miscellaneous">Miscellaneous</option>' +
                                    '<option value="Security">Security</option>' +
                                    '<option value="Other">Other</option>' +
                                '</select>' +
                            '</div>' +
                            
                            // Payment To field
                            '<div class="form-group">' +
                                Utils.createLabel('payment_to', 'Payment To', true) +
                                '<input type="text" id="payment_to" name="payment_to" required>' +
                            '</div>' +
                            
                            // Payment Method field
                            '<div class="form-group">' +
                                Utils.createLabel('payment_method', 'Payment Method', true) +
                                '<select id="payment_method" name="payment_method" required>' +
                                    '<option value="">Select payment method</option>' +
                                    '<option value="Bank Transfer">Bank Transfer</option>' +
                                    '<option value="Cash Transfer">Cash Transfer</option>' +
                                '</select>' +
                            '</div>' +
                            
                            // IBAN field - initially hidden
                            '<div class="form-group" id="ibanContainer" style="display: none;">' +
                                Utils.createLabel('iban', 'IBAN', true) +
                                '<select id="iban" name="iban_id">' +
                                    '<option value="">Select IBAN</option>' +
                                '</select>' +
                            '</div>' +
                            
                            // Date of Entry field
                            '<div class="form-group">' +
                                Utils.createLabel('date', 'Date of Entry', true) +
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
        var closeBtn = modal.querySelector('.close-btn');
        var cancelBtn = modal.querySelector('[data-dismiss="modal"]');
        var paymentMethodSelect = document.getElementById('payment_method');
  
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
        
        if (form) {
            form.onsubmit = function(e) {
                e.preventDefault();
                var formData = new FormData(form);
                self.handleSubmit(formData);
            };
        }
        
        // Add payment method change handler for IBAN section
        if (paymentMethodSelect) {
            paymentMethodSelect.addEventListener('change', function() {
                var ibanContainer = document.getElementById('ibanContainer');
                
                // Show IBAN selection when Bank Transfer is selected
                if (this.value === 'Bank Transfer') {
                    ibanContainer.style.display = 'block';
                    Utils.loadIBANs(); // Load IBANs into select element
                } else {
                    ibanContainer.style.display = 'none';
                }
            });
        }
  
        // Initialize the datepicker component on the date input using Utils
        var dateInput = document.getElementById('date');
        if (dateInput) {
            Utils.initDatePicker(dateInput);
        }

        // Apply word limit to fund_details textarea
        var fundDetailsTextarea = document.getElementById('fund_details');
        if (fundDetailsTextarea) {
            Utils.limitTextareaWords(fundDetailsTextarea, 800);
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
            Utils.onSuccess('error', 'Amount must be greater than 0');
            if (submitButton) {
                submitButton.disabled = false;
            }
            return;
        }

        // Validate payment method
        var paymentMethod = data.payment_method;
        if (!paymentMethod || paymentMethod === '') {
            if (submitButton) submitButton.disabled = false;
            return Utils.showFieldError(document.getElementById('payment_method'), 'Please select a payment method');
        }

        // Validate IBAN if payment method is Bank Transfer
        if (paymentMethod === 'Bank Transfer') {
            if (!data.iban_id || data.iban_id === '') {
                if (submitButton) submitButton.disabled = false;
                return Utils.showFieldError(document.getElementById('iban'), 'Please select an IBAN for bank transfers');
            }
        }
  
        var formattedData = {
            name: data.name,
            fund_details: data.fund_details,
            amount: amount,
            type: data.type,
            payment_to: data.payment_to,
            payment_method: data.payment_method,
            date: data.date
        };
        
        // Add IBAN ID if payment method is Bank Transfer and IBAN is selected
        if (data.payment_method === 'Bank Transfer' && data.iban_id) {
            formattedData.iban_id = Number(data.iban_id);
        }
  
        ApiClient.createLiability(formattedData)
            .then(function(response) {
                self.close();
                Utils.onSuccess('add', 'Liability');
                if (typeof self.onSuccess === 'function') {
                    self.onSuccess();
                }
            })
            .catch(function(error) {
                console.error('Failed to create liability:', error);
                Utils.onSuccess('error', (error.message || 'Unknown error to create liability'));
            })
            .finally(function() {
                submitButton.disabled = false;
            });
    }
};

// Make AddLiability globally available
window.AddLiability = AddLiability; 