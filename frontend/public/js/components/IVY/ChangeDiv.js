var ChangeDiv = {
    init: function(container, div, onClose) {
        this.container = container;
        this.div = div;
        this.onClose = onClose;
        this.isAlertOpen = false;
        this.showModal = false;
        this.corps = [];
        this.selectedCorpId = null;
        this.isSubmitting = false;
        this.isDirty = false;

        // Initialize the component - only load corps data, don't setup event listeners yet
        this.loadCorps();
    },

    loadCorps: function() {
        // Call API to get corps data
        var self = this;
        ApiClient.readIvy()
            .then(function(response) {
                self.corps = response.data || [];
                self.render();
            })
            .catch(function(error) {
                console.error('Error loading corps:', error);
                Utils.showMessage('error', 'Failed to load corps data');
            });
    },

    render: function() {
        // Create warning alert if needed
        if (this.div && this.div.brigades && this.div.brigades.length > 0) {
            this.isAlertOpen = true;
            this.renderWarningAlert();
        } else {
            this.showModal = true;
            this.renderModal();
        }
    },

    renderWarningAlert: function() {
        var alertHtml = 
            '<div class="alert-dialog-overlay">' +
                '<div class="alert-dialog-content">' +
                    '<div class="alert-dialog-header">' +
                        '<h3>Change Division</h3>' +
                    '</div>' +
                    '<div class="alert-dialog-body">' +
                        'You are about to change the division. This will also affect its child elements.' +
                        'Are you sure you want to continue?' +
                    '</div>' +
                    '<div class="alert-dialog-footer">' +
                        '<button class="btn btn-secondary" id="cancelWarningBtn">Cancel</button>' +
                        '<button class="btn btn-danger" id="confirmWarningBtn">Proceed</button>' +
                    '</div>' +
                '</div>' +
            '</div>';

        this.container.innerHTML = alertHtml;
        this.setupAlertEventListeners();
    },

    renderModal: function() {
        var self = this;
        var corpsOptions = '';
        
        for (var i = 0; i < this.corps.length; i++) {
            var corp = this.corps[i];
            corpsOptions += '<option value="' + corp.id + '">' + corp.name + '</option>';
        }
        
        var modalHtml = 
            '<div class="modal-overlay">' +
                '<div class="modal-content">' +
                    '<div class="modal-header">' +
                        '<h3>Change Division</h3>' +
                        '<button class="modal-close-btn">&times;</button>' +
                    '</div>' +
                    '<div class="modal-body">' +
                        '<div class="form-group">' +
                            '<label for="corp_id">Select Corps</label>' +
                            '<select id="corp_id" class="form-control" required>' +
                                '<option value="">Select a Corps</option>' +
                                corpsOptions +
                            '</select>' +
                            '<div class="error-message" id="corpError"></div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="modal-footer">' +
                        '<button class="btn btn-primary" id="saveBtn" disabled>Save</button>' +
                        '<button class="btn btn-secondary" id="cancelBtn">Cancel</button>' +
                    '</div>' +
                '</div>' +
            '</div>';

        this.container.innerHTML = modalHtml;
        this.setupModalEventListeners();
    },

    setupAlertEventListeners: function() {
        var self = this;
        var cancelBtn = this.container.querySelector('#cancelWarningBtn');
        var confirmBtn = this.container.querySelector('#confirmWarningBtn');

        // Add null checks for each element to avoid errors
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function() { 
                self.closeWarning(); 
            });
        }
        
        if (confirmBtn) {
            confirmBtn.addEventListener('click', function() { 
                self.confirmWarning(); 
            });
        }
    },

    setupModalEventListeners: function() {
        // Make sure to get all the references to UI elements after they've been rendered
        var self = this;
        var closeBtn = this.container.querySelector('.modal-close-btn');
        var cancelBtn = this.container.querySelector('#cancelBtn');
        var saveBtn = this.container.querySelector('#saveBtn');
        var corpSelect = this.container.querySelector('#corp_id');

        // Add null checks for each element to avoid errors
        if (closeBtn) {
            closeBtn.addEventListener('click', function() { 
                self.onCancel(); 
            });
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function() { 
                self.onCancel(); 
            });
        }
        
        if (saveBtn) {
            saveBtn.addEventListener('click', function() { 
                self.handleSubmit(); 
            });
        }
        
        if (corpSelect) {
            corpSelect.addEventListener('change', function(e) {
                self.selectedCorpId = e.target.value;
                self.isDirty = true;
                self.updateSaveButton();
            });
        }
    },

    updateSaveButton: function() {
        var saveBtn = this.container.querySelector('#saveBtn');
        saveBtn.disabled = !this.isDirty || this.isSubmitting;
    },

    closeWarning: function() {
        this.isAlertOpen = false;
        this.showModal = false;
        this.onClose();
    },

    confirmWarning: function() {
        this.isAlertOpen = false;
        this.showModal = true;
        this.renderModal();
    },

    onCancel: function() {
        this.selectedCorpId = null;
        this.isDirty = false;
        this.showModal = false;
        this.onClose();
    },

    handleSubmit: function() {
        if (!this.selectedCorpId) {
            var errorElement = this.container.querySelector('#corpError');
            errorElement.textContent = 'Corps selection is required';
            return;
        }

        this.isSubmitting = true;
        this.updateSaveButton();

        // Call API to update division
        var self = this;
        ApiClient.updateDive({
            id: this.div.id,
            corp_id: this.selectedCorpId
        })
            .then(function() {
                Utils.onSuccess('edit', 'Division');
                self.showModal = false;
                self.onClose();
            })
            .catch(function(error) {
                console.error('Error updating division:', error);
                Utils.onSuccess('error', (error.message || 'Unknown error to update division'));
            })
            .finally(function() {
                self.isSubmitting = false;
                self.updateSaveButton();
            });
    }
};

// Make ChangeDiv globally available
window.ChangeDiv = ChangeDiv;
