var EditInvestment = {
    init: function(type, id, onClose) {
        this.type = type;
        this.investmentId = id;
        this.onClose = onClose;
        this.investment = null;
        
        // Clear any existing modal first
        this.cleanup();
        
        // Load investment data and render the modal
        this.loadInvestmentData();
    },

    cleanup: function() {
        // Check if Utils exists before calling its method
        if (typeof Utils !== 'undefined') {
            Utils.cleanup('editInvestmentModal');
        } else {
            // Fallback cleanup if Utils is not available
            var existingModal = document.getElementById('editInvestmentModal');
            if (existingModal) {
                existingModal.remove();
            }
        }
    },

    loadInvestmentData: function() {
        var self = this;
        
        // Check if ApiClient exists
        if (typeof ApiClient === 'undefined') {
            console.error('ApiClient not found');
            return;
        }
        
        ApiClient.getInvestment(this.investmentId)
            .then(function(response) {
                if (response && response.data) {
                    self.investment = response.data;
                    self.render();
                    self.setupEventListeners();
                    self.loadIBANs();
                } else {
                    throw new Error('Invalid response format');
                }
            })
            .catch(function(error) {
                console.error('Failed to load investment:', error);
                alert('Failed to load investment: ' + (error.message || 'Unknown error'));
                self.close();
            });
    },

    render: function() {
        if (!this.investment) {
            console.error('No investment data to render');
            return;
        }
        
        var modalHtml = '<div class="modal" id="editInvestmentModal">' +
            '<div class="modal-content">' +
                '<div class="modal-header">' +
                    '<h2>Edit Investment</h2>' +
                    '<button type="button" class="close-btn">&times;</button>' +
                '</div>' +
                '<div class="modal-body">' +
                    '<form id="editInvestmentForm" class="modal-form-grid">' +
                        // Name field
                        '<div class="form-group">' +
                            '<label for="name">Name</label>' +
                            '<div class="input-group">' +
                                '<input type="text" id="name" name="name" class="form-control" value="' + (this.investment.name || '') + '" required>' +
                            '</div>' +
                        '</div>' +
                        
                        // Amount field
                        '<div class="form-group">' +
                            '<label for="amount">Amount</label>' +
                            '<div class="input-group">' +
                                '<input type="number" id="amount" name="amount" class="form-control" step="0.01" min="0" value="' + (this.investment.amount || 0) + '" required>' +
                            '</div>' +
                        '</div>' +
                        
                        // Type field
                        '<div class="form-group">' +
                            '<label for="type">Type</label>' +
                            '<div class="input-group">' +
                                '<select id="type" name="type" class="form-control" required>' +
                                    '<option value="">Select Type</option>' +
                                    '<option value="Property"' + (this.investment.type === 'Property' ? ' selected' : '') + '>Property</option>' +
                                    '<option value="Stocks"' + (this.investment.type === 'Stocks' ? ' selected' : '') + '>Stocks</option>' +
                                    '<option value="Bonds"' + (this.investment.type === 'Bonds' ? ' selected' : '') + '>Bonds</option>' +
                                    '<option value="Mutual Funds"' + (this.investment.type === 'Mutual Funds' ? ' selected' : '') + '>Mutual Funds</option>' +
                                    '<option value="Cryptocurrency"' + (this.investment.type === 'Cryptocurrency' ? ' selected' : '') + '>Cryptocurrency</option>' +
                                    '<option value="Other"' + (this.investment.type === 'Other' ? ' selected' : '') + '>Other</option>' +
                                '</select>' +
                            '</div>' +
                        '</div>' +
                        
                        // Payment Method field
                        '<div class="form-group">' +
                            '<label for="payment_method">Payment Method</label>' +
                            '<div class="input-group">' +
                                '<select id="payment_method" name="payment_method" class="form-control" required>' +
                                    '<option value="">Select Payment Method</option>' +
                                    '<option value="Cash"' + (this.investment.payment_method === 'Cash' ? ' selected' : '') + '>Cash</option>' +
                                    '<option value="Bank Transfer"' + (this.investment.payment_method === 'Bank Transfer' ? ' selected' : '') + '>Bank Transfer</option>' +
                                    '<option value="Credit Card"' + (this.investment.payment_method === 'Credit Card' ? ' selected' : '') + '>Credit Card</option>' +
                                    '<option value="Debit Card"' + (this.investment.payment_method === 'Debit Card' ? ' selected' : '') + '>Debit Card</option>' +
                                    '<option value="Check"' + (this.investment.payment_method === 'Check' ? ' selected' : '') + '>Check</option>' +
                                    '<option value="Other"' + (this.investment.payment_method === 'Other' ? ' selected' : '') + '>Other</option>' +
                                '</select>' +
                            '</div>' +
                        '</div>' +
                        
                        // IBAN field (conditionally shown)
                        '<div class="form-group" id="ibanGroup" style="display: ' + (this.investment.payment_method === 'Bank Transfer' ? 'block' : 'none') + ';">' +
                            '<label for="iban_id">IBAN</label>' +
                            '<div class="input-group">' +
                                '<select id="iban_id" name="iban_id" class="form-control" ' + (this.investment.payment_method === 'Bank Transfer' ? 'required' : '') + '>' +
                                    '<option value="">Select IBAN</option>' +
                                '</select>' +
                            '</div>' +
                        '</div>' +
                        
                        // Date field
                        '<div class="form-group">' +
                            '<label for="date">Date</label>' +
                            '<div class="input-group">' +
                                '<input type="date" id="date" name="date" class="form-control" value="' + (this.formatDateForInput(this.investment.date) || '') + '" required>' +
                            '</div>' +
                        '</div>' +
                        
                        // Asset Details field (full width)
                        '<div class="form-group full-width">' +
                            '<label for="asset_details">Asset Details</label>' +
                            '<div class="input-group">' +
                                '<textarea id="asset_details" name="asset_details" class="form-control" rows="4">' + (this.investment.asset_details || '') + '</textarea>' +
                            '</div>' +
                        '</div>' +
                    '</form>' +
                '</div>' +
                '<div class="modal-footer">' +
                    '<button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>' +
                    '<button type="submit" form="editInvestmentForm" class="btn btn-primary" id="updateInvestment">Update</button>' +
                '</div>' +
            '</div>' +
        '</div>';
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Show the modal
        var modal = document.getElementById('editInvestmentModal');
        if (modal) {
            setTimeout(function() {
                modal.classList.add('show');
            }, 10);
        }
    },

    formatDateForInput: function(dateString) {
        if (!dateString) return '';
        
        try {
            var date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return '';
            }
            
            var year = date.getFullYear();
            var month = String(date.getMonth() + 1).padStart(2, '0');
            var day = String(date.getDate()).padStart(2, '0');
            
            return year + '-' + month + '-' + day;
        } catch (e) {
            console.error('Error formatting date for input:', e);
            return '';
        }
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
                            
                            // Select the current IBAN if it matches
                            if (self.investment.iban_id && self.investment.iban_id === iban.id) {
                                option.selected = true;
                            }
                            
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
        var modal = document.getElementById('editInvestmentModal');

        if (!modal) {
            console.error('Modal not found');
            return;
        }

        var form = document.getElementById('editInvestmentForm');
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
                var ibanSelect = document.getElementById('iban_id');
                
                if (ibanGroup && ibanSelect) {
                    if (this.value === 'Bank Transfer') {
                        ibanGroup.style.display = 'block';
                        ibanSelect.setAttribute('required', 'required');
                    } else {
                        ibanGroup.style.display = 'none';
                        ibanSelect.removeAttribute('required');
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
        var modal = document.getElementById('editInvestmentModal');
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
        var submitButton = document.querySelector('#updateInvestment');

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

        ApiClient.updateInvestment(this.investmentId, formattedData)
            .then(function(response) {
                self.close();
                self.showSuccessMessage('edit', 'Investment');
                if (self.onClose && typeof self.onClose === 'function') {
                    self.onClose();
                }
            })
            .catch(function(error) {
                console.error('Failed to update investment:', error);
                alert('Failed to update investment: ' + (error.message || 'Unknown error'));
            })
            .finally(function() {
                submitButton.disabled = false;
            });
    },

    showSuccessMessage: function(action, type) {
        var message = action === 'edit' ? type + ' updated successfully!' : 'Error updating ' + type;
        var messageClass = action === 'edit' ? 'success-message' : 'error-message';
        
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