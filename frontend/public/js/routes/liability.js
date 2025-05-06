var LiabilityApp = {
    init: function() {
        // Reset page to 1 only if coming from another route
        if (!sessionStorage.getItem('isLiability')) {
            this.currentPage = 1;
            sessionStorage.setItem('liabilityCurrentPage', '1');
        } else {
            this.currentPage = parseInt(sessionStorage.getItem('liabilityCurrentPage')) || 1;
        }
        
        // Get per-page setting from sessionStorage or default to 10
        this.storageKey = 'liability'; // For use with common pagination functions
        this.perPage = parseInt(sessionStorage.getItem(this.storageKey + 'PerPage')) || 10;
        this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
        this.storedUserId = sessionStorage.getItem('selectedUserId');
        this.storedUserName = sessionStorage.getItem('selectedUserName');
        
        // Initialize sorting state (defaults will be set in initTableSorting)
        this.sortColumn = null;
        this.sortDirection = 'asc';
        
        // Column to property mapping for sorting
        this.columnMap = [
            'name',              // Column 0: Name
            'fund_details',      // Column 1: Fund Details
            'amount',            // Column 2: Amount
            'remaining_balance', // Column 3: Remaining
            'type',              // Column 4: Type
            'payment_to',        // Column 5: Payment To
            'payment_method',    // Column 6: Payment Method
            'date',              // Column 7: Entry Date
            'user',              // Column 8: User
            null                 // Column 9: Actions (not sortable)
        ];
        
        // Mark that we're in liability page
        sessionStorage.setItem('isLiability', 'true');
        Utils.storeLastVisited('liability');
        
        // Show liability page
        this.showLiabilityPage();
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

    showLiabilityPage: function() {
        var content = document.getElementById('content');
        if (!content) {
            console.error('Content element not found');
            return;
        }

        content.innerHTML = '<div class="container-fluid">' +
            '<div class="page-header">' +
                '<div class="header-content">' +
                    '<h1 class="page-title">' + Utils.getPageTitle('Liabilities', this.currentUser, this.storedUserName) + '</h1>' +
                    (this.currentUser.is_superuser ? '' : 
                        '<button class="btn btn-primary" id="addLiabilityBtn">' +
                            '<i class="fas fa-plus"></i> Add Liability' +
                        '</button>'
                    ) +
                '</div>' +
                '<div class="search-bar">' +
                    '<input type="text" id="searchInput" placeholder="Search liabilities..." class="form-control">' +
                '</div>' +
            '</div>' +
            
            '<div class="status-legend">' +
                '<div class="legend-item">' +
                    '<span class="color-box paid-box"></span>' +
                    '<span class="legend-text">Paid</span>' +
                '</div>' +
                '<div class="legend-item">' +
                    '<span class="color-box deleted-box"></span>' +
                    '<span class="legend-text">Deleted</span>' +
                '</div>' +
                '<div class="legend-item">' +
                    '<span class="color-box active-box"></span>' +
                    '<span class="legend-text">Active</span>' +
                '</div>' +
            '</div>' +
            
            '<div class="table-responsive horizontal-scroll">' +
                '<table class="table" id="liabilityTable">' +
                    '<thead>' +
                        '<tr>' +
                            '<th>Name</th>' +
                            '<th>Fund Details</th>' +
                            '<th>Amount</th>' +
                            '<th>Remaining</th>' +
                            '<th>Type</th>' +
                            '<th>Payment To</th>' +
                            '<th>Payment Method</th>' +
                            '<th>Entry Date</th>' +
                            '<th>User</th>' +
                            '<th class="no-sort">Actions</th>' +
                        '</tr>' +
                    '</thead>' +
                    '<tbody id="liabilityTableBody">' +
                        '<tr>' +
                            '<td colspan="10" class="text-center">Loading...</td>' +
                        '</tr>' +
                    '</tbody>' +
                '</table>' +
            '</div>' +
            
            '<div class="pagination-footer"></div>' +
        '</div>';

        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize table sorting
        Utils.initTableSorting('liabilityTable', this, this.loadLiabilityData.bind(this));
        
        // Load liability data
        this.loadLiabilityData();
    },

    goBack: function() {
        history.pushState(null, '', '/');
        // Update sidebar visual selection
        document.querySelectorAll('.nav-item').forEach(function(item) {
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

    loadLiabilityData: function(query) {
        // Default parameter value for older browser compatibility
        query = query || '';
        
        var self = this;
        var skip = (this.currentPage - 1) * this.perPage;
        var tableBody = document.getElementById('liabilityTableBody');
        
        // Show loading state
        if (tableBody) {
            // Create a row with a cell that spans all columns
            tableBody.innerHTML = '<tr><td colspan="10" class="text-center" id="loadingLiabilityCell"></td></tr>';
            // Apply loading to the single cell instead of the whole tbody
            Utils.showLoading('loadingLiabilityCell', 'Loading liabilities...');
        }

        ApiClient.getLiabilities({ 
            skip: skip, 
            limit: this.perPage, 
            search: query,
            userId: this.storedUserId
        })
        .then(function(response) {
            if (response && response.data) {
                // Store the data for sorting
                self.liabilityData = response.data;
                
                // Render the sorted data
                self.renderLiabilityTable(self.liabilityData);
                
                // Update to use numbered pagination
                Utils.updateNumberedPagination(self, response.count, response.count > (skip + self.perPage));
                self.updateUrl();
            } else {
                throw new Error('Invalid response format');
            }
        })
        .catch(function(error) {
            Utils.handleApiError(error, 'liabilityTableBody', 'Failed to load liabilities');
        });
    },

    renderLiabilityTable: function(liabilities) {
        var tableBody = document.getElementById('liabilityTableBody');
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        
        if (!liabilities || liabilities.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="10" class="text-center">No liabilities found</td></tr>';
            return;
        }
        
        // Sort the data if a sort column is selected
        var sortedData = liabilities;
        if (this.sortColumn !== null && this.columnMap[this.sortColumn]) {
            var columnName = this.columnMap[this.sortColumn];
            sortedData = Utils.sortData(liabilities, columnName, this.sortDirection);
        }
        
        var self = this;
        sortedData.forEach(function(liability) {
            var row = document.createElement('tr');
            
            // Add appropriate class based on liability status
            if (liability.is_deleted) {
                row.classList.add('deleted-row');
            } else if (liability.is_paid) {
                row.classList.add('paid-row');
            }
            
            row.innerHTML = 
                '<td>' + (liability.name || 'N/A') + '</td>' +
                '<td class="long-text">' +
                    '<div class="truncate-text" title="' + (liability.fund_details || '') + '">' +
                        (liability.fund_details || 'N/A') +
                    '</div>' +
                '</td>' +
                '<td>' + Utils.formatNumber(liability.amount) + '</td>' +
                '<td>' + Utils.formatNumber(liability.remaining_balance) + '</td>' +
                '<td>' + (liability.type || 'N/A') + '</td>' +
                '<td>' + (liability.payment_to || 'N/A') + '</td>' +
                '<td>' + (liability.payment_method || 'N/A') + '</td>' +
                '<td >' + Utils.formatDate(liability.date, true) + '</td>' +
                '<td>' + (liability.user || 'N/A') + '</td>' +
                '<td>' + ActionsMenu.init('Liability', liability, {
                    isDelete: liability.is_deleted,
                    isPaid: liability.is_paid,
                    disabled: liability.is_deleted,
                    onAction: function(action, item) {
                        self.handleAction(action, item);
                    }
                }) + '</td>';
            
            tableBody.appendChild(row);
        });
    },

    updatePagination: function(hasMore) {
        Utils.updatePagination(this, hasMore);
    },

    setupEventListeners: function() {
        var self = this;
        
        // Add Liability button
        var addLiabilityBtn = document.getElementById('addLiabilityBtn');
        if (addLiabilityBtn) {
            addLiabilityBtn.onclick = function() {
                if (typeof AddLiability !== 'undefined') {
                    AddLiability.init(self.loadLiabilityData.bind(self));
                } else {
                    console.error('AddLiability component not found');
                }
            };
        }
        
        // Search functionality
        var searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.oninput = function() {
                clearTimeout(self.searchTimeout);
                self.searchTimeout = setTimeout(function() {
                    self.currentPage = 1;
                    sessionStorage.setItem('liabilityCurrentPage', '1');
                    self.loadLiabilityData(searchInput.value);
                }, 300);
            };
        }
    },
    
    // Handle action menu operations (edit, delete, paid)
    handleAction: function(action, liability) {
        var self = this;
        switch (action) {
            case 'edit':
                if (typeof EditLiability !== 'undefined') {
                    EditLiability.init('Liability', liability.id, function() {
                        self.loadLiabilityData();
                    });
                } else {
                    console.error('EditLiability component not found');
                }
                break;
                
            case 'delete':
                if (confirm('Are you sure you want to delete this liability?')) {
                    ApiClient.deleteLiability(liability.id)
                        .then(function() {
                            Utils.onSuccess('delete', 'Liability');
                            self.loadLiabilityData();
                        })
                        .catch(function(error) {
                            console.error('Failed to delete liability:', error);
                            alert('Failed to delete liability: ' + (error.message || 'Unknown error'));
                        });
                }
                break;
                
            case 'paid':
                if (confirm('Mark this liability as paid?')) {
                    Utils.markAsPaid('Liability', liability.id, function(error) {
                        if (!error) {
                            self.loadLiabilityData();
                        }
                    });
                }
                break;
        }
    }
};

// Make LiabilityApp globally available
window.LiabilityApp = LiabilityApp; 

// Add CSS for the status legend
(function() {
    var style = document.createElement('style');
    style.id = 'liability-legend-styles';
    style.textContent = `
        .status-legend {
            display: flex;
            margin-bottom: 15px;
            background-color: #f4f4f4;
            padding: 10px 15px;
            border-radius: 4px;
            border-left: 3px solid #2196f3;
        }
        
        .status-legend > * {
            margin-right: 20px;
        }
        
        .status-legend > *:last-child {
            margin-right: 0;
        }
        
        .legend-item {
            display: flex;
            align-items: center;
            font-size: 14px;
        }
        
        .color-box {
            display: inline-block;
            width: 16px;
            height: 16px;
            margin-right: 6px;
            border-radius: 3px;
            border: 1px solid rgba(0,0,0,0.1);
        }
        
        .paid-box {
            background-color: rgba(0, 255, 0, 0.1);
        }
        
        .deleted-box {
            background-color: rgba(161, 83, 77, 0.5);
        }
        
        .active-box {
            background-color: rgba(255, 255, 255, 0.4);
            border: 1px solid #ddd;
        }
    `;
    document.head.appendChild(style);
})(); 