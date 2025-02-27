// ActionsMenu.js
var ActionsMenu = {
    init: function(type, value, options = {}) {
        this.type = type;
        this.value = value;
        this.options = {
            disabled: options.disabled || false,
            canDelete: options.delete !== false,
            isPaid: options.isPaid || false,
            isDelete: options.isDelete || false
        };
        
        return this.render();
    },

    render: function() {
        var menuId = `action-menu-${this.value.id}`;
        var menuHtml = `
            <div class="action-menu-container">
                ${!this.value.is_deleted ? `
                    <button class="btn btn-sm btn-icon" onclick="ActionsMenu.toggleMenu('${menuId}')" title="Actions">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                    <div id="${menuId}" class="action-menu-dropdown">
                        <div class="action-menu-item" onclick="ActionsMenu.handleEdit(${this.value.id})">
                            <i class="fas fa-edit"></i> Edit
                        </div>
                        ${this.options.canDelete ? `
                            <div class="action-menu-item" onclick="ActionsMenu.handleDelete(${this.value.id})">
                                <i class="fas fa-trash"></i> Delete
                            </div>
                        ` : ''}
                    </div>
                ` : ''}
            </div>
        `;

        return menuHtml;
    },

    toggleMenu: function(menuId) {
        // Close all other open menus first
        document.querySelectorAll('.action-menu-dropdown.show').forEach(menu => {
            if (menu.id !== menuId) menu.classList.remove('show');
        });
        
        // Toggle current menu
        var menu = document.getElementById(menuId);
        menu.classList.toggle('show');

        // Close menu when clicking outside
        document.addEventListener('click', function closeMenu(e) {
            if (!e.target.closest('.action-menu-container')) {
                menu.classList.remove('show');
                document.removeEventListener('click', closeMenu);
            }
        });
    },

    handleEdit: function(id) {
        // Pass the inflow ID and a callback function to handle after closing
        EditInflow.init('Inflow', id, function() {
            // Optional callback after closing
            InflowApp.loadInflowData(); // Refresh the inflow data after editing
        });
    },

    handleDelete: function(id) {
        DeleteAlert.init('Inflow', id, function() {
            // Optional callback after closing
            InflowApp.loadInflowData(); // Refresh the inflow data after deleting
        });
    }
};

window.ActionsMenu = ActionsMenu;