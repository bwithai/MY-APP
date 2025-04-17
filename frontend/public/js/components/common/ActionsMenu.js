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
        var menuHtml = "<div class='action-menu-container'>";
        
        if (!this.value.is_deleted) {
            menuHtml += "<button class='btn btn-sm btn-icon' " + 
                       "onclick=\"ActionsMenu.toggleMenu('" + menuId + "', event)\" " +
                       "title='Actions'>" +
                       "<i class='fas fa-ellipsis-v'></i>" +
                       "</button>";

            menuHtml += "<div id='" + menuId + "' class='action-menu-dropdown'>";
            
            // IVY-specific menu items
            if (this.type === 'Corp' || this.type === 'Division' || this.type === 'Brigade' || this.type === 'Unit') {
                var entityDataAttr = "data-entity='" + JSON.stringify(this.value).replace(/'/g, "&apos;") + "' data-type='" + this.type + "'";
                
                // Change operation for each IVY entity type
                if (this.type === 'Corp') {
                    // Corps only have delete operation in our implementation
                } else if (this.type === 'Division') {
                    menuHtml += "<div class='action-menu-item' " + entityDataAttr + " " +
                               "onclick=\"ActionsMenu.handleChangeDiv(this)\">" +
                               "<i class='fas fa-edit' style='color: darkgreen;'></i> " +
                               "Change Corps" +
                               "</div>";
                } else if (this.type === 'Brigade') {
                    menuHtml += "<div class='action-menu-item' " + entityDataAttr + " " +
                               "onclick=\"ActionsMenu.handleChangeBrigade(this)\">" +
                               "<i class='fas fa-edit' style='color: darkgreen;'></i> " +
                               "Change Division" +
                               "</div>";
                } else if (this.type === 'Unit') {
                    menuHtml += "<div class='action-menu-item' " + entityDataAttr + " " +
                               "onclick=\"ActionsMenu.handleChangeUnit(this)\">" +
                               "<i class='fas fa-edit' style='color: darkgreen;'></i> " +
                               "Change Brigade" +
                               "</div>";
                }
                
                // Delete operation for all IVY entity types
                menuHtml += "<div class='action-menu-item' " + entityDataAttr + " " +
                           "onclick=\"ActionsMenu.handleDeleteIVY(this)\">" +
                           "<i class='fas fa-trash' style='color: red;'></i> " +
                           "Delete " + this.type +
                           "</div>";
            }
            // Handle non-IVY types using existing code
            else {
                // Edit option
                if (this.type === 'Asset') {
                    // Store this exact asset in a dataset attribute for retrieval later
                    var assetDataAttr = "data-asset='" + JSON.stringify(this.value).replace(/'/g, "&apos;") + "'";
                    menuHtml += "<div class='action-menu-item' " + assetDataAttr + " " +
                               "onclick=\"ActionsMenu.handleEdit(this)\">" +
                               "<i class='fas fa-edit' style='color: darkgreen;'></i> " +
                               "Edit " + this.type +
                               "</div>";
                } else {
                    menuHtml += "<div class='action-menu-item' " +
                               "onclick=\"ActionsMenu.handleEdit(" + this.value.id + ")\">" +
                               "<i class='fas fa-edit' style='color: darkgreen;'></i> " +
                               "Edit " + this.type +
                               "</div>";
                }

                // Pay Liability option (if applicable)
                if (this.type === 'Liability' && !this.options.isPaid && !this.options.isDelete) {
                    menuHtml += "<div class='action-menu-item' " +
                               "onclick=\"ActionsMenu.handlePayLiability(" + this.value.id + ")\">" +
                               "<i class='fas fa-credit-card' style='color: lightblue;'></i> " +
                               "Pay Liability" +
                               "</div>";
                }
                
                // History option (for Liability and Investment)
                if (this.type === 'Liability' || this.type === 'Investment') {
                    menuHtml += "<div class='action-menu-item' " +
                               "onclick=\"ActionsMenu.handleViewHistory(" + this.value.id + ")\">" +
                               "<i class='fas fa-history' style='color: darkgray;'></i> " +
                               this.type + " History" +
                               "</div>";
                }

                // View option (for Asset)
                if (this.type === 'Asset') {
                    // Store this exact asset in a dataset attribute for retrieval later
                    var assetDataAttr = "data-asset='" + JSON.stringify(this.value).replace(/'/g, "&apos;") + "'";
                    menuHtml += "<div class='action-menu-item' " + assetDataAttr + " " +
                               "onclick=\"ActionsMenu.handleViewAsset(this)\">" +
                               "<i class='fas fa-eye' style='color: darkgray;'></i> " +
                               "View Asset" +
                               "</div>";
                                
                    // Add Dispose Asset option if not already disposed
                    if (!this.value.dispose_status) {
                        menuHtml += "<div class='action-menu-item' " + assetDataAttr + " " +
                                   "onclick=\"ActionsMenu.handleDisposeAsset(this)\">" +
                                   "<i class='fas fa-archive' style='color: orange;'></i> " +
                                   "Dispose Asset" +
                                   "</div>";
                    }
                }

                // Delete option (if enabled)
                if (this.options.canDelete) {
                    menuHtml += "<div class='action-menu-item' " +
                               "onclick=\"ActionsMenu.handleDelete(" + this.value.id + ")\">" +
                               "<i class='fas fa-trash' style='color: red;'></i> " +
                               "Delete " + this.type +
                               "</div>";
                }
            }

            menuHtml += "</div>";
        }

        menuHtml += "</div>";
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

    handleEdit: function(idOrElement) {
        // Check if we're dealing with an Asset and have an element with data
        if (typeof idOrElement === 'object' && idOrElement.dataset && idOrElement.dataset.asset) {
            try {
                // For Asset type, get the asset data directly from the element
                var assetData = JSON.parse(idOrElement.dataset.asset);
                
                console.log('Editing specific asset:', assetData);
                
                // Pass the specific asset data to EditAsset
                EditAsset.init(assetData, function() {
                    // Refresh the assets list after edit
                    if (typeof AssetsApp !== 'undefined' && typeof AssetsApp.loadAssetsData === 'function') {
                        AssetsApp.loadAssetsData();
                    }
                });
                return;
            } catch (error) {
                console.error('Error parsing asset data:', error);
                alert('Failed to edit asset: ' + error.message);
                return;
            }
        }
        
        // For non-Asset types or fallback, use the original ID-based approach
        var id = typeof idOrElement === 'object' ? idOrElement.id : idOrElement;
        
        switch (this.type) {
            case 'Appt':
                // Get the appointment data and open the EditAppt modal
                if (typeof EditAppt === 'undefined') {
                    console.error('EditAppt component is not available');
                    alert('Cannot edit appointment: The required component is not loaded');
                    return;
                }
                
                // For Appt type, we already have the full object in this.value
                EditAppt.open(this.value, function() {
                    // Refresh the appointments list after edit
                    if (window.AppointmentList && typeof window.AppointmentList.loadAppointments === 'function') {
                        window.AppointmentList.loadAppointments();
                    }
                });
                break;
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
            case 'Appt':
                // For Appointment, confirm deletion and call the API
                if (confirm('Are you sure you want to delete this appointment? This action cannot be undone.')) {
                    ApiClient.deleteAppt({ id: this.value.id })
                        .then(function(response) {
                            Utils.onSuccess('delete', 'Appointment');
                            // Refresh the appointments list
                            if (window.AppointmentList && typeof window.AppointmentList.loadAppointments === 'function') {
                                window.AppointmentList.loadAppointments();
                            }
                        })
                        .catch(function(error) {
                            console.error('Failed to delete appointment:', error);
                            Utils.showMessage('error', 'Failed to delete appointment: ' + (error.message || 'Unknown error'));
                        });
                }
                break;
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
            case 'Liability':
                DeleteAlert.init('Liability', id, function() {
                    LiabilityApp.loadLiabilityData();
                });
                break;
            default:
                console.error('Unknown type:', this.type);
        }
    },

    handlePayLiability: function(id) {
        // Get the liability data first to initialize the PayLiability modal
        ApiClient.getLiability(id)
            .then(function(liability) {
                PayLiability.init(liability, function() {
                    LiabilityApp.loadLiabilityData();
                });
            })
            .catch(function(error) {
                console.error('Failed to load liability for payment:', error);
                alert('Failed to load liability details: ' + (error.message || 'Unknown error'));
            });
    },

    handleViewHistory: function(id) {
        // Get the data first to initialize the appropriate History modal
        if (this.type === 'Liability') {
            ApiClient.getLiability(id)
                .then(function(liability) {
                    LiabilityHistory.init(liability, function() {
                        // Optional callback when history modal is closed
                    });
                })
                .catch(function(error) {
                    console.error('Failed to load liability for history view:', error);
                    alert('Failed to load liability details: ' + (error.message || 'Unknown error'));
                });
        } else if (this.type === 'Investment') {
            ApiClient.getInvestment(id)
                .then(function(investment) {
                    InvestHistory.init(investment, function() {
                        // Optional callback when history modal is closed
                    });
                })
                .catch(function(error) {
                    console.error('Failed to load investment for history view:', error);
                    alert('Failed to load investment details: ' + (error.message || 'Unknown error'));
                });
        }
    },

    handleViewAsset: function(element) {
        try {
            // Get the asset data directly from the clicked element's dataset
            var assetData = element.dataset.asset ? JSON.parse(element.dataset.asset) : null;
            
            if (!assetData) {
                console.error('Asset data not found in element');
                return;
            }
            
            console.log('Viewing specific asset:', assetData);
            
            // Pass the specific asset data to ViewAsset
            ViewAsset.init(assetData, function() {
                // Optional callback when view modal is closed
                if (typeof AssetsApp !== 'undefined' && typeof AssetsApp.loadAssetsData === 'function') {
                    AssetsApp.loadAssetsData();
                }
            });
        } catch (error) {
            console.error('Error viewing asset:', error);
            alert('Failed to view asset details: ' + error.message);
        }
    },

    // Add this new method to handle asset disposal
    handleDisposeAsset: function(element) {
        try {
            // Get the asset data directly from the clicked element's dataset
            var assetData = element.dataset.asset ? JSON.parse(element.dataset.asset) : null;
            
            if (!assetData) {
                console.error('Asset data not found in element');
                return;
            }
            
            console.log('Disposing asset:', assetData);
            
            // Pass the specific asset data to DisposeAsset
            DisposeAsset.init(assetData, function() {
                // Refresh the assets list after disposal
                if (typeof AssetsApp !== 'undefined' && typeof AssetsApp.loadAssetsData === 'function') {
                    AssetsApp.loadAssetsData();
                }
            });
        } catch (error) {
            console.error('Error preparing asset disposal:', error);
            alert('Failed to prepare asset disposal: ' + error.message);
        }
    },

    // Add these new methods to handle IVY operations
    handleChangeDiv: function(element) {
        try {
            var div = JSON.parse(element.dataset.entity);
            // Use originalId if it exists
            if (div.originalId) div.id = div.originalId;
            
            // Check if ChangeDiv component exists
            if (typeof ChangeDiv === 'undefined' || ChangeDiv === null) {
                console.error('ChangeDiv component is not defined');
                alert('Cannot change division: The required component is not loaded');
                return;
            }
            
            // Create a container to hold the modal
            var modalContainer = document.createElement('div');
            modalContainer.id = 'changeDivContainer';
            modalContainer.style.position = 'fixed';
            modalContainer.style.top = '0';
            modalContainer.style.left = '0';
            modalContainer.style.width = '100%';
            modalContainer.style.height = '100%';
            modalContainer.style.zIndex = '10000';
            document.body.appendChild(modalContainer);
            
            // Initialize the ChangeDiv component
            ChangeDiv.init(modalContainer, div, function() {
                document.body.removeChild(modalContainer);
                // Refresh the data
                if (window.SettingsIVY) {
                    SettingsIVY.loadCorps();
                }
            });
        } catch (error) {
            console.error('Error handling div change:', error);
            alert('Failed to change division: ' + error.message);
        }
    },

    handleChangeBrigade: function(element) {
        try {
            var brigade = JSON.parse(element.dataset.entity);
            // Use originalId if it exists
            if (brigade.originalId) brigade.id = brigade.originalId;
            
            // Check if ChangeBrigade component exists
            if (typeof ChangeBrigade === 'undefined' || ChangeBrigade === null) {
                console.error('ChangeBrigade component is not defined');
                alert('Cannot change brigade: The required component is not loaded');
                return;
            }
            
            // Create a container to hold the modal
            var modalContainer = document.createElement('div');
            modalContainer.id = 'changeBrigadeContainer';
            modalContainer.style.position = 'fixed';
            modalContainer.style.top = '0';
            modalContainer.style.left = '0';
            modalContainer.style.width = '100%';
            modalContainer.style.height = '100%';
            modalContainer.style.zIndex = '10000';
            document.body.appendChild(modalContainer);
            
            // Initialize the ChangeBrigade component
            ChangeBrigade.init(modalContainer, brigade, function() {
                document.body.removeChild(modalContainer);
                // Refresh the data
                if (window.SettingsIVY) {
                    SettingsIVY.loadCorps();
                }
            });
        } catch (error) {
            console.error('Error handling brigade change:', error);
            alert('Failed to change brigade: ' + error.message);
        }
    },

    handleChangeUnit: function(element) {
        try {
            var unit = JSON.parse(element.dataset.entity);
            // Use originalId if it exists
            if (unit.originalId) unit.id = unit.originalId;
            
            // Check if ChangeUnit component exists
            if (typeof ChangeUnit === 'undefined' || ChangeUnit === null) {
                console.error('ChangeUnit component is not defined');
                alert('Cannot change unit: The required component is not loaded');
                return;
            }
            
            // Create a container to hold the modal
            var modalContainer = document.createElement('div');
            modalContainer.id = 'changeUnitContainer';
            modalContainer.style.position = 'fixed';
            modalContainer.style.top = '0';
            modalContainer.style.left = '0';
            modalContainer.style.width = '100%';
            modalContainer.style.height = '100%';
            modalContainer.style.zIndex = '10000';
            document.body.appendChild(modalContainer);
            
            // Initialize the ChangeUnit component
            ChangeUnit.init(modalContainer, unit, function() {
                document.body.removeChild(modalContainer);
                // Refresh the data
                if (window.SettingsIVY) {
                    SettingsIVY.loadCorps();
                }
            });
        } catch (error) {
            console.error('Error handling unit change:', error);
            alert('Failed to change unit: ' + error.message);
        }
    },

    handleDeleteIVY: function(element) {
        try {
            var entity = JSON.parse(element.dataset.entity);
            var type = element.dataset.type;
            
            console.log('Deleting IVY entity:', type, entity);
            
            // Map type to flag value for API
            var flag;
            switch (type) {
                case 'Corp': flag = 'Corp'; break;
                case 'Division': flag = 'Division'; break;
                case 'Brigade': flag = 'Brigade'; break;
                case 'Unit': flag = 'Unit'; break;
                default: throw new Error('Unknown entity type: ' + type);
            }
            
            // Use originalId if it exists (for modified IDs by SettingsIVY)
            var entityId = entity.originalId || entity.id;
            
            if (confirm(`Are you sure you want to delete this ${type.toLowerCase()}? This action cannot be undone.`)) {
                console.log('Sending delete request with flag:', flag, 'and id:', entityId);
                
                ApiClient.deleteIVY({ flag: flag, id: entityId })
                    .then(function(response) {
                        console.log('Delete successful:', response);
                        Utils.onSuccess('delete', type);
                        // Refresh the IVY data
                        if (window.SettingsIVY) {
                            SettingsIVY.loadCorps();
                        }
                    })
                    .catch(function(error) {
                        console.error(`Failed to delete ${type.toLowerCase()}:`, error);
                        Utils.onSuccess('error', (error.message || 'Unknown error'));
                    });
            }
        } catch (error) {
            console.error('Error handling IVY deletion:', error);
            alert('Failed to process deletion: ' + error.message);
        }
    }
};

window.ActionsMenu = ActionsMenu;
