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
            '/inflow': this.showInflows,
            '/outflow': this.showOutflows,
            '/investment': this.showInvestments,
            '/liability': this.showLiabilities,
            '/assets': this.showAssets,
            '/settings': this.showSettings,
            '/admin': this.showAdmin,
        };
    },

    showDashboard: function() {
        DashboardApp.init();
    },
    showInflows: function() {
        InflowApp.init();
    },
    showOutflows: function() {
        OutflowApp.init();
    },
    showInvestments: function() {
        InvestmentApp.init();
    },
    showLiabilities: function() {
        LiabilityApp.init();
    },
    showAssets: function() {
        AssetsApp.init();
    },
    showSettings: function() {
        SettingsApp.init();
    },
    showAdmin: function() {
        AdminApp.init();
    },
    handleNavigation: function() {
    var path = window.location.pathname;
    console.log('Handling navigation for path:', path);
    var content = document.getElementById('content');
    content.innerHTML = '';  // Clear previous content
    
    if (path === '/inflow') {
        InflowApp.init(); // This should load the inflow table
    } else if (path === '/outflow') {
        OutflowApp.init();
    } else if (path === '/' || path === '/index.html') {
        this.showDashboard();
    } else if (path === '/investment') {
        InvestmentApp.init();
    } else if (path === '/liability') {
        LiabilityApp.init();
    } else if (path === '/assets') {
        AssetsApp.init();
    } else if (path === '/settings') {
        SettingsApp.init();
    } else if (path === '/admin') {
        AdminApp.init();
    } else {
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