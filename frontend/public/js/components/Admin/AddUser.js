var AddUser = {
    init: function(onSuccess) {
        // Clear any existing modal first
        this.cleanup();

        // Add CSS for checkbox styling
        this.addStyles();

        this.onSuccess = onSuccess;
        this.render();

        // Wait for DOM to be ready before setting up events and loading data
        var self = this;
        setTimeout(function() {
            self.setupEventListeners();
            self.loadInitialData();
        }, 0);
    },

    cleanup: function () {
        Utils.cleanup('addUserModal');
        // Remove any added styles
        var styleElement = document.getElementById('addUserStyles');
        if (styleElement) {
            styleElement.remove();
        }
    },

    addStyles: function() {
        // Create a style element to add necessary CSS
        var style = document.createElement('style');
        style.id = 'addUserStyles';
        style.textContent = `
            .checkbox-group {
                display: flex;
                justify-content: space-between;
                width: 100%;
                margin-top: 20px;
                grid-column: 1 / -1;
            }
            .checkbox-container {
                display: flex;
                align-items: center;
            }
            .checkbox-container input[type="checkbox"] {
                margin-right: 5px;
            }
            .checkbox-container label {
                margin-bottom: 0;
                margin-left: 5px;
            }
        `;
        document.head.appendChild(style);
    },

    render: function() {
        var modalHtml = '<div class="modal" id="addUserModal">' +
            '<div class="modal-content">' +
                '<div class="modal-header">' +
                    '<h2>Add User</h2>' +
                    '<button type="button" class="close-btn">&times;</button>' +
                '</div>' +
                '<div class="modal-body">' +
                    '<form id="addUserForm" class="modal-form-grid">' +
                        '<div class="form-group">' +
                            Utils.createLabel('core', 'Core', true) +
                            '<select id="core" name="corp_id" required>' +
                                '<option value="">Select a core</option>' +
                            '</select>' +
                        '</div>' +

                        '<div class="form-group" id="divContainer" style="display: none;">' +
                            Utils.createLabel('div', 'Div', false) +
                            '<select id="div" name="div_id">' +
                                '<option value="">Select a div</option>' +
                            '</select>' +
                        '</div>' +

                        '<div class="form-group" id="brigadeContainer" style="display: none;">' +
                            Utils.createLabel('brigade', 'Brigade', false) +
                            '<select id="brigade" name="brigade_id">' +
                                '<option value="">Select a brigade</option>' +
                            '</select>' +
                        '</div>' +

                        '<div class="form-group" id="unitContainer" style="display: none;">' +
                            Utils.createLabel('unit', 'Unit', false) +
                            '<select id="unit" name="unit_id">' +
                                '<option value="">Select a unit</option>' +
                            '</select>' +
                        '</div>' +

                        '<div class="form-group">' +
                            Utils.createLabel('appt', 'Appointment', true) +
                            '<select id="appt" name="appt" required>' +
                                '<option value="">Select appointment</option>' +
                            '</select>' +
                        '</div>' +

                        '<div class="form-group">' +
                            Utils.createLabel('name', 'Full Name', true) +
                            '<input type="text" id="name" name="name" readonly>' +
                        '</div>' +

                        '<div class="form-group">' +
                            Utils.createLabel('username', 'Username', true) +
                            '<input type="text" id="username" name="username" readonly>' +
                        '</div>' +

                        '<input type="hidden" id="email" name="email">' +

                        '<div class="form-group">' +
                            Utils.createLabel('password', 'Password', true) +
                            '<input type="password" id="password" name="password" required minlength="8">' +
                            '<small class="form-text password-error" style="display: none; color: red;">Password must be at least 8 characters</small>' +
                        '</div>' +

                        '<div class="form-group">' +
                            Utils.createLabel('confirm_password', 'Confirm Password', true) +
                            '<input type="password" id="confirm_password" name="confirm_password" required>' +
                            '<small class="form-text password-match-error" style="display: none; color: red;">Passwords do not match</small>' +
                        '</div>' +

                        '<div class="checkbox-group">' +
                            '<div class="checkbox-container">' +
                                '<input type="checkbox" id="is_superuser" name="is_superuser">' +
                                '<label for="is_superuser">Is superuser ?</label>' +
                            '</div>' +
                            '<div style="margin-left: 340px; margin-top: -20px;" class="checkbox-container">' +
                                '<input type="checkbox" id="is_active" name="is_active">' +
                                '<label for="is_active">Is active ?</label>' +
                            '</div>' +
                        '</div>' +
                    '</form>' +
                '</div>' +
                '<div class="modal-footer">' +
                    '<button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>' +
                    '<button type="submit" form="addUserForm" class="btn btn-primary" id="submitUser">Save</button>' +
                '</div>' +
            '</div>' +
        '</div>';
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    setupEventListeners: function() {
        var self = this;
        var modal = document.getElementById('addUserModal');

        if (!modal) {
            console.error('Modal not found');
            return;
        }

        var form = document.getElementById('addUserForm');
        var coreSelect = document.getElementById('core');
        var divSelect = document.getElementById('div');
        var brigadeSelect = document.getElementById('brigade');
        var unitSelect = document.getElementById('unit');
        var apptSelect = document.getElementById('appt');
        var passwordInput = document.getElementById('password');
        var confirmPasswordInput = document.getElementById('confirm_password');
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

        if (coreSelect) {
            coreSelect.addEventListener('change', function() {
                self.handleCoreChange(this.value);
            });
        }

        if (divSelect) {
            divSelect.addEventListener('change', function() {
                self.handleDivChange(this.value);
            });
        }

        if (brigadeSelect) {
            brigadeSelect.addEventListener('change', function() {
                self.handleBrigadeChange(this.value);
            });
        }

        if (unitSelect) {
            unitSelect.addEventListener('change', function() {
                self.handleUnitChange(this.value);
            });
        }

        if (apptSelect) {
            apptSelect.addEventListener('change', function() {
                self.updateUserInfo();
            });
        }

        if (passwordInput) {
            passwordInput.addEventListener('input', function() {
                self.validatePasswordLength();
            });
            
            passwordInput.addEventListener('blur', function() {
                self.validatePasswordLength();
                if (confirmPasswordInput.value) {
                    self.validatePasswordsMatch();
                }
            });
        }

        if (confirmPasswordInput) {
            confirmPasswordInput.addEventListener('input', function() {
                self.validatePasswordsMatch();
            });
            
            confirmPasswordInput.addEventListener('blur', function() {
                self.validatePasswordsMatch();
            });
        }

        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                if (self.validateForm()) {
                    self.handleSubmit(new FormData(this));
                }
            });
        }
    },

    loadInitialData: function() {
        this.loadCorps();
        this.loadAppointments();
    },

    loadCorps: function() {
        var self = this;
        var coreSelect = document.getElementById('core');
        
        ApiClient.readIvy()
            .then(function(response) {
                if (response && response.data && Array.isArray(response.data)) {
                    response.data.forEach(function(corp) {
                        var option = document.createElement('option');
                        option.value = corp.id;
                        option.text = corp.name;
                        option.dataset.corpData = JSON.stringify(corp);
                        coreSelect.appendChild(option);
                    });
                }
            })
            .catch(function(error) {
                console.error('Failed to load corps data:', error);
            });
    },

    loadAppointments: function() {
        var self = this;
        var apptSelect = document.getElementById('appt');
        
        ApiClient.getAppointments()
            .then(function(response) {
                if (response && Array.isArray(response)) {
                    response.forEach(function(appointment) {
                        var option = document.createElement('option');
                        option.value = appointment.name;
                        option.text = appointment.name;
                        apptSelect.appendChild(option);
                    });
                }
            })
            .catch(function(error) {
                console.error('Failed to load appointments data:', error);
            });
    },

    handleCoreChange: function(corpId) {
        if (!corpId) return;
        
        var coreSelect = document.getElementById('core');
        var divContainer = document.getElementById('divContainer');
        var divSelect = document.getElementById('div');
        var selectedOption = coreSelect.options[coreSelect.selectedIndex];
        
        // Reset child selectors
        document.getElementById('appt').value = '';
        document.getElementById('div').innerHTML = '<option value="">Select a div</option>';
        document.getElementById('brigade').innerHTML = '<option value="">Select a brigade</option>';
        document.getElementById('unit').innerHTML = '<option value="">Select a unit</option>';
        
        // Hide containers
        document.getElementById('brigadeContainer').style.display = 'none';
        document.getElementById('unitContainer').style.display = 'none';
        
        // Reset user info
        this.resetUserInfo();
        
        try {
            if (selectedOption && selectedOption.dataset.corpData) {
                var corpData = JSON.parse(selectedOption.dataset.corpData);
                
                if (corpData.divs && corpData.divs.length > 0) {
                    // Populate div dropdown
                    corpData.divs.forEach(function(div) {
                        var option = document.createElement('option');
                        option.value = div.id;
                        option.text = div.name;
                        option.dataset.divData = JSON.stringify(div);
                        divSelect.appendChild(option);
                    });
                    
                    divContainer.style.display = 'block';
                } else {
                    divContainer.style.display = 'none';
                }
                
                // Update user info if appointment is selected
                this.updateUserInfo();
            }
        } catch (e) {
            console.error('Error parsing corp data:', e);
        }
    },

    handleDivChange: function(divId) {
        if (!divId) return;
        
        var divSelect = document.getElementById('div');
        var brigadeContainer = document.getElementById('brigadeContainer');
        var brigadeSelect = document.getElementById('brigade');
        var selectedOption = divSelect.options[divSelect.selectedIndex];
        
        // Reset child selectors
        document.getElementById('appt').value = '';
        document.getElementById('brigade').innerHTML = '<option value="">Select a brigade</option>';
        document.getElementById('unit').innerHTML = '<option value="">Select a unit</option>';
        
        // Hide unit container
        document.getElementById('unitContainer').style.display = 'none';
        
        // Reset user info
        this.resetUserInfo();
        
        try {
            if (selectedOption && selectedOption.dataset.divData) {
                var divData = JSON.parse(selectedOption.dataset.divData);
                
                if (divData.brigades && divData.brigades.length > 0) {
                    // Populate brigade dropdown
                    divData.brigades.forEach(function(brigade) {
                        var option = document.createElement('option');
                        option.value = brigade.id;
                        option.text = brigade.name;
                        option.dataset.brigadeData = JSON.stringify(brigade);
                        brigadeSelect.appendChild(option);
                    });
                    
                    brigadeContainer.style.display = 'block';
                } else {
                    brigadeContainer.style.display = 'none';
                }
                
                // Update user info if appointment is selected
                this.updateUserInfo();
            }
        } catch (e) {
            console.error('Error parsing div data:', e);
        }
    },

    handleBrigadeChange: function(brigadeId) {
        if (!brigadeId) return;
        
        var brigadeSelect = document.getElementById('brigade');
        var unitContainer = document.getElementById('unitContainer');
        var unitSelect = document.getElementById('unit');
        var selectedOption = brigadeSelect.options[brigadeSelect.selectedIndex];
        
        // Reset child selectors
        document.getElementById('appt').value = '';
        document.getElementById('unit').innerHTML = '<option value="">Select a unit</option>';
        
        // Reset user info
        this.resetUserInfo();
        
        try {
            if (selectedOption && selectedOption.dataset.brigadeData) {
                var brigadeData = JSON.parse(selectedOption.dataset.brigadeData);
                
                if (brigadeData.units && brigadeData.units.length > 0) {
                    // Populate unit dropdown
                    brigadeData.units.forEach(function(unit) {
                        var option = document.createElement('option');
                        option.value = unit.id;
                        option.text = unit.name;
                        unitSelect.appendChild(option);
                    });
                    
                    unitContainer.style.display = 'block';
                } else {
                    unitContainer.style.display = 'none';
                }
                
                // Update user info if appointment is selected
                this.updateUserInfo();
            }
        } catch (e) {
            console.error('Error parsing brigade data:', e);
        }
    },

    handleUnitChange: function(unitId) {
        // Reset appt
        document.getElementById('appt').value = '';
        
        // Reset user info
        this.resetUserInfo();
        
        // Will be updated when appointment is selected
        this.updateUserInfo();
    },

    updateUserInfo: function() {
        var coreSelect = document.getElementById('core');
        var divSelect = document.getElementById('div');
        var brigadeSelect = document.getElementById('brigade');
        var unitSelect = document.getElementById('unit');
        var apptSelect = document.getElementById('appt');
        var nameInput = document.getElementById('name');
        var emailInput = document.getElementById('email');
        var usernameInput = document.getElementById('username');
        
        var appt = apptSelect.value;
        if (!appt) return;
        
        var unitName = '';
        var locationName = '';
        
        // Try to get unit name first
        if (unitSelect.selectedIndex > 0) {
            var selectedUnit = unitSelect.options[unitSelect.selectedIndex];
            unitName = selectedUnit.text;
            locationName = unitName;
        }
        // If no unit, try brigade
        else if (brigadeSelect.selectedIndex > 0) {
            locationName = brigadeSelect.options[brigadeSelect.selectedIndex].text;
        }
        // If no brigade, try div
        else if (divSelect.selectedIndex > 0) {
            locationName = divSelect.options[divSelect.selectedIndex].text;
        }
        // If no div, use core
        else if (coreSelect.selectedIndex > 0) {
            locationName = coreSelect.options[coreSelect.selectedIndex].text;
        }
        
        if (locationName) {
            var fullName = locationName + '-' + appt;
            var username = fullName;
            var email = fullName.toLowerCase().replace(/\s+/g, '-') + '@commandfund.com';
            
            nameInput.value = fullName;
            usernameInput.value = username;
            emailInput.value = email;
        }
    },

    resetUserInfo: function() {
        document.getElementById('name').value = '';
        document.getElementById('email').value = '';
        document.getElementById('username').value = '';
    },

    validatePasswordLength: function() {
        var password = document.getElementById('password').value;
        var errorMsg = document.querySelector('.password-error');
        
        if (password && password.length < 8) {
            errorMsg.style.display = 'block';
            return false;
        } else {
            errorMsg.style.display = 'none';
            return true;
        }
    },

    validatePasswordsMatch: function() {
        var password = document.getElementById('password').value;
        var confirmPassword = document.getElementById('confirm_password').value;
        var errorMsg = document.querySelector('.password-match-error');
        
        if (confirmPassword && password !== confirmPassword) {
            errorMsg.style.display = 'block';
            return false;
        } else {
            errorMsg.style.display = 'none';
            return true;
        }
    },

    validateForm: function() {
        var form = document.getElementById('addUserForm');
        var requiredFields = form.querySelectorAll('[required]');
        var isValid = true;
        
        // Check all required fields
        requiredFields.forEach(function(field) {
            if (!field.value.trim()) {
                isValid = false;
                field.classList.add('error');
            } else {
                field.classList.remove('error');
            }
        });
        
        // Validate password length
        if (!this.validatePasswordLength()) {
            isValid = false;
        }
        
        // Validate password match
        if (!this.validatePasswordsMatch()) {
            isValid = false;
        }
        
        return isValid;
    },

    handleSubmit: function(formData) {
        var self = this;
        var submitButton = document.querySelector('button[type="submit"]');

        if (submitButton.disabled) {
            return;
        }
        submitButton.disabled = true;

        // Initialize userData object with the structure expected by the API
        var userData = {
            username: "",
            appt: "",
            email: "",
            name: "",
            password: "",
            is_active: false,
            is_superuser: false,
            corp_id: null,
            div_id: null,
            brigade_id: null,
            unit_id: null
        };

        // Process form data
        for (var pair of formData.entries()) {
            var key = pair[0];
            var value = pair[1];

            if (key === 'confirm_password') {
                // Skip confirm_password as it's not needed for API
                continue;
            } 
            else if (['is_superuser', 'is_active'].includes(key)) {
                // Handle checkboxes
                userData[key] = value === 'on';
            }
            else if (['corp_id', 'div_id', 'brigade_id', 'unit_id'].includes(key)) {
                // Handle ID fields - convert to number if value exists, otherwise keep as null
                userData[key] = value ? Number(value) : null;
            }
            else {
                // Handle other fields as strings
                userData[key] = value;
            }
        }

        console.log('Submitting user data:', userData);

        ApiClient.createUser(userData)
            .then(function(response) {
                self.close();
                // Show success message
                Utils.onSuccess('add', 'User');
                if (self.onSuccess && typeof self.onSuccess === 'function') {
                    self.onSuccess();
                }
            })
            .catch(function(error) {
                console.error('Failed to create user:', error);
                Utils.onSuccess('error', (error.message || 'Unknown error creating user'));
            })
            .finally(function() {
                submitButton.disabled = false;
            });
    },

    close: function() {
        this.cleanup();
    }
};

window.AddUser = AddUser;
