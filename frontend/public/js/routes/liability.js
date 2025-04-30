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
            
            '<div class="table-responsive horizontal-scroll">' +
                '<table class="table">' +
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
                            '<th>Actions</th>' +
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
                self.renderLiabilityTable(response.data);
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
        
        var self = this;
        liabilities.forEach(function(liability) {
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