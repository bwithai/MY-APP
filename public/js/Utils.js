// Global Utils object for compatibility with older browsers
var Utils = {
    cleanup: function (modalId) {
        var existingModal = document.getElementById(modalId);
        if (existingModal) {
            existingModal.remove();
        }
        window.onclick = null;
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
            .catch(console.error);
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

    onSuccess: function(action, type) {
        type = type || '';
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
        } else if (value < 1000000) {
            return (value / 1000).toFixed(2) + 'K'; // Thousands
        } else if (value < 1000000000) {
            return (value / 1000000).toFixed(2) + 'M'; // Millions
        } else if (value < 1000000000000) {
            return (value / 1000000000).toFixed(2) + 'B'; // Billions
        } else if (value < 1000000000000000) {
            return (value / 1000000000000).toFixed(2) + 'T'; // Trillions
        } else if (value < 1000000000000000000) {
            return (value / 1000000000000000).toFixed(2) + 'Q'; // Quadrillions
        } else {
            return (value / 1000000000000000000).toFixed(2) + 'Qi'; // Quintillions or more
        }
    }
};

// Make Utils globally available
window.Utils = Utils; 