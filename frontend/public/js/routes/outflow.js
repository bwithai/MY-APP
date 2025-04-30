var OutflowApp = {
    init: function() {

        // Reset page to 1 only if coming from another route
        if (!sessionStorage.getItem('isOutflow')) {
            this.currentPage = 1;
            sessionStorage.setItem('outflowCurrentPage', '1');
        } else {
            this.currentPage = parseInt(sessionStorage.getItem('outflowCurrentPage')) || 1;
        }
        
        // Get per-page setting from sessionStorage or default to 10
        this.storageKey = 'outflow'; // For use with pagination functions
        this.perPage = parseInt(sessionStorage.getItem(this.storageKey + 'PerPage')) || 10;
        this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
        this.storedUserId = sessionStorage.getItem('selectedUserId');
        this.storedUserName = sessionStorage.getItem('selectedUserName');
        
        // Mark that we're in outflow page
        sessionStorage.setItem('isOutflow', 'true');
        
        // Show outflow page
        this.showOutflowPage();
    },

    cleanup: function() {
        // Remove existing event listeners
        var prevPage = document.getElementById('prevPage');
        var nextPage = document.getElementById('nextPage');
        var searchInput = document.getElementById('searchInput');

        if (prevPage) {
            prevPage.removeEventListener('click', this.prevPageHandler);
        }
        if (nextPage) {
            nextPage.removeEventListener('click', this.nextPageHandler);
        }
        if (searchInput) {
            searchInput.removeEventListener('input', this.searchHandler);
        }
    },

    showOutflowPage: function() {
        var content = document.getElementById('content');
        if (!content) {
            console.error('Content element not found');
            return;
        }

        content.innerHTML = '<div class="container-fluid">' +
            '<div class="page-header">' +
                '<div class="header-content">' +
                    '<h1 class="page-title">' + this.getPageTitle() + '</h1>' +
                    (this.currentUser.is_superuser ? '' : 
                        '<button class="btn btn-primary" id="addOutflowBtn">' +
                            '<i class="fas fa-plus"></i> Add Outflow' +
                        '</button>'
                    ) +
                '</div>' +
                '<div class="search-bar">' +
                    '<input type="text" id="searchInput" placeholder="Search outflows..." class="form-control">' +
                '</div>' +
            '</div>' +
            
            '<div class="table-responsive horizontal-scroll">' +
                '<table class="table">' +
                    '<thead>' +
                        '<tr>' +
                            '<th>ID</th>' +
                            '<th>Head</th>' +
                            '<th>Sub Head</th>' +
                            '<th>Head Details</th>' +
                            '<th>Type</th>' +
                            '<th>Amount</th>' +
                            '<th>Payment Type</th>' +
                            '<th>IBAN</th>' +
                            '<th>Payment To</th>' +
                            '<th>Expense Date</th>' +
                            '<th>User</th>' +
                            '<th>Actions</th>' +
                        '</tr>' +
                    '</thead>' +
                    '<tbody id="outflowTableBody">' +
                        '<tr>' +
                            '<td colspan="13" class="text-center">Loading...</td>' +
                        '</tr>' +
                    '</tbody>' +
                '</table>' +
            '</div>' +
            
            '<div class="pagination-footer"></div>' +
        '</div>';

        // Setup event listeners
        this.setupEventListeners();
        
        // Load outflow data
        this.loadOutflowData();
    },

    getPageTitle: function() {
        if (this.currentUser.is_superuser) {
            return this.storedUserName.toLowerCase() === 'admin' ? 'All Users Outflows' : this.storedUserName + '\'s Outflows';
        }
        return 'My Outflows';
    },

    goBack: function() {
        history.pushState(null, '', '/');
        // Update sidebar visual selection
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.path === '/index.html') {
                item.classList.add('active');
            }
        });
        MainApp.handleNavigation();
    },

    updateUrl: function() {
        var searchParams = new URLSearchParams(window.location.search);
        searchParams.set('page', this.currentPage);
        history.pushState(null, '', '?' + searchParams.toString());
    },

    loadOutflowData: function(query) {
        // Default parameter value for older browser compatibility
        query = query || this.searchQuery || '';
        
        var self = this;
        var skip = (this.currentPage - 1) * this.perPage;
        var tableBody = document.getElementById('outflowTableBody');
        
        // Show loading state
        if (tableBody) {
            // Create a row with a cell that spans all columns
            tableBody.innerHTML = '<tr><td colspan="13" class="text-center" id="loadingOutflowCell"></td></tr>';
            // Apply loading to the single cell instead of the whole tbody
            Utils.showLoading('loadingOutflowCell', 'Loading outflows...');
        }

        ApiClient.getOutflows({ 
            skip: skip, 
            limit: this.perPage, 
            search: query,
            userId: this.storedUserId
        })
        .then(function(response) {
            if (response && response.data) {
                self.renderOutflowTable(response.data);
                // Update to use numbered pagination
                Utils.updateNumberedPagination(self, response.count, response.count > (skip + self.perPage));
                self.updateUrl();
            } else {
                throw new Error('Invalid response format');
            }
        })
        .catch(function(error) {
            console.error('Failed to load outflows:', error);
            var tableBody = document.getElementById('outflowTableBody');
            if (tableBody) {
                tableBody.innerHTML = '<tr>' +
                    '<td colspan="13" class="text-center text-danger">' +
                        'Error loading outflows: ' + (error.message || 'Unknown error') +
                    '</td>' +
                '</tr>';
            }
        });
    },

    formatNumber: function(value) {
        return Utils.formatNumber(value);
    },

    renderOutflowTable: function(outflows) {
        var tableBody = document.getElementById('outflowTableBody');
        if (!tableBody) {
            console.error('Table body element not found');
            return;
        }

        if (!outflows || outflows.length === 0) {
            tableBody.innerHTML = '<tr>' +
                '<td colspan="13" class="text-center">No outflows found</td>' +
            '</tr>';
            return;
        }

        var self = this;
        tableBody.innerHTML = '';
        
        outflows.forEach(function(outflow) {
            // Add deleted-row class if is_deleted is true
            var rowClass = outflow.is_deleted ? 'deleted-row' : '';
            var row = document.createElement('tr');
            row.className = rowClass;
            row.dataset.id = outflow.id;
            
            // Create cells in the same order as the headers
            row.innerHTML = 
                '<td>' + outflow.id + '</td>' +
                '<td class="truncate" title="' + (outflow.head || '') + '">' + (outflow.head || 'N/A') + '</td>' +
                '<td class="' + (outflow.sub_heads ? '' : 'text-muted') + '">' + (outflow.sub_heads || 'N/A') + '</td>' +
                '<td class="long-text">' +
                    '<div class="truncate-text" title="' + (outflow.head_details || '') + '">' +
                        (outflow.head_details || 'N/A') +
                    '</div>' +
                '</td>' +
                '<td>' + (outflow.type || 'N/A') + '</td>' +
                '<td title="' + (outflow.cost || 0) + '">' + self.formatNumber(outflow.cost) + '</td>' +
                '<td>' + (outflow.payment_type || 'N/A') + '</td>' +
                '<td class="long-text ' + (outflow.iban ? '' : 'text-muted') + '">' +
                    '<div class="truncate-text" title="' + (outflow.iban || '') + '">' +
                        (outflow.iban ? ('••• ' + outflow.iban.slice(-4)) : 'N/A') +
                    '</div>' +
                '</td>' +
                '<td class="' + (outflow.payment_to ? '' : 'text-muted') + '">' + (outflow.payment_to || 'N/A') + '</td>' +
                '<td>' + self.formatDate(outflow.expense_date, false) + '</td>' +
                '<td>' + (outflow.user || 'N/A') + '</td>' +
                '<td>' + ActionsMenu.init('Outflow', outflow, {
                    delete: !outflow.is_deleted,
                    disabled: outflow.is_deleted
                }) + '</td>';
            
            tableBody.appendChild(row);
        });
    },

    setupEventListeners: function() {
        var self = this;

        // Search functionality
        var searchInput = document.getElementById('searchInput');
        if (searchInput) {
            this.searchHandler = function() {
                clearTimeout(self.searchTimeout);
                self.searchTimeout = setTimeout(function() {
                    self.currentPage = 1;
                    sessionStorage.setItem('outflowCurrentPage', '1');
                    self.loadOutflowData(searchInput.value);
                }, 300);
            };
            searchInput.addEventListener('input', this.searchHandler);
        }

        // Add new outflow
        var addButton = document.getElementById('addOutflowBtn');
        if (addButton) {
            addButton.addEventListener('click', function() {
                AddOutflow.init(function() {
                    self.loadOutflowData();
                });
            });
        }
    },

    formatDate: function(dateString, includeTime = false) {
        return Utils.formatDate(dateString, includeTime);
    }
};

// Clean up when leaving outflow page
// Using a more compatible approach for legacy browsers
if (typeof window.attachEvent !== 'undefined') {
    // For older IE browsers
    window.attachEvent('onunload', function() {
        if (window.location.pathname !== '/outflow') {
            sessionStorage.removeItem('isOutflow');
        }
    });
} else if (typeof window.addEventListener !== 'undefined') {
    // For modern browsers
    window.addEventListener('beforeunload', function() {
        if (window.location.pathname !== '/outflow') {
            sessionStorage.removeItem('isOutflow');
        }
    });
} else {
    // Fallback for very old browsers
    window.onunload = function() {
        if (window.location.pathname !== '/outflow') {
            sessionStorage.removeItem('isOutflow');
        }
    };
}

// Make it globally available
window.OutflowApp = OutflowApp;