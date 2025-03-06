var OutflowApp = {
    init: function() {

        // Reset page to 1 only if coming from another route
        if (!sessionStorage.getItem('isOutflow')) {
            this.currentPage = 1;
            sessionStorage.setItem('outflowCurrentPage', '1');
        } else {
            this.currentPage = parseInt(sessionStorage.getItem('outflowCurrentPage')) || 1;
        }
        
        this.perPage = 10;
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
                            '<th>Entity</th>' +
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
            
            '<div class="pagination-footer">' +
                '<button id="prevPage" class="btn btn-secondary" disabled>Previous</button>' +
                '<span class="page-info">Page <span id="currentPage">1</span></span>' +
                '<button id="nextPage" class="btn btn-secondary">Next</button>' +
            '</div>' +
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

    loadOutflowData: function(query = '') {
        var self = this;
        var skip = (this.currentPage - 1) * this.perPage;

        ApiClient.getOutflows({ 
            skip: skip, 
            limit: this.perPage, 
            search: query,
            userId: this.storedUserId
        })
        .then(function(response) {
            if (response && response.data) {
                self.renderOutflowTable(response.data);
                self.updatePagination(response.count > (skip + self.perPage));
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
        value = Number(value);
        if (value == null || isNaN(value)) {
            return 'Invalid number'; // Handle null, undefined, or NaN
        }
    
        if (value < 1000) {
            return value.toFixed(2); // Less than 1,000
        } else if (value < 1000000) {
            return (value / 1000).toFixed(2) + 'K'; // Thousands
        } else if (value < 1000000000) {
            return (value / 1000000).toFixed(2) + 'M'; // Millions
        } else if (value < 1000000000000) {
            return (value / 1000000000).toFixed(2) + 'B'; // Billions
        } else {
            return (value / 1000000000000).toFixed(2) + 'T'; // Trillions
        }
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
                '<td class="' + (outflow.entity ? '' : 'text-muted') + '">' + (outflow.entity || 'N/A') + '</td>' +
                '<td title="' + (outflow.cost || 0) + '">' + self.formatNumber(outflow.cost) + '</td>' +
                '<td>' + (outflow.payment_type || 'N/A') + '</td>' +
                '<td class="' + (outflow.iban ? '' : 'text-muted') + '">' + (outflow.iban || 'N/A') + '</td>' +
                '<td class="' + (outflow.payment_to ? '' : 'text-muted') + '">' + (outflow.payment_to || 'N/A') + '</td>' +
                '<td>' + self.formatDate(outflow.expense_date, true) + '</td>' +
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
                    sessionStorage.setItem('inflowCurrentPage', '1');
                    self.loadOutflowData(searchInput.value);
                }, 300);
            };
            searchInput.addEventListener('input', this.searchHandler);
        }

        // Pagination
        var prevPage = document.getElementById('prevPage');
        var nextPage = document.getElementById('nextPage');

        if (prevPage) {
            this.prevPageHandler = function(e) {
                e.preventDefault();
                if (self.currentPage > 1) {
                    self.currentPage--;
                    sessionStorage.setItem('outflowCurrentPage', self.currentPage.toString());
                    self.loadOutflowData(searchInput ? searchInput.value : '');
                }
            };
            prevPage.addEventListener('click', this.prevPageHandler);
        }

        if (nextPage) {
            this.nextPageHandler = function(e) {
                e.preventDefault();
                self.currentPage++;
                sessionStorage.setItem('outflowCurrentPage', self.currentPage.toString());
                self.loadOutflowData(searchInput ? searchInput.value : '');
            };
            nextPage.addEventListener('click', this.nextPageHandler);
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

    updatePagination: function(hasNextPage) {
        var currentPageSpan = document.getElementById('currentPage');
        var prevPageBtn = document.getElementById('prevPage');
        var nextPageBtn = document.getElementById('nextPage');

        // Update current page display
        currentPageSpan.textContent = this.currentPage;

        // Update button states
        prevPageBtn.disabled = this.currentPage === 1;
        nextPageBtn.disabled = !hasNextPage;

        // Store current page in sessionStorage
        sessionStorage.setItem('inflowCurrentPage', this.currentPage);
    },

    formatDate: function(dateString, includeTime = false) {
        if (!dateString) return 'N/A';
        var date = new Date(dateString);
        var options = includeTime 
            ? { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
            : { year: 'numeric', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }
};

// Initialize when DOM is ready and handle route changes
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname === '/inflow.html') {
        InflowApp.init();
    }
});

window.addEventListener('popstate', function() {
    MainApp.handleNavigation();
});

// Clean up when leaving inflow page
window.addEventListener('beforeunload', function() {
    if (window.location.pathname !== '/outflow.html') {
        sessionStorage.removeItem('isOutflow');
    }
});

// Make it globally available
window.OutflowApp = OutflowApp; 