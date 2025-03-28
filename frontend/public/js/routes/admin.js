/**
 * Admin route - User management functionality
 */
var AdminApp = {
    init: function() {
        this.content = document.getElementById('content');
        this.currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};
        
        // Parse query parameters for pagination
        var searchParams = new URLSearchParams(window.location.search);
        this.page = parseInt(searchParams.get('page')) || 1;
        this.query = searchParams.get('query') || null;
        
        // Render the admin page
        this.render();
        this.setupEventListeners();
    },
    
    render: function() {
        this.content.innerHTML = `
            <div class="container-fluid">
                <div class="page-header">
                    <div class="header-content">
                        <h1 class="page-title">Users Management</h1>
                        <button class="btn btn-primary" id="addUserBtn">
                            <i class="fas fa-plus"></i> Add User
                        </button>
                    </div>
                    <div class="search-bar">
                        <input type="text" id="searchInput" placeholder="Search users..." class="form-control">
                    </div>
                </div>
                
                <div id="users-table-container">
                    <!-- UsersTabl will be rendered here -->
                </div>
            </div>
        `;
        
        // Initialize the UsersTabl component
        this.initUsersTable();
    },
    
    setupEventListeners: function() {
        var self = this;
        
        // Search functionality
        var searchInput = document.getElementById('searchInput');
        if (searchInput) {
            // Set initial value if query exists
            if (this.query) {
                searchInput.value = this.query;
            }
            
            this.searchHandler = function() {
                clearTimeout(self.searchTimeout);
                self.searchTimeout = setTimeout(function() {
                    self.handleSearch(searchInput.value);
                }, 300);
            };
            searchInput.addEventListener('input', this.searchHandler);
        }
        
        // Add user button
        var addUserBtn = document.getElementById('addUserBtn');
        if (addUserBtn) {
            addUserBtn.addEventListener('click', function() {
                if (typeof AddUser !== 'undefined') {
                    AddUser.init(function() {
                        // Refresh the table after adding a user
                        self.usersTable.loadUsers();
                    });
                } else {
                    console.error('AddUser component not found');
                }
            });
        }
    },
    
    initUsersTable: function() {
        var self = this;
        
        if (typeof UsersTabl !== 'undefined') {
            this.usersTable = UsersTabl;
            
            UsersTabl.init({
                container: document.getElementById('users-table-container'),
                query: this.query,
                page: this.page,
                setPage: function(page) {
                    self.handlePageChange(page);
                },
                ivy: false,
                onUserChange: function(userData) {
                    // This would be implemented if we need to select a user
                    console.log('User selected:', userData);
                }
            });
        } else {
            console.error('UsersTabl component not found');
            document.getElementById('users-table-container').innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>UsersTabl component not found. Please check your implementation.</p>
                </div>
            `;
        }
    },
    
    handleSearch: function(query) {
        // Update query state
        this.query = query;
        
        // Reset to page 1 when searching
        this.page = 1;
        
        // Update URL to reflect the search
        this.updateUrl();
        
        // Update the table
        if (this.usersTable) {
            this.usersTable.update({
                query: query,
                page: 1
            });
        }
    },
    
    handlePageChange: function(page) {
        // Update page state
        this.page = page;
        
        // Update URL to reflect the page change
        this.updateUrl();
        
        // Update the table
        if (this.usersTable) {
            this.usersTable.update({
                page: page
            });
        }
    },
    
    updateUrl: function() {
        var searchParams = new URLSearchParams(window.location.search);
        
        // Update or add page parameter
        searchParams.set('page', this.page);
        
        // Update or remove query parameter
        if (this.query && this.query.trim() !== '') {
            searchParams.set('query', this.query);
        } else {
            searchParams.delete('query');
        }
        
        // Update URL without reloading the page
        var newUrl = window.location.pathname + '?' + searchParams.toString();
        history.pushState(null, '', newUrl);
    }
};

// Initialize the admin app when the route is loaded
window.AdminApp = AdminApp;
