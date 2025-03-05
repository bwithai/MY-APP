var InflowApp = {

    init: function() {
        
        // Reset page to 1 only if coming from another route
        if (!sessionStorage.getItem('isInflow')) {
            this.currentPage = 1;
            sessionStorage.setItem('inflowCurrentPage', '1');
        } else {
            this.currentPage = parseInt(sessionStorage.getItem('inflowCurrentPage')) || 1;
        }
        
        this.perPage = 10;
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

        content.innerHTML = `
            <div class="container-fluid">
                <div class="search-section">
                    <div class="search-bar mb-4">
                        <input type="text" id="searchInput" class="form-control" placeholder="Search inflows...">
                    </div>
                </div>

                <div class="page-header">
                    <div class="header-content">
                        <h1 class="page-title">
                            ${this.getPageTitle()}
                        </h1>
                        <button class="btn btn-outline back-btn" onclick="InflowApp.goBack()">
                            Go back
                        </button>
                    </div>
                    ${!this.currentUser.is_superuser ? `
                        <button class="btn btn-primary add-inflow-btn">Add New Inflow</button>
                    ` : ''}
                </div>

                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Head</th>
                                <th>Sub Heads</th>
                                <th>Fund Details</th>
                                <th>Amount</th>
                                <th>Payment Method</th>
                                <th>IBAN</th>
                                <th>Date of Entry</th>
                                <th>Date</th>
                                <th>User</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="inflowTableBody">
                            <tr>
                                <td colspan="11" class="text-center">Loading...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="pagination-footer">
                    <button class="btn btn-outline-primary" id="prevPage" disabled>Previous</button>
                    <span class="page-info">Page <span id="currentPage">1</span></span>
                    <button class="btn btn-outline-primary" id="nextPage">Next</button>
                </div>
            </div>
        `;

        // Setup event listeners after content is rendered
        this.setupEventListeners();
        this.loadInflowData();
    },

    getPageTitle: function() {
        if (this.currentUser.is_superuser) {
            return this.storedUserName.toLowerCase() === 'admin' ? 'All Inflows' : this.storedUserName + ' Inflows';
        }
        return 'Inflow Management';
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

    loadInflowData: function(query = '') {
        var self = this;
        var skip = (this.currentPage - 1) * this.perPage;

        ApiClient.getInflows({ 
            skip: skip, 
            limit: this.perPage, 
            search: query,
            userId: this.storedUserId
        })
        .then(function(response) {
            if (response && response.data) {
                self.renderInflowTable(response.data);
                self.updatePagination(response.count > (skip + self.perPage));
                self.updateUrl();
            } else {
                throw new Error('Invalid response format');
            }
        })
        .catch(function(error) {
            console.error('Failed to load inflows:', error);
            var tableBody = document.getElementById('inflowTableBody');
            tableBody.innerHTML = `
                <tr>
                    <td colspan="11" class="text-center text-danger">
                        Error loading inflows: ${error.message}
                    </td>
                </tr>
            `;
        });
    },

    renderInflowTable: function(inflows) {
        var tableBody = document.getElementById('inflowTableBody');
        if (!inflows.length) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="11" class="text-center">No inflows found.</td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = inflows.map(function(inflow) {
            // Add deleted-row class if is_deleted is true
            const rowClass = inflow.is_deleted ? 'deleted-row' : '';
            
            return `
                <tr class="${rowClass}" data-id="${inflow.id}">
                    <td>${inflow.id}</td>
                    <td class="truncate" title="${inflow.head}">${inflow.head}</td>
                    <td class="${inflow.sub_heads ? '' : 'text-muted'}">${inflow.sub_heads || 'N/A'}</td>
                    <td class="long-text">
                        <div class="truncate-text" title="${inflow.fund_details}">
                            ${inflow.fund_details}
                        </div>
                    </td>
                    <td title="${inflow.amount}">${Utils.formatNumber(inflow.amount)}</td>
                    <td>${inflow.payment_method}</td>
                    <td class="${inflow.iban ? '' : 'text-muted'}">${inflow.iban || 'N/A'}</td>
                    <td>${this.formatDate(inflow.date, true)}</td>
                    <td>${this.formatDate(inflow.created_at)}</td>
                    <td>${inflow.user}</td>
                    <td>
                        ${ActionsMenu.init('Inflow', inflow, {
                            delete: !inflow.is_deleted,
                            disabled: inflow.is_deleted
                        })}
                    </td>
                </tr>
            `;
        }, this).join('');
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

        // Pagination
        var prevPage = document.getElementById('prevPage');
        var nextPage = document.getElementById('nextPage');

        if (prevPage) {
            this.prevPageHandler = function(e) {
                e.preventDefault();
                if (self.currentPage > 1) {
                    self.currentPage--;
                    sessionStorage.setItem('inflowCurrentPage', self.currentPage.toString());
                    self.loadInflowData(searchInput ? searchInput.value : '');
                }
            };
            prevPage.addEventListener('click', this.prevPageHandler);
        }

        if (nextPage) {
            this.nextPageHandler = function(e) {
                e.preventDefault();
                self.currentPage++;
                sessionStorage.setItem('inflowCurrentPage', self.currentPage.toString());
                self.loadInflowData(searchInput ? searchInput.value : '');
            };
            nextPage.addEventListener('click', this.nextPageHandler);
        }

        // Add new inflow
        var addButton = document.querySelector('.add-inflow-btn');
        if (addButton) {
            addButton.addEventListener('click', function() {
                AddInflow.init(function() {
                    self.loadInflowData();
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

    formatNumber: function(number) {
        return new Intl.NumberFormat().format(number);
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
    if (window.location.pathname !== '/inflow') {
        sessionStorage.removeItem('isInflow');
    }
});

// Make it globally available
window.InflowApp = InflowApp; 