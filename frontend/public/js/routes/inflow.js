var InflowApp = {

    init: function() {
        
        // Reset page to 1 only if coming from another route
        if (!sessionStorage.getItem('isInflow')) {
            this.currentPage = 1;
            sessionStorage.setItem('inflowCurrentPage', '1');
        } else {
            this.currentPage = parseInt(sessionStorage.getItem('inflowCurrentPage')) || 1;
        }
        
        // Get per-page setting from sessionStorage or default to 10
        this.storageKey = 'inflow'; // For use with pagination functions
        this.perPage = parseInt(sessionStorage.getItem(this.storageKey + 'PerPage')) || 10;
        this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
        this.storedUserId = sessionStorage.getItem('selectedUserId');
        this.storedUserName = sessionStorage.getItem('selectedUserName');
        
        // Mark that we're in inflow page
        sessionStorage.setItem('isInflow', 'true');
        
        // Show inflow page
        this.showInflowPage();
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

    showInflowPage: function() {
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
                        '<button class="btn btn-primary" id="addInflowBtn">' +
                            '<i class="fas fa-plus"></i> Add Inflow' +
                        '</button>'
                    ) +
                '</div>' +
                '<div class="search-bar">' +
                    '<input type="text" id="searchInput" placeholder="Search inflows..." class="form-control">' +
                '</div>' +
            '</div>' +
            
            '<div class="table-responsive horizontal-scroll">' +
                '<table class="table">' +
                    '<thead>' +
                        '<tr>' +
                            '<th>ID</th>' +
                            '<th>Head</th>' +
                            '<th>Sub Head</th>' +
                            '<th>Fund Details</th>' +
                            '<th>Amount</th>' +
                            '<th>Payment Method</th>' +
                            '<th>IBAN</th>' +
                            '<th>Entry Date</th>' +
                            '<th>User</th>' +
                            '<th>Actions</th>' +
                        '</tr>' +
                    '</thead>' +
                    '<tbody id="inflowTableBody">' +
                        '<tr>' +
                            '<td colspan="11" class="text-center">Loading...</td>' +
                        '</tr>' +
                    '</tbody>' +
                '</table>' +
            '</div>' +
            
            '<div class="pagination-footer"></div>' +
        '</div>';

        // Setup event listeners
        this.setupEventListeners();
        
        // Load inflow data
        this.loadInflowData();
    },

    getPageTitle: function() {
        if (this.currentUser.is_superuser) {
            return this.storedUserName.toLowerCase() === 'admin' ? 'All Users Inflows' : this.storedUserName + '\'s Inflows';
        }
        return 'My Inflows';
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

    loadInflowData: function(query) {
        // Default parameter value for older browser compatibility
        query = query || this.searchQuery || '';
        
        var self = this;
        var skip = (this.currentPage - 1) * this.perPage;
        var tableBody = document.getElementById('inflowTableBody');
        
        // Show loading state
        if (tableBody) {
            // Create a row with a cell that spans all columns
            tableBody.innerHTML = '<tr><td colspan="11" class="text-center" id="loadingCell"></td></tr>';
            // Apply loading to the single cell instead of the whole tbody
            Utils.showLoading('loadingCell', 'Loading inflows...');
        }

        ApiClient.getInflows({ 
            skip: skip, 
            limit: this.perPage, 
            search: query,
            userId: this.storedUserId
        })
        .then(function(response) {
            if (response && response.data) {
                self.renderInflowTable(response.data);
                // Update to use numbered pagination
                Utils.updateNumberedPagination(self, response.count, response.count > (skip + self.perPage));
                self.updateUrl();
            } else {
                throw new Error('Invalid response format');
            }
        })
        .catch(function(error) {
            console.error('Failed to load inflows:', error);
            var tableBody = document.getElementById('inflowTableBody');
            if (tableBody) {
                tableBody.innerHTML = '<tr>' +
                    '<td colspan="11" class="text-center text-danger">' +
                        'Error loading inflows: ' + (error.message || 'Unknown error') +
                    '</td>' +
                '</tr>';
            }
        });
    },

    renderInflowTable: function(inflows) {
        var tableBody = document.getElementById('inflowTableBody');
        if (!tableBody) {
            console.error('Table body element not found');
            return;
        }

        if (!inflows || inflows.length === 0) {
            tableBody.innerHTML = '<tr>' +
                '<td colspan="11" class="text-center">No inflows found</td>' +
            '</tr>';
            return;
        }

        var self = this;
        tableBody.innerHTML = '';
        
        inflows.forEach(function(inflow) {
            // Add deleted-row class if is_deleted is true
            var rowClass = inflow.is_deleted ? 'deleted-row' : '';
            var row = document.createElement('tr');
            row.className = rowClass;
            row.dataset.id = inflow.id;
            
            // Create cells in the same order as the headers
            row.innerHTML = 
                '<td>' + inflow.id + '</td>' +
                '<td class="truncate" title="' + (inflow.head || '') + '">' + (inflow.head || 'N/A') + '</td>' +
                '<td class="' + (inflow.sub_heads ? '' : 'text-muted') + '">' + (inflow.sub_heads || 'N/A') + '</td>' +
                '<td class="long-text">' +
                    '<div class="truncate-text" title="' + (inflow.fund_details || '') + '">' +
                        (inflow.fund_details || 'N/A') +
                    '</div>' +
                '</td>' +
                '<td title="' + (inflow.amount || 0) + '">' + self.formatNumber(inflow.amount) + '</td>' +
                '<td>' + (inflow.payment_method || 'N/A') + '</td>' +
                '<td class="long-text ' + (inflow.iban ? '' : 'text-muted') + '">' +
                    '<div class="truncate-text" title="' + (inflow.iban || '') + '">' +
                        (inflow.iban ? ('••• ' + inflow.iban.slice(-4)) : 'N/A') +
                    '</div>' +
                '</td>' +
                '<td>' + self.formatDate(inflow.date) + '</td>' +
                // '<td>' + self.formatDate(inflow.created_at) + '</td>' +
                '<td>' + (inflow.user || 'N/A') + '</td>' +
                '<td>' + ActionsMenu.init('Inflow', inflow, {
                    delete: !inflow.is_deleted,
                    disabled: inflow.is_deleted
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
                    sessionStorage.setItem('inflowCurrentPage', '1');
                    self.loadInflowData(searchInput.value);
                }, 300);
            };
            searchInput.addEventListener('input', this.searchHandler);
        }

        // Add new inflow
        var addButton = document.getElementById('addInflowBtn');
        if (addButton) {
            addButton.addEventListener('click', function() {
                AddInflow.init(function() {
                    self.loadInflowData();
                });
            });
        }
    },

    formatNumber: function(value) {
        return Utils.formatNumber(value);
    },

    formatDate: function(dateString, includeTime = false) {
        return Utils.formatDate(dateString, includeTime);
    }
};

// Clean up when leaving inflow page
// Using a more compatible approach for legacy browsers
if (typeof window.attachEvent !== 'undefined') {
    // For older IE browsers
    window.attachEvent('onunload', function() {
        if (window.location.pathname !== '/inflow') {
            sessionStorage.removeItem('isInflow');
        }
    });
} else if (typeof window.addEventListener !== 'undefined') {
    // For modern browsers
    window.addEventListener('beforeunload', function() {
        if (window.location.pathname !== '/inflow') {
            sessionStorage.removeItem('isInflow');
        }
    });
} else {
    // Fallback for very old browsers
    window.onunload = function() {
        if (window.location.pathname !== '/inflow') {
            sessionStorage.removeItem('isInflow');
        }
    };
}

// Make it globally available
window.InflowApp = InflowApp; 