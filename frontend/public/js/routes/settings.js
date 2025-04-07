var SettingsApp = {
    init: function() {
        this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
        
        // Mark that we're in settings page
        sessionStorage.setItem('isSettings', 'true');
        Utils.storeLastVisited('settings');
        
        // Define tabs configuration
        this.tabsConfig = [
            { title: "My profile", component: "UserInformation" },
            { title: "Password", component: "ChangePassword" },
            { title: "Heads Management", component: "HeadsManagement" },
            { title: "Settings", component: "SettingsIVY" },
            { title: "Appointment", component: "UserAppoint" }
        ];
        
        // Filter tabs based on user permissions
        this.finalTabs = this.currentUser.is_superuser 
            ? this.tabsConfig 
            : this.tabsConfig.slice(0, 3);
        
        // Show settings page with first tab active
        this.showSettingsPage();
        this.activeTabIndex = 0;
        this.renderTabContent(0);
    },
    
    cleanup: function() {
        // Remove existing event listeners if any
    },
    
    showSettingsPage: function() {
        var content = document.getElementById('content');
        if (!content) {
            console.error('Content element not found');
            return;
        }
        
        // Create the settings page structure
        var html = `
            <div class="container-fluid">
                <div class="page-header">
                    <h1 class="page-title">User Settings</h1>
                </div>
                
                <div class="settings-container">
                    <div class="settings-tabs">
                        <ul class="tabs-list" id="settingsTabs">
                            ${this.renderTabsList()}
                        </ul>
                    </div>
                    
                    <div class="settings-content" id="settingsContent">
                        <!-- Tab content will be rendered here -->
                    </div>
                </div>
            </div>
        `;
        
        content.innerHTML = html;
        
        // Setup event listeners
        this.setupEventListeners();
    },
    
    renderTabsList: function() {
        var html = '';
        
        this.finalTabs.forEach(function(tab, index) {
            var activeClass = index === 0 ? 'active' : '';
            html += `<li class="tab ${activeClass}" data-index="${index}">${tab.title}</li>`;
        });
        
        return html;
    },
    
    renderTabContent: function(tabIndex) {
        var contentContainer = document.getElementById('settingsContent');
        if (!contentContainer) return;
        
        // Update active tab
        var tabs = document.querySelectorAll('#settingsTabs .tab');
        tabs.forEach(function(tab) {
            tab.classList.remove('active');
        });
        tabs[tabIndex].classList.add('active');
        
        // Get the component name for the selected tab
        var componentName = this.finalTabs[tabIndex].component;
        contentContainer.innerHTML = '';
        
        // Render the appropriate content based on the selected tab
        switch(componentName) {
            case 'UserInformation':
                // Use the UserInformation component
                if (typeof UserInformation !== 'undefined') {
                    UserInformation.init(contentContainer, this.currentUser);
                } else {
                    contentContainer.innerHTML = '<div class="settings-panel"><p>User Information component not loaded.</p></div>';
                    console.error('UserInformation component not found');
                }
                break;
            case 'ChangePassword':
                // Use the ChangePassword component
                if (typeof ChangePassword !== 'undefined') {
                    ChangePassword.init(contentContainer);
                } else {
                    contentContainer.innerHTML = '<div class="settings-panel"><p>Change Password component not loaded.</p></div>';
                    console.error('ChangePassword component not found');
                }
                break;
            case 'HeadsManagement':
                // Use the HeadsManagement component
                if (typeof HeadsManagement !== 'undefined') {
                    HeadsManagement.init(contentContainer);
                } else {
                    contentContainer.innerHTML = '<div class="settings-panel"><p>Heads Management component not loaded.</p></div>';
                    console.error('HeadsManagement component not found');
                }
                break;
            case 'SettingsIVY':
                this.renderSettingsIVY(contentContainer);
                break;
            case 'UserAppoint':
                this.renderUserAppoint(contentContainer);
                break;
            default:
                contentContainer.innerHTML = '<div class="settings-panel"><p>Component not implemented yet.</p></div>';
        }
    },
    
    renderSettingsIVY: function(container) {
        container.innerHTML = `
            <div class="settings-panel">
                <h2>IVY Settings</h2>
                <div class="ivy-settings">
                    <div class="form-group">
                        <label for="ivyApiKey">API Key</label>
                        <input type="text" id="ivyApiKey" class="form-control" />
                    </div>
                    <div class="form-group">
                        <label for="ivyEndpoint">Endpoint URL</label>
                        <input type="text" id="ivyEndpoint" class="form-control" />
                    </div>
                    <div class="form-group">
                        <label>Features</label>
                        <div class="checkbox-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="featureAutomation"> 
                                <span>Enable Automation</span>
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" id="featureReporting"> 
                                <span>Enable Reporting</span>
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" id="featureAnalytics"> 
                                <span>Enable Analytics</span>
                            </label>
                        </div>
                    </div>
                    <button type="button" id="saveIvySettings" class="btn btn-primary">Save Settings</button>
                </div>
            </div>
        `;
        
        // Setup event listener for save button
        var saveBtn = document.getElementById('saveIvySettings');
        if (saveBtn) {
            saveBtn.addEventListener('click', this.handleSaveIvySettings.bind(this));
        }
    },
    
    renderUserAppoint: function(container) {
        container.innerHTML = `
            <div class="settings-panel">
                <h2>Appointment Management</h2>
                <div class="appointment-controls">
                    <button id="scheduleAppointment" class="btn btn-secondary">Schedule New Appointment</button>
                    <div class="date-filter">
                        <label>Filter by Date:</label>
                        <input type="date" id="appointmentDateFilter" class="form-control">
                    </div>
                </div>
                
                <div class="appointments-list" id="appointmentsList">
                    <div class="loading-indicator">Loading appointments...</div>
                </div>
            </div>
        `;
        
        // Setup event listeners
        var scheduleBtn = document.getElementById('scheduleAppointment');
        if (scheduleBtn) {
            scheduleBtn.addEventListener('click', this.showScheduleAppointmentModal.bind(this));
        }
        
        var dateFilter = document.getElementById('appointmentDateFilter');
        if (dateFilter) {
            dateFilter.addEventListener('change', this.handleAppointmentDateFilter.bind(this));
        }
        
        // Load appointments
        this.loadAppointments();
    },
    
    loadAppointments: function() {
        var appointmentsContainer = document.getElementById('appointmentsList');
        if (!appointmentsContainer) return;
        
        appointmentsContainer.innerHTML = '<div class="loading-indicator">Loading appointments...</div>';
        
        // Simulate API call to load appointments
        setTimeout(function() {
            var mockAppointments = [
                { id: 1, title: 'Budget Review', date: '2023-11-25', time: '10:00 AM', with: 'Finance Team' },
                { id: 2, title: 'Investment Planning', date: '2023-11-30', time: '2:00 PM', with: 'Investment Advisor' },
                { id: 3, title: 'Tax Consultation', date: '2023-12-05', time: '11:30 AM', with: 'Tax Consultant' }
            ];
            
            this.renderAppointmentsList(mockAppointments, appointmentsContainer);
        }.bind(this), 500);
    },
    
    renderAppointmentsList: function(appointments, container) {
        if (appointments.length === 0) {
            container.innerHTML = '<div class="empty-state">No appointments found. Schedule one to get started.</div>';
            return;
        }
        
        var html = '<div class="appointments-table">';
        html += `
            <table class="table">
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>With</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        appointments.forEach(function(appointment) {
            html += `
                <tr>
                    <td>${appointment.title}</td>
                    <td>${appointment.date}</td>
                    <td>${appointment.time}</td>
                    <td>${appointment.with}</td>
                    <td>
                        <button class="btn-icon edit-appointment" data-id="${appointment.id}"><i class="fas fa-edit"></i></button>
                        <button class="btn-icon delete-appointment" data-id="${appointment.id}"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table></div>';
        container.innerHTML = html;
        
        // Attach event listeners to buttons
        var editButtons = container.querySelectorAll('.edit-appointment');
        editButtons.forEach(function(btn) {
            btn.addEventListener('click', function() {
                this.handleEditAppointment(btn.dataset.id);
            }.bind(this));
        }.bind(this));
        
        var deleteButtons = container.querySelectorAll('.delete-appointment');
        deleteButtons.forEach(function(btn) {
            btn.addEventListener('click', function() {
                this.handleDeleteAppointment(btn.dataset.id);
            }.bind(this));
        }.bind(this));
    },
    
    setupEventListeners: function() {
        // Setup tab click events
        var tabs = document.querySelectorAll('#settingsTabs .tab');
        tabs.forEach(function(tab) {
            tab.addEventListener('click', function() {
                var index = parseInt(tab.dataset.index);
                this.activeTabIndex = index;
                this.renderTabContent(index);
            }.bind(this));
        }.bind(this));
    },
    
    showScheduleAppointmentModal: function() {
        alert('Schedule appointment functionality would be implemented here.');
    },
    
    handleAppointmentDateFilter: function() {
        var filterDate = document.getElementById('appointmentDateFilter').value;
        alert('Filtering appointments by date: ' + filterDate);
    },
    
    handleEditAppointment: function(appointmentId) {
        alert('Edit appointment functionality for ID: ' + appointmentId + ' would be implemented here.');
    },
    
    handleDeleteAppointment: function(appointmentId) {
        if (confirm('Are you sure you want to delete this appointment? This action cannot be undone.')) {
            alert('Appointment with ID: ' + appointmentId + ' would be deleted here.');
        }
    },
    
    handleSaveIvySettings: function() {
        var apiKey = document.getElementById('ivyApiKey').value;
        var endpoint = document.getElementById('ivyEndpoint').value;
        var featureAutomation = document.getElementById('featureAutomation').checked;
        var featureReporting = document.getElementById('featureReporting').checked;
        var featureAnalytics = document.getElementById('featureAnalytics').checked;
        
        // Validate inputs
        if (!apiKey || !endpoint) {
            alert('Please fill in all required fields.');
            return;
        }
        
        // Send API request to save settings
        alert('IVY settings saved successfully!');
    }
};

// Make SettingsApp globally available
window.SettingsApp = SettingsApp;
