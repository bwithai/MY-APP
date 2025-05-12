var SettingsApp = {
    init: function() {
        this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
        
        // Mark that we're in settings page
        sessionStorage.setItem('isSettings', 'true');
        Utils.storeLastVisited('settings');
        
        // Define tabs configuration
        this.tabsConfig = [
            { title: "My profile", component: "UserInformation" },
            { title: "Heads Management", component: "HeadsManagement" },
            { title: "Settings", component: "SettingsIVY" },
            { title: "Appointment", component: "UserAppoint" }
        ];
        
        // Filter tabs based on user permissions
        this.finalTabs = this.currentUser.is_superuser 
            ? this.tabsConfig 
            : this.tabsConfig.slice(0, 2);
        
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
        
        // Add styles for the grid layout
        this.addGridStyles();
        
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
    
    addGridStyles: function() {
        // Check if styles already exist
        if (document.getElementById('settings-grid-styles')) {
            return;
        }
        
        // Create and add custom styles for grid layout
        var styleElement = document.createElement('style');
        styleElement.id = 'settings-grid-styles';
        styleElement.textContent = `
            .settings-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                grid-gap: 20px;
                margin-bottom: 20px;
            }
            
            @media (max-width: 768px) {
                .settings-grid {
                    grid-template-columns: 1fr;
                }
            }
        `;
        
        document.head.appendChild(styleElement);
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
                // Create a grid container for UserInformation and ChangePassword
                var gridContainer = document.createElement('div');
                gridContainer.className = 'settings-grid';
                contentContainer.appendChild(gridContainer);
                
                // Create left container for UserInformation
                var leftContainer = document.createElement('div');
                leftContainer.className = 'user-info-container';
                gridContainer.appendChild(leftContainer);
                
                // Create right container for ChangePassword
                var rightContainer = document.createElement('div');
                rightContainer.className = 'password-container';
                gridContainer.appendChild(rightContainer);
                
                // Initialize UserInformation in left container
                if (typeof UserInformation !== 'undefined') {
                    UserInformation.init(leftContainer, this.currentUser);
                } else {
                    console.error('UserInformation component not found');
                    leftContainer.innerHTML = '<div class="settings-panel"><p>User Information component not loaded.</p></div>';
                }
                
                // Initialize ChangePassword in right container
                if (typeof ChangePassword !== 'undefined') {
                    ChangePassword.init(rightContainer);
                } else {
                    console.error('ChangePassword component not found');
                    rightContainer.innerHTML = '<div class="settings-panel"><p>Change Password component not loaded.</p></div>';
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
        // Initialize the AppointmentList component if it exists
        if (typeof AppointmentList !== 'undefined') {
            AppointmentList.init(container);
        } else {
            // Try to load the AppointmentList component dynamically
            this.loadAppointmentComponents(container);
        }
    },
    
    loadAppointmentComponents: function(container) {
        container.innerHTML = '<div class="loading-indicator">Loading appointment management...</div>';
        
        var self = this;
        var scripts = [
            '/js/components/Appointment/AddAppt.js',
            '/js/components/Appointment/AppointmentList.js'
        ];
        
        var loadedCount = 0;
        
        scripts.forEach(function(src) {
            var script = document.createElement('script');
            script.src = src;
            script.onload = function() {
                loadedCount++;
                if (loadedCount === scripts.length) {
                    if (typeof AppointmentList !== 'undefined') {
                        AppointmentList.init(container);
                    } else {
                        container.innerHTML = '<div class="error-message">Failed to load appointment components.</div>';
                    }
                }
            };
            script.onerror = function() {
                container.innerHTML = '<div class="error-message">Failed to load appointment components.</div>';
            };
            document.body.appendChild(script);
        });
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
