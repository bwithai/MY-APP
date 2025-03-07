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
        
        // Mark that we're in investment page
        sessionStorage.setItem('isInvestment', 'true');
        
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
        if (this.currentUser.is_superuser) {
            return this.storedUserName.toLowerCase() === 'admin' ? 'All Users Investments' : this.storedUserName + '\'s Investments';
        }
        return 'My Investments';
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

    loadInvestmentData: function(query = '') {
        var self = this;
        var skip = (this.currentPage - 1) * this.perPage;

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
            console.error('Failed to load investments:', error);
            var tableBody = document.getElementById('investmentTableBody');
            if (tableBody) {
                tableBody.innerHTML = '<tr>' +
                    '<td colspan="9" class="text-center text-danger">' +
                        'Error loading investments: ' + (error.message || 'Unknown error') +
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

    formatDate: function(dateString, includeTime = false) {
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

    renderInvestmentTable: function(investments) {
        var tableBody = document.getElementById('investmentTableBody');
        if (!tableBody) {
            console.error('Table body element not found');
            return;
        }

        if (!investments || investments.length === 0) {
            tableBody.innerHTML = '<tr>' +
                '<td colspan="9" class="text-center">No investments found</td>' +
            '</tr>';
            return;
        }

        var self = this;
        tableBody.innerHTML = '';
        
        investments.forEach(function(investment) {
            // Add deleted-row class if is_deleted is true
            var rowClass = investment.is_deleted ? 'deleted-row' : '';
            var row = document.createElement('tr');
            row.className = rowClass;
            row.dataset.id = investment.id;
            
            // Create cells in the same order as the headers
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
                '<td>' +
                    '<div class="action-menu-container">' +
                        '<button class="btn-icon action-menu-trigger" aria-label="Actions">' +
                            '<i class="fas fa-ellipsis-v"></i>' +
                        '</button>' +
                        '<div class="action-menu-dropdown">' +
                            '<div class="action-menu-item edit-investment" data-id="' + investment.id + '">' +
                                '<i class="fas fa-edit"></i> Edit' +
                            '</div>' +
                            '<div class="action-menu-item delete-investment" data-id="' + investment.id + '">' +
                                '<i class="fas fa-trash"></i> Delete' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</td>';
            
            tableBody.appendChild(row);
        });

        // Setup action menu event listeners
        this.setupActionMenus();
    },

    setupActionMenus: function() {
        var self = this;
        var triggers = document.querySelectorAll('.action-menu-trigger');
        var editButtons = document.querySelectorAll('.edit-investment');
        var deleteButtons = document.querySelectorAll('.delete-investment');
        
        // Close all dropdowns when clicking outside
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.action-menu-container')) {
                document.querySelectorAll('.action-menu-dropdown').forEach(function(dropdown) {
                    dropdown.classList.remove('show');
                });
            }
        });
        
        // Toggle dropdown on trigger click
        triggers.forEach(function(trigger) {
            trigger.addEventListener('click', function(e) {
                e.stopPropagation();
                var dropdown = this.nextElementSibling;
                
                // Close all other dropdowns
                document.querySelectorAll('.action-menu-dropdown').forEach(function(otherDropdown) {
                    if (otherDropdown !== dropdown) {
                        otherDropdown.classList.remove('show');
                    }
                });
                
                // Toggle this dropdown
                dropdown.classList.toggle('show');
            });
        });
        
        // Edit button click
        editButtons.forEach(function(button) {
            button.addEventListener('click', function() {
                var id = this.dataset.id;
                self.editInvestment(id);
            });
        });
        
        // Delete button click
        deleteButtons.forEach(function(button) {
            button.addEventListener('click', function() {
                var id = this.dataset.id;
                self.deleteInvestment(id);
            });
        });
    },

    editInvestment: function(id) {
        // Close any open dropdowns
        document.querySelectorAll('.action-menu-dropdown').forEach(function(dropdown) {
            dropdown.classList.remove('show');
        });
        
        // Initialize the edit investment component
        if (typeof EditInvestment !== 'undefined') {
            EditInvestment.init('Investment', id, this.loadInvestmentData.bind(this));
        } else {
            console.error('EditInvestment component not found');
        }
    },

    deleteInvestment: function(id) {
        // Close any open dropdowns
        document.querySelectorAll('.action-menu-dropdown').forEach(function(dropdown) {
            dropdown.classList.remove('show');
        });
        
        // Initialize the delete alert component
        if (typeof DeleteAlert !== 'undefined') {
            DeleteAlert.init('Investment', id, this.loadInvestmentData.bind(this));
        } else {
            console.error('DeleteAlert component not found');
        }
    },

    updatePagination: function(hasMore) {
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
        
        // Add Investment button
        var addInvestmentBtn = document.getElementById('addInvestmentBtn');
        if (addInvestmentBtn) {
            addInvestmentBtn.addEventListener('click', function() {
                if (typeof AddInvestment !== 'undefined') {
                    AddInvestment.init(self.loadInvestmentData.bind(self));
                } else {
                    console.error('AddInvestment component not found');
                }
            });
        }
        
        // Pagination buttons
        var prevPage = document.getElementById('prevPage');
        var nextPage = document.getElementById('nextPage');
        
        this.prevPageHandler = function() {
            if (self.currentPage > 1) {
                self.currentPage--;
                sessionStorage.setItem('investmentCurrentPage', self.currentPage);
                self.loadInvestmentData(document.getElementById('searchInput').value);
            }
        };
        
        this.nextPageHandler = function() {
            self.currentPage++;
            sessionStorage.setItem('investmentCurrentPage', self.currentPage);
            self.loadInvestmentData(document.getElementById('searchInput').value);
        };
        
        if (prevPage) {
            prevPage.addEventListener('click', this.prevPageHandler);
        }
        
        if (nextPage) {
            nextPage.addEventListener('click', this.nextPageHandler);
        }
        
        // Search input
        var searchInput = document.getElementById('searchInput');
        
        this.searchHandler = function() {
            self.currentPage = 1;
            sessionStorage.setItem('investmentCurrentPage', '1');
            self.loadInvestmentData(this.value);
        };
        
        if (searchInput) {
            searchInput.addEventListener('input', this.searchDebounced());
        }
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