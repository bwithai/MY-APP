var EditInflow = {
    init: function (type, id, onClose) {
        this.type = type;
        this.inflowId = id;
        this.onClose = onClose;
        this.cleanup();
        this.render();
        this.setupEventListeners();
        
        // Check if Utils exists before calling its method
        if (typeof Utils !== 'undefined') {
            try {
                Utils.loadHeadsData(1);
            } catch (error) {
                console.error('Error loading heads data:', error);
                this.loadHeadsData(1);
            }
        } else {
            console.error('Utils object is not defined');
            this.loadHeadsData(1);
        }
        
        if (id) this.loadInflowData();
    },

    cleanup: function () {
        // Check if Utils exists before calling its method
        if (typeof Utils !== 'undefined') {
            Utils.cleanup('editInflowModal');
        } else {
            // Fallback cleanup if Utils is not available
            var existingModal = document.getElementById('editInflowModal');
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
        var selectedHead = document.querySelector(`#head option[value='${headId}']`);
        
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
            '<div class="modal-content">' +
                '<div class="modal-header">' +
                    '<h2>Edit Inflow</h2>' +
                    '<button type="button" class="close-btn">&times;</button>' +
                '</div>' +
                '<div class="modal-body">' +
                    '<form id="editInflowForm" class="modal-form-grid">' +
                        '<div class="form-group">' +
                            '<label for="head">Head*</label>' +
                            '<select id="head" name="head_id" required></select>' +
                        '</div>' +

                        '<div class="form-group" id="subHeadContainer" style="display: none;">' +
                            '<label for="subhead">Sub Head</label>' +
                            '<select id="subhead" name="subhead_id">' +
                                '<option value="">Select a sub-head</option>' +
                            '</select>' +
                        '</div>' +

                        '<div class="form-group full-width">' +
                            '<label for="fund_details">Fund Details*</label>' +
                            '<textarea ' +
                                'id="fund_details" ' +
                                'name="fund_details" ' +
                                'required ' +
                                'placeholder="Enter fund details..." ' +
                                'rows="3"' +
                            '></textarea>' +
                        '</div>' +

                        '<div class="form-group">' +
                            '<label for="amount">Amount*</label>' +
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
                            '<label for="received_from">Received From*</label>' +
                            '<input type="text" id="received_from" name="received_from" required>' +
                        '</div>' +

                        '<div class="form-group">' +
                            '<label for="payment_method">Payment Method*</label>' +
                            '<select id="payment_method" name="payment_method" required>' +
                                '<option value="">Select payment method</option>' +
                                '<option value="Bank Transfer">Bank Transfer</option>' +
                                '<option value="Cash Transfer">Cash Transfer</option>' +
                            '</select>' +
                        '</div>' +

                        '<div class="form-group" id="ibanContainer" style="display: none;">' +
                            '<label for="iban">IBAN*</label>' +
                            '<select id="iban" name="iban_id">' +
                                '<option value="">Select IBAN</option>' +
                            '</select>' +
                        '</div>' +

                        '<div class="form-group">' +
                            '<label for="date">Date of Entry*</label>' +
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
            // Check if Utils exists before calling its method
            try {
                if (typeof Utils !== 'undefined') {
                    Utils.loadSubHeads(this.value);
                } else {
                    self.loadSubHeads(this.value);
                }
            } catch (error) {
                console.error('Error loading sub-heads:', error);
                self.loadSubHeads(this.value);
            }
        });

        document.getElementById('payment_method').addEventListener('change', function () {
            var ibanContainer = document.getElementById('ibanContainer');
            ibanContainer.style.display = this.value === 'Bank Transfer' ? 'block' : 'none';
            if (this.value === 'Bank Transfer') {
                // Check if Utils exists before calling its method
                try {
                    if (typeof Utils !== 'undefined') {
                        Utils.loadIBANs();
                    } else {
                        self.loadIBANs();
                    }
                } catch (error) {
                    console.error('Error loading IBANs:', error);
                    self.loadIBANs();
                }
            }
        });

        document.getElementById('editInflowForm').addEventListener('submit', function (e) {
            e.preventDefault();
            self.handleSubmit(new FormData(this));
        });

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
                        if (typeof Utils !== 'undefined') {
                            Utils.loadIBANs();
                        } else {
                            self.loadIBANs();
                        }
                        
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
                    if (typeof Utils !== 'undefined') {
                        Utils.loadSubHeads(inflow.head_id);
                    } else {
                        self.loadSubHeads(inflow.head_id);
                    }
                    
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

    handleSubmit: function (formData) {
        var self = this;
        var data = {};
        formData.forEach(function (value, key) { data[key] = value; });
        data.amount = parseFloat(data.amount).toFixed(2);
        ApiClient.updateInflow(this.inflowId, data)
            .then(function () {
                self.close();
                // Show success message
                self.showSuccessMessage('edit', 'Inflow');
                if (self.onClose && typeof self.onClose === 'function') {
                    self.onClose();
                }
            })
            .catch(console.error);
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
                message = `Added ${type} successfully!`;
                break;
            case 'edit':
                message = `Updated ${type} successfully!`;
                break; 
            case 'delete':
                message = `Deleted ${type} successfully!`;
                break;
        }
    
        // Display success message
        var successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        
        // Change background color to red if action is delete
        if (action === 'delete') {
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

window.EditInflow = EditInflow;
