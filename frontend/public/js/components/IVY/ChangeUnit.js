var ChangeUnit = {
    init: function(container, unit, onClose) {
        this.container = container;
        this.unit = unit;
        this.onClose = onClose;
        this.corps = [];
        this.selectedCorpId = null;
        this.selectedDivId = null;
        this.selectedBrigadeId = null;
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
                        '<h3>Change Unit</h3>' +
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
                        '<div class="form-group" id="divSelectContainer" style="display: none;">' +
                            '<label for="div_id">Select Division</label>' +
                            '<select id="div_id" class="form-control" required>' +
                                '<option value="">Select a Division</option>' +
                            '</select>' +
                            '<div class="error-message" id="divError"></div>' +
                        '</div>' +
                        '<div class="form-group" id="brigadeSelectContainer" style="display: none;">' +
                            '<label for="brigade_id">Select Brigade</label>' +
                            '<select id="brigade_id" class="form-control" required>' +
                                '<option value="">Select a Brigade</option>' +
                            '</select>' +
                            '<div class="error-message" id="brigadeError"></div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="modal-footer">' +
                        '<button class="btn btn-primary" id="saveBtn" disabled>Save</button>' +
                        '<button class="btn btn-secondary" id="cancelBtn">Cancel</button>' +
                    '</div>' +
                '</div>' +
            '</div>';

        this.container.innerHTML = modalHtml;
        this.setupEventListeners();
    },

    setupEventListeners: function() {
        var self = this;
        var closeBtn = this.container.querySelector('.modal-close-btn');
        var cancelBtn = this.container.querySelector('#cancelBtn');
        var saveBtn = this.container.querySelector('#saveBtn');
        var corpSelect = this.container.querySelector('#corp_id');
        var divSelect = this.container.querySelector('#div_id');
        var brigadeSelect = this.container.querySelector('#brigade_id');

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
                self.selectedDivId = null;
                self.selectedBrigadeId = null;
                self.updateDivisions();
                self.hideBrigadeSelect();
                self.isDirty = true;
                self.updateSaveButton();
            });
        }

        if (divSelect) {
            divSelect.addEventListener('change', function(e) {
                self.selectedDivId = e.target.value;
                self.selectedBrigadeId = null;
                self.updateBrigades();
                self.isDirty = true;
                self.updateSaveButton();
            });
        }

        if (brigadeSelect) {
            brigadeSelect.addEventListener('change', function(e) {
                self.selectedBrigadeId = e.target.value;
                self.isDirty = true;
                self.updateSaveButton();
            });
        }
    },

    updateDivisions: function() {
        var divSelect = this.container.querySelector('#div_id');
        var divSelectContainer = this.container.querySelector('#divSelectContainer');
        var selectedCorp = null;
        
        // Find the selected corp using loop instead of find()
        for (var i = 0; i < this.corps.length; i++) {
            if (this.corps[i].id === Number(this.selectedCorpId)) {
                selectedCorp = this.corps[i];
                break;
            }
        }

        if (selectedCorp && selectedCorp.divs) {
            var divOptionsHtml = '<option value="">Select a Division</option>';
            
            for (var j = 0; j < selectedCorp.divs.length; j++) {
                var div = selectedCorp.divs[j];
                divOptionsHtml += '<option value="' + div.id + '">' + div.name + '</option>';
            }
            
            divSelect.innerHTML = divOptionsHtml;
            divSelectContainer.style.display = 'block';
        } else {
            divSelectContainer.style.display = 'none';
            this.hideBrigadeSelect();
        }
    },

    updateBrigades: function() {
        var brigadeSelect = this.container.querySelector('#brigade_id');
        var brigadeSelectContainer = this.container.querySelector('#brigadeSelectContainer');
        var selectedCorp = null;
        var selectedDiv = null;
        
        // Find the selected corp
        for (var i = 0; i < this.corps.length; i++) {
            if (this.corps[i].id === Number(this.selectedCorpId)) {
                selectedCorp = this.corps[i];
                break;
            }
        }
        
        // Find the selected division within the corp
        if (selectedCorp && selectedCorp.divs) {
            for (var j = 0; j < selectedCorp.divs.length; j++) {
                if (selectedCorp.divs[j].id === Number(this.selectedDivId)) {
                    selectedDiv = selectedCorp.divs[j];
                    break;
                }
            }
        }

        if (selectedDiv && selectedDiv.brigades) {
            var brigadeOptionsHtml = '<option value="">Select a Brigade</option>';
            
            for (var k = 0; k < selectedDiv.brigades.length; k++) {
                var brigade = selectedDiv.brigades[k];
                brigadeOptionsHtml += '<option value="' + brigade.id + '">' + brigade.name + '</option>';
            }
            
            brigadeSelect.innerHTML = brigadeOptionsHtml;
            brigadeSelectContainer.style.display = 'block';
        } else {
            this.hideBrigadeSelect();
        }
    },

    hideBrigadeSelect: function() {
        var brigadeSelectContainer = this.container.querySelector('#brigadeSelectContainer');
        var brigadeSelect = this.container.querySelector('#brigade_id');
        brigadeSelectContainer.style.display = 'none';
        brigadeSelect.value = '';
        this.selectedBrigadeId = null;
    },

    updateSaveButton: function() {
        var saveBtn = this.container.querySelector('#saveBtn');
        saveBtn.disabled = !this.isDirty || this.isSubmitting || 
                          !this.selectedCorpId || !this.selectedDivId || !this.selectedBrigadeId;
    },

    onCancel: function() {
        this.selectedCorpId = null;
        this.selectedDivId = null;
        this.selectedBrigadeId = null;
        this.isDirty = false;
        this.onClose();
    },

    handleSubmit: function() {
        if (!this.selectedCorpId) {
            var errorElement = this.container.querySelector('#corpError');
            errorElement.textContent = 'Corps selection is required';
            return;
        }

        if (!this.selectedDivId) {
            var errorElement = this.container.querySelector('#divError');
            errorElement.textContent = 'Division selection is required';
            return;
        }

        if (!this.selectedBrigadeId) {
            var errorElement = this.container.querySelector('#brigadeError');
            errorElement.textContent = 'Brigade selection is required';
            return;
        }

        this.isSubmitting = true;
        this.updateSaveButton();

        // Call API to update unit
        var self = this;
        ApiClient.updateUnit({
            id: this.unit.id,
            corp_id: this.selectedCorpId,
            div_id: this.selectedDivId,
            brigade_id: this.selectedBrigadeId
        })
            .then(function() {
                Utils.onSuccess('edit', 'Unit');
                self.onClose();
            })
            .catch(function(error) {
                console.error('Error updating unit:', error);
                Utils.onSuccess('error', (error.message || 'Unknown error to update unit'));
            })
            .finally(function() {
                self.isSubmitting = false;
                self.updateSaveButton();
            });
    }
};

// Make ChangeUnit globally available
window.ChangeUnit = ChangeUnit;
