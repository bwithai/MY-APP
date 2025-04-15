console.log("SettingsIVY script loading...");

var SettingsIVY = {
    init: function(container) {
        console.log('SettingsIVY.init called with container:', container);
        
        // Store container reference
        this.container = container;
        
        // Initialize state
        this.corps = [];
        this.selectedCorpId = null;
        this.selectedDivId = null;
        this.selectedBrigadeId = null;
        this.selectedUnitId = null;
        this.isLoadingCorps = false;
        this.isCorpsError = false;
        
        // Form submission states
        this.isSubmittingCorp = false;
        this.isSubmittingDiv = false;
        this.isSubmittingBrig = false;
        this.isSubmittingUnit = false;
        
        // Initialize the component
        this.loadCorps();
        this.setupEventListeners();
    },

    loadCorps: function() {
        console.log('SettingsIVY.loadCorps called');
        this.isLoadingCorps = true;
        this.render();

        // Call API to get corps data
        var self = this; // Store 'this' reference for use in callbacks
        ApiClient.readIvy()
            .then(function(response) {
                console.log('Corps data loaded successfully:', response);
                self.corps = response.data || [];
                self.isLoadingCorps = false;
                self.render();
            })
            .catch(function(error) {
                console.error('Error loading corps:', error);
                self.isCorpsError = true;
                self.isLoadingCorps = false;
                self.render();
                Utils.showMessage('error', 'Failed to load corps data');
            });
    },

    render: function() {
        console.log('SettingsIVY.render called with state:', {
            isLoadingCorps: this.isLoadingCorps,
            isCorpsError: this.isCorpsError,
            corpsCount: this.corps.length,
            selectedCorpId: this.selectedCorpId,
            selectedDivId: this.selectedDivId,
            selectedBrigadeId: this.selectedBrigadeId
        });
        
        var html = 
            '<div class="settings-ivy">' +
                '<div class="container">' +
                    '<div class="grid">' +
                        '<!-- Add Corps -->' +
                        '<div class="grid-item">' +
                            '<div class="card">' +
                                '<form id="addCorpForm">' +
                                    '<div class="form-group">' +
                                        '<label for="add_corps">Add Corps</label>' +
                                        '<input id="add_corps" type="text" placeholder="Enter Corps" required>' +
                                        '<div class="error-message" id="corpError"></div>' +
                                    '</div>' +
                                    '<button type="submit" class="btn btn-primary" id="addCorpBtn">+ Add</button>' +
                                '</form>' +

                                '<!-- Select Corps -->' +
                                '<div class="form-group">' +
                                    '<label>Select Corps</label>' +
                                    this.renderCorpsList() +
                                '</div>' +
                            '</div>' +
                        '</div>' +

                        '<!-- Add Division -->' +
                        (this.selectedCorpId ? 
                            '<div class="grid-item">' +
                                '<div class="card">' +
                                    '<form id="addDivForm">' +
                                        '<div class="form-group">' +
                                            '<label for="add_div">Add Division</label>' +
                                            '<input id="add_div" type="text" placeholder="Enter Division" required>' +
                                            '<div class="error-message" id="divError"></div>' +
                                        '</div>' +
                                        '<button type="submit" class="btn btn-primary" id="addDivBtn">+ Add</button>' +
                                    '</form>' +

                                    '<!-- Select Division -->' +
                                    '<div class="form-group">' +
                                        '<label>Select Division</label>' +
                                        this.renderDivisionsList() +
                                    '</div>' +
                                '</div>' +
                            '</div>'
                        : '') +

                        '<!-- Add Brigade -->' +
                        (this.selectedDivId ? 
                            '<div class="grid-item">' +
                                '<div class="card">' +
                                    '<form id="addBrigForm">' +
                                        '<div class="form-group">' +
                                            '<label for="add_brigade">Add Brigade</label>' +
                                            '<input id="add_brigade" type="text" placeholder="Enter Brigade" required>' +
                                            '<div class="error-message" id="brigError"></div>' +
                                        '</div>' +
                                        '<button type="submit" class="btn btn-primary" id="addBrigBtn">+ Add</button>' +
                                    '</form>' +

                                    '<!-- Select Brigade -->' +
                                    '<div class="form-group">' +
                                        '<label>Select Brigade</label>' +
                                        this.renderBrigadesList() +
                                    '</div>' +
                                '</div>' +
                            '</div>'
                        : '') +

                        '<!-- Add Unit -->' +
                        (this.selectedBrigadeId ? 
                            '<div class="grid-item">' +
                                '<div class="card">' +
                                    '<form id="addUnitForm">' +
                                        '<div class="form-group">' +
                                            '<label for="add_unit">Add Unit</label>' +
                                            '<input id="add_unit" type="text" placeholder="Enter Unit" required>' +
                                            '<div class="error-message" id="unitError"></div>' +
                                        '</div>' +
                                        '<button type="submit" class="btn btn-primary" id="addUnitBtn">+ Add</button>' +
                                    '</form>' +

                                    '<!-- Select Unit -->' +
                                    '<div class="form-group">' +
                                        '<label>Select Unit</label>' +
                                        this.renderUnitsList() +
                                    '</div>' +
                                '</div>' +
                            '</div>'
                        : '') +
                    '</div>' +
                '</div>' +
            '</div>';

        this.container.innerHTML = html;
        this.setupEventListeners();
    },

    renderCorpsList: function() {
        if (this.isLoadingCorps) {
            return '<div class="spinner"></div>';
        }

        if (this.isCorpsError) {
            return '<div class="error">Failed to load corps</div>';
        }

        var html = 
            '<table class="table" id="settingsIVYCorpsList">' +
                '<thead>' +
                    '<tr>' +
                        '<th>Name</th>' +
                        '<th>Action</th>' +
                    '</tr>' +
                '</thead>' +
                '<tbody>';

        for (var i = 0; i < this.corps.length; i++) {
            var corp = this.corps[i];
            html +=
                '<tr>' +
                    '<td>' +
                        '<input type="radio" name="corp" value="' + corp.id + '"' + 
                            (this.selectedCorpId === corp.id ? ' checked' : '') + ' id="corp_' + corp.id + '">' +
                        '<label title="' + corp.name + '" for="corp_' + corp.id + '" class="entity-name">' + corp.name + '</label>' +
                    '</td>' +
                    '<td>' + this.renderActionsMenu('Corp', corp) + '</td>' +
                '</tr>';
        }
                
        html += '</tbody></table>';
        return html;
    },

    renderDivisionsList: function() {
        var selectedCorp = null;
        for (var i = 0; i < this.corps.length; i++) {
            if (this.corps[i].id === this.selectedCorpId) {
                selectedCorp = this.corps[i];
                break;
            }
        }
        
        if (!selectedCorp || !selectedCorp.divs) return '';

        var html = 
            '<table class="table" id="settingsIVYDivisionsList">' +
                '<thead>' +
                    '<tr>' +
                        '<th>Name</th>' +
                        '<th>Action</th>' +
                    '</tr>' +
                '</thead>' +
                '<tbody>';

        for (var j = 0; j < selectedCorp.divs.length; j++) {
            var div = selectedCorp.divs[j];
            html +=
                '<tr>' +
                    '<td>' +
                        '<input type="radio" name="div" value="' + div.id + '"' + 
                            (this.selectedDivId === div.id ? ' checked' : '') + ' id="div_' + div.id + '">' +
                        '<label title="' + div.name + '" for="div_' + div.id + '" class="entity-name">' + div.name + '</label>' +
                    '</td>' +
                    '<td>' + this.renderActionsMenu('Division', div) + '</td>' +
                '</tr>';
        }
                
        html += '</tbody></table>';
        return html;
    },

    renderBrigadesList: function() {
        var selectedCorp = null;
        for (var i = 0; i < this.corps.length; i++) {
            if (this.corps[i].id === this.selectedCorpId) {
                selectedCorp = this.corps[i];
                break;
            }
        }
        
        var selectedDiv = null;
        if (selectedCorp && selectedCorp.divs) {
            for (var j = 0; j < selectedCorp.divs.length; j++) {
                if (selectedCorp.divs[j].id === this.selectedDivId) {
                    selectedDiv = selectedCorp.divs[j];
                    break;
                }
            }
        }
        
        if (!selectedDiv || !selectedDiv.brigades) return '';

        var html = 
            '<table class="table" id="settingsIVYBrigadesList">' +
                '<thead>' +
                    '<tr>' +
                        '<th>Name</th>' +
                        '<th>Action</th>' +
                    '</tr>' +
                '</thead>' +
                '<tbody>';

        for (var k = 0; k < selectedDiv.brigades.length; k++) {
            var brigade = selectedDiv.brigades[k];
            html +=
                '<tr>' +
                    '<td>' +
                        '<input type="radio" name="brigade" value="' + brigade.id + '"' + 
                            (this.selectedBrigadeId === brigade.id ? ' checked' : '') + ' id="brigade_' + brigade.id + '">' +
                        '<label title="' + brigade.name + '" for="brigade_' + brigade.id + '" class="entity-name">' + brigade.name + '</label>' +
                    '</td>' +
                    '<td>' + this.renderActionsMenu('Brigade', brigade) + '</td>' +
                '</tr>';
        }
                
        html += '</tbody></table>';
        return html;
    },

    renderUnitsList: function() {
        var selectedCorp = null;
        for (var i = 0; i < this.corps.length; i++) {
            if (this.corps[i].id === this.selectedCorpId) {
                selectedCorp = this.corps[i];
                break;
            }
        }
        
        var selectedDiv = null;
        if (selectedCorp && selectedCorp.divs) {
            for (var j = 0; j < selectedCorp.divs.length; j++) {
                if (selectedCorp.divs[j].id === this.selectedDivId) {
                    selectedDiv = selectedCorp.divs[j];
                    break;
                }
            }
        }
        
        var selectedBrigade = null;
        if (selectedDiv && selectedDiv.brigades) {
            for (var k = 0; k < selectedDiv.brigades.length; k++) {
                if (selectedDiv.brigades[k].id === this.selectedBrigadeId) {
                    selectedBrigade = selectedDiv.brigades[k];
                    break;
                }
            }
        }
        
        if (!selectedBrigade || !selectedBrigade.units) return '';

        var html = 
            '<table class="table" id="settingsIVYUnitsList">' +
                '<thead>' +
                    '<tr>' +
                        '<th>Name</th>' +
                        '<th>Action</th>' +
                    '</tr>' +
                '</thead>' +
                '<tbody>';

        for (var l = 0; l < selectedBrigade.units.length; l++) {
            var unit = selectedBrigade.units[l];
            html +=
                '<tr>' +
                    '<td>' +
                        '<input type="radio" name="unit" value="' + unit.id + '"' + 
                            (this.selectedUnitId === unit.id ? ' checked' : '') + ' id="unit_' + unit.id + '">' +
                        '<label title="' + unit.name + '" for="unit_' + unit.id + '" class="entity-name">' + unit.name + '</label>' +
                    '</td>' +
                    '<td>' + this.renderActionsMenu('Unit', unit) + '</td>' +
                '</tr>';
        }
                
        html += '</tbody></table>';
        return html;
    },

    renderActionsMenu: function(type, value) {
        console.log('Rendering actions menu for:', type, value);
        
        // Create a copy of the value with a type-specific id to ensure unique menu IDs
        var valueWithUniqueId = Object.assign({}, value);
        
        // Set a type-specific ID to ensure uniqueness across different entity types
        // This prevents conflicts between different entity types with the same ID
        if (!valueWithUniqueId.originalId) {
            valueWithUniqueId.originalId = valueWithUniqueId.id;
            valueWithUniqueId.id = type.toLowerCase() + '_' + valueWithUniqueId.id;
        }
        
        if (typeof ActionsMenu !== 'undefined' && ActionsMenu !== null) {
            return ActionsMenu.init(type, valueWithUniqueId);
        }
        return '<div class="actions-menu" data-type="' + type + '" data-value=\'' + JSON.stringify(valueWithUniqueId) + '\'></div>';
    },

    setupEventListeners: function() {
        var self = this; // Store 'this' context for use in callbacks
        
        // Corps selection
        var corpsRadios = this.container.querySelectorAll('input[name="corp"]');
        for (var i = 0; i < corpsRadios.length; i++) {
            corpsRadios[i].addEventListener('change', function(e) {
                self.selectedCorpId = Number(e.target.value);
                self.selectedDivId = null;
                self.selectedBrigadeId = null;
                self.selectedUnitId = null;
                self.render();
            });
        }

        // Division selection
        var divRadios = this.container.querySelectorAll('input[name="div"]');
        for (var j = 0; j < divRadios.length; j++) {
            divRadios[j].addEventListener('change', function(e) {
                self.selectedDivId = Number(e.target.value);
                self.selectedBrigadeId = null;
                self.selectedUnitId = null;
                self.render();
            });
        }

        // Brigade selection
        var brigadeRadios = this.container.querySelectorAll('input[name="brigade"]');
        for (var k = 0; k < brigadeRadios.length; k++) {
            brigadeRadios[k].addEventListener('change', function(e) {
                self.selectedBrigadeId = Number(e.target.value);
                self.selectedUnitId = null;
                self.render();
            });
        }

        // Unit selection
        var unitRadios = this.container.querySelectorAll('input[name="unit"]');
        for (var l = 0; l < unitRadios.length; l++) {
            unitRadios[l].addEventListener('change', function(e) {
                self.selectedUnitId = Number(e.target.value);
            });
        }

        // Form submissions
        this.setupFormSubmissions();
    },

    setupFormSubmissions: function() {
        var self = this; // Store 'this' context for use in callbacks
        
        // Add Corps form
        var addCorpForm = this.container.querySelector('#addCorpForm');
        if (addCorpForm) {
            addCorpForm.addEventListener('submit', function(e) {
                e.preventDefault();
                var name = self.container.querySelector('#add_corps').value;
                if (!name) {
                    self.showError('corpError', 'Corps name is required');
                    return;
                }

                // Set loading state
                self.isSubmittingCorp = true;
                var addCorpBtn = self.container.querySelector('#addCorpBtn');
                if (addCorpBtn) {
                    addCorpBtn.disabled = true;
                    addCorpBtn.innerHTML = '<span class="spinner-sm"></span> Adding...';
                }

                self.addCorp({ name: name });
            });
        }

        // Add Division form
        var addDivForm = this.container.querySelector('#addDivForm');
        if (addDivForm) {
            addDivForm.addEventListener('submit', function(e) {
                e.preventDefault();
                var name = self.container.querySelector('#add_div').value;
                if (!name) {
                    self.showError('divError', 'Division name is required');
                    return;
                }

                // Set loading state
                self.isSubmittingDiv = true;
                var addDivBtn = self.container.querySelector('#addDivBtn');
                if (addDivBtn) {
                    addDivBtn.disabled = true;
                    addDivBtn.innerHTML = '<span class="spinner-sm"></span> Adding...';
                }

                self.addDivision({ name: name, corp_id: self.selectedCorpId });
            });
        }

        // Add Brigade form
        var addBrigForm = this.container.querySelector('#addBrigForm');
        if (addBrigForm) {
            addBrigForm.addEventListener('submit', function(e) {
                e.preventDefault();
                var name = self.container.querySelector('#add_brigade').value;
                if (!name) {
                    self.showError('brigError', 'Brigade name is required');
                    return;
                }

                // Set loading state
                self.isSubmittingBrig = true;
                var addBrigBtn = self.container.querySelector('#addBrigBtn');
                if (addBrigBtn) {
                    addBrigBtn.disabled = true;
                    addBrigBtn.innerHTML = '<span class="spinner-sm"></span> Adding...';
                }

                self.addBrigade({ name: name, div_id: self.selectedDivId });
            });
        }

        // Add Unit form
        var addUnitForm = this.container.querySelector('#addUnitForm');
        if (addUnitForm) {
            addUnitForm.addEventListener('submit', function(e) {
                e.preventDefault();
                var name = self.container.querySelector('#add_unit').value;
                if (!name) {
                    self.showError('unitError', 'Unit name is required');
                    return;
                }

                // Set loading state
                self.isSubmittingUnit = true;
                var addUnitBtn = self.container.querySelector('#addUnitBtn');
                if (addUnitBtn) {
                    addUnitBtn.disabled = true;
                    addUnitBtn.innerHTML = '<span class="spinner-sm"></span> Adding...';
                }

                self.addUnit({ name: name, brigade_id: self.selectedBrigadeId });
            });
        }
    },

    addCorp: function(data) {
        var self = this; // Store 'this' context for use in callbacks
        console.log('Adding corps with data:', data);
        ApiClient.createCorp(data)
            .then(function() {
                Utils.onSuccess('add', 'Corps');
                // Reset the form input
                var corpInput = self.container.querySelector('#add_corps');
                if (corpInput) corpInput.value = '';
                self.loadCorps();
            })
            .catch(function(error) {
                console.error('Error adding corps:', error);
                Utils.onSuccess('error', 'Failed to add corps');
            })
            .finally(function() {
                // Reset loading state
                self.isSubmittingCorp = false;
                var addCorpBtn = self.container.querySelector('#addCorpBtn');
                if (addCorpBtn) {
                    addCorpBtn.disabled = false;
                    addCorpBtn.innerHTML = '+ Add';
                }
            });
    },

    addDivision: function(data) {
        var self = this; // Store 'this' context for use in callbacks
        console.log('Adding division with data:', data);
        ApiClient.createDiv(data)
            .then(function() {
                Utils.onSuccess('add', 'Division');
                // Reset the form input
                var divInput = self.container.querySelector('#add_div');
                if (divInput) divInput.value = '';
                self.loadCorps();
            })
            .catch(function(error) {
                console.error('Error adding division:', error);
                Utils.onSuccess('error', 'Failed to add division');
            })
            .finally(function() {
                // Reset loading state
                self.isSubmittingDiv = false;
                var addDivBtn = self.container.querySelector('#addDivBtn');
                if (addDivBtn) {
                    addDivBtn.disabled = false;
                    addDivBtn.innerHTML = '+ Add';
                }
            });
    },

    addBrigade: function(data) {
        var self = this; // Store 'this' context for use in callbacks
        console.log('Adding brigade with data:', data);
        ApiClient.createBrig(data)
            .then(function() {
                Utils.onSuccess('add', 'Brigade');
                // Reset the form input
                var brigInput = self.container.querySelector('#add_brigade');
                if (brigInput) brigInput.value = '';
                self.loadCorps();
            })
            .catch(function(error) {
                console.error('Error adding brigade:', error);
                Utils.onSuccess('error', 'Failed to add brigade');
            })
            .finally(function() {
                // Reset loading state
                self.isSubmittingBrig = false;
                var addBrigBtn = self.container.querySelector('#addBrigBtn');
                if (addBrigBtn) {
                    addBrigBtn.disabled = false;
                    addBrigBtn.innerHTML = '+ Add';
                }
            });
    },

    addUnit: function(data) {
        var self = this; // Store 'this' context for use in callbacks
        console.log('Adding unit with data:', data);
        ApiClient.createUnit(data)
            .then(function() {
                Utils.onSuccess('add', 'Unit');
                // Reset the form input
                var unitInput = self.container.querySelector('#add_unit');
                if (unitInput) unitInput.value = '';
                self.loadCorps();
            })
            .catch(function(error) {
                console.error('Error adding unit:', error);
                Utils.onSuccess('error', 'Failed to add unit');
            })
            .finally(function() {
                // Reset loading state
                self.isSubmittingUnit = false;
                var addUnitBtn = self.container.querySelector('#addUnitBtn');
                if (addUnitBtn) {
                    addUnitBtn.disabled = false;
                    addUnitBtn.innerHTML = '+ Add';
                }
            });
    },

    showError: function(elementId, message) {
        var errorElement = this.container.querySelector('#' + elementId);
        if (errorElement) {
            errorElement.textContent = message;
        }
    }
};

// Make SettingsIVY globally available and explicitly log it
window.SettingsIVY = SettingsIVY;
console.log('SettingsIVY component loaded and available globally:', window.SettingsIVY);

// Debugging - list all components in window that might be IVY-related
console.log('Available window components:', 
    Object.keys(window).filter(function(key) {
        return key.includes('IVY') || key.includes('Settings') || key.includes('Component');
    })
);

console.log('SettingsIVY.js file fully loaded and executed');
