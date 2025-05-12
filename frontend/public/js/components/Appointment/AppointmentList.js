var AppointmentList = {
    init: function(container) {
        // Store container reference
        this.container = container;
        
        // Initialize state
        this.appointments = [];
        this.isLoading = true;
        
        // Render initial UI
        this.render();
        
        // Load appointments
        this.loadAppointments();
    },
    
    render: function() {
        var html = `
            <div class="appointment-management">
                <div class="section-card">
                    <!-- Header with title and add button -->
                    <div id="apptNavbar"></div>
                    
                    <!-- Appointments list container -->
                    <div id="appointmentsList" class="appointments-container">
                        <div class="loading-indicator">Loading appointments...</div>
                    </div>
                </div>
            </div>
        `;
        
        this.container.innerHTML = html;
        
        // Add some custom styles for the card layout
        this.addStyles();
        
        // Initialize the navbar
        this.initializeNavbar();
    },
    
    addStyles: function() {
        // Check if styles already exist
        if (document.getElementById('appointment-styles')) {
            return;
        }
        
        // Create and add custom styles for appointments
        var styleElement = document.createElement('style');
        styleElement.id = 'appointment-styles';
        styleElement.textContent = `
            .section-card {
                background-color: #f8f9fa;
                border: 1px solid #dee2e6;
                border-radius: 8px;
                padding: 20px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            }
            
            .appointments-container {
                display: flex;
                flex-direction: column;
                margin-top: 20px;
            }
            
            .appt-card {
                background-color: #ffffff;
                border: 1px solid #dee2e6;
                border-radius: 8px;
                padding: 15px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                transition: all 0.3s ease;
                margin-bottom: 15px;
            }
            
            .appt-card:last-child {
                margin-bottom: 0;
            }
            
            .appt-card:hover {
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                transform: translateY(-2px);
            }
            
            .appt-card-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .appt-icon-info {
                display: flex;
                align-items: center;
            }
            
            .appt-icon {
                color: #38b2ac;
                font-size: 24px;
                min-width: 24px;
                margin-right: 15px;
            }
            
            .appt-info {
                display: flex;
                flex-direction: column;
            }
            
            .appt-name {
                font-weight: bold;
                font-size: 1.1rem;
                margin: 0 0 4px 0;
            }
            
            .appt-description {
                color: #6c757d;
                font-size: 0.9rem;
                margin: 0;
            }
            
            .empty-state {
                text-align: center;
                padding: 40px 0;
                color: #6c757d;
                font-size: 1.1rem;
            }
            
            .loading-indicator {
                text-align: center;
                padding: 20px 0;
                color: #6c757d;
            }
            
            .error-message {
                color: #dc3545;
                text-align: center;
                padding: 20px 0;
            }
            
            .navbar-container {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
            }
            .section-title {
                font-size: 1.5rem;
                margin: 0;
            }
        `;
        
        document.head.appendChild(styleElement);
    },
    
    initializeNavbar: function() {
        var navbarContainer = document.getElementById('apptNavbar');
        if (!navbarContainer) return;
        
        if (typeof Navbar !== 'undefined') {
            Navbar.init(navbarContainer, {
                type: 'Appointment',
                addModal: 'AddAppt'
            });
        } else {
            // Create a simple navbar if the Navbar component is not available
            navbarContainer.innerHTML = `
                <div class="navbar-container">
                    <h2 class="section-title">Appointments</h2>
                    <button id="addAppointmentBtn" class="btn btn-primary">+ New Appointment</button>
                </div>
                <style>
                    .navbar-container {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 15px;
                    }
                    .section-title {
                        font-size: 1.5rem;
                        margin: 0;
                    }
                </style>
            `;
            
            // Add event listener for add button
            var addButton = document.getElementById('addAppointmentBtn');
            if (addButton) {
                addButton.addEventListener('click', function() {
                    if (typeof AddAppt !== 'undefined') {
                        AddAppt.open(function() {
                            this.loadAppointments();
                        }.bind(this));
                    } else {
                        console.error('AddAppt component not available');
                    }
                }.bind(this));
            }
        }
    },
    
    loadAppointments: function() {
        var self = this;
        
        // Show loading state
        this.isLoading = true;
        this.updateAppointmentsList();
        
        // Call API to get appointments without parameters
        ApiClient.getAppointments()
        .then(function(response) {
            console.log('Appointments:', response);
            // Handle different potential response formats
            if (Array.isArray(response)) {
                self.appointments = response;
            } else if (response && Array.isArray(response.data)) {
                self.appointments = response.data;
            } else if (response && typeof response === 'object') {
                self.appointments = [response];
            } else {
                self.appointments = [];
            }
            
            self.isLoading = false;
            self.updateAppointmentsList();
        })
        .catch(function(error) {
            console.error('Failed to load appointments:', error);
            self.isLoading = false;
            self.updateAppointmentsList('Error loading appointments: ' + (error.message || 'Unknown error'));
        });
    },
    
    updateAppointmentsList: function(errorMessage) {
        var appointmentsList = document.getElementById('appointmentsList');
        if (!appointmentsList) return;
        
        if (this.isLoading) {
            appointmentsList.innerHTML = '<div class="loading-indicator">Loading appointments...</div>';
            return;
        }
        
        if (errorMessage) {
            appointmentsList.innerHTML = '<div class="error-message">' + errorMessage + '</div>';
            return;
        }
        
        if (!this.appointments || this.appointments.length === 0) {
            appointmentsList.innerHTML = '<div class="empty-state">No appointments available.</div>';
            return;
        }
        
        var html = '';
        
        // Build card for each appointment
        this.appointments.forEach(function(appointment) {
            html += `
                <div class="appt-card" data-id="${appointment.id}">
                    <div class="appt-card-content">
                        <div class="appt-icon-info">
                            <div class="appt-icon">
                                <i class="fas fa-bookmark"></i>
                            </div>
                            <div class="appt-info">
                                <h3 class="appt-name">${appointment.name || 'Untitled Appointment'}</h3>
                                ${appointment.description ? 
                                    '<p class="appt-description">' + appointment.description + '</p>' : 
                                    ''}
                            </div>
                        </div>
                        <div class="appt-actions">
                            ${typeof ActionsMenu !== 'undefined' ? 
                                ActionsMenu.init('Appt', appointment, { view: true, edit: true, delete: true }) : 
                                '<button class="btn btn-sm btn-secondary">View</button>'}
                        </div>
                    </div>
                </div>
            `;
        });
        
        appointmentsList.innerHTML = html;
    }
};

// Make it globally available
window.AppointmentList = AppointmentList;
