var MainApp = {
    init: function() {
        this.token = localStorage.getItem('access_token');
        if (!this.token) {
            window.location.href = '/login.html';
            return;
        }
        
        // Initialize sidebar first
        Sidebar.init();
        
        // Handle initial navigation
        if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
            this.showDashboard();
        } else {
            this.handleNavigation();
        }
    },

    setupRoutes: function() {
        this.routes = {
            '/': this.showDashboard,
            '/inflows': this.showInflows,
            '/outflows': this.showOutflows,
            '/heads': this.showHeads,
            '/profile': this.showProfile
        };
    },

    handleNavigation: function() {
        var path = window.location.pathname;
        console.log('Handling navigation for path:', path);

        if (path === '/inflow.html') {
            InflowApp.init();
        } else if (path === '/' || path === '/index.html') {
            this.showDashboard();
        } else {
            // Show 404 page for unsupported routes
            var content = document.getElementById('content');
            content.innerHTML = `
                <div class="content-wrapper text-center">
                    <div class="page-header">
                        <h1 class="page-title">404 - Page Not Found</h1>
                    </div>
                    <p class="mb-4">This page is not yet supported. Currently only inflow management is available.</p>
                    <button class="btn btn-primary" onclick="window.location.href='/'">Return to Dashboard</button>
                </div>
            `;
        }
    },

    showDashboard: function() {
        var content = document.getElementById('content');
        content.innerHTML = `
            <div class="content-wrapper">
                <div class="page-header">
                    <h1 class="page-title">Dashboard</h1>
                    <p class="text-muted">Welcome to Command Fund Management System</p>
                </div>
                <div class="dashboard-stats">
                    Loading...
                </div>
            </div>
        `;
        
        // Load dashboard data
        this.loadDashboardData();
    },

    loadDashboardData: function() {
        ApiClient.getDashboardData()
            .then(function(data) {
                var statsContainer = document.querySelector('.dashboard-stats');
                // Update dashboard with actual data
                statsContainer.innerHTML = `
                    <div class="stat-card">
                        <h3>Total Inflow</h3>
                        <p>${data.total_inflow}</p>
                    </div>
                    <div class="stat-card">
                        <h3>Total Outflow</h3>
                        <p>${data.total_outflow}</p>
                    </div>
                    <!-- Add more stats as needed -->
                `;
            })
            .catch(function(error) {
                console.error('Failed to load dashboard data:', error);
            });
    },

    logout: function() {
        localStorage.removeItem('access_token');
        window.location.href = '/login.html';
    }
};

// Make it globally available
window.MainApp = MainApp;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    MainApp.init();
}); 