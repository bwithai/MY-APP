var Sidebar = {
    init: function() {
        // Use try-catch for JSON parsing to handle potential errors
        try {
            this.currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        } catch(e) {
            this.currentUser = {};
            console.error('Error parsing user data:', e);
        }
        
        this.isMobile = window.innerWidth < 768;
        this.isOpen = !this.isMobile; // Default open on desktop, closed on mobile
        this.sidebarState = localStorage.getItem('sidebarState');
        
        // If we have a saved state, use it
        if (this.sidebarState !== null) {
            this.isOpen = this.sidebarState === 'open';
        }
        
        this.render();
        this.setupEventListeners();
        this.applySidebarState(); // Apply initial state
    },

    items: [
        { icon: 'home', title: "Dashboard", path: "/index.html" },
        { icon: 'arrow-down', title: "Inflow", path: "/inflow" },
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
        // Toggle Button (visible on all screen sizes) with tooltip
        var toggleButton = '<button class="menu-btn" aria-label="' + 
            (this.isOpen ? 'Close' : 'Open') + ' Menu">' +
            '<svg class="icon" viewBox="0 0 24 24">' +
            '<path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>' +
            '</svg>' +
            '<span class="menu-tooltip">' + (this.isOpen ? 'Hide Sidebar' : 'Show Sidebar') + '</span>' +
            '</button>';
        
        var menuToggle = document.querySelector('.menu-toggle');
        if (menuToggle) {
            menuToggle.innerHTML = toggleButton;
        }

        // Sidebar Content without close button
        var userInfo = '';
        if (this.currentUser && this.currentUser.email) {
            userInfo = '<div class="user-info">' +
                'Logged in as: ' + this.currentUser.username +
                '</div>';
        }
        
        var sidebarContent = '<div class="sidebar-content">' +
            '<div class="sidebar-header">' +
            '<img src="/assets/images/logo.png" alt="Logo" class="sidebar-logo">' +
            '</div>' +
            '<nav class="sidebar-nav">' +
            this.renderNavItems() +
            '</nav>' +
            '<div class="sidebar-footer">' +
            '<button class="logout-btn">' +
            '<svg class="icon" viewBox="0 0 24 24">' +
            '<path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>' +
            '</svg>' +
            '<span>Log out</span>' +
            '</button>' +
            userInfo +
            '</div>' +
            '</div>';

        var sidebarContainer = document.querySelector('.sidebar');
        if (sidebarContainer) {
            sidebarContainer.innerHTML = sidebarContent;
        }
    },

    renderNavItems: function() {
        var self = this;
        var currentPath = window.location.pathname;
        var finalItems = this.items;
        
        // Add admin items if user is superuser
        if (this.currentUser && this.currentUser.is_superuser) {
            finalItems = this.items.concat(this.adminItems);
        }

        var navItemsHtml = '';
        for (var i = 0; i < finalItems.length; i++) {
            var item = finalItems[i];
            var isActive = currentPath === item.path;
            var activeClass = isActive ? 'active' : '';
            
            navItemsHtml += '<a href="#" ' +
                'class="nav-item ' + activeClass + '" ' +
                'data-path="' + item.path + '" ' +
                'onclick="Sidebar.handleNavigation(event, \'' + item.path + '\')">' +
                '<svg class="icon" viewBox="0 0 24 24">' +
                '<path d="' + self.getIconPath(item.icon) + '"/>' +
                '</svg>' +
                '<span>' + item.title + '</span>' +
                '</a>';
        }
        
        return navItemsHtml;
    },

    getIconPath: function(icon) {
        // Add SVG paths for each icon
        var icons = {
            'home': 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
            'arrow-down': 'M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z',
            'arrow-up': 'M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z',
            'hand-holding-usd': 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z',
            'minus-circle': 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z',
            'coins': 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z',
            'cog': 'M19.43 12.98c.04-.32.07-.64.07-.98 0-.34-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.09-.16-.26-.25-.44-.25-.06 0-.12.01-.17.03l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.06-.02-.12-.03-.18-.03-.17 0-.34.09-.43.25l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98 0 .33.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.09.16.26.25.44.25.06 0 .12-.01.17-.03l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.06.02.12.03.18.03.17 0 .34-.09.43-.25l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zm-1.98-1.71c.04.31.05.52.05.73 0 .21-.02.43-.05.73l-.14 1.13.89.7 1.08.84-.7 1.21-1.27-.51-1.04-.42-.9.68c-.43.32-.84.56-1.25.73l-1.06.43-.16 1.13-.2 1.35h-1.4l-.19-1.35-.16-1.13-1.06-.43c-.43-.18-.83-.41-1.23-.71l-.91-.7-1.06.43-1.27.51-.7-1.21 1.08-.84.89-.7-.14-1.13c-.03-.31-.05-.54-.05-.74s.02-.43.05-.73l.14-1.13-.89-.7-1.08-.84.7-1.21 1.27.51 1.04.42.9-.68c.43-.32.84-.56 1.25-.73l1.06-.43.16-1.13.2-1.35h1.39l.19 1.35.16 1.13 1.06.43c.43.18.83.41 1.23.71l.91.7 1.06-.43 1.27-.51.7 1.21-1.07.85-.89.7.14 1.13zM12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z',
            'users': 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
            'activity': 'M13.5,8H12V13L16.28,15.54L17,14.33L13.5,12.25V8M13,3A9,9 0 0,0 4,12H1L4.96,16.03L9,12H6A7,7 0 0,1 13,5A7,7 0 0,1 20,12A7,7 0 0,1 13,19C11.07,19 9.32,18.21 8.06,16.94L6.64,18.36C8.27,20 10.5,21 13,21A9,9 0 0,0 22,12A9,9 0 0,0 13,3'
        };
        return icons[icon] || '';
    },

    setupEventListeners: function() {
        var self = this;

        // Menu toggle button (works on all screen sizes)
        var menuBtns = document.querySelectorAll('.menu-btn');
        for (var i = 0; i < menuBtns.length; i++) {
            menuBtns[i].onclick = function(e) {
                e.preventDefault();
                self.toggleSidebar();
            };
        }

        // Logout button
        var logoutBtn = document.querySelector('.logout-btn');
        if (logoutBtn) {
            logoutBtn.onclick = function(e) {
                e.preventDefault();
                self.handleLogout();
            };
        }

        // Handle window resize
        if (window.attachEvent) {
            // For IE8 and earlier
            window.attachEvent('onresize', function() {
                self.handleResize();
            });
        } else if (window.addEventListener) {
            // For modern browsers
            window.addEventListener('resize', function() {
                self.handleResize();
            }, false);
        }
        
        // Handle clicks outside sidebar to close it on mobile
        if (document.addEventListener) {
            document.addEventListener('click', function(event) {
                if (self.isMobile && self.isOpen) {
                    var sidebar = document.querySelector('.sidebar');
                    var menuBtn = document.querySelector('.menu-btn');
                    var target = event.target || event.srcElement;
                    
                    // Check if click is outside sidebar and not on menu button
                    var isOutsideSidebar = true;
                    var isOnMenuBtn = false;
                    
                    // Check if click is on sidebar
                    var element = target;
                    while (element) {
                        if (element === sidebar) {
                            isOutsideSidebar = false;
                            break;
                        }
                        if (element === menuBtn) {
                            isOnMenuBtn = true;
                            break;
                        }
                        element = element.parentNode;
                    }
                    
                    if (isOutsideSidebar && !isOnMenuBtn) {
                        self.toggleSidebar();
                    }
                }
            });
        }
    },

    toggleSidebar: function() {
        this.isOpen = !this.isOpen;
        this.applySidebarState();
        
        // Save state to localStorage
        try {
            localStorage.setItem('sidebarState', this.isOpen ? 'open' : 'closed');
        } catch(e) {
            console.error('Error saving sidebar state:', e);
        }
    },
    
    applySidebarState: function() {
        var sidebar = document.querySelector('.sidebar');
        var content = document.getElementById('content');
        var menuBtn = document.querySelector('.menu-btn');
        
        if (!sidebar || !content) return;
        
        if (this.isOpen) {
            // Open sidebar
            this.addClass(sidebar, 'open');
            
            // Adjust content area
            if (!this.isMobile) {
                content.style.marginLeft = '250px';
                content.style.width = 'calc(100% - 250px)';
            }
            
            // Update tooltip text
            if (menuBtn) {
                var tooltip = menuBtn.querySelector('.menu-tooltip');
                if (tooltip) {
                    tooltip.innerHTML = 'Hide Sidebar';
                }
            }
        } else {
            // Close sidebar
            this.removeClass(sidebar, 'open');
            
            // Adjust content area
            if (!this.isMobile) {
                content.style.marginLeft = '0';
                content.style.width = '100%';
            }
            
            // Update tooltip text
            if (menuBtn) {
                var tooltip = menuBtn.querySelector('.menu-tooltip');
                if (tooltip) {
                    tooltip.innerHTML = 'Show Sidebar';
                }
            }
        }
        
        // Update menu button aria-label
        var menuBtns = document.querySelectorAll('.menu-btn');
        for (var i = 0; i < menuBtns.length; i++) {
            menuBtns[i].setAttribute('aria-label', this.isOpen ? 'Close Menu' : 'Open Menu');
        }
    },
    
    // Helper functions for cross-browser class manipulation
    hasClass: function(element, className) {
        if (element.classList) {
            return element.classList.contains(className);
        } else {
            return new RegExp('(^| )' + className + '( |$)', 'gi').test(element.className);
        }
    },
    
    addClass: function(element, className) {
        if (element.classList) {
            element.classList.add(className);
        } else {
            element.className += ' ' + className;
        }
    },
    
    removeClass: function(element, className) {
        if (element.classList) {
            element.classList.remove(className);
        } else {
            element.className = element.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
            // Trim whitespace
            element.className = element.className.replace(/^\s+|\s+$/g, '');
        }
    },

    handleLogout: function() {
        try {
            localStorage.removeItem('access_token');
            localStorage.removeItem('currentUser');
        } catch(e) {
            console.error('Error during logout:', e);
        }
        window.location.href = '/login.html';
    },

    handleResize: function() {
        var wasMobile = this.isMobile;
        this.isMobile = window.innerWidth < 768;
        
        if (wasMobile !== this.isMobile) {
            this.render();
            this.setupEventListeners();
            this.applySidebarState();
        }
    },

    handleNavigation: function(event, path) {
        if (event) {
            event.preventDefault();
        }
        console.log('Navigating to:', path);
        
        // Update active state
        var navItems = document.querySelectorAll('.nav-item');
        for (var i = 0; i < navItems.length; i++) {
            this.removeClass(navItems[i], 'active');
        }
        
        if (event && event.currentTarget) {
            this.addClass(event.currentTarget, 'active');
        }
        
        // Navigate to the new page
        if (window.history && window.history.pushState) {
            history.pushState(null, '', path);
            if (window.MainApp && typeof window.MainApp.handleNavigation === 'function') {
                window.MainApp.handleNavigation();
            }
        } else {
            // Fallback for older browsers
            window.location.href = path;
        }
    }
};

// Make it globally available
window.Sidebar = Sidebar; 