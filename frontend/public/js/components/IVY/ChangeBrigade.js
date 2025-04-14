const ChangeBrigade = {
    init: function(container, brig, onClose) {
        this.container = container;
        this.brig = brig;
        this.onClose = onClose;
        this.isAlertOpen = false;
        this.showModal = false;
        this.corps = [];
        this.selectedCorpId = null;
        this.selectedDivId = null;
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
        // Create warning alert if needed
        if (this.brig?.units?.length > 0) {
            this.isAlertOpen = true;
            this.renderWarningAlert();
        } else {
            this.showModal = true;
            this.renderModal();
        }
    },

    renderWarningAlert: function() {
        const alertHtml = `
            <div class="alert-dialog-overlay">
                <div class="alert-dialog-content">
                    <div class="alert-dialog-header">
                        <h3>Change Brigade</h3>
                    </div>
                    <div class="alert-dialog-body">
                        You are about to change the brigade. This will also affect its child elements.
                        Are you sure you want to continue?
                    </div>
                    <div class="alert-dialog-footer">
                        <button class="btn btn-secondary" id="cancelWarningBtn">Cancel</button>
                        <button class="btn btn-danger" id="confirmWarningBtn">Proceed</button>
                    </div>
                </div>
            </div>
        `;

        this.container.innerHTML = alertHtml;
        this.setupAlertEventListeners();
    },

    renderModal: function() {
        const modalHtml = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Change Brigade</h3>
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
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-primary" id="saveBtn" disabled>Save</button>
                        <button class="btn btn-secondary" id="cancelBtn">Cancel</button>
                    </div>
                </div>
            </div>
        `;

        this.container.innerHTML = modalHtml;
        this.setupModalEventListeners();
    },

    setupAlertEventListeners: function() {
        const cancelBtn = this.container.querySelector('#cancelWarningBtn');
        const confirmBtn = this.container.querySelector('#confirmWarningBtn');

        cancelBtn.addEventListener('click', () => this.closeWarning());
        confirmBtn.addEventListener('click', () => this.confirmWarning());
    },

    setupModalEventListeners: function() {
        const closeBtn = this.container.querySelector('.modal-close-btn');
        const cancelBtn = this.container.querySelector('#cancelBtn');
        const saveBtn = this.container.querySelector('#saveBtn');
        const corpSelect = this.container.querySelector('#corp_id');
        const divSelect = this.container.querySelector('#div_id');
        const divSelectContainer = this.container.querySelector('#divSelectContainer');

        closeBtn.addEventListener('click', () => this.onCancel());
        cancelBtn.addEventListener('click', () => this.onCancel());
        saveBtn.addEventListener('click', () => this.handleSubmit());
        
        corpSelect.addEventListener('change', (e) => {
            this.selectedCorpId = e.target.value;
            this.selectedDivId = null;
            this.updateDivisions();
            this.isDirty = true;
            this.updateSaveButton();
        });

        divSelect.addEventListener('change', (e) => {
            this.selectedDivId = e.target.value;
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
        }
    },

    updateSaveButton: function() {
        const saveBtn = this.container.querySelector('#saveBtn');
        saveBtn.disabled = !this.isDirty || this.isSubmitting || !this.selectedCorpId || !this.selectedDivId;
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
        this.selectedDivId = null;
        this.isDirty = false;
        this.showModal = false;
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

        this.isSubmitting = true;
        this.updateSaveButton();

        // Call API to update brigade
        ApiClient.updateBrig({
            id: this.brig.id,
            corp_id: this.selectedCorpId,
            div_id: this.selectedDivId
        })
            .then(() => {
                Utils.showMessage('success', 'Brigade updated successfully');
                this.showModal = false;
                this.onClose();
            })
            .catch(error => {
                console.error('Error updating brigade:', error);
                Utils.showMessage('error', 'Failed to update brigade');
            })
            .finally(() => {
                this.isSubmitting = false;
                this.updateSaveButton();
            });
    }
};

// Make ChangeBrigade globally available
window.ChangeBrigade = ChangeBrigade;
