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
        
        console.log('Rendering tab content for:', componentName);
        
        // Render the appropriate content based on the selected tab
        switch(componentName) {
            case 'UserInformation':
                // Use the UserInformation component
                if (typeof UserInformation !== 'undefined') {
                    UserInformation.init(contentContainer, this.currentUser);
                } else {
                    console.error('UserInformation component not found');
                    contentContainer.innerHTML = '<div class="settings-panel"><p>User Information component not loaded.</p></div>';
                }
                break;
            case 'ChangePassword':
                // Use the ChangePassword component
                if (typeof ChangePassword !== 'undefined') {
                    ChangePassword.init(contentContainer);
                } else {
                    console.error('ChangePassword component not found');
                    contentContainer.innerHTML = '<div class="settings-panel"><p>Change Password component not loaded.</p></div>';
                }
                break;
            case 'HeadsManagement':
                // Use the HeadsManagement component
                if (typeof HeadsManagement !== 'undefined') {
                    HeadsManagement.init(contentContainer);
                } else {
                    console.error('HeadsManagement component not found');
                    contentContainer.innerHTML = '<div class="settings-panel"><p>Heads Management component not loaded.</p></div>';
                }
                break;
            case 'SettingsIVY':
                // Use the SettingsIVY component
                this.loadSettingsIVYComponent(contentContainer);
                break;
            case 'UserAppoint':
                this.renderUserAppoint(contentContainer);
                break;
            default:
                contentContainer.innerHTML = '<div class="settings-panel"><p>Component not implemented yet.</p></div>';
        }
    },
    
    loadSettingsIVYComponent: function(contentContainer) {
        console.log('Checking for SettingsIVY component:', typeof SettingsIVY);
        
        // Check if component exists
        if (typeof SettingsIVY !== 'undefined') {
            try {
                console.log('Initializing SettingsIVY component...');
                SettingsIVY.init(contentContainer);
                console.log('SettingsIVY component initialized');
            } catch (error) {
                console.error('Error initializing SettingsIVY component:', error);
                contentContainer.innerHTML = '<div class="settings-panel"><p>Error initializing IVY Settings component. Check console for details.</p></div>';
            }
        } else {
            console.error('SettingsIVY component not found. Available components:', 
                Object.keys(window).filter(function(key) { 
                    return key.includes('IVY') || key.includes('Settings') || key.includes('Component'); 
                })
            );
            
            // Try to dynamically load the SettingsIVY component
            this.tryToLoadSettingsIVYScript(contentContainer);
        }
    },
    
    tryToLoadSettingsIVYScript: function(contentContainer) {
        contentContainer.innerHTML = '<div class="settings-panel"><p>Loading IVY Settings component...</p></div>';
        
        // Create a script element to load the SettingsIVY component
        var script = document.createElement('script');
        script.src = '/js/components/IVY/SettingsIVY.js';
        script.onload = function() {
            console.log('SettingsIVY script loaded dynamically');
            if (typeof SettingsIVY !== 'undefined') {
                console.log('SettingsIVY component available after dynamic loading');
                SettingsIVY.init(contentContainer);
            } else {
                console.error('SettingsIVY component still not available after script load');
                contentContainer.innerHTML = '<div class="settings-panel"><p>Failed to load IVY Settings component.</p></div>';
            }
        };
        script.onerror = function() {
            console.error('Failed to load SettingsIVY script');
            contentContainer.innerHTML = '<div class="settings-panel"><p>Failed to load IVY Settings component. Script not found.</p></div>';
        };
        
        document.body.appendChild(script);
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
    }
};

// Make SettingsApp globally available
window.SettingsApp = SettingsApp;
