const ChangeUnit = {
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

        // Initialize the component
        this.loadCorps();
        this.setupEventListeners();
    },

    loadCorps: function() {
        // Call API to get corps data
        ApiClient.readIvy()
            .then(response => {
                this.corps = response.data || [];
                this.render();
            })
            .catch(error => {
                console.error('Error loading corps:', error);
                Utils.showMessage('error', 'Failed to load corps data');
            });
    },

    render: function() {
        const modalHtml = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Change Unit</h3>
                        <button class="modal-close-btn">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label for="corp_id">Select Corps</label>
                            <select id="corp_id" class="form-control" required>
                                <option value="">Select a Corps</option>
                                ${this.corps.map(corp => `
                                    <option value="${corp.id}">${corp.name}</option>
                                `).join('')}
                            </select>
                            <div class="error-message" id="corpError"></div>
                        </div>
                        <div class="form-group" id="divSelectContainer" style="display: none;">
                            <label for="div_id">Select Division</label>
                            <select id="div_id" class="form-control" required>
                                <option value="">Select a Division</option>
                            </select>
                            <div class="error-message" id="divError"></div>
                        </div>
                        <div class="form-group" id="brigadeSelectContainer" style="display: none;">
                            <label for="brigade_id">Select Brigade</label>
                            <select id="brigade_id" class="form-control" required>
                                <option value="">Select a Brigade</option>
                            </select>
                            <div class="error-message" id="brigadeError"></div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-primary" id="saveBtn" disabled>Save</button>
                        <button class="btn btn-secondary" id="cancelBtn">Cancel</button>
                    </div>
                </div>
            </div>
        `;

        this.container.innerHTML = modalHtml;
        this.setupEventListeners();
    },

    setupEventListeners: function() {
        const closeBtn = this.container.querySelector('.modal-close-btn');
        const cancelBtn = this.container.querySelector('#cancelBtn');
        const saveBtn = this.container.querySelector('#saveBtn');
        const corpSelect = this.container.querySelector('#corp_id');
        const divSelect = this.container.querySelector('#div_id');
        const brigadeSelect = this.container.querySelector('#brigade_id');

        closeBtn.addEventListener('click', () => this.onCancel());
        cancelBtn.addEventListener('click', () => this.onCancel());
        saveBtn.addEventListener('click', () => this.handleSubmit());
        
        corpSelect.addEventListener('change', (e) => {
            this.selectedCorpId = e.target.value;
            this.selectedDivId = null;
            this.selectedBrigadeId = null;
            this.updateDivisions();
            this.hideBrigadeSelect();
            this.isDirty = true;
            this.updateSaveButton();
        });

        divSelect.addEventListener('change', (e) => {
            this.selectedDivId = e.target.value;
            this.selectedBrigadeId = null;
            this.updateBrigades();
            this.isDirty = true;
            this.updateSaveButton();
        });

        brigadeSelect.addEventListener('change', (e) => {
            this.selectedBrigadeId = e.target.value;
            this.isDirty = true;
            this.updateSaveButton();
        });
    },

    updateDivisions: function() {
        const divSelect = this.container.querySelector('#div_id');
        const divSelectContainer = this.container.querySelector('#divSelectContainer');
        const selectedCorp = this.corps.find(corp => corp.id === Number(this.selectedCorpId));

        if (selectedCorp && selectedCorp.divs) {
            divSelect.innerHTML = `
                <option value="">Select a Division</option>
                ${selectedCorp.divs.map(div => `
                    <option value="${div.id}">${div.name}</option>
                `).join('')}
            `;
            divSelectContainer.style.display = 'block';
        } else {
            divSelectContainer.style.display = 'none';
            this.hideBrigadeSelect();
        }
    },

    updateBrigades: function() {
        const brigadeSelect = this.container.querySelector('#brigade_id');
        const brigadeSelectContainer = this.container.querySelector('#brigadeSelectContainer');
        const selectedCorp = this.corps.find(corp => corp.id === Number(this.selectedCorpId));
        const selectedDiv = selectedCorp?.divs.find(div => div.id === Number(this.selectedDivId));

        if (selectedDiv && selectedDiv.brigades) {
            brigadeSelect.innerHTML = `
                <option value="">Select a Brigade</option>
                ${selectedDiv.brigades.map(brigade => `
                    <option value="${brigade.id}">${brigade.name}</option>
                `).join('')}
            `;
            brigadeSelectContainer.style.display = 'block';
        } else {
            this.hideBrigadeSelect();
        }
    },

    hideBrigadeSelect: function() {
        const brigadeSelectContainer = this.container.querySelector('#brigadeSelectContainer');
        const brigadeSelect = this.container.querySelector('#brigade_id');
        brigadeSelectContainer.style.display = 'none';
        brigadeSelect.value = '';
        this.selectedBrigadeId = null;
    },

    updateSaveButton: function() {
        const saveBtn = this.container.querySelector('#saveBtn');
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
            const errorElement = this.container.querySelector('#corpError');
            errorElement.textContent = 'Corps selection is required';
            return;
        }

        if (!this.selectedDivId) {
            const errorElement = this.container.querySelector('#divError');
            errorElement.textContent = 'Division selection is required';
            return;
        }

        if (!this.selectedBrigadeId) {
            const errorElement = this.container.querySelector('#brigadeError');
            errorElement.textContent = 'Brigade selection is required';
            return;
        }

        this.isSubmitting = true;
        this.updateSaveButton();

        // Call API to update unit
        ApiClient.updateUnit({
            id: this.unit.id,
            corp_id: this.selectedCorpId,
            div_id: this.selectedDivId,
            brigade_id: this.selectedBrigadeId
        })
            .then(() => {
                Utils.showMessage('success', 'Unit updated successfully');
                this.onClose();
            })
            .catch(error => {
                console.error('Error updating unit:', error);
                Utils.showMessage('error', 'Failed to update unit');
            })
            .finally(() => {
                this.isSubmitting = false;
                this.updateSaveButton();
            });
    }
};

// Make ChangeUnit globally available
window.ChangeUnit = ChangeUnit;
