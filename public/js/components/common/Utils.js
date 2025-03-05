var Utils = {
    cleanup: function (modalId) {
        var existingModal = document.getElementById(modalId);
        if (existingModal) {
            existingModal.remove();
        }
        window.onclick = null;
    },

    loadHeadsData: function (type) {
        ApiClient.getHeads(type) // Pass the type parameter to the API call
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
            .catch(console.error);
    },

    loadSubHeads: function (headId) {
        var subHeadContainer = document.getElementById('subHeadContainer');
        var subHeadSelect = document.getElementById('subhead');
        var selectedHead = document.querySelector(`#head option[value='${headId}']`);
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

    onSuccess: function(action, type='') {
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
    
        // Close the modal if it's open
        if (typeof ModalHandler !== 'undefined' && typeof ModalHandler.close === 'function') {
            ModalHandler.close();
        }
    },

    close: function() {
        this.cleanup();
    },

    formatNumber: function(value) {
        value = Number(value);
        if (value == null || isNaN(value)) {
            return 'Invalid number'; // Handle null, undefined, or NaN
        }
    
        if (value < 1000) {
            return value.toFixed(2); // Less than 1,000
        } else if (value < 1_000_000) {
            return (value / 1000).toFixed(2) + 'K'; // Thousands
        } else if (value < 1_000_000_000) {
            return (value / 1_000_000).toFixed(2) + 'M'; // Millions
        } else if (value < 1_000_000_000_000) {
            return (value / 1_000_000_000).toFixed(2) + 'B'; // Billions
        } else if (value < 1_000_000_000_000_000) {
            return (value / 1_000_000_000_000).toFixed(2) + 'T'; // Trillions
        } else if (value < 1_000_000_000_000_000_000) {
            return (value / 1_000_000_000_000_000).toFixed(2) + 'Q'; // Quadrillions
        } else {
            return (value / 1_000_000_000_000_000_000).toFixed(2) + 'Qi'; // Quintillions or more
        }
    },

    handleInflowSubmit: function(formData, options) {
        var self = this;
        var submitButton = document.querySelector('button[type="submit"]');
        if (submitButton.disabled) {
            return;
        }
        submitButton.disabled = true;
    
        // Build data object from FormData
        var data = {};
        formData.forEach(function(value, key) { 
            data[key] = value; 
        });
    
        // Validate and format the amount
        var amount = Number(parseFloat(data.amount).toFixed(2));
        if (amount <= 0) {
            alert('Amount must be greater than 0');
            submitButton.disabled = false;
            return;
        }
    
        // Prepare the formatted data object
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
    
        // Determine API call based on options.method ("update" vs. create)
        var apiPromise;
        if (options && options.method === 'update') {
            // Update existing inflow; require options.id
            apiPromise = ApiClient.updateInflow(options.id, formattedData);
        } else {
            // Default: create new inflow
            apiPromise = ApiClient.createInflow(formattedData);
        }
    
        apiPromise
            .then(function(response) {
                self.close();
                // Show a success message (add vs. edit based on method)
                if (options && options.method === 'update') {
                    Utils.onSuccess('edit', 'Inflow');
                } else {
                    Utils.onSuccess('add', 'Inflow');
                }
                // Optionally reload the data if a callback is provided
                if (options && typeof options.reloadCallback === 'function') {
                    options.reloadCallback();
                }
            })
            .catch(function(error) {
                console.error('Failed to submit inflow:', error);
                var errorMessage = error.message || 'Failed to submit inflow';
                alert(errorMessage);
            })
            .then(function() {
                submitButton.disabled = false;
            });
    }
    
    
    
};

window.Utils = Utils;
