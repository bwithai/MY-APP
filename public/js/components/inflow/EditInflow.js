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
        var modalHtml = `
            <div class="modal" id="editInflowModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Edit Inflow</h2>
                        <button type="button" class="close-btn">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="editInflowForm" class="modal-form-grid">
                            <div class="form-group">
                                <label for="head">Head*</label>
                                <select id="head" name="head_id" required></select>
                            </div>
                            <div class="form-group" id="subHeadContainer" style="display: none;">
                                <label for="subhead">Sub Head</label>
                                <select id="subhead" name="subhead_id"></select>
                            </div>
                            <div class="form-group full-width">
                                <label for="fund_details">Fund Details*</label>
                                <textarea id="fund_details" name="fund_details" required rows="3"></textarea>
                            </div>
                            <div class="form-group">
                                <label for="amount">Amount*</label>
                                <input 
                                    type="number" 
                                    id="amount" 
                                    name="amount" 
                                    step="0.01" 
                                    min="0.01"
                                    required
                                    onchange="this.value = Math.max(0.01, Math.abs(this.value))"
                                >
                            </div>
                            <div class="form-group">
                                <label for="received_from">Received From*</label>
                                <input type="text" id="received_from" name="received_from" required>
                            </div>
                            <div class="form-group">
                                <label for="payment_method">Payment Method*</label>
                                <select id="payment_method" name="payment_method" required>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                    <option value="Cash Transfer">Cash Transfer</option>
                                </select>
                            </div>
                            <div class="form-group" id="ibanContainer" style="display: none;">
                                <label for="iban">IBAN*</label>
                                <select id="iban" name="iban_id"></select>
                            </div>
                            <div class="form-group">
                                <label for="date">Date of Entry*</label>
                                <input type="text" id="date" name="date" required placeholder="YYYY-MM-DD" readonly>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary close-btn">Cancel</button>
                        <button type="submit" form="editInflowForm" class="btn btn-primary">Save</button>
                    </div>
                </div>
            </div>`;
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
            if (this.value === 'Bank Transfer') Utils.loadIBANs();
        });

        document.getElementById('editInflowForm').addEventListener('submit', function (e) {
            e.preventDefault();
            self.handleSubmit(new FormData(this));
        });

        // Initialize the restricted datepicker component on the date input
        var dateInput = document.getElementById('date');
        if (dateInput) {
            RestrictedDatePicker(dateInput);
        }
    },

    populateForm: function (inflow) {
        console.log("Populating form with inflow:", inflow);
        
        // Use the correct keys from the inflow object
        document.getElementById('head').value = inflow.head_id;
        document.getElementById('fund_details').value = inflow.fund_details;
        document.getElementById('amount').value = inflow.amount;
        document.getElementById('received_from').value = inflow.received_from;
        if (inflow.payment_method) {  // Set Payment Method (if valid)
            let paymentSelect = document.getElementById('payment_method');
            let validOptions = [...paymentSelect.options].map(opt => opt.value);
            if (validOptions.includes(inflow.payment_method)) {
                paymentSelect.value = inflow.payment_method;
            } else {
                console.warn('Invalid payment method:', inflow.payment_method);
            }
        }
        if (inflow.date) {
            let formattedDate = inflow.date.split('T')[0]; // Extract only YYYY-MM-DD
            document.getElementById('date').value = formattedDate;
        }
        if (inflow.subhead_id) { // For sub-head, if provided (using the correct key, e.g., 'sub_heads')
            Utils.loadSubHeads(inflow.head_id); // You might need to adjust this if the value differs
            setTimeout(() => {
                document.getElementById('subhead').value = inflow.subhead_id;
            }, 100);
        }
        if (inflow.payment_method === 'Bank Transfer') { // Handle IBAN display for Bank Transfer
            document.getElementById('ibanContainer').style.display = 'block';
            Utils.loadIBANs();
            setTimeout(() => {
                document.getElementById('iban').value = inflow.iban_id;
            }, 100);
        } else {
            document.getElementById('ibanContainer').style.display = 'none';
        }
    },

    handleSubmit: function (formData) {
        var self = this;
        var data = {};
        formData.forEach(function (value, key) { data[key] = value; });
        data.amount = parseFloat(data.amount).toFixed(2);
        ApiClient.updateInflow(this.inflowId, data)
            .then(function () {
                self.close();
                Utils.onSuccess('edit', 'Inflow');
                InflowApp.loadInflowData();
            })
            .catch(console.error);
    },

    close: function() {
        this.cleanup();
    }
};
