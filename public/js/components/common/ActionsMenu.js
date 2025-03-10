var ActionsMenu = {
    init: function(type, value, options) {
        this.type = type;
        this.value = value;
        this.options = {
            disabled: options && options.disabled || false,
            canDelete: options && options.delete !== false,
            isPaid: options && options.isPaid || false,
            isDelete: options && options.isDelete || false
        };
        
        return this.render();
    },

    render: function() {
        var menuId = "action-menu-" + this.value.id;
        var menuHtml = "<div class='action-menu-container'>" +
            (!this.value.is_deleted ? "<button class='btn btn-sm btn-icon' onclick=\"ActionsMenu.toggleMenu('" + menuId + "', event)\" title='Actions'>" +
            "<i class='fas fa-ellipsis-v'></i></button>" +
            "<div id='" + menuId + "' class='action-menu-dropdown'>" +
            "<div class='action-menu-item' onclick=\"ActionsMenu.handleEdit(" + this.value.id + ")\">" +
            "<i class='fas fa-edit' style='color: darkgreen;'></i> Edit " + this.type + "</div>" +
            (this.options.canDelete ? "<div class='action-menu-item' onclick=\"ActionsMenu.handleDelete(" + this.value.id + ")\">" +
            "<i class='fas fa-trash' style='color: red;'></i> Delete " + this.type + "</div>" : "") + "</div>" : "") + "</div>";
        return menuHtml;
    },

    toggleMenu: function(menuId, event) {
        // Close all other open menus first
        var openMenus = document.querySelectorAll('.action-menu-dropdown.show');
        for (var i = 0; i < openMenus.length; i++) {
            if (openMenus[i].id !== menuId) {
                openMenus[i].classList.remove('show');
            }
        }

        // Toggle current menu
        var menu = document.getElementById(menuId);
        if (!menu) return;

        // Get the action button that triggered the event
        var button = event.currentTarget;
        var rect = button.getBoundingClientRect();

        // Append the menu to document.body if it isn't already there
        if (menu.parentElement !== document.body) {
            document.body.appendChild(menu);
        }

        // Ensure menu is visible before measuring size
        menu.style.display = 'block';
        var menuWidth = menu.offsetWidth;
        menu.style.display = '';

        var top = rect.bottom + window.scrollY;
        var left = rect.right - menuWidth + window.scrollX;

        // Apply position styles
        menu.style.position = 'absolute';
        menu.style.top = top + 'px';
        menu.style.left = left + 'px';
        menu.style.width = '200px';
        menu.style.zIndex = '10000';
        menu.classList.toggle('show');

            // Close menu when clicking outside
        document.addEventListener('click', function closeMenu(e) {
            if (!e.target.closest('.action-menu-container')) {
                menu.classList.remove('show');
                document.removeEventListener('click', closeMenu);
            }
        });

        // Close menu when clicking an item inside it
        menu.querySelectorAll('.action-menu-item').forEach(item => {
            item.addEventListener('click', function() {
                menu.classList.remove('show');
            });
        });
    },

    handleEdit: function(id) {
        switch (this.type) {
            case 'Inflow':
                EditInflow.init('Inflow', id, function() {
                    InflowApp.loadInflowData();
                });
                break;
            case 'Outflow':
                EditOutflow.init('Outflow', id, function() {
                    OutflowApp.loadOutflowData();
                });
                break;
            case 'Investment':
                EditInvestment.init('Investment', id, function() {
                    InvestmentApp.loadInvestmentData();
                });
                break;
            case 'Liability':
                EditLiability.init('Liability', id, function() {
                    LiabilityApp.loadLiabilityData();
                });
                break;
            default:
                console.error('Unknown type:', this.type);
        }
    },

    handleDelete: function(id) {
        switch (this.type) {
            case 'Inflow':
                DeleteAlert.init('Inflow', id, function() {
                    InflowApp.loadInflowData();
                });
                break;
            case 'Outflow':
                DeleteAlert.init('Outflow', id, function() {
                    OutflowApp.loadOutflowData();
                });
                break;
            case 'Investment':
                DeleteAlert.init('Investment', id, function() {
                    InvestmentApp.loadInvestmentData();
                });
                break;
            default:
                console.error('Unknown type:', type);
        }
    }
};

window.ActionsMenu = ActionsMenu;
