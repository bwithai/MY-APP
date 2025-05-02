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
      Utils.cleanup('addInvestmentModal');
    },
  
    render: function() {
      
      var modalHtml =
        '<div class="modal" id="addInvestmentModal">' +
          '<div class="modal-content" style="max-width: 800px;">' +
            '<div class="modal-header">' +
              '<h2>Add Investment</h2>' +
              '<button type="button" class="close-btn">&times;</button>' +
            '</div>' +
            '<div class="modal-body">' +
              '<form id="addInvestmentForm" class="modal-form-grid">' +
                // Name field
                '<div class="form-group">' +
                  Utils.createLabel('name', 'Name', true) +
                  '<input type="text" id="name" name="name" required>' +
                '</div>' +
                // Amount field
                '<div class="form-group">' +
                  Utils.createLabel('amount', 'Amount', true) +
                  '<input type="number" id="amount" name="amount" step="0.01" min="0.01" required>' +
                '</div>' +
                // Type field
                '<div class="form-group">' +
                  Utils.createLabel('type', 'Type', false) +
                  '<select id="type" name="type" required>' +
                    '<option value="">Select Type</option>' +
                    '<option value="DLS">DLS</option>' +
                    '<option value="Fixed">Fixed</option>' +
                    '<option value="Disposed">Disposed</option>' +
                  '</select>' +
                '</div>' +
                // Payment Method field
                '<div class="form-group">' +
                  Utils.createLabel('payment_method', 'Payment Method', true) +
                  '<select id="payment_method" name="payment_method" required>' +
                    '<option value="">Select payment method</option>' +
                    '<option value="Bank Transfer">Bank Transfer</option>' +
                    '<option value="Cash Transfer">Cash Transfer</option>' +
                  '</select>' +
                '</div>' +
                // IBAN field (conditionally shown)
                '<div class="form-group" id="ibanContainer" style="display: none;">' +
                  Utils.createLabel('iban', 'IBAN', true) +
                  '<select id="iban" name="iban_id">' +
                    '<option value="">Select IBAN</option>' +
                  '</select>' +
                '</div>' +
                // Date field
                '<div class="form-group">' +
                  Utils.createLabel('date', 'Date of Entry', true) +
                  '<input type="text" id="date" name="date" required placeholder="YYYY-MM-DD" readonly>' +
                '</div>' +
                // Asset Details field (full width)
                '<div class="form-group full-width">' +
                  Utils.createLabel('asset_details', 'Asset Details', true) +
                  '<textarea id="asset_details" name="asset_details" required placeholder="Enter details..." rows="3"></textarea>' +
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
        Utils.setCurrentDate(dateInput);
      }
  
      // Don't load IBANs here - we'll load them only when Bank Transfer is selected
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
            Utils.loadIBANs();
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
        Utils.initDatePicker(dateInput);
      }

      // Apply word limit to fund_details textarea
      var fundDetailsTextarea = document.getElementById('asset_details');
      if (fundDetailsTextarea) {
        Utils.limitTextareaWords(fundDetailsTextarea, 800);
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
          Utils.onSuccess('add', 'Investment');
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
    }
  };
  
  window.AddInvestment = AddInvestment;
  