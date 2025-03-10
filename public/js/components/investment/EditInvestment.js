var EditInvestment = {
    init: function(type, id, onClose) {
      this.type = type;
      this.investmentId = id;
      this.onClose = onClose;
      this.investment = null;
  
      // Clear any existing modal first
      this.cleanup();
  
      // Load investment data and render the modal
      this.loadInvestmentData();
    },
  
    cleanup: function() {
      if (typeof Utils !== 'undefined' && typeof Utils.cleanup === 'function') {
        Utils.cleanup('editInvestmentModal');
      } else {
        var existingModal = document.getElementById('editInvestmentModal');
        if (existingModal) {
          existingModal.parentNode.removeChild(existingModal);
        }
      }
    },
  
    loadInvestmentData: function() {
      var self = this;
      if (typeof ApiClient === 'undefined') {
        console.error('ApiClient not found');
        return;
      }
      ApiClient.getInvestment(this.investmentId)
        .then(function(investment) {
          self.investment = investment;
          self.render();
          self.setupEventListeners();
          self.loadIBANs();
        })
        .catch(function(error) {
          console.error('Failed to load investment:', error);
          alert('Failed to load investment: ' + (error.message || 'Unknown error'));
        });
    },
  
    render: function() {
      if (!this.investment) {
        console.error('No investment data to render');
        return;
      }
      
      // Helper function to create labels (fallback if Utils is not available)
      var createLabel = function(forId, text, isRequired) {
          if (typeof Utils !== 'undefined' && typeof Utils.createLabel === 'function') {
              return Utils.createLabel(forId, text, isRequired);
          }
          var requiredAttr = isRequired ? ' data-required="*"' : '';
          return '<label for="' + forId + '"' + requiredAttr + '>' + text + '</label>';
      };
      
      var modalHtml = '<div class="modal" id="editInvestmentModal">' +
        '<div class="modal-content">' +
          '<div class="modal-header">' +
            '<h2>Edit Investment</h2>' +
            '<button type="button" class="close-btn">&times;</button>' +
          '</div>' +
          '<div class="modal-body">' +
            '<form id="editInvestmentForm" class="modal-form-grid">' +
              // Name field
              '<div class="form-group">' +
                createLabel('name', 'Name', true) +
                '<input type="text" id="name" name="name" value="' + (this.investment.name || '') + '" required>' +
              '</div>' +
              // Amount field
              '<div class="form-group">' +
                createLabel('amount', 'Amount', true) +
                '<input type="number" id="amount" name="amount" step="0.01" min="0.01" value="' + (this.investment.amount || 0) + '" required>' +
              '</div>' +
              // Type field
              '<div class="form-group">' +
                createLabel('type', 'Type', false) +
                '<select id="type" name="type" required>' +
                  '<option value="">Select Type</option>' +
                  '<option value="DLS"' + (this.investment.type === 'DLS' ? ' selected' : '') + '>DLS</option>' +
                  '<option value="Fixed"' + (this.investment.type === 'Fixed' ? ' selected' : '') + '>Fixed</option>' +
                  '<option value="Disposed"' + (this.investment.type === 'Disposed' ? ' selected' : '') + '>Disposed</option>' +
                '</select>' +
              '</div>' +
              // Payment Method field
              '<div class="form-group">' +
                createLabel('payment_method', 'Payment Method', true) +
                '<select id="payment_method" name="payment_method" required>' +
                  '<option value="">Select payment method</option>' +
                  '<option value="Bank Transfer"' + (this.investment.payment_method === 'Bank Transfer' ? ' selected' : '') + '>Bank Transfer</option>' +
                  '<option value="Cash Transfer"' + (this.investment.payment_method === 'Cash Transfer' ? ' selected' : '') + '>Cash Transfer</option>' +
                '</select>' +
              '</div>' +
              // IBAN field (conditionally shown)
              '<div class="form-group" id="ibanContainer" style="display: ' + (this.investment.payment_method === 'Bank Transfer' ? 'block' : 'none') + ';">' +
                createLabel('iban', 'IBAN', true) +
                '<select id="iban" name="iban_id"' + (this.investment.payment_method === 'Bank Transfer' ? ' required' : '') + '>' +
                  '<option value="">Select IBAN</option>' +
                '</select>' +
              '</div>' +
              // Date field
              '<div class="form-group">' +
                createLabel('date', 'Date of Entry', true) +
                '<input type="text" id="date" name="date" value="' + (Utils.formatDateForInput(this.investment.date) || '') + '" required placeholder="YYYY-MM-DD" readonly>' +
              '</div>' +
              // Asset Details field (full width)
              '<div class="form-group full-width">' +
                createLabel('asset_details', 'Asset Details', true) +
                '<textarea id="fund_details" name="fund_details" required placeholder="Enter details..." rows="3">' + (this.investment.asset_details || '') + '</textarea>' +
              '</div>' +
            '</form>' +
          '</div>' +
          '<div class="modal-footer">' +
            '<button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>' +
            '<button type="submit" form="editInvestmentForm" class="btn btn-primary">Update</button>' +
          '</div>' +
        '</div>' +
      '</div>';
      
      document.body.insertAdjacentHTML('beforeend', modalHtml);
      
      var modal = document.getElementById('editInvestmentModal');
      if (modal) {
        setTimeout(function() {
          modal.classList.add('show');
        }, 10);
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
  
    loadIBANs: function() {
      // Use the Utils.loadIBANs function if available
      if (typeof Utils !== 'undefined' && typeof Utils.loadIBANs === 'function') {
        Utils.loadIBANs();
        return;
      }
      
      // Fallback implementation if Utils is not available
      var self = this;
      var userId = sessionStorage.getItem('selectedUserId');
      
      if (!userId) {
        console.error('No user ID found in session storage');
        return;
      }
      
      ApiClient.getIBANs(userId)
        .then(function(response) {
          if (response && response.data) {
            var ibanSelect = document.getElementById('iban');
            if (ibanSelect) {
              // Remove existing options except the first one
              while (ibanSelect.options.length > 1) {
                ibanSelect.remove(1);
              }
              
              response.data.forEach(function(iban) {
                var option = document.createElement('option');
                option.value = iban.id;
                option.textContent = iban.iban;
                if (self.investment && self.investment.iban_id && self.investment.iban_id === iban.id) {
                  option.selected = true;
                }
                ibanSelect.appendChild(option);
              });
            }
          }
        })
        .catch(function(error) {
          console.error('Failed to load IBANs:', error);
        });
    },
  
    setupEventListeners: function() {
      var self = this;
      var modal = document.getElementById('editInvestmentModal');
      var form = document.getElementById('editInvestmentForm');
      var paymentMethodSelect = document.getElementById('payment_method');
      var closeBtn = modal.querySelector('.close-btn');
      var cancelBtn = modal.querySelector('[data-dismiss="modal"]');
  
      if (closeBtn) {
        closeBtn.onclick = function() {
          self.close();
        };
      }
  
      if (cancelBtn) {
        cancelBtn.onclick = function() {
          self.close();
        };
      }
  
      if (paymentMethodSelect) {
        paymentMethodSelect.addEventListener('change', function() {
          var ibanContainer = document.getElementById('ibanContainer');
          var ibanSelect = document.getElementById('iban');
          
          if (ibanContainer && ibanSelect) {
            if (this.value === 'Bank Transfer') {
              ibanContainer.style.display = 'block';
              ibanSelect.setAttribute('required', 'required');
              self.loadIBANs();
            } else {
              ibanContainer.style.display = 'none';
              ibanSelect.removeAttribute('required');
            }
          }
        });
      }
  
      if (form) {
        form.addEventListener('submit', function(e) {
          e.preventDefault();
          var formData = new FormData(form);
          self.handleSubmit(formData);
        });
      }
    },
  
    close: function() {
      var modal = document.getElementById('editInvestmentModal');
      if (modal) {
        modal.classList.remove('show');
        
        // Remove modal after animation
        setTimeout(function() {
          modal.remove();
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

      var data = {};
      var entries = formData.entries();
      var entry;
      while (!(entry = entries.next()).done) {
        data[entry.value[0]] = entry.value[1];
      }

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
      ApiClient.updateInvestment(this.investmentId, formattedData)
        .then(function(response) {
          self.close();
          self.showSuccessMessage('edit', 'Investment');
          if (self.onClose && typeof self.onClose === 'function') {
            self.onClose();
          }
        })
        .catch(function(error) {
          console.error('Failed to update investment:', error);
          alert('Failed to update investment: ' + (error.message || 'Unknown error'));
        })
        .then(function() {
          if (submitButton) {
            submitButton.disabled = false;
          }
        });
    },
  
    showSuccessMessage: function(action, type) {
      // Use Utils.onSuccess if available
      if (typeof Utils !== 'undefined' && typeof Utils.onSuccess === 'function') {
        Utils.onSuccess(action, type);
        return;
      }
      
      // Fallback implementation if Utils is not available
      var message = action === 'edit' ? type + ' updated successfully!' : 'Error updating ' + type;
      var messageClass = action === 'edit' ? 'success-message' : 'error-message';
      
      var messageElement = document.createElement('div');
      messageElement.className = messageClass;
      messageElement.textContent = message;
      
      document.body.appendChild(messageElement);
      
      // Remove message after 3 seconds
      setTimeout(function() {
        messageElement.remove();
      }, 3000);
    }
  };
  
  window.EditInvestment = EditInvestment;
  