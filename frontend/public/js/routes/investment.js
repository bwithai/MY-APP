var InvestmentApp = {
    init: function() {
        // Reset page to 1 only if coming from another route
        if (!sessionStorage.getItem('isInvestment')) {
            this.currentPage = 1;
            sessionStorage.setItem('investmentCurrentPage', '1');
        } else {
            this.currentPage = parseInt(sessionStorage.getItem('investmentCurrentPage')) || 1;
        }
        
        this.perPage = 10;
        this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
        this.storedUserId = sessionStorage.getItem('selectedUserId');
        this.storedUserName = sessionStorage.getItem('selectedUserName');
        this.storageKey = 'investment'; // For use with common pagination functions
        
        // Mark that we're in investment page
        sessionStorage.setItem('isInvestment', 'true');
        Utils.storeLastVisited('investment');
        
        // Show investment page
        this.showInvestmentPage();
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

    showInvestmentPage: function() {
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
                        '<button class="btn btn-primary" id="addInvestmentBtn">' +
                            '<i class="fas fa-plus"></i> Add Investment' +
                        '</button>'
                    ) +
                '</div>' +
                '<div class="search-bar">' +
                    '<input type="text" id="searchInput" placeholder="Search investments..." class="form-control">' +
                '</div>' +
            '</div>' +
            
            '<div class="table-responsive horizontal-scroll">' +
                '<table class="table">' +
                    '<thead>' +
                        '<tr>' +
                            '<th>Name</th>' +
                            '<th>Details</th>' +
                            '<th>Amount</th>' +
                            '<th>Type</th>' +
                            '<th>Payment Method</th>' +
                            '<th>IBAN</th>' +
                            '<th>Date of Entry</th>' +
                            '<th>User</th>' +
                            '<th>Actions</th>' +
                        '</tr>' +
                    '</thead>' +
                    '<tbody id="investmentTableBody">' +
                        '<tr>' +
                            '<td colspan="9" class="text-center">Loading...</td>' +
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
        
        // Load investment data
        this.loadInvestmentData();
    },

    getPageTitle: function() {
        return Utils.getPageTitle('Investments', this.currentUser, this.storedUserName);
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

    loadInvestmentData: function(query) {
        // Default parameter value for older browser compatibility
        query = query || this.searchQuery || '';
        
        var self = this;
        var skip = (this.currentPage - 1) * this.perPage;
        var tableBody = document.getElementById('investmentTableBody');
        
        // Show loading state
        if (tableBody) {
            // Create a row with a cell that spans all columns
            tableBody.innerHTML = '<tr><td colspan="9" class="text-center" id="loadingInvestmentCell"></td></tr>';
            // Apply loading to the single cell instead of the whole tbody
            Utils.showLoading('loadingInvestmentCell', 'Loading investments...');
        }

        ApiClient.getInvestments({ 
            skip: skip, 
            limit: this.perPage, 
            search: query,
            userId: this.storedUserId
        })
        .then(function(response) {
            if (response && response.data) {
                self.renderInvestmentTable(response.data);
                self.updatePagination(response.count > (skip + self.perPage));
                self.updateUrl();
            } else {
                throw new Error('Invalid response format');
            }
        })
        .catch(function(error) {
            Utils.handleApiError(error, 'investmentTableBody', 'Failed to load investments');
        });
    },

    formatNumber: function(value) {
        return Utils.formatNumber(value);
    },

    formatDate: function(dateString, includeTime = false) {
        return Utils.formatDate(dateString, includeTime);
    },

    renderInvestmentTable: function(investments) {
        var tableBody = document.getElementById('investmentTableBody');
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        
        if (!investments || investments.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="9" class="text-center">No investments found</td></tr>';
            return;
        }
        
        var self = this;
        investments.forEach(function(investment) {
            var row = document.createElement('tr');
            if (investment.is_deleted) {
                row.classList.add('deleted-row');
            }
            
            row.innerHTML = 
                '<td class="truncate-text" title="' + (investment.name || '') + '">' + (investment.name || 'N/A') + '</td>' +
                '<td class="long-text ' + (investment.asset_details ? '' : 'text-muted') + '">' +
                    '<div class="truncate-text" title="' + (investment.asset_details || '') + '">' +
                        (investment.asset_details || 'N/A') +
                    '</div>' +
                '</td>' +
                '<td title="' + (investment.amount || 0) + '">' + self.formatNumber(investment.amount) + '</td>' +
                '<td>' + (investment.type || 'N/A') + '</td>' +
                '<td>' + (investment.payment_method || 'N/A') + '</td>' +
                '<td class="' + (investment.iban ? '' : 'text-muted') + '">' + (investment.iban || 'N/A') + '</td>' +
                '<td>' + self.formatDate(investment.date, true) + '</td>' +
                '<td>' + (investment.user || 'N/A') + '</td>' +
                '<td>' + ActionsMenu.init('Investment', investment, {
                    delete: !investment.is_deleted,
                    disabled: investment.is_deleted
                }) + '</td>';
            
            tableBody.appendChild(row);
        });
    },

    updatePagination: function(hasMore) {
        Utils.updatePagination(this, hasMore);
    },

    setupEventListeners: function() {
        var self = this;
        
        // Add Investment button
        var addInvestmentBtn = document.getElementById('addInvestmentBtn');
        if (addInvestmentBtn) {
            addInvestmentBtn.onclick = function() {
                if (typeof AddInvestment !== 'undefined') {
                    AddInvestment.init(self.loadInvestmentData.bind(self));
                } else {
                    console.error('AddInvestment component not found');
                }
            };
        }
        
        // Use common pagination initialization with compatibility fixes
        Utils.initPagination(this, function(searchTerm) {
            var searchInput = document.getElementById('searchInput');
            self.loadInvestmentData(searchTerm || (searchInput ? searchInput.value : ''));
        });
    },

    searchDebounced: function() {
        var self = this;
        var timeout;
        
        return function() {
            var query = this.value;
            clearTimeout(timeout);
            
            timeout = setTimeout(function() {
                self.currentPage = 1;
                sessionStorage.setItem('investmentCurrentPage', '1');
                self.loadInvestmentData(query);
            }, 300);
        };
    }
};

// Clean up when leaving investment page
// Using a more compatible approach for legacy browsers
if (typeof window.attachEvent !== 'undefined') {
    // For older IE browsers
    window.attachEvent('onunload', function() {
        if (window.location.pathname !== '/investment') {
            sessionStorage.removeItem('isInvestment');
        }
    });
} else if (typeof window.addEventListener !== 'undefined') {
    // For modern browsers
    window.addEventListener('beforeunload', function() {
        if (window.location.pathname !== '/investment') {
            sessionStorage.removeItem('isInvestment');
        }
    });
} else {
    // Fallback for very old browsers
    window.onunload = function() {
        if (window.location.pathname !== '/investment') {
            sessionStorage.removeItem('isInvestment');
        }
    };
}

// Make it globally available
window.InvestmentApp = InvestmentApp; 