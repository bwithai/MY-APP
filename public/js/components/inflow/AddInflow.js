var AddInflow = {
    init: function(onSuccess) {
        // Clear any existing modal first
        this.cleanup();

        this.onSuccess = onSuccess;
        this.render();

        // Wait for DOM to be ready before setting up events and loading data
        var self = this;
        setTimeout(function() {
            self.setupEventListeners();
            // Check if Utils exists before calling its method
            if (typeof Utils !== 'undefined') {
                Utils.loadHeadsData(1);
            } else {
                console.error('Utils object is not defined');
                self.loadHeadsData(1);
            }
        }, 0);
    },

    cleanup: function () {
        // Check if Utils exists before calling its method
        if (typeof Utils !== 'undefined') {
            Utils.cleanup('addInflowModal');
        } else {
            // Fallback cleanup if Utils is not available
            var existingModal = document.getElementById('addInflowModal');
            if (existingModal) {
                existingModal.remove();
            }
        }
    },

    // Add a fallback loadHeadsData method
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

    // Add a fallback loadSubHeads method
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

    // Add a fallback loadIBANs method
    loadIBANs: function() {
        var userId = sessionStorage.getItem('selectedUserId');
        if (!userId || typeof ApiClient === 'undefined') return;

        ApiClient.getIBANs(userId)
            .then(function(response) {
                var ibanSelect = document.getElementById('iban');
                if (ibanSelect) {
                    ibanSelect.innerHTML = '<option value="">Select IBAN</option>';
                    response.forEach(function(iban) {
                        var option = document.createElement('option');
                        option.value = iban.id;
                        option.textContent = iban.iban;
                        ibanSelect.appendChild(option);
                    });
                }
            })
            .catch(function(error) {
                console.error('Failed to load IBANs:', error);
            });
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
        
        var modalHtml = '<div class="modal" id="addInflowModal">' +
            '<div class="modal-content">' +
                '<div class="modal-header">' +
                    '<h2>Add Inflow</h2>' +
                    '<button type="button" class="close-btn">&times;</button>' +
                '</div>' +
                '<div class="modal-body">' +
                    '<form id="addInflowForm" class="modal-form-grid">' +
                        '<div class="form-group">' +
                            createLabel('head', 'Head', true) +
                            '<select id="head" name="head_id" required>' +
                                '<option value="">Select a head</option>' +
                            '</select>' +
                        '</div>' +

                        '<div class="form-group" id="subHeadContainer" style="display: none;">' +
                            createLabel('subhead', 'Sub Head', false) +
                            '<select id="subhead" name="subhead_id">' +
                                '<option value="">Select a sub-head</option>' +
                            '</select>' +
                        '</div>' +

                        '<div class="form-group full-width">' +
                            createLabel('fund_details', 'Fund Details', true) +
                            '<textarea ' +
                                'id="fund_details" ' +
                                'name="fund_details" ' +
                                'required ' +
                                'placeholder="Enter fund details..." ' +
                                'rows="3" ' +
                            '></textarea>' +
                        '</div>' +

                        '<div class="form-group">' +
                            createLabel('amount', 'Amount', true) +
                            '<input ' +
                                'type="number" ' +
                                'id="amount" ' +
                                'name="amount" ' +
                                'step="0.01" ' +
                                'min="0.01" ' +
                                'required ' +
                                'onchange="this.value = Math.max(0.01, Math.abs(this.value))" ' +
                            '>' +
                        '</div>' +

                        '<div class="form-group">' +
                            createLabel('received_from', 'Received From', true) +
                            '<input type="text" id="received_from" name="received_from" required>' +
                        '</div>' +

                        '<div class="form-group">' +
                            createLabel('payment_method', 'Payment Method', true) +
                            '<select id="payment_method" name="payment_method" required>' +
                                '<option value="">Select payment method</option>' +
                                '<option value="Bank Transfer">Bank Transfer</option>' +
                                '<option value="Cash Transfer">Cash Transfer</option>' +
                            '</select>' +
                        '</div>' +

                        '<div class="form-group" id="ibanContainer" style="display: none;">' +
                            createLabel('iban', 'IBAN', true) +
                            '<select id="iban" name="iban_id">' +
                                '<option value="">Select IBAN</option>' +
                            '</select>' +
                        '</div>' +

                        '<div class="form-group">' +
                            createLabel('date', 'Date of Entry', true) +
                            '<input type="text" id="date" name="date" required placeholder="YYYY-MM-DD" readonly>' +
                        '</div>' +
                    '</form>' +
                '</div>' +
                '<div class="modal-footer">' +
                    '<button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>' +
                    '<button type="submit" form="addInflowForm" class="btn btn-primary" id="submitInflow">Save</button>' +
                '</div>' +
            '</div>' +
        '</div>';
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    setupEventListeners: function() {
        var self = this;
        var modal = document.getElementById('addInflowModal');

        if (!modal) {
            console.error('Modal not found');
            return;
        }

        var form = document.getElementById('addInflowForm');
        var headSelect = document.getElementById('head');
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

        if (headSelect) {
            headSelect.addEventListener('change', function() {
                // Check if Utils exists before calling its method
                if (typeof Utils !== 'undefined') {
                    Utils.loadSubHeads(this.value);
                } else {
                    self.loadSubHeads(this.value);
                }
            });
        }

        if (paymentMethodSelect) {
            paymentMethodSelect.addEventListener('change', function() {
                var ibanContainer = document.getElementById('ibanContainer');
                if (this.value === 'Bank Transfer') {
                    ibanContainer.style.display = 'block';
                    // Check if Utils exists before calling its method
                    if (typeof Utils !== 'undefined') {
                        Utils.loadIBANs();
                    } else {
                        self.loadIBANs();
                    }
                } else {
                    ibanContainer.style.display = 'none';
                }
            });
        }

        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                self.handleSubmit(new FormData(this));
            });
        }

        // Initialize the restricted datepicker component on the date input
        var dateInput = document.getElementById('date');
        if (dateInput) {
            if (typeof RestrictedDatePicker === 'function') {
                RestrictedDatePicker(dateInput);
            } else {
                // Simple fallback for date input if RestrictedDatePicker is not available
                dateInput.type = 'date';
                dateInput.readOnly = false;
            }
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
            head_id: Number(data.head_id),
            amount: amount,
            fund_details: data.fund_details,
            received_from: data.received_from,
            payment_method: data.payment_method,
            date: data.date
        };

        if (data.subhead_id) {
            formattedData.subhead_id = Number(data.subhead_id);
        }
        if (data.payment_method === 'Bank Transfer') {
            formattedData.iban_id = Number(data.iban_id);
        }

        console.log('Submitting formatted data:', formattedData);

        ApiClient.createInflow(formattedData)
            .then(function(response) {
                self.close();
                // Show success message
                self.showSuccessMessage('add', 'Inflow');
                if (self.onSuccess && typeof self.onSuccess === 'function') {
                    self.onSuccess();
                }
            })
            .catch(function(error) {
                console.error('Failed to create inflow:', error);
                self.showSuccessMessage('error', 'Inflow');
            })
            .finally(function() {
                submitButton.disabled = false;
            });
    },

    close: function() {
        this.cleanup();
    },

    // Add a success message method as fallback for Utils.onSuccess
    showSuccessMessage: function(action, type) {
        if (typeof Utils !== 'undefined' && typeof Utils.onSuccess === 'function') {
            Utils.onSuccess(action, type);
            return;
        }

        let message = '';
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
            case 'error':
                message = 'Failed ' + type + '!';
                break;
        }
    
        // Display success message
        var successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        
        // Change background color to red if action is delete
        if (action === 'delete' || action === 'error') {
            successDiv.style.backgroundColor = '#d63031';
        }
        
        successDiv.innerText = message;
    
        document.body.appendChild(successDiv);
    
        // Remove the message after 3 seconds
        setTimeout(function () {
            successDiv.remove();
        }, 3000);
    }
};

window.AddInflow = AddInflow;
