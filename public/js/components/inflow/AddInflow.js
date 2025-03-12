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
            Utils.loadHeadsData(1);
        }, 0);
    },

    cleanup: function () {
        Utils.cleanup('addInflowModal');
    },

    render: function() {
        var modalHtml = '<div class="modal" id="addInflowModal">' +
            '<div class="modal-content">' +
                '<div class="modal-header">' +
                    '<h2>Add Inflow</h2>' +
                    '<button type="button" class="close-btn">&times;</button>' +
                '</div>' +
                '<div class="modal-body">' +
                    '<form id="addInflowForm" class="modal-form-grid">' +
                        '<div class="form-group">' +
                            Utils.createLabel('head', 'Head', true) +
                            '<select id="head" name="head_id" required>' +
                                '<option value="">Select a head</option>' +
                            '</select>' +
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
                                'rows="3" ' +
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
                                'onchange="this.value = Math.max(0.01, Math.abs(this.value))" ' +
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
                Utils.loadSubHeads(this.value);
            });
        }

        if (paymentMethodSelect) {
            paymentMethodSelect.addEventListener('change', function() {
                var ibanContainer = document.getElementById('ibanContainer');
                if (this.value === 'Bank Transfer') {
                    ibanContainer.style.display = 'block';
                    Utils.loadIBANs();
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
            Utils.setCurrentDate(dateInput);
            Utils.initDatePicker(dateInput);
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
                Utils.onSuccess('add', 'Inflow');
                if (self.onSuccess && typeof self.onSuccess === 'function') {
                    self.onSuccess();
                }
            })
            .catch(function(error) {
                console.error('Failed to create inflow:', error);
                Utils.onSuccess('error', 'Inflow');
            })
            .finally(function() {
                submitButton.disabled = false;
            });
    },

    close: function() {
        this.cleanup();
    }
};

window.AddInflow = AddInflow;
