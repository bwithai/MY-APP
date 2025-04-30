/**
 * UsersTabl Component - Vanilla JS implementation of the UsersTable component
 * Displays a table of users with support for both standard view and ivy mode
 */
var UsersTabl = {
    /**
     * Initialize the UsersTabl component
     * 
     * @param {Object} options - Configuration options
     * @param {HTMLElement} options.container - Container element to render the component in
     * @param {string} options.query - Search query
     * @param {number} options.page - Current page number
     * @param {Function} options.setPage - Function to update the page number
     * @param {boolean} options.ivy - Whether to display in ivy mode or standard mode
     * @param {Function} options.onUserChange - Callback for when a user is selected
     */
    init: function(options) {
        this.container = options.container;
        this.query = options.query || null;
        this.page = options.page || 1;
        this.setPage = options.setPage || function(page) { 
            this.page = page;
            this.loadUsers();
        }.bind(this);
        this.ivy = options.ivy || false;
        this.onUserChange = options.onUserChange || function() {};
        
        // Set storage key for pagination
        this.storageKey = 'users';
        
        // Get per-page setting from sessionStorage or default to 10
        this.perPage = parseInt(sessionStorage.getItem(this.storageKey + 'PerPage')) || 10;
        
        // Get current user data
        this.currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};

        // Render the component
        this.render();
        
        // Load users data
        this.loadUsers();
    },
    
    /**
     * Render the component's initial HTML structure
     */
    render: function() {
        var tableHtml = '';
        
        if (this.ivy) {
            tableHtml = this.getIvyTableHtml();
            this.container.innerHTML = `
                ${tableHtml}
                
                <div class="pagination-footer"></div>
            `;
        } else {
            tableHtml = this.getStandardTableHtml();
            this.container.innerHTML = `
                <div class="table-responsive horizontal-scroll">
                    ${tableHtml}
                </div>
                
                <div class="pagination-footer"></div>
            `;
        }
        
        // No need to attach pagination listeners as the numbered pagination will handle it
    },
    
    /**
     * Get HTML structure for ivy mode table
     */
    getIvyTableHtml: function() {
        return `
            <table class="table" style="text-align: center;">
                <thead>
                    <tr>
                        <th style="width: 15%">UserName</th>
                        <th style="width: 15%">Actions</th>
                    </tr>
                </thead>
                <tbody id="users-table-body">
                    <tr>
                        <td colspan="2" class="text-center" id="loading-placeholder">Loading users...</td>
                    </tr>
                </tbody>
            </table>
        `;
    },
    
    /**
     * Get HTML structure for standard mode table
     */
    getStandardTableHtml: function() {
        return `
            <table class="table">
                <thead>
                    <tr>
                        <th style="width: 10%">ID</th>
                        <th style="width: 15%">UserName</th>
                        <th style="width: 15%">Formation</th>
                        <th style="width: 10%">Role</th>
                        <th style="width: 10%">Status</th>
                        <th style="width: 10%">Actions</th>
                    </tr>
                </thead>
                <tbody id="users-table-body">
                    <tr>
                        <td colspan="6" class="text-center" id="loading-placeholder">Loading users...</td>
                    </tr>
                </tbody>
            </table>
        `;
    },
    
    /**
     * Load users data from the API
     */
    loadUsers: function() {
        var self = this;
        var skip = (this.page - 1) * this.perPage;
        var tableBody = document.getElementById('users-table-body');
        
        // Show loading state
        if (tableBody) {
            // Create a row with a cell that spans all columns
            var colspan = self.ivy ? 2 : 6;
            tableBody.innerHTML = `<tr><td colspan="${colspan}" class="text-center" id="loading-placeholder"></td></tr>`;
            // Apply loading to the single cell
            Utils.showLoading('loading-placeholder', 'Loading users...');
        }
        
        ApiClient.readUsers({
            skip: skip,
            limit: this.perPage,
            search: this.query
        })
        .then(function(response) {
            if (response && response.data) {
                self.users = response.data;
                self.renderUsersTable(response.data);
                // Need to set storageKey and currentPage for compatibility with Utils pagination
                self.storageKey = 'users';
                self.currentPage = self.page;
                // Update to use numbered pagination
                Utils.updateNumberedPagination(self, response.count || response.data.length * 2, response.data.length === self.perPage);
            } else {
                throw new Error('Invalid response format');
            }
        })
        .catch(function(error) {
            console.error('Failed to load users:', error);
            if (tableBody) {
                var colspan = self.ivy ? 2 : 6;
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="${colspan}" class="text-center text-danger">
                            Error loading users: ${error.message || 'Unknown error'}
                        </td>
                    </tr>
                `;
            }
        });
    },
    
    /**
     * Render the users table with data
     * 
     * @param {Array} users - Array of user objects
     */
    renderUsersTable: function(users) {
        var tableBody = document.getElementById('users-table-body');
        if (!tableBody) {
            console.error('Table body element not found');
            return;
        }
        
        if (!users || users.length === 0) {
            var colspan = this.ivy ? 2 : 6;
            tableBody.innerHTML = `
                <tr>
                    <td colspan="${colspan}" class="text-center">No users found</td>
                </tr>
            `;
            return;
        }
        
        tableBody.innerHTML = '';
        
        if (this.ivy) {
            this.renderIvyRows(users, tableBody);
        } else {
            this.renderStandardRows(users, tableBody);
        }
    },
    
    /**
     * Render rows for ivy mode table
     * 
     * @param {Array} users - Array of user objects
     * @param {HTMLElement} tableBody - Table body element
     */
    renderIvyRows: function(users, tableBody) {
        var self = this;
        
        users.forEach(function(user) {
            var row = document.createElement('tr');
            
            // Username cell with "You" badge if current user
            var usernameCell = document.createElement('td');
            
            if (self.currentUser.id === user.id) {
                usernameCell.innerHTML = `
                    ${user.username}
                    <span class="badge badge-success">You</span>
                `;
            } else {
                usernameCell.textContent = user.username;
            }
            
            // Actions cell with Select User button
            var actionsCell = document.createElement('td');
            var selectButton = document.createElement('button');
            selectButton.className = 'btn btn-primary btn-sm';
            selectButton.textContent = 'Select User';
            selectButton.addEventListener('click', function() {
                self.onUserChange({ userId: `${user.id}|${user.username}` });
            });
            
            actionsCell.appendChild(selectButton);
            
            // Add cells to row
            row.appendChild(usernameCell);
            row.appendChild(actionsCell);
            
            // Add row to table
            tableBody.appendChild(row);
        });
    },
    
    /**
     * Render rows for standard mode table
     * 
     * @param {Array} users - Array of user objects
     * @param {HTMLElement} tableBody - Table body element
     */
    renderStandardRows: function(users, tableBody) {
        var self = this;
        
        users.forEach(function(user) {
            var row = document.createElement('tr');
            
            // ID cell
            var idCell = document.createElement('td');
            idCell.textContent = user.id;
            
            // Username cell with "You" badge if current user
            var usernameCell = document.createElement('td');
            
            if (self.currentUser.id === user.id) {
                usernameCell.innerHTML = `
                    ${user.username}
                    <span class="badge badge-success">You</span>
                `;
            } else {
                usernameCell.textContent = user.username;
            }
            
            // Email/Formation cell
            var emailCell = document.createElement('td');
            var formation = user.username.split('-')[0]
            emailCell.innerHTML = `
                <div class='${formation ? '' : 'text-muted'}' title="${formation || ''}">
                    ${formation || 'N/A'}
                </div>
            `;
            
            // Role cell
            var roleCell = document.createElement('td');
            roleCell.textContent = user.is_superuser ? 'Superuser' : 'User';
            
            // Status cell
            var statusCell = document.createElement('td');
            statusCell.innerHTML = `
                <div class="user-status">
                    <span class="status-indicator ${user.is_active ? 'active' : 'inactive'}"></span>
                    ${user.is_active ? 'Active' : 'Inactive'}
                </div>
            `;
            
            // Actions cell
            var actionsCell = document.createElement('td');
            
            // Only show actions menu if not current user
            if (self.currentUser.id !== user.id) {
                actionsCell.innerHTML = ActionsMenu.init('User', user);
            }
            
            // Add cells to row
            row.appendChild(idCell);
            row.appendChild(usernameCell);
            row.appendChild(emailCell);
            row.appendChild(roleCell);
            row.appendChild(statusCell);
            row.appendChild(actionsCell);
            
            // Add row to table
            tableBody.appendChild(row);
        });
    },
    
    /**
     * Update pagination buttons and current page display
     * 
     * @param {boolean} hasNextPage - Whether there is a next page
     */
    updatePagination: function(hasNextPage) {
        // No longer needed as we're using the Utils.updateNumberedPagination
    },
    
    /**
     * Update the component with new options
     * 
     * @param {Object} options - New options to update the component with
     */
    update: function(options) {
        if (options.query !== undefined) {
            this.query = options.query;
        }
        
        if (options.page !== undefined) {
            this.page = options.page;
        }
        
        if (options.ivy !== undefined) {
            this.ivy = options.ivy;
            // Re-render if ivy mode changed
            this.render();
        }
        
        // Add loadData method for compatibility with numbered pagination
        this.loadData = function(query) {
            if (query !== undefined) {
                this.query = query;
            }
            this.loadUsers();
        }.bind(this);
        
        // Reload users with new options
        this.loadUsers();
    }
};

window.UsersTabl = UsersTabl;
