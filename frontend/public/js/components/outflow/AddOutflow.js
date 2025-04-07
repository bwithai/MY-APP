var AddOutflow = {
    init: function(onSuccess) {
        // Clear any existing modal first
        this.cleanup();

        this.onSuccess = onSuccess;
        this.render();

        // Wait for DOM to be ready before setting up events and loading data
        var self = this;
        setTimeout(function() {
            self.setupEventListeners();
            Utils.loadHeadsData(2);
        }, 0);
    },

    cleanup: function () {
        Utils.cleanup('addOutflowModal');
    },

    render: function() {
        var modalHtml = '<div class="modal" id="addOutflowModal">' +
            '<div class="modal-content">' +
                '<div class="modal-header">' +
                    '<h2>Add Outflow</h2>' +
                    '<button type="button" class="close-btn">&times;</button>' +
                '</div>' +
                '<div class="modal-body">' +
                    '<form id="addOutflowForm" class="modal-form-grid">' +
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
                            Utils.createLabel('head_details', 'Head Details', true) +
                            '<textarea ' +
                                'id="head_details" ' +
                                'name="head_details" ' +
                                'required ' +
                                'placeholder="Enter head details..." ' +
                                'rows="3" ' +
                            '></textarea>' +
                        '</div>' +

                        '<div class="form-group">' +
                            Utils.createLabel('type', 'Type', true) +
                            '<select id="type" name="type" required>' +
                                '<option value="">Select type</option>' +
                                '<option value="EXPANDABLE">Expandable</option>' +
                                '<option value="NONEXPANDABLE">Non Expandable</option>' +
                            '</select>' +
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
                                'onchange="this.value = Math.max(0.01, Math.abs(this.value))" ' +
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
                            Utils.createLabel('date', 'Date of Entry', true) +
                            '<input type="text" id="date" name="date" required placeholder="YYYY-MM-DD" readonly>' +
                        '</div>' +
                    '</form>' +
                '</div>' +
                '<div class="modal-footer">' +
                    '<button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>' +
                    '<button type="submit" form="addOutflowForm" class="btn btn-primary" id="submitOutflow">Save</button>' +
                '</div>' +
            '</div>' +
        '</div>';
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    setupEventListeners: function() {
        var self = this;
        var modal = document.getElementById('addOutflowModal');

        if (!modal) {
            console.error('Modal not found');
            return;
        }

        var form = document.getElementById('addOutflowForm');
        var headSelect = document.getElementById('head');
        var paymentTypeSelect = document.getElementById('payment_type');
        var closeBtn = modal.querySelector('.close-btn');
        var cancelBtn = modal.querySelector('[data-dismiss="modal"]');
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
                if (this.value === 'NONEXPADABLE') {
                    entityContainer.style.display = 'block';
                    placeTypeSelect.setAttribute('required', 'required');
                } else {
                    entityContainer.style.display = 'none';
                    placeTypeSelect.removeAttribute('required');
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
                e.preventDefault();
                self.handleSubmit(new FormData(form));
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
            head_id: parseInt(data.head_id),
            cost: amount,
            head_details: data.head_details,
            payment_to: data.payment_to,
            type: data.type,
            place_type: data.place_type,
            payment_type: data.payment_type,
            expense_date: data.date
        };

        if (data.subhead_id) {
            formattedData.subhead_id = parseInt(data.subhead_id);
        }
        if (data.payment_type === 'bank') {
            formattedData.iban_id = parseInt(data.iban_id);
        }

        console.log('Submitting formatted data:', formattedData);

        ApiClient.createOutflow(formattedData)
            .then(function(response) {
                self.close();
                Utils.onSuccess('add', 'Outflow');
                if (self.onSuccess) {
                    self.onSuccess();
                }
            })
            .catch(function(error) {
                console.error('Failed to create outflow:', error);
                Utils.onSuccess('error', 'Outflow');
            })
            .then(function() {
                submitButton.disabled = false;
            });
    },

    close: function() {
        this.cleanup();
    }
};

window.AddOutflow = AddOutflow;
