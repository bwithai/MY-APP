var AddInvestment = {
    init: function(onSuccess) {
        // Clear any existing modal first
        this.cleanup();

        this.onSuccess = onSuccess;
        this.render();

        // Wait for DOM to be ready before setting up events
        var self = this;
        setTimeout(function() {
            self.setupEventListeners();
        }, 0);
    },

    cleanup: function() {
        // Check if Utils exists before calling its method
        if (typeof Utils !== 'undefined') {
            Utils.cleanup('addInvestmentModal');
        } else {
            // Fallback cleanup if Utils is not available
            var existingModal = document.getElementById('addInvestmentModal');
            if (existingModal) {
                existingModal.remove();
            }
        }
    },

    render: function() {
        var modalHtml = '<div class="modal" id="addInvestmentModal">' +
            '<div class="modal-content">' +
                '<div class="modal-header">' +
                    '<h2>Add Investment</h2>' +
                    '<button type="button" class="close-btn">&times;</button>' +
                '</div>' +
                '<div class="modal-body">' +
                    '<form id="addInvestmentForm" class="modal-form-grid">' +
                        // Name field
                        '<div class="form-group">' +
                            '<label for="name">Name</label>' +
                            '<div class="input-group">' +
                                '<input type="text" id="name" name="name" class="form-control" required>' +
                            '</div>' +
                        '</div>' +
                        
                        // Amount field
                        '<div class="form-group">' +
                            '<label for="amount">Amount</label>' +
                            '<div class="input-group">' +
                                '<input type="number" id="amount" name="amount" class="form-control" step="0.01" min="0" required>' +
                            '</div>' +
                        '</div>' +
                        
                        // Type field
                        '<div class="form-group">' +
                            '<label for="type">Type</label>' +
                            '<div class="input-group">' +
                                '<select id="type" name="type" class="form-control" required>' +
                                    '<option value="">Select Type</option>' +
                                    '<option value="Property">Property</option>' +
                                    '<option value="Stocks">Stocks</option>' +
                                    '<option value="Bonds">Bonds</option>' +
                                    '<option value="Mutual Funds">Mutual Funds</option>' +
                                    '<option value="Cryptocurrency">Cryptocurrency</option>' +
                                    '<option value="Other">Other</option>' +
                                '</select>' +
                            '</div>' +
                        '</div>' +
                        
                        // Payment Method field
                        '<div class="form-group">' +
                            '<label for="payment_method">Payment Method</label>' +
                            '<div class="input-group">' +
                                '<select id="payment_method" name="payment_method" class="form-control" required>' +
                                    '<option value="">Select Payment Method</option>' +
                                    '<option value="Cash">Cash</option>' +
                                    '<option value="Bank Transfer">Bank Transfer</option>' +
                                    '<option value="Credit Card">Credit Card</option>' +
                                    '<option value="Debit Card">Debit Card</option>' +
                                    '<option value="Check">Check</option>' +
                                    '<option value="Other">Other</option>' +
                                '</select>' +
                            '</div>' +
                        '</div>' +
                        
                        // IBAN field (conditionally shown)
                        '<div class="form-group" id="ibanGroup" style="display: none;">' +
                            '<label for="iban_id">IBAN</label>' +
                            '<div class="input-group">' +
                                '<select id="iban_id" name="iban_id" class="form-control">' +
                                    '<option value="">Select IBAN</option>' +
                                '</select>' +
                            '</div>' +
                        '</div>' +
                        
                        // Date field
                        '<div class="form-group">' +
                            '<label for="date">Date</label>' +
                            '<div class="input-group">' +
                                '<input type="date" id="date" name="date" class="form-control" required>' +
                            '</div>' +
                        '</div>' +
                        
                        // Asset Details field (full width)
                        '<div class="form-group full-width">' +
                            '<label for="asset_details">Asset Details</label>' +
                            '<div class="input-group">' +
                                '<textarea id="asset_details" name="asset_details" class="form-control" rows="4"></textarea>' +
                            '</div>' +
                        '</div>' +
                    '</form>' +
                '</div>' +
                '<div class="modal-footer">' +
                    '<button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>' +
                    '<button type="submit" form="addInvestmentForm" class="btn btn-primary" id="submitInvestment">Save</button>' +
                '</div>' +
            '</div>' +
        '</div>';
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Show the modal
        var modal = document.getElementById('addInvestmentModal');
        if (modal) {
            setTimeout(function() {
                modal.classList.add('show');
            }, 10);
        }
        
        // Set default date to today
        var dateInput = document.getElementById('date');
        if (dateInput) {
            var today = new Date();
            var year = today.getFullYear();
            var month = String(today.getMonth() + 1).padStart(2, '0');
            var day = String(today.getDate()).padStart(2, '0');
            dateInput.value = year + '-' + month + '-' + day;
        }
        
        // Load IBANs
        this.loadIBANs();
    },

    loadIBANs: function() {
        var self = this;
        
        // Check if ApiClient exists
        if (typeof ApiClient === 'undefined') {
            console.error('ApiClient not found');
            return;
        }
        
        ApiClient.getIBANs()
            .then(function(response) {
                if (response && response.data) {
                    var ibanSelect = document.getElementById('iban_id');
                    if (ibanSelect) {
                        // Clear existing options except the first one
                        while (ibanSelect.options.length > 1) {
                            ibanSelect.remove(1);
                        }
                        
                        // Add new options
                        response.data.forEach(function(iban) {
                            var option = document.createElement('option');
                            option.value = iban.id;
                            option.textContent = iban.iban;
                            ibanSelect.appendChild(option);
                        });
                    }
                }
            })
            .catch(function(error) {
                console.error('Failed to load IBANs:', error);
            });
    },

    setupEventListeners: function() {
        var self = this;
        var modal = document.getElementById('addInvestmentModal');

        if (!modal) {
            console.error('Modal not found');
            return;
        }

        var form = document.getElementById('addInvestmentForm');
        var paymentMethodSelect = document.getElementById('payment_method');
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

        if (paymentMethodSelect) {
            paymentMethodSelect.addEventListener('change', function() {
                var ibanGroup = document.getElementById('ibanGroup');
                if (ibanGroup) {
                    if (this.value === 'Bank Transfer') {
                        ibanGroup.style.display = 'block';
                        document.getElementById('iban_id').setAttribute('required', 'required');
                    } else {
                        ibanGroup.style.display = 'none';
                        document.getElementById('iban_id').removeAttribute('required');
                    }
                }
            });
        }

        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                var formData = new FormData(form);
                self.handleSubmit(formData);
            });
        }
    },

    close: function() {
        var modal = document.getElementById('addInvestmentModal');
        if (modal) {
            modal.classList.remove('show');
            
            // Remove modal after animation
            setTimeout(function() {
                modal.remove();
            }, 300);
        }
    },

    handleSubmit: function(formData) {
        var self = this;
        var submitButton = document.querySelector('button[type="submit"]');

        if (submitButton.disabled) {
            return;
        }
        submitButton.disabled = true;

        var data = {};
        var entries = formData.entries();
        var entry;
        while (!(entry = entries.next()).done) {
            data[entry.value[0]] = entry.value[1];
        }

        var amountStr = data.amount.toString();
        var amount = Number(parseFloat(amountStr).toFixed(2));

        if (amount <= 0) {
            alert('Amount must be greater than 0');
            submitButton.disabled = false;
            return;
        }

        var formattedData = {
            name: data.name,
            amount: amount,
            type: data.type,
            payment_method: data.payment_method,
            asset_details: data.asset_details,
            date: data.date
        };

        if (data.payment_method === 'Bank Transfer' && data.iban_id) {
            formattedData.iban_id = parseInt(data.iban_id);
        }

        console.log('Submitting formatted data:', formattedData);

        ApiClient.createInvestment(formattedData)
            .then(function(response) {
                self.close();
                self.showSuccessMessage('add', 'Investment');
                if (self.onSuccess) {
                    self.onSuccess();
                }
            })
            .catch(function(error) {
                console.error('Failed to create investment:', error);
                alert('Failed to create investment: ' + (error.message || 'Unknown error'));
            })
            .finally(function() {
                submitButton.disabled = false;
            });
    },

    showSuccessMessage: function(action, type) {
        var message = action === 'add' ? type + ' added successfully!' : 'Error adding ' + type;
        var messageClass = action === 'add' ? 'success-message' : 'error-message';
        
        var messageElement = document.createElement('div');
        messageElement.className = messageClass;
        messageElement.textContent = message;
        
        document.body.appendChild(messageElement);
        
        // Remove message after 3 seconds
        setTimeout(function() {
            messageElement.remove();
        }, 3000);
    }
}; 