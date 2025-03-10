var AddInvestment = {
    init: function(onSuccess) {
      this.cleanup();
      this.onSuccess = onSuccess;
      this.render();
  
      var self = this;
      setTimeout(function() {
        self.setupEventListeners();
      }, 0);
    },
  
    cleanup: function() {
      if (typeof Utils !== 'undefined' && typeof Utils.cleanup === 'function') {
        Utils.cleanup('addInvestmentModal');
      } else {
        var existingModal = document.getElementById('addInvestmentModal');
        if (existingModal && existingModal.parentNode) {
          existingModal.parentNode.removeChild(existingModal);
        }
      }
    },
  
    render: function() {
      // Helper function to create labels (fallback if Utils is not available)
      var createLabel = function(forId, text, isRequired) {
          if (typeof Utils !== 'undefined' && typeof Utils.createLabel === 'function') {
              return Utils.createLabel(forId, text, isRequired);
          }
          var requiredAttr = isRequired ? ' data-required="*"' : '';
          return '<label for="' + forId + '"' + requiredAttr + '>' + text + '</label>';
      };
      
      var modalHtml =
        '<div class="modal" id="addInvestmentModal">' +
          '<div class="modal-content">' +
            '<div class="modal-header">' +
              '<h2>Add Investment</h2>' +
              '<button type="button" class="close-btn">&times;</button>' +
            '</div>' +
            '<div class="modal-body">' +
              '<form id="addInvestmentForm" class="modal-form-grid">' +
                // Name field
                '<div class="form-group">' +
                  createLabel('name', 'Name', true) +
                  '<input type="text" id="name" name="name" required>' +
                '</div>' +
                // Amount field
                '<div class="form-group">' +
                  createLabel('amount', 'Amount', true) +
                  '<input type="number" id="amount" name="amount" step="0.01" min="0.01" required>' +
                '</div>' +
                // Type field
                '<div class="form-group">' +
                  createLabel('type', 'Type', false) +
                  '<select id="type" name="type" required>' +
                    '<option value="">Select Type</option>' +
                    '<option value="DLS">DLS</option>' +
                    '<option value="Fixed">Fixed</option>' +
                    '<option value="Disposed">Disposed</option>' +
                  '</select>' +
                '</div>' +
                // Payment Method field
                '<div class="form-group">' +
                  createLabel('payment_method', 'Payment Method', true) +
                  '<select id="payment_method" name="payment_method" required>' +
                    '<option value="">Select payment method</option>' +
                    '<option value="Bank Transfer">Bank Transfer</option>' +
                    '<option value="Cash Transfer">Cash Transfer</option>' +
                  '</select>' +
                '</div>' +
                // IBAN field (conditionally shown)
                '<div class="form-group" id="ibanContainer" style="display: none;">' +
                  createLabel('iban', 'IBAN', true) +
                  '<select id="iban" name="iban_id">' +
                    '<option value="">Select IBAN</option>' +
                  '</select>' +
                '</div>' +
                // Date field
                '<div class="form-group">' +
                  createLabel('date', 'Date of Entry', true) +
                  '<input type="text" id="date" name="date" required placeholder="YYYY-MM-DD" readonly>' +
                '</div>' +
                // Asset Details field (full width)
                '<div class="form-group full-width">' +
                  createLabel('asset_details', 'Asset Details', true) +
                  '<textarea id="fund_details" name="fund_details" required placeholder="Enter details..." rows="3"></textarea>' +
                '</div>' +
              '</form>' +
            '</div>' +
            '<div class="modal-footer">' +
              '<button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>' +
              '<button type="submit" form="addInvestmentForm" class="btn btn-primary" id="submitInvestment">Save</button>' +
            '</div>' +
          '</div>' +
        '</div>';
  
      document.body.insertAdjacentHTML('beforeend', modalHtml);
  
      // Show the modal (with a slight delay for CSS transition)
      var modal = document.getElementById('addInvestmentModal');
      if (modal) {
        setTimeout(function() {
          modal.classList.add('show');
        }, 10);
      }
  
      // Set default date to today in YYYY-MM-DD format
      var dateInput = document.getElementById('date');
      if (dateInput) {
        var today = new Date();
        var year = today.getFullYear();
        var month = today.getMonth() + 1;
        if (month < 10) { month = '0' + month; }
        var day = today.getDate();
        if (day < 10) { day = '0' + day; }
        dateInput.value = year + '-' + month + '-' + day;
      }
  
      // Don't load IBANs here - we'll load them only when Bank Transfer is selected
    },
  
    loadIBANs: function() {
      // Use Utils.loadIBANs if available
      if (typeof Utils !== 'undefined' && typeof Utils.loadIBANs === 'function') {
        Utils.loadIBANs();
        return;
      }
      
      // Fallback implementation if Utils is not available
      var self = this;
      var userId = sessionStorage.getItem('selectedUserId');
      if (!userId || typeof ApiClient === 'undefined') {
        console.error('User ID not found or ApiClient not available');
        return;
      }
      
      ApiClient.getIBANs(userId)
        .then(function(response) {
          var ibanSelect = document.getElementById('iban');
          if (ibanSelect) {
            // Clear existing options except the first one
            ibanSelect.innerHTML = '<option value="">Select IBAN</option>';
            
            // Add new options
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
  
    setupEventListeners: function() {
      var self = this;
      var modal = document.getElementById('addInvestmentModal');
      if (!modal) {
        console.error('Modal not found');
        return;
      }
  
      var form = document.getElementById('addInvestmentForm');
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
      
      if (paymentMethodSelect) {
        // Use onchange instead of addEventListener for older browser compatibility
        paymentMethodSelect.onchange = function() {
          var ibanContainer = document.getElementById('ibanContainer');
          var ibanSelect = document.getElementById('iban');
          
          if (this.value === 'Bank Transfer') {
            if (ibanContainer) { 
              ibanContainer.style.display = 'block'; 
            }
            if (ibanSelect) { 
              ibanSelect.setAttribute('required', 'required'); 
            }
            
            // Load IBANs when Bank Transfer is selected
            if (typeof Utils !== 'undefined' && typeof Utils.loadIBANs === 'function') {
              Utils.loadIBANs();
            } else {
              self.loadIBANs();
            }
          } else {
            if (ibanContainer) { 
              ibanContainer.style.display = 'none'; 
            }
            if (ibanSelect) { 
              ibanSelect.removeAttribute('required'); 
            }
          }
        };
      }
      
      if (form) {
        // Use onsubmit instead of addEventListener for older browser compatibility
        form.onsubmit = function(e) {
          e.preventDefault();
          var formData = new FormData(form);
          self.handleSubmit(formData);
        };
      }
  
      // Initialize the restricted datepicker component on the date input, if available.
      var dateInput = document.getElementById('date');
      if (dateInput) {
        if (typeof RestrictedDatePicker === 'function') {
          RestrictedDatePicker(dateInput);
        } else {
          // Fallback: use the native date input if supported.
          dateInput.type = 'date';
          dateInput.readOnly = false;
        }
      }
    },
  
    close: function() {
      var modal = document.getElementById('addInvestmentModal');
      if (modal) {
        modal.classList.remove('show');
        setTimeout(function() {
          if (modal.parentNode) {
            modal.parentNode.removeChild(modal);
          }
        }, 300);
      }
    },
  
    handleSubmit: function(formData) {
      var self = this;
      var submitButton = document.querySelector('button[type="submit"]');
      if (submitButton && submitButton.disabled) {
        return;
      }
      if (submitButton) {
        submitButton.disabled = true;
      }
  
      // Build an object from formData.
      var data = {};
      var entries = formData.entries();
      var entry;
      while (!(entry = entries.next()).done) {
        data[entry.value[0]] = entry.value[1];
      }
  
      // Validate and format the amount.
      var amountStr = data.amount ? data.amount.toString() : '';
      var amount = Number(parseFloat(amountStr).toFixed(2));
      if (isNaN(amount) || amount <= 0) {
        alert('Amount must be greater than 0');
        if (submitButton) {
          submitButton.disabled = false;
        }
        return;
      }
  
      var formattedData = {
        name: data.name,
        amount: amount,
        type: data.type,
        payment_method: data.payment_method,
        asset_details: data.fund_details,
        date: data.date
      };
      if (data.payment_method === 'Bank Transfer' && data.iban_id) {
        formattedData.iban_id = parseInt(data.iban_id, 10);
      }
  
      console.log('Submitting formatted data:', formattedData);
  
      ApiClient.createInvestment(formattedData)
        .then(function(response) {
          self.close();
          self.showSuccessMessage('add', 'Investment');
          if (typeof self.onSuccess === 'function') {
            self.onSuccess();
          }
        })
        .catch(function(error) {
          console.error('Failed to create investment:', error);
          alert('Failed to create investment: ' + (error.message || 'Unknown error'));
        })
        .then(function() {
          if (submitButton) {
            submitButton.disabled = false;
          }
        });
    },
  
    showSuccessMessage: function(action, type) {
      var message = (action === 'add') ? type + ' added successfully!' : 'Error adding ' + type;
      var messageClass = (action === 'add') ? 'success-message' : 'error-message';
      
      var messageElement = document.createElement('div');
      messageElement.className = messageClass;
      messageElement.textContent = message;
      document.body.appendChild(messageElement);
      
      setTimeout(function() {
        if (messageElement.parentNode) {
          messageElement.parentNode.removeChild(messageElement);
        }
      }, 3000);
    }
  };
  
  window.AddInvestment = AddInvestment;
  