var Sidebar = {
    init: function() {
        this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
        this.isMobile = window.innerWidth < 768;
        this.isOpen = false;
        this.render();
        this.setupEventListeners();
    },

    items: [
        { icon: 'home', title: "Dashboard", path: "/index.html" },
        { icon: 'arrow-down', title: "Inflow", path: "/inflow.html" },
        { icon: 'arrow-up', title: "Outflow", path: "/outflow" },
        { icon: 'hand-holding-usd', title: "Investment", path: "/investment" },
        { icon: 'minus-circle', title: "Liability", path: "/liability" },
        { icon: 'coins', title: "Assets / Inventory", path: "/assets" },
        { icon: 'cog', title: "User Profile", path: "/settings" }
    ],

    adminItems: [
        { icon: 'users', title: "Users", path: "/admin" },
        { icon: 'activity', title: "Activity Logs", path: "/activity" }
    ],

    render: function() {
        // Mobile Menu Button
        if (this.isMobile) {
            document.querySelector('.menu-toggle').innerHTML = `
                <button class="menu-btn" aria-label="Open Menu">
                    <svg class="icon" viewBox="0 0 24 24">
                        <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                    </svg>
                </button>
            `;
        }

        // Sidebar Content
        var sidebarContent = `
            <div class="sidebar-content">
                <div class="sidebar-header">
                    <img src="/assets/images/fastapi-logo.svg" alt="Logo" class="sidebar-logo">
                    ${this.isMobile ? '<button class="close-btn">&times;</button>' : ''}
                </div>
                <nav class="sidebar-nav">
                    ${this.renderNavItems()}
                </nav>
                <div class="sidebar-footer">
                    <button class="logout-btn">
                        <svg class="icon" viewBox="0 0 24 24">
                            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                        </svg>
                        <span>Log out</span>
                    </button>
                    ${this.currentUser.email ? `
                        <div class="user-info">
                            Logged in as: ${this.currentUser.email}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        var sidebarContainer = document.querySelector('.sidebar');
        sidebarContainer.innerHTML = sidebarContent;
    },

    renderNavItems: function() {
        var self = this;
        var currentPath = window.location.pathname;
        var finalItems = this.currentUser.is_superuser 
            ? [...this.items, ...this.adminItems]
            : this.items;

        return finalItems.map(function(item) {
            var isActive = currentPath === item.path;
            return `
                <a href="#" 
                   class="nav-item ${isActive ? 'active' : ''}"
                   data-path="${item.path}" 
                   onclick="Sidebar.handleNavigation(event, '${item.path}')">
                    <svg class="icon" viewBox="0 0 24 24">
                        ${self.getIconPath(item.icon)}
                    </svg>
                    <span>${item.title}</span>
                </a>
            `;
        }).join('');
    },

    getIconPath: function(icon) {
        // Add SVG paths for each icon
        const icons = {
            'home': 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
            'arrow-down': 'M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z',
            // Add other icon paths...
        };
        return icons[icon] || '';
    },

    setupEventListeners: function() {
        var self = this;

        // Mobile menu toggle
        var menuBtn = document.querySelector('.menu-btn');
        if (menuBtn) {
            menuBtn.addEventListener('click', function() {
                self.toggleSidebar();
            });
        }

        // Close button
        var closeBtn = document.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                self.toggleSidebar();
            });
        }

        // Logout button
        var logoutBtn = document.querySelector('.logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function() {
                self.handleLogout();
            });
        }

        // Handle window resize
        window.addEventListener('resize', function() {
            self.handleResize();
        });
    },

    toggleSidebar: function() {
        this.isOpen = !this.isOpen;
        document.querySelector('.sidebar').classList.toggle('open');
    },

    handleLogout: function() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('currentUser');
        window.location.href = '/login.html';
    },

    handleResize: function() {
        var wasMobile = this.isMobile;
        this.isMobile = window.innerWidth < 768;
        
        if (wasMobile !== this.isMobile) {
            this.render();
            this.setupEventListeners();
        }
    },

    handleNavigation: function(event, path) {
        event.preventDefault();
        console.log('Navigating to:', path);
        
        // Update active state
        document.querySelectorAll('.nav-item').forEach(function(item) {
            item.classList.remove('active');
        });
        event.currentTarget.classList.add('active');
        
        // Navigate to the new page
        history.pushState(null, '', path);
        MainApp.handleNavigation();
    }
};

// Make it globally available
window.Sidebar = Sidebar; 