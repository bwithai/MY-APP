var LiabilityApp = {
    init: function() {
        // Reset page to 1 only if coming from another route
        if (!sessionStorage.getItem('isLiability')) {
            this.currentPage = 1;
            sessionStorage.setItem('liabilityCurrentPage', '1');
        } else {
            this.currentPage = parseInt(sessionStorage.getItem('liabilityCurrentPage')) || 1;
        }
        
        this.perPage = 10;
        this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
        this.storedUserId = sessionStorage.getItem('selectedUserId');
        this.storedUserName = sessionStorage.getItem('selectedUserName');
        this.storageKey = 'liability'; // For use with common pagination functions
        
        // Mark that we're in liability page
        sessionStorage.setItem('isLiability', 'true');
        if (typeof Utils !== 'undefined' && typeof Utils.storeLastVisited === 'function') {
            Utils.storeLastVisited('liability');
        }
        
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
                    '<h1 class="page-title">' + this.getPageTitle() + '</h1>' +
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
                            '<th>Head</th>' +
                            '<th>Sub Heads</th>' +
                            '<th>Fund Details</th>' +
                            '<th>Amount</th>' +
                            '<th>Remaining</th>' +
                            '<th>Type</th>' +
                            '<th>Payment To</th>' +
                            '<th>Payment Method</th>' +
                            '<th>Date of Entry</th>' +
                            '<th>User</th>' +
                            '<th>Actions</th>' +
                        '</tr>' +
                    '</thead>' +
                    '<tbody id="liabilityTableBody">' +
                        '<tr>' +
                            '<td colspan="11" class="text-center">Loading...</td>' +
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
        
        // Load liability data
        this.loadLiabilityData();
    },

    getPageTitle: function() {
        if (typeof Utils !== 'undefined' && typeof Utils.getPageTitle === 'function') {
            return Utils.getPageTitle('Liabilities', this.currentUser, this.storedUserName);
        }
        
        if (this.currentUser.is_superuser) {
            return this.storedUserName.toLowerCase() === 'admin' ? 'All Liabilities' : this.storedUserName + '\'s Liabilities';
        }
        return 'My Liabilities';
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
            if (typeof Utils !== 'undefined' && typeof Utils.showLoading === 'function') {
                Utils.showLoading('liabilityTableBody', 'Loading liabilities...');
            } else {
                tableBody.innerHTML = '<tr><td colspan="11" class="text-center">Loading...</td></tr>';
            }
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
                self.updatePagination(response.count > (skip + self.perPage));
                self.updateUrl();
            } else {
                throw new Error('Invalid response format');
            }
        })
        .catch(function(error) {
            if (typeof Utils !== 'undefined' && typeof Utils.handleApiError === 'function') {
                Utils.handleApiError(error, 'liabilityTableBody', 'Failed to load liabilities');
            } else {
                console.error('Failed to load liabilities:', error);
                var tableBody = document.getElementById('liabilityTableBody');
                if (tableBody) {
                    tableBody.innerHTML = '<tr><td colspan="11" class="text-center text-danger">Error loading liabilities: ' + 
                        (error.message || 'Unknown error') + '</td></tr>';
                }
            }
        });
    },

    formatNumber: function(value) {
        if (typeof Utils !== 'undefined' && typeof Utils.formatNumber === 'function') {
            return Utils.formatNumber(value);
        }
        
        value = Number(value);
        if (value == null || isNaN(value)) {
            return 'Invalid number';
        }
    
        if (value < 1000) {
            return value.toFixed(2);
        } else if (value < 1000000) {
            return (value / 1000).toFixed(2) + 'K';
        } else if (value < 1000000000) {
            return (value / 1000000).toFixed(2) + 'M';
        } else if (value < 1000000000000) {
            return (value / 1000000000).toFixed(2) + 'B';
        } else {
            return (value / 1000000000000).toFixed(2) + 'T';
        }
    },

    formatDate: function(dateString, includeTime) {
        if (typeof Utils !== 'undefined' && typeof Utils.formatDate === 'function') {
            return Utils.formatDate(dateString, includeTime);
        }
        
        if (!dateString) return 'N/A';
        
        try {
            var date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return 'Invalid date';
            }
            
            var options = { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric'
            };
            
            if (includeTime) {
                options.hour = '2-digit';
                options.minute = '2-digit';
            }
            
            return date.toLocaleDateString('en-US', options);
        } catch (e) {
            console.error('Error formatting date:', e);
            return 'Error';
        }
    },

    renderLiabilityTable: function(liabilities) {
        var tableBody = document.getElementById('liabilityTableBody');
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        
        if (!liabilities || liabilities.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="11" class="text-center">No liabilities found</td></tr>';
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
                '<td class="truncate-text" title="' + (liability.head || '') + '">' + (liability.head || 'N/A') + '</td>' +
                '<td class="truncate-text" title="' + (liability.sub_heads || '') + '">' + (liability.sub_heads || 'N/A') + '</td>' +
                '<td class="long-text ' + (liability.fund_details ? '' : 'text-muted') + '">' +
                    '<div class="truncate-text" title="' + (liability.fund_details || '') + '">' +
                        (liability.fund_details || 'N/A') +
                    '</div>' +
                '</td>' +
                '<td title="' + (liability.amount || 0) + '">' + self.formatNumber(liability.amount) + '</td>' +
                '<td title="' + (liability.remaining_balance || 0) + '">' + self.formatNumber(liability.remaining_balance) + '</td>' +
                '<td>' + (liability.type || 'N/A') + '</td>' +
                '<td class="truncate-text" title="' + (liability.payment_to || '') + '">' + (liability.payment_to || 'N/A') + '</td>' +
                '<td>' + (liability.payment_method || 'N/A') + '</td>' +
                '<td>' + self.formatDate(liability.date, true) + '</td>' +
                '<td>' + (liability.user || 'N/A') + '</td>' +
                '<td>' + ActionsMenu.init('Liability', liability, {
                    delete: !liability.is_deleted,
                    paid: !liability.is_paid && !liability.is_deleted,
                    disabled: liability.is_deleted,
                    onAction: function(action, item) {
                        self.handleAction(action, item);
                    }
                }) + '</td>';
            
            tableBody.appendChild(row);
        });
    },

    updatePagination: function(hasMore) {
        if (typeof Utils !== 'undefined' && typeof Utils.updatePagination === 'function') {
            Utils.updatePagination(this, hasMore);
            return;
        }
        
        var prevPageBtn = document.getElementById('prevPage');
        var nextPageBtn = document.getElementById('nextPage');
        var currentPageSpan = document.getElementById('currentPage');
        
        if (currentPageSpan) {
            currentPageSpan.textContent = this.currentPage;
        }
        
        if (prevPageBtn) {
            prevPageBtn.disabled = this.currentPage <= 1;
        }
        
        if (nextPageBtn) {
            nextPageBtn.disabled = !hasMore;
        }
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
        
        // Use common pagination initialization if available
        if (typeof Utils !== 'undefined' && typeof Utils.initPagination === 'function') {
            Utils.initPagination(this, function(searchTerm) {
                var searchInput = document.getElementById('searchInput');
                self.loadLiabilityData(searchTerm || (searchInput ? searchInput.value : ''));
            });
        } else {
            // Fallback pagination handling
            var prevPage = document.getElementById('prevPage');
            var nextPage = document.getElementById('nextPage');
            var searchInput = document.getElementById('searchInput');
            
            this.prevPageHandler = function() {
                if (self.currentPage > 1) {
                    self.currentPage--;
                    sessionStorage.setItem('liabilityCurrentPage', self.currentPage);
                    self.loadLiabilityData(searchInput ? searchInput.value : '');
                }
            };
            
            this.nextPageHandler = function() {
                self.currentPage++;
                sessionStorage.setItem('liabilityCurrentPage', self.currentPage);
                self.loadLiabilityData(searchInput ? searchInput.value : '');
            };
            
            this.searchHandler = function() {
                self.currentPage = 1;
                sessionStorage.setItem('liabilityCurrentPage', '1');
                self.loadLiabilityData(this.value);
            };
            
            if (prevPage) {
                prevPage.onclick = this.prevPageHandler;
            }
            
            if (nextPage) {
                nextPage.onclick = this.nextPageHandler;
            }
            
            if (searchInput) {
                var timeout = null;
                searchInput.oninput = function() {
                    if (timeout) {
                        clearTimeout(timeout);
                    }
                    var value = this.value;
                    timeout = setTimeout(function() {
                        self.currentPage = 1;
                        sessionStorage.setItem('liabilityCurrentPage', '1');
                        self.loadLiabilityData(value);
                    }, 500);
                };
            }
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
                            if (typeof Utils !== 'undefined' && typeof Utils.onSuccess === 'function') {
                                Utils.onSuccess('delete', 'Liability');
                            } else {
                                var successDiv = document.createElement('div');
                                successDiv.className = 'success-message';
                                successDiv.style.backgroundColor = '#d63031';
                                successDiv.textContent = 'Deleted Liability successfully!';
                                document.body.appendChild(successDiv);
                                setTimeout(function() {
                                    successDiv.remove();
                                }, 3000);
                            }
                            
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
                    if (typeof Utils !== 'undefined' && typeof Utils.markAsPaid === 'function') {
                        Utils.markAsPaid('Liability', liability.id, function(error) {
                            if (!error) {
                                self.loadLiabilityData();
                            }
                        });
                    } else {
                        ApiClient.markLiabilityAsPaid(liability.id)
                            .then(function() {
                                // Show success message
                                var successDiv = document.createElement('div');
                                successDiv.className = 'success-message';
                                successDiv.textContent = 'Liability marked as paid!';
                                document.body.appendChild(successDiv);
                                setTimeout(function() {
                                    successDiv.remove();
                                }, 3000);
                                
                                self.loadLiabilityData();
                            })
                            .catch(function(error) {
                                console.error('Failed to mark liability as paid:', error);
                                alert('Failed to mark liability as paid: ' + (error.message || 'Unknown error'));
                            });
                    }
                }
                break;
        }
    }
};

// Make LiabilityApp globally available
window.LiabilityApp = LiabilityApp; 