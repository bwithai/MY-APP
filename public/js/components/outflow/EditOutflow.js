var EditOutflow = {
    init: function (type, id, onClose) {
        this.type = type;
        this.outflowId = id;
        this.onClose = onClose;
        this.cleanup();
        this.render();
        this.setupEventListeners();
        
        // Check if Utils exists before calling its method
        if (typeof Utils !== 'undefined') {
            try {
                Utils.loadHeadsData(2);
            } catch (error) {
                console.error('Error loading heads data:', error);
                this.loadHeadsData(2);
            }
        } else {
            console.error('Utils object is not defined');
            this.loadHeadsData(2);
        }
        
        if (id) this.loadOutflowData();
    },

    cleanup: function () {
        // Check if Utils exists before calling its method
        if (typeof Utils !== 'undefined') {
            Utils.cleanup('editOutflowModal');
        } else {
            // Fallback cleanup if Utils is not available
            var existingModal = document.getElementById('editOutflowModal');
            if (existingModal) {
                existingModal.remove();
            }
        }
    },

    loadHeadsData: function (type) {
        ApiClient.getHeads(type)
            .then(function (response) {
                var headSelect = document.getElementById('head');
                headSelect.innerHTML = '<option value="">Select a head</option>';
                response.data.forEach(function (head) {
                    var option = document.createElement('option');
                    option.value = head.id;
                    option.textContent = head.heads;
                    option.dataset.subheads = JSON.stringify(head.sub_heads || []);
                    headSelect.appendChild(option);
                });
            })
            .catch(function(error) {
                console.error('Failed to load heads data:', error);
            });
    },

    loadSubHeads: function (headId) {
        var subHeadContainer = document.getElementById('subHeadContainer');
        var subHeadSelect = document.getElementById('subhead');
        var selectedHead = document.querySelector('#head option[value="' + headId + '"]');
        subHeadSelect.innerHTML = '<option value="">Select a sub-head</option>';
        var subHeads = selectedHead && selectedHead.dataset.subheads ? JSON.parse(selectedHead.dataset.subheads) : [];
        if (subHeads.length > 0) {
            subHeads.forEach(function (subHead) {
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
            '<div class="modal-content">' +
                '<div class="modal-header">' +
                    '<h2>Edit Outflow</h2>' +
                    '<button type="button" class="close-btn">&times;</button>' +
                '</div>' +
                '<div class="modal-body">' +
                    '<form id="editOutflowForm" class="modal-form-grid">' +
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
                            '<label for="head_details">Head Details*</label>' +
                            '<textarea ' +
                                'id="head_details" ' +
                                'name="head_details" ' +
                                'required ' +
                                'placeholder="Enter head details..." ' +
                                'rows="3"' +
                            '></textarea>' +
                        '</div>' +
                        '<div class="form-group">' +
                            '<label for="type">Type*</label>' +
                            '<select id="type" name="type" required>' +
                                '<option value="">Select type</option>' +
                                '<option value="Expandable">Expandable</option>' +
                                '<option value="Non Expandable">Non Expandable</option>' +
                            '</select>' +
                        '</div>' +
                        '<div class="form-group" id="entityContainer" style="display: none;">' +
                            '<label for="place_type">Entity</label>' +
                            '<select id="place_type" name="place_type">' +
                                '<option value="">Select an entity</option>' +
                                '<option value="Command House">Command House</option>' +
                                '<option value="Mess">Mess</option>' +
                                '<option value="unit/ESTB">unit/ESTB</option>' +
                            '</select>' +
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
                            '<label for="payment_type">Payment Type*</label>' +
                            '<select id="payment_type" name="payment_type" required>' +
                                '<option value="">Select payment type</option>' +
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
                            '<label for="payment_to">Payment To</label>' +
                            '<input type="text" id="payment_to" name="payment_to">' +
                        '</div>' +
                        '<div class="form-group">' +
                            '<label for="expense_date">Expense Date*</label>' +
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
                // Check if Utils exists before calling its method
                if (typeof Utils !== 'undefined') {
                    Utils.loadSubHeads(this.value);
                } else {
                    self.loadSubHeads(this.value);
                }
            });
        }

        if (paymentTypeSelect) {
            paymentTypeSelect.addEventListener('change', function() {
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
            if (typeof RestrictedDatePicker === 'function') {
                RestrictedDatePicker(dateInput);
            } else {
                // Simple fallback for date input if RestrictedDatePicker is not available
                dateInput.type = 'date';
                dateInput.readOnly = false;
            }
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
                if (outflow.payment_type === 'Bank Transfer') {
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
                    if (typeof Utils !== 'undefined') {
                        Utils.loadSubHeads(outflow.head_id);
                    } else {
                        self.loadSubHeads(outflow.head_id);
                    }
                    
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
        if (data.payment_type === 'Bank Transfer') {
            formattedData.iban_id = Number(data.iban_id);
        }

        console.log('Submitting formatted data:', formattedData);

        ApiClient.updateOutflow(this.outflowId, formattedData)
            .then(function(response) {
                self.close();
                // Show success message
                self.showSuccessMessage('edit', 'Outflow');
                if (self.onClose && typeof self.onClose === 'function') {
                    self.onClose();
                }
            })
            .catch(function(error) {
                console.error('Failed to update outflow:', error);
                var errorMessage = error.message || 'Failed to update outflow';
                alert(errorMessage);
            })
            .finally(function() {
                submitButton.disabled = false;
            });
    },

    close: function() {
        this.cleanup();
    },

    showSuccessMessage: function(action, type) {
        if (typeof Utils !== 'undefined' && typeof Utils.onSuccess === 'function') {
            try {
                Utils.onSuccess(action, type);
                return;
            } catch (error) {
                console.error('Error calling Utils.onSuccess:', error);
                // Continue to fallback
            }
        }

        var message = '';
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

window.EditOutflow = EditOutflow;
