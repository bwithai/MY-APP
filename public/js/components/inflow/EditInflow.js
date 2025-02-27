var EditInflow = {
    init: function(type, id, onClose) {
        this.type = type;
        this.inflowId = id;
        this.onClose = onClose;
        this.render();
        
        // Wait for DOM to be ready before setting up events and loading data
        setTimeout(() => {
            this.setupEventListeners();
            this.loadHeadsData();
            this.loadInflowData();
        }, 0);
        
    },

    loadInflowData: function() {
        var self = this;
        ApiClient.getInflow(this.inflowId)
            .then(function(inflow) {
                self.render(inflow);
                self.setupEventListeners();
                self.loadHeadsData(inflow.head_id);
                if (inflow.payment_method === 'Bank Transfer') {
                    self.loadIBANs();
                }
                self.show();
            })
            .catch(function(error) {
                console.error('Failed to load inflow:', error);
            });
    },

    render: function() {
        // Remove any existing alert
        this.cleanup();

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
                                <select id="head" name="head_id" required>
                                    <option value="">Select a head</option>
                                </select>
                            </div>

                            <div class="form-group" id="subHeadContainer" style="display: none;">
                                <label for="subhead">Sub Head</label>
                                <select id="subhead" name="subhead_id">
                                    <option value="">Select a sub-head</option>
                                </select>
                            </div>

                            <div class="form-group full-width">
                                <label for="fund_details">Fund Details*</label>
                                <textarea 
                                    id="fund_details" 
                                    name="fund_details" 
                                    required
                                    placeholder="Enter fund details..."
                                    rows="3"
                                ></textarea>
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
                                    <option value="">Select payment method</option>
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
                                <label for="date">Date of Entry*</label>
                                <input type="date" id="date" name="date" required>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                        <button type="submit" form="editInflowForm" class="btn btn-primary" id="submitInflow">Save</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    setupEventListeners: function() {
        var self = this;
        var modal = document.getElementById('editInflowModal');
        var form = document.getElementById('editInflowForm');
        var headSelect = document.getElementById('head');
        var paymentMethodSelect = document.getElementById('payment_method');
        var closeBtn = modal.querySelector('.close-btn');
        var cancelBtn = modal.querySelector('[data-dismiss="modal"]');

        // Close button
        if (closeBtn) {
            closeBtn.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                self.close();
            };
        }

        // Cancel button
        if (cancelBtn) {
            cancelBtn.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                self.close();
            };
        }

        // Head change
        if (headSelect) {
            headSelect.addEventListener('change', function() {
                self.loadSubHeads(this.value);
            });
        }

        // Payment method change
        if (paymentMethodSelect) {
            paymentMethodSelect.addEventListener('change', function() {
                var ibanContainer = document.getElementById('ibanContainer');
                if (this.value === 'Bank Transfer') {
                    ibanContainer.style.display = 'block';
                    self.loadIBANs();
                } else {
                    ibanContainer.style.display = 'none';
                }
            });
        }

        // Form submission
        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                self.handleSubmit(new FormData(this));
            });
        }
    },

    loadHeadsData: function() {
        var self = this;
        ApiClient.getHeads()
            .then(function(response) {
                var headSelect = document.getElementById('head');
                // Clear existing options first, keeping only the default option
                headSelect.innerHTML = '<option value="">Select a head</option>';
                
                response.data.forEach(function(head) {
                    var option = document.createElement('option');
                    option.value = head.id;
                    option.textContent = head.heads;
                    // Store sub_heads data in the option element
                    if (head.sub_heads && head.sub_heads.length > 0) {
                        option.dataset.subheads = JSON.stringify(head.sub_heads);
                    }
                    headSelect.appendChild(option);
                });
            })
            .catch(function(error) {
                console.error('Failed to load heads:', error);
            });
    },

    loadSubHeads: function(headId) {
        var subHeadContainer = document.getElementById('subHeadContainer');
        var subHeadSelect = document.getElementById('subhead');
        
        if (!headId) {
            subHeadContainer.style.display = 'none';
            return;
        }

        // Get selected head's option element
        var selectedHead = document.getElementById('head').querySelector(`option[value="${headId}"]`);
        if (selectedHead && selectedHead.dataset.subheads) {
            var subHeads = JSON.parse(selectedHead.dataset.subheads);
            subHeadSelect.innerHTML = '<option value="">Select a sub-head</option>';
            subHeads.forEach(function(subHead) {
                var option = document.createElement('option');
                option.value = subHead.id;
                option.textContent = subHead.subheads;
                subHeadSelect.appendChild(option);
            });
            subHeadContainer.style.display = 'block';
        } else {
            subHeadContainer.style.display = 'none';
        }
    },


    loadIBANs: function() {
        var self = this;
        var userId = sessionStorage.getItem('selectedUserId');
        if (!userId) return;

        ApiClient.getIBANs(userId)
            .then(function(response) {
                var ibanSelect = document.getElementById('iban');
                ibanSelect.innerHTML = '<option value="">Select IBAN</option>';
                response.forEach(function(iban) {
                    var option = document.createElement('option');
                    option.value = iban.id;
                    option.textContent = iban.iban;
                    ibanSelect.appendChild(option);
                });
            })
            .catch(function(error) {
                console.error('Failed to load IBANs:', error);
            });
    },

    handleSubmit: function(formData) {
        var self = this;
        // Build the data object manually from FormData
        var data = {};
        var entries = formData.entries();
        var entry;
        while (!(entry = entries.next()).done) {
            data[entry.value[0]] = entry.value[1];
        }
        
        // Validate amount
        var amount = Number(parseFloat(data.amount).toFixed(2));
        if (amount <= 0) {
            alert('Amount must be greater than 0');
            return;
        }
        
        // Format data according to API requirements
        var formattedData = {
            head_id: Number(data.head_id),
            amount: amount,
            fund_details: data.fund_details,
            received_from: data.received_from,
            payment_method: data.payment_method,
            date: data.date
        };
        
        // Conditionally add properties without using spread syntax
        if (data.subhead_id) {
            formattedData.subhead_id = Number(data.subhead_id);
        }
        if (data.payment_method === 'Bank Transfer') {
            formattedData.iban_id = Number(data.iban_id);
        }
        
        // Call the API endpoint for updating the inflow
        ApiClient.updateInflow(this.inflowId, formattedData)
            .then(function(response) {
                self.close();
                // Refresh the inflow list
                InflowApp.loadInflowData();
            })
            .catch(function(error) {
                console.error('Failed to update inflow:', error);
                alert(error.message || 'Failed to update inflow');
            });
    },

    cleanup: function() {
        var existingModal = document.getElementById('editInflowModal');
        if (existingModal) {
            existingModal.remove();
        }
    },

    close: function() {
        this.cleanup();
        if (this.onClose) this.onClose();
    }
};

window.DeleteAlert = DeleteAlert; 