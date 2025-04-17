var ActivityApp = {

    init: function() {
        // Reset page to 1 only if coming from another route
        if (!sessionStorage.getItem('isActivity')) {
            this.currentPage = 1;
            sessionStorage.setItem('activityCurrentPage', '1');
        } else {
            this.currentPage = parseInt(sessionStorage.getItem('activityCurrentPage')) || 1;
        }
        
        this.perPage = 10;
        this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
        
        // Mark that we're in activity page
        sessionStorage.setItem('isActivity', 'true');
        
        // Show activity logs page
        this.showActivityPage();
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

    showActivityPage: function() {
        var content = document.getElementById('content');
        if (!content) {
            console.error('Content element not found');
            return;
        }

        content.innerHTML = '<div class="container-fluid">' +
            '<div class="page-header">' +
                '<div class="header-content">' +
                    '<h1 class="page-title">Logs Management</h1>' +
                '</div>' +
                '<div class="search-bar">' +
                    '<input type="text" id="searchInput" placeholder="Search logs..." class="form-control">' +
                '</div>' +
            '</div>' +
            
            '<div class="table-responsive horizontal-scroll">' +
                '<table class="table">' +
                    '<thead>' +
                        '<tr>' +
                            '<th width="10%">Log Name</th>' +
                            '<th width="20%">Description</th>' +
                            '<th width="10%">Subject Type</th>' +
                            '<th width="10%">Event</th>' +
                            '<th width="20%">Custom</th>' +
                            '<th width="10%">User</th>' +
                        '</tr>' +
                    '</thead>' +
                    '<tbody id="activityTableBody">' +
                        '<tr>' +
                            '<td colspan="7" class="text-center">Loading...</td>' +
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
        
        // Load activity data
        this.loadActivityData();
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

    loadActivityData: function(query) {
        // Default parameter value for older browser compatibility
        query = query || this.searchQuery || '';
        
        var self = this;
        var skip = (this.currentPage - 1) * this.perPage;
        var tableBody = document.getElementById('activityTableBody');
        
        // Show loading state
        if (tableBody) {
            // Create a row with a cell that spans all columns
            tableBody.innerHTML = '<tr><td colspan="7" class="text-center" id="loadingCell"></td></tr>';
            // Apply loading to the single cell instead of the whole tbody
            Utils.showLoading('loadingCell', 'Loading activity logs...');
        }

        ApiClient.readActivities({ 
            skip: skip, 
            limit: this.perPage, 
            search: query
        })
        .then(function(response) {
            if (response && response.data) {
                self.renderActivityTable(response.data);
                self.updatePagination(response.data.length >= self.perPage);
                self.updateUrl();
            } else {
                throw new Error('Invalid response format');
            }
        })
        .catch(function(error) {
            console.error('Failed to load activity logs:', error);
            var tableBody = document.getElementById('activityTableBody');
            if (tableBody) {
                tableBody.innerHTML = '<tr>' +
                    '<td colspan="7" class="text-center text-danger">' +
                        'Error loading logs: ' + (error.message || 'Unknown error') +
                    '</td>' +
                '</tr>';
            }
        });
    },

    renderActivityTable: function(logs) {
        var tableBody = document.getElementById('activityTableBody');
        if (!tableBody) {
            console.error('Table body element not found');
            return;
        }

        if (!logs || logs.length === 0) {
            tableBody.innerHTML = '<tr>' +
                '<td colspan="7" class="text-center">No activity logs found</td>' +
            '</tr>';
            return;
        }

        var self = this;
        tableBody.innerHTML = '';
        
        logs.forEach(function(log) {
            var row = document.createElement('tr');
            row.dataset.id = log.id;
            
            // Create cells in the same order as the headers
            row.innerHTML = 
                '<td>' + (log.log_name || 'N/A') + '</td>' +
                '<td class="long-text">' +
                    '<div class="truncate-text" title="' + (log.description || '') + '">' +
                        (log.description || 'N/A') +
                    '</div>' +
                '</td>' +
                '<td>' + (log.subject_type || 'N/A') + '</td>' +
                '<td>' + (log.event || 'N/A') + '</td>' +
                '<td class="long-text">' +
                    '<div class="truncate-text" title="' + (log.my_custom_field || '') + '">' +
                        (log.my_custom_field || 'N/A') +
                    '</div>' +
                '</td>' +
                '<td>' + (log.user || 'N/A') + '</td>';
            
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
                    sessionStorage.setItem('activityCurrentPage', '1');
                    self.loadActivityData(searchInput.value);
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
                    sessionStorage.setItem('activityCurrentPage', self.currentPage.toString());
                    self.loadActivityData(searchInput ? searchInput.value : '');
                }
            };
            prevPage.addEventListener('click', this.prevPageHandler);
        }

        if (nextPage) {
            this.nextPageHandler = function(e) {
                e.preventDefault();
                self.currentPage++;
                sessionStorage.setItem('activityCurrentPage', self.currentPage.toString());
                self.loadActivityData(searchInput ? searchInput.value : '');
            };
            nextPage.addEventListener('click', this.nextPageHandler);
        }
    },

    updatePagination: function(hasNextPage) {
        Utils.updatePagination(this, hasNextPage);
    }
};

// Clean up when leaving activity page
// Using a more compatible approach for legacy browsers
if (typeof window.attachEvent !== 'undefined') {
    // For older IE browsers
    window.attachEvent('onunload', function() {
        if (window.location.pathname !== '/activity') {
            sessionStorage.removeItem('isActivity');
        }
    });
} else if (typeof window.addEventListener !== 'undefined') {
    // For modern browsers
    window.addEventListener('beforeunload', function() {
        if (window.location.pathname !== '/activity') {
            sessionStorage.removeItem('isActivity');
        }
    });
} else {
    // Fallback for very old browsers
    window.onunload = function() {
        if (window.location.pathname !== '/activity') {
            sessionStorage.removeItem('isActivity');
        }
    };
}

// Make it globally available
window.ActivityApp = ActivityApp;
