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
        var modalHtml = `
            <div class="modal" id="editOutflowModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Edit Outflow</h2>
                        <button type="button" class="close-btn">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="editOutflowForm" class="modal-form-grid">
                            <div class="form-group">
                                <label for="head">Head*</label>
                                <select id="head" name="head_id" required></select>
                            </div>
                            <div class="form-group" id="subHeadContainer" style="display: none;">
                                <label for="subhead">Sub Head</label>
                                <select id="subhead" name="subhead_id"></select>
                            </div>
                            <div class="form-group full-width">
                                <label for="head_details">Details*</label>
                                <textarea 
                                    id="head_details" 
                                    name="head_details" 
                                    required
                                    placeholder="Enter details..."
                                    rows="3"
                                ></textarea>
                            </div>
                            <div class="form-group">
                                <label for="type">Type*</label>
                                <select id="type" name="type" required>
                                    <option value="">Select a type</option>
                                    <option value="Expandable">Expandable</option>
                                    <option value="Non Expandable">Non Expandable</option>
                                </select>
                            </div>
                            <div class="form-group" id="entityContainer" style="display: none;">
                                <label for="place_type">Entity*</label>
                                <select id="place_type" name="place_type">
                                    <option value="">Select an entity</option>
                                    <option value="Command House">Command House</option>
                                    <option value="Mess">Mess</option>
                                    <option value="Unit/ESTB">Unit/ESTB</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="amount">Amount*</label>
                                <input 
                                    type="number" 
                                    id="amount" 
                                    name="amount" 
                                    step="0.01" 
                                    min="0.01"
                                    required"
                                >
                            </div>
                            <div class="form-group">
                                <label for="payment_to">Payment To*</label>
                                <input type="text" id="payment_to" name="payment_to" required>
                            </div>
                            <div class="form-group">
                                <label for="payment_type">Payment Type*</label>
                                <select id="payment_type" name="payment_type" required>
                                    <option value="">Select payment type</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                    <option value="Cash Transfer">Cash Transfer</option>
                                </select>
                            </div>
                            <div class="form-group" id="ibanContainer" style="display: none;">
                                <label for="iban">IBAN*</label>
                                <select id="iban" name="iban_id">
                                    <option value="">Select IBAN</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="expense_date">Date of Entry*</label>
                                <input type="text" id="date" name="date" required placeholder="YYYY-MM-DD" readonly>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary close-btn">Cancel</button>
                        <button type="submit" form="editOutflowForm" class="btn btn-primary">Save</button>
                    </div>
                </div>
            </div>`;
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
                if (this.value === 'Non Expandable') {
                    entityContainer.style.display = 'block';
                    placeTypeSelect.setAttribute('required', 'required');
                } else {
                    entityContainer.style.display = 'none';
                    placeTypeSelect.removeAttribute('required');
                    placeTypeSelect.value = '';
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
            RestrictedDatePicker(dateInput);
        }
    },

    populateForm: function (outflow) {
        console.log("Populating form with outflow:", outflow);
        
        // Use the correct keys from the outflow object
        document.getElementById('head').value = outflow.head_id;
        document.getElementById('head_details').value = outflow.head_details;
        document.getElementById('type').value = outflow.type;
        document.getElementById('place_type').value = outflow.place_type;
        document.getElementById('amount').value = outflow.cost;
        document.getElementById('payment_to').value = outflow.payment_to;
        if (outflow.payment_type) {  // Set Payment Method (if valid)
            let paymentSelect = document.getElementById('payment_type');
            let validOptions = [...paymentSelect.options].map(opt => opt.value);
            if (validOptions.includes(outflow.payment_type)) {
                paymentSelect.value = outflow.payment_type;
            } else {
                console.warn('Invalid payment type:', outflow.payment_type);
            }
        }
        if (outflow.expense_date) {
            let formattedDate = outflow.expense_date.split('T')[0]; // Extract only YYYY-MM-DD
            document.getElementById('date').value = formattedDate;
        }
        if (outflow.subhead_id) { // For sub-head, if provided (using the correct key, e.g., 'sub_heads')
            Utils.loadSubHeads(outflow.head_id); // You might need to adjust this if the value differs
            setTimeout(() => {
                document.getElementById('subhead').value = outflow.subhead_id;
            }, 100);
        }
        if (outflow.payment_type === 'Bank Transfer') { // Handle IBAN display for Bank Transfer
            document.getElementById('ibanContainer').style.display = 'block';
            Utils.loadIBANs();
            setTimeout(() => {
                document.getElementById('iban').value = outflow.iban_id;
            }, 100);
        } else {
            document.getElementById('ibanContainer').style.display = 'none';
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
        if (data.payment_type === 'Bank Transfer') {
            formattedData.iban_id = Number(data.iban_id);
        }

        console.log('Submitting formatted data:', formattedData);

        ApiClient.updateOutflow(this.outflowId, formattedData)
            .then(function() {
                self.close();
                Utils.onSuccess('edit', 'Outflow');
                OutflowApp.loadOutflowData();
            })
            .catch(function(error) {
                console.error('Failed to create outflow:', error);
                var errorMessage = error.message || 'Failed to create outflow';
                alert(errorMessage);
            })
            .then(function() {
                submitButton.disabled = false;
            });
    },

    close: function() {
        this.cleanup();
    }
};
