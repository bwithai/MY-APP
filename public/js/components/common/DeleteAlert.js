var DeleteAlert = {
    init: function(type, id, onClose) {
        this.type = type;
        this.id = id;
        this.onClose = onClose;
        this.render();
        this.setupEventListeners();
    },

    render: function() {
        // Remove any existing alert
        this.cleanup();

        var alertHtml = `
            <div class="modal delete-alert" id="deleteAlertModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Delete ${this.type}</h2>
                        <button type="button" class="close-btn">&times;</button>
                    </div>
                    <div class="modal-body">
                        ${this.getAlertMessage()}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-danger" id="confirmDelete">Delete</button>
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', alertHtml);
    },

    getAlertMessage: function() {
        let message = '';
        
        if (this.type === "User") {
            message = `<p>All items associated with this user will also be <strong>permanently deleted.</strong></p>`;
        } else if (this.type === "Head") {
            message = `<p>All SubHeads associated with this Head will also be <strong>permanently deleted.</strong></p>`;
        } else if (["Corp", "Division", "Brigade"].includes(this.type)) {
            message = `
                <p><strong style="color: red">Cascade Deletion Behavior!</strong></p>
                <p>The deletion will only impact the hierarchy with the specified ${this.type}, 
                and it will be <strong>permanently deleted.</strong></p>
            `;
        }

        return `
            ${message}
            <p>Are you sure? You will not be able to undo this action.</p>
        `;
    },

    setupEventListeners: function() {
        var self = this;
        var modal = document.getElementById('deleteAlertModal');
        var closeBtn = modal.querySelector('.close-btn');
        var cancelBtn = modal.querySelector('[data-dismiss="modal"]');
        var confirmBtn = modal.querySelector('#confirmDelete');

        closeBtn.onclick = function() {
            self.close();
        };

        cancelBtn.onclick = function() {
            self.close();
        };

        confirmBtn.onclick = function() {
            self.handleDelete();
        };
    },

    handleDelete: function() {
        var self = this;
        var confirmBtn = document.getElementById('confirmDelete');
        confirmBtn.disabled = true;

        // Call appropriate delete endpoint based on type
        var deletePromise;
        switch (this.type) {
            case 'Inflow':
                deletePromise = ApiClient.deleteInflow(this.id);
                break;
            // Add other cases as needed
            default:
                console.error('Unexpected type:', this.type);
                return;
        }

        deletePromise
            .then(function() {
                self.close();
                // Refresh the data
                InflowApp.loadInflowData();
                // Show success message
                alert(`The ${self.type.toLowerCase()} was deleted successfully.`);
            })
            .catch(function(error) {
                console.error('Delete failed:', error);
                alert(error.message || `Failed to delete ${self.type.toLowerCase()}`);
            })
            .finally(function() {
                confirmBtn.disabled = false;
            });
    },

    cleanup: function() {
        var existingModal = document.getElementById('deleteAlertModal');
        if (existingModal) {
            existingModal.remove();
        }
    },

    close: function() {
        this.cleanup();
        if (this.onClose) this.onClose();
    }
};

window.DeleteAlert = DeleteAlert;