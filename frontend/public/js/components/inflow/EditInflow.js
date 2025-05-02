var EditInflow = {
    init: function (type, id, onClose) {
        this.type = type;
        this.inflowId = id;
        this.onClose = onClose;
        this.cleanup();
        this.render();
        this.setupEventListeners();
        
        Utils.loadHeadsData(1);
        
        if (id) this.loadInflowData();
    },

    cleanup: function () {
        Utils.cleanup('editInflowModal');
    },

    loadInflowData: function () {
        var self = this;
        ApiClient.getInflow(this.inflowId)
            .then(function (inflow) {
                self.populateForm(inflow);
            })
            .catch(function (error) {
                console.error('Failed to load inflow:', error);
            });
    },

    render: function () {
        var modalHtml = '<div class="modal" id="editInflowModal">' +
            '<div class="modal-content" style="max-width: 800px;">' +
                '<div class="modal-header">' +
                    '<h2>Edit Inflow</h2>' +
                    '<button type="button" class="close-btn">&times;</button>' +
                '</div>' +
                '<div class="modal-body">' +
                    '<form id="editInflowForm" class="modal-form-grid">' +
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
                            Utils.createLabel('fund_details', 'Fund Details', true) +
                            '<textarea ' +
                                'id="fund_details" ' +
                                'name="fund_details" ' +
                                'required ' +
                                'placeholder="Enter fund details..." ' +
                                'rows="3"' +
                            '></textarea>' +
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
                            Utils.createLabel('received_from', 'Received From', true) +
                            '<input type="text" id="received_from" name="received_from" required>' +
                        '</div>' +

                        '<div class="form-group">' +
                            Utils.createLabel('payment_method', 'Payment Method', true) +
                            '<select id="payment_method" name="payment_method" required>' +
                                '<option value="">Select payment method</option>' +
                                '<option value="Bank Transfer">Bank Transfer</option>' +
                                '<option value="Cash Transfer">Cash Transfer</option>' +
                            '</select>' +
                        '</div>' +

                        '<div class="form-group" id="ibanContainer" style="display: none;">' +
                            Utils.createLabel('iban', 'IBAN', true) +
                            '<select id="iban" name="iban_id">' +
                                '<option value="">Select IBAN</option>' +
                            '</select>' +
                        '</div>' +

                        '<div class="form-group">' +
                            Utils.createLabel('date', 'Date of Entry', true) +
                            '<input type="text" id="date" name="date" required placeholder="YYYY-MM-DD" readonly>' +
                        '</div>' +
                    '</form>' +
                '</div>' +
                '<div class="modal-footer">' +
                    '<button type="button" class="btn btn-secondary close-btn">Cancel</button>' +
                    '<button type="submit" form="editInflowForm" class="btn btn-primary">Save</button>' +
                '</div>' +
            '</div>' +
        '</div>';
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    setupEventListeners: function () {
        var self = this;
        document.querySelectorAll('.close-btn').forEach(function (btn) {
            btn.onclick = function () { self.close(); };
        });

        document.getElementById('head').addEventListener('change', function () {
            Utils.loadSubHeads(this.value);
        });

        document.getElementById('payment_method').addEventListener('change', function () {
            var ibanContainer = document.getElementById('ibanContainer');
            ibanContainer.style.display = this.value === 'Bank Transfer' ? 'block' : 'none';
            if (this.value === 'Bank Transfer') {
                Utils.loadIBANs();
            }
        });

        document.getElementById('editInflowForm').addEventListener('submit', function (e) {
            e.preventDefault();
            self.handleSubmit(new FormData(this));
        });

        // Initialize the restricted datepicker component on the date input
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

    populateForm: function (inflow) {
        // Set form values
        document.getElementById('fund_details').value = inflow.fund_details || '';
        document.getElementById('amount').value = inflow.amount || '';
        document.getElementById('received_from').value = inflow.received_from || '';
        document.getElementById('date').value = inflow.date ? inflow.date.split('T')[0] : '';

        // Set payment method and handle IBAN container visibility
        var paymentSelect = document.getElementById('payment_method');
        if (paymentSelect) {
            // Convert options to array for compatibility
            var validOptions = [];
            for (var i = 0; i < paymentSelect.options.length; i++) {
                validOptions.push(paymentSelect.options[i].value);
            }
            
            // Set payment method if valid
            if (inflow.payment_method && validOptions.indexOf(inflow.payment_method) !== -1) {
                paymentSelect.value = inflow.payment_method;
                
                // Show IBAN container if Bank Transfer
                if (inflow.payment_method === 'Bank Transfer') {
                    document.getElementById('ibanContainer').style.display = 'block';
                    
                    // Load IBANs and set selected IBAN
                    var self = this;
                    setTimeout(function() {
                        Utils.loadIBANs();
                        
                        // Set IBAN after a delay to ensure options are loaded
                        setTimeout(function() {
                            var ibanSelect = document.getElementById('iban');
                            if (ibanSelect && inflow.iban_id) {
                                ibanSelect.value = inflow.iban_id;
                            }
                        }, 500);
                    }, 0);
                }
            }
        }

        // Set head and load subheads
        var headSelect = document.getElementById('head');
        if (headSelect && inflow.head_id) {
            var self = this;
            // Wait for heads to be loaded
            var checkHeadsLoaded = setInterval(function() {
                if (headSelect.options.length > 1) {
                    clearInterval(checkHeadsLoaded);
                    headSelect.value = inflow.head_id;
                    
                    // Trigger change event to load subheads
                    Utils.loadSubHeads(inflow.head_id);
                    
                    // Set subhead after a delay
                    setTimeout(function() {
                        var subheadSelect = document.getElementById('subhead');
                        if (subheadSelect && inflow.subhead_id) {
                            subheadSelect.value = inflow.subhead_id;
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

        ApiClient.updateInflow(this.inflowId, formattedData)
            .then(function () {
                self.close();
                // Show success message
                Utils.onSuccess('edit', 'Inflow');
                if (self.onClose && typeof self.onClose === 'function') {
                    self.onClose();
                }
            })
            .catch(function(error) {
                // Display error in alert
                Utils.onSuccess('error', (error.message || 'Unknown error: Failed to update inflow'));
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

window.EditInflow = EditInflow;
