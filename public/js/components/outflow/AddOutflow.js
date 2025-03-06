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
            // Check if Utils exists before calling its method
            if (typeof Utils !== 'undefined') {
                Utils.loadHeadsData(2);
            } else {
                console.error('Utils object is not defined');
                self.loadHeadsData(2);
            }
        }, 0);
    },

    cleanup: function () {
        // Check if Utils exists before calling its method
        if (typeof Utils !== 'undefined') {
            Utils.cleanup('addOutflowModal');
        } else {
            // Fallback cleanup if Utils is not available
            var existingModal = document.getElementById('addOutflowModal');
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
        var modalHtml = '<div class="modal" id="addOutflowModal">' +
            '<div class="modal-content">' +
                '<div class="modal-header">' +
                    '<h2>Add Outflow</h2>' +
                    '<button type="button" class="close-btn">&times;</button>' +
                '</div>' +
                '<div class="modal-body">' +
                    '<form id="addOutflowForm" class="modal-form-grid">' +
                        '<div class="form-group">' +
                            '<label for="head">Head*</label>' +
                            '<select id="head" name="head_id" required>' +
                                '<option value="">Select a head</option>' +
                            '</select>' +
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
                                'rows="3" ' +
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
                                'onchange="this.value = Math.max(0.01, Math.abs(this.value))" ' +
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
                            '<label for="date">Date of Entry*</label>' +
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
                if (this.value === 'Non Expandable') {
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
                e.preventDefault();
                self.handleSubmit(new FormData(form));
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
        if (data.payment_type === 'Bank Transfer') {
            formattedData.iban_id = parseInt(data.iban_id);
        }

        console.log('Submitting formatted data:', formattedData);

        ApiClient.createOutflow(formattedData)
            .then(function(response) {
                self.close();
                self.showSuccessMessage('add', 'Outflow');
                if (self.onSuccess) {
                    self.onSuccess();
                }
            })
            .catch(function(error) {
                console.error('Failed to create outflow:', error);
                self.showSuccessMessage('error', 'Outflow');
            })
            .then(function() {
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

window.AddOutflow = AddOutflow;
