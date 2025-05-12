var EditOutflow = {
    init: function (type, id, onClose) {
        this.type = type;
        this.outflowId = id;
        this.onClose = onClose;
        this.cleanup();
        this.render();
        this.setupEventListeners();
        
        Utils.loadHeadsData(2);
        
        if (id) this.loadOutflowData();
    },

    cleanup: function () {
        Utils.cleanup('editOutflowModal');
    },

    loadOutflowData: function () {
        var self = this;
        ApiClient.getOutflow(this.outflowId)
            .then(function (outflow) {
                self.populateForm(outflow);
            })
            .catch(function (error) {
                console.error('Failed to load outflow:', error);
            });
    },

    render: function () {
        var modalHtml = '<div class="modal" id="editOutflowModal">' +
            '<div class="modal-content" style="max-width: 800px;">' +
                '<div class="modal-header">' +
                    '<h2>Edit Outflow</h2>' +
                    '<button type="button" class="close-btn">&times;</button>' +
                '</div>' +
                '<div class="modal-body">' +
                    '<form id="editOutflowForm" class="modal-form-grid">' +
                        '<div class="form-group">' +
                            Utils.createLabel('head', 'Head', true) +
                            '<select id="head" name="head_id" required></select>' +
                        '</div>' +
                        '<div class="form-group" id="subHeadContainer" style="display: none;">' +
                            Utils.createLabel('subhead', 'Sub Head', false) +
                            '<select id="subhead" name="subhead_id">' +
                                '<option value="">Select a sub-head</option>' +
                            '</select>' +
                        '</div>' +
                        '<div class="form-group full-width">' +
                            Utils.createLabel('head_details', 'Head Details', true) +
                            '<textarea ' +
                                'id="head_details" ' +
                                'name="head_details" ' +
                                'required ' +
                                'placeholder="Enter head details..." ' +
                                'rows="3"' +
                            '></textarea>' +
                        '</div>' +
                        '<div class="form-group">' +
                            Utils.createLabel('type', 'Type', true) +
                            '<select id="type" name="type" required>' +
                                '<option value="">Select type</option>' +
                                '<option value="EXPANDABLE">Expandable</option>' +
                                '<option value="NONEXPANDABLE">Non Expandable</option>' +
                            '</select>' +
                            '<div id="assetNotification" class="notification-message" style="display: none;">' +
                                '<i class="fas fa-info-circle"></i> This will be added to Assets' +
                            '</div>' +
                        '</div>' +
                        '<div class="form-group" id="entityContainer" style="display: none;">' +
                            Utils.createLabel('place_type', 'Entity', false) +
                            '<select id="place_type" name="place_type">' +
                                '<option value="">Select an entity</option>' +
                                '<option value="Command House">Command House</option>' +
                                '<option value="Mess">Mess</option>' +
                                '<option value="unit/ESTB">unit/ESTB</option>' +
                            '</select>' +
                        '</div>' +
                        '<div class="form-group">' +
                            Utils.createLabel('amount', 'Amount', true) +
                            '<input ' +
                                'type="number" ' +
                                'id="amount" ' +
                                'name="amount" ' +
                                'step="0.01" ' +
                                'min="0.01" ' +
                                'required ' +
                                'onchange="this.value = Math.max(0.01, Math.abs(this.value))"' +
                            '>' +
                        '</div>' +
                        '<div class="form-group">' +
                            Utils.createLabel('payment_type', 'Payment Type', true) +
                            '<select id="payment_type" name="payment_type" required>' +
                                '<option value="">Select payment type</option>' +
                                '<option value="bank">Bank Transfer</option>' +
                                '<option value="cash">Cash Transfer</option>' +
                                '<option value="prev_held">Previously Held</option>' +
                            '</select>' +
                        '</div>' +
                        '<div class="form-group" id="ibanContainer" style="display: none;">' +
                            Utils.createLabel('iban', 'IBAN', true) +
                            '<select id="iban" name="iban_id">' +
                                '<option value="">Select IBAN</option>' +
                            '</select>' +
                        '</div>' +
                        '<div class="form-group">' +
                            Utils.createLabel('payment_to', 'Payment To', false) +
                            '<input type="text" id="payment_to" name="payment_to">' +
                        '</div>' +
                        '<div class="form-group">' +
                            Utils.createLabel('expense_date', 'Expense Date', true) +
                            '<input type="text" id="expense_date" name="expense_date" required placeholder="YYYY-MM-DD" readonly>' +
                        '</div>' +
                    '</form>' +
                '</div>' +
                '<div class="modal-footer">' +
                    '<button type="button" class="btn btn-secondary close-btn">Cancel</button>' +
                    '<button type="submit" form="editOutflowForm" class="btn btn-primary">Save</button>' +
                '</div>' +
            '</div>' +
        '</div>';
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    setupEventListeners: function () {
        var self = this;
        var modal = document.getElementById('editOutflowModal');

        if (!modal) {
            console.error('Modal not found');
            return;
        }

        var form = document.getElementById('editOutflowForm');
        var headSelect = document.getElementById('head');
        var paymentTypeSelect = document.getElementById('payment_type');
        var closeBtn = modal.querySelector('.close-btn');
        var cancelBtn = modal.querySelector('.close-btn');
        var typeSelect = document.getElementById('type');
        var entityContainer = document.getElementById('entityContainer');
        var placeTypeSelect = document.getElementById('place_type');

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

        if (typeSelect) {
            typeSelect.addEventListener('change', function() {
                var assetNotification = document.getElementById('assetNotification');
                
                if (this.value === 'NONEXPANDABLE') {
                    entityContainer.style.display = 'block';
                    placeTypeSelect.setAttribute('required', 'required');
                    assetNotification.style.display = 'block';
                } else {
                    entityContainer.style.display = 'none';
                    placeTypeSelect.removeAttribute('required');
                    placeTypeSelect.value = '';
                    assetNotification.style.display = 'none';
                }
            });
        }
        

        if (headSelect) {
            headSelect.addEventListener('change', function() {
                Utils.loadSubHeads(this.value);
            });
        }

        if (paymentTypeSelect) {
            paymentTypeSelect.addEventListener('change', function() {
                var ibanContainer = document.getElementById('ibanContainer');
                if (this.value === 'bank') {
                    ibanContainer.style.display = 'block';
                    Utils.loadIBANs();
                } else {
                    ibanContainer.style.display = 'none';
                }
            });
        }

        if (form) {
            form.addEventListener('submit', function(e) {
                if (entityContainer.style.display === 'none') {
                    placeTypeSelect.removeAttribute('required');
                }
                e.preventDefault();
                self.handleSubmit(new FormData(this));
            });
        }

        // Initialize the restricted datepicker component on the date input
        var dateInput = document.getElementById('date');
        if (dateInput) {
            Utils.initDatePicker(dateInput);
        }

        // Add CSS for notification message
        if (!document.getElementById('notification-styles')) {
            var styleEl = document.createElement('style');
            styleEl.id = 'notification-styles';
            styleEl.textContent = `
                .notification-message {
                    margin-top: 6px;
                    padding: 6px 10px;
                    background-color: #e3f2fd;
                    border-left: 3px solid #2196f3;
                    color: #0d47a1;
                    font-size: 14px;
                    border-radius: 2px;
                    transition: all 0.3s ease;
                }
                .notification-message i {
                    margin-right: 5px;
                }
            `;
            document.head.appendChild(styleEl);
        }

        // Apply word limit to fund_details textarea
        var fundDetailsTextarea = document.getElementById('head_details');
        if (fundDetailsTextarea) {
            Utils.limitTextareaWords(fundDetailsTextarea, 800);
        }
    },

    populateForm: function (outflow) {
        // Set form values
        document.getElementById('head_details').value = outflow.head_details || '';
        document.getElementById('amount').value = outflow.cost || '';
        document.getElementById('place_type').value = outflow.place_type || '';
        document.getElementById('payment_to').value = outflow.payment_to || '';
        document.getElementById('expense_date').value = outflow.expense_date ? outflow.expense_date.split('T')[0] : '';

        // Set type
        var typeSelect = document.getElementById('type');
        if (typeSelect && outflow.type) {
            // Convert options to array for compatibility
            var validTypeOptions = [];
            for (var i = 0; i < typeSelect.options.length; i++) {
                validTypeOptions.push(typeSelect.options[i].value);
            }
            
            if (validTypeOptions.indexOf(outflow.type) !== -1) {
                typeSelect.value = outflow.type;
                
                // Show asset notification if NONEXPANDABLE
                if (outflow.type === 'NONEXPANDABLE') {
                    document.getElementById('entityContainer').style.display = 'block';
                    document.getElementById('assetNotification').style.display = 'block';
                }
            }
        }

        // Set payment type and handle IBAN container visibility
        var paymentTypeSelect = document.getElementById('payment_type');
        if (paymentTypeSelect) {
            // Convert options to array for compatibility
            var validPaymentOptions = [];
            for (var j = 0; j < paymentTypeSelect.options.length; j++) {
                validPaymentOptions.push(paymentTypeSelect.options[j].value);
            }
            
            // Set payment type if valid
            if (outflow.payment_type && validPaymentOptions.indexOf(outflow.payment_type) !== -1) {
                paymentTypeSelect.value = outflow.payment_type;
                
                // Show IBAN container if Bank Transfer
                if (outflow.payment_type === 'bank') {
                    document.getElementById('ibanContainer').style.display = 'block';
                    
                    // Load IBANs and set selected IBAN
                    var self = this;
                    setTimeout(function() {
                        Utils.loadIBANs();
                        
                        // Set IBAN after a delay to ensure options are loaded
                        setTimeout(function() {
                            var ibanSelect = document.getElementById('iban');
                            if (ibanSelect && outflow.iban_id) {
                                ibanSelect.value = outflow.iban_id;
                            }
                        }, 500);
                    }, 0);
                }
            }
        }

        // Set head and load subheads
        var headSelect = document.getElementById('head');
        if (headSelect && outflow.head_id) {
            var self = this;
            // Wait for heads to be loaded
            var checkHeadsLoaded = setInterval(function() {
                if (headSelect.options.length > 1) {
                    clearInterval(checkHeadsLoaded);
                    headSelect.value = outflow.head_id;
                    
                    // Trigger change event to load subheads
                    Utils.loadSubHeads(outflow.head_id);
                    
                    // Set subhead after a delay
                    setTimeout(function() {
                        var subheadSelect = document.getElementById('subhead');
                        if (subheadSelect && outflow.subhead_id) {
                            subheadSelect.value = outflow.subhead_id;
                        }
                    }, 500);
                }
            }, 100);
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
            cost: amount,
            head_details: data.head_details,
            payment_to: data.payment_to,
            type: data.type,
            place_type: data.place_type,
            payment_type: data.payment_type,
            expense_date: data.date
        };

        if (data.subhead_id) {
            formattedData.subhead_id = Number(data.subhead_id);
        }
        if (data.payment_type === 'bank') {
            formattedData.iban_id = Number(data.iban_id);
        }

        console.log('Submitting formatted data:', formattedData);

        ApiClient.updateOutflow(this.outflowId, formattedData)
            .then(function(response) {
                self.close();
                // Show success message
                Utils.onSuccess('edit', 'Outflow');
                if (self.onClose && typeof self.onClose === 'function') {
                    self.onClose();
                }
            })
            .catch(function(error) {
                // Display error in alert
                Utils.onSuccess('error', (error.message || 'Unknown error: Failed to update outflow'));
                console.error(error);
                // Re-enable the submit button
                submitButton.disabled = true;
            })
            .finally(function() {
                submitButton.disabled = false;
            });
    },

    close: function() {
        this.cleanup();
    }
};

window.EditOutflow = EditOutflow;
