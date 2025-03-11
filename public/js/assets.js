var AssetsApp = {
    init: function() {
        // Reset page to 1 only if coming from another route
        if (!sessionStorage.getItem('isAssets')) {
            this.currentPage = 1;
            sessionStorage.setItem('assetsCurrentPage', '1');
        } else {
            this.currentPage = parseInt(sessionStorage.getItem('assetsCurrentPage')) || 1;
        }
        
        this.perPage = 10;
        this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
        this.storedUserId = sessionStorage.getItem('selectedUserId');
        this.storedUserName = sessionStorage.getItem('selectedUserName');
        this.storageKey = 'assets'; // For use with common pagination functions
        this.searchQuery = '';
        
        // Mark that we're in assets page
        sessionStorage.setItem('isAssets', 'true');
        if (typeof Utils !== 'undefined' && typeof Utils.storeLastVisited === 'function') {
            Utils.storeLastVisited('assets');
        }
        
        // Show assets page
        this.showAssetsPage();
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

    showAssetsPage: function() {
        var content = document.getElementById('content');
        if (!content) {
            console.error('Content element not found');
            return;
        }

        content.innerHTML = '<div class="container-fluid">' +
            '<div class="page-header">' +
                '<div class="header-content">' +
                    '<h1 class="page-title">' + this.getPageTitle() + '</h1>' +
                    '<button class="btn btn-secondary" id="goBackBtn">' +
                        '<i class="fas fa-arrow-left"></i> Go back' +
                    '</button>' +
                '</div>' +
                '<div class="search-bar">' +
                    '<input type="text" id="searchInput" placeholder="Search assets..." class="form-control">' +
                '</div>' +
            '</div>' +
            
            '<div class="table-responsive horizontal-scroll">' +
                '<table class="table">' +
                    '<thead>' +
                        '<tr>' +
                            '<th>ID</th>' +
                            '<th>Name</th>' +
                            '<th>Type</th>' +
                            '<th>Purchase Date</th>' +
                            '<th>Purchased From</th>' +
                            '<th>Cost</th>' +
                            '<th>Salvage Value</th>' +
                            '<th>Details</th>' +
                            '<th>User</th>' +
                            '<th>Actions</th>' +
                        '</tr>' +
                    '</thead>' +
                    '<tbody id="assetsTableBody">' +
                        '<tr>' +
                            '<td colspan="10" class="text-center">Loading...</td>' +
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
        
        // Load assets data
        this.loadAssetsData();
    },

    getPageTitle: function() {
        if (typeof Utils !== 'undefined' && typeof Utils.getPageTitle === 'function') {
            return Utils.getPageTitle('Assets', this.currentUser, this.storedUserName);
        }
        
        if (this.currentUser.is_superuser) {
            return this.storedUserName.toLowerCase() === 'admin' ? 'All Assets' : this.storedUserName + '\'s Assets';
        }
        return 'Assets Management';
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
        if (this.searchQuery) {
            searchParams.set('query', this.searchQuery);
        } else {
            searchParams.delete('query');
        }
        history.pushState(null, '', '?' + searchParams.toString());
    },

    loadAssetsData: function(query) {
        // Default parameter value for older browser compatibility
        query = query || this.searchQuery || '';
        
        var self = this;
        var skip = (this.currentPage - 1) * this.perPage;
        var tableBody = document.getElementById('assetsTableBody');
        
        // Show loading state
        if (tableBody) {
            if (typeof Utils !== 'undefined' && typeof Utils.showLoading === 'function') {
                // Create a row with a cell that spans all columns
                tableBody.innerHTML = '<tr><td colspan="10" class="text-center" id="loadingCell"></td></tr>';
                // Apply loading to the single cell instead of the whole tbody
                Utils.showLoading('loadingCell', 'Loading assets...');
            } else {
                tableBody.innerHTML = '<tr><td colspan="10" class="text-center">' +
                    '<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px;">' +
                    '<div class="spinner" style="width: 30px; height: 30px; border: 3px solid #f3f3f3; border-top: 3px solid #3498db; border-radius: 50%; animation: spin 2s linear infinite;"></div>' +
                    '<p style="margin-top: 10px;">Loading assets...</p>' +
                    '</div>' +
                    '</td></tr>';
                
                // Add spin animation if not already present
                if (!document.getElementById('spin-animation')) {
                    var style = document.createElement('style');
                    style.id = 'spin-animation';
                    style.innerHTML = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
                    document.head.appendChild(style);
                }
            }
        }

        ApiClient.getAssets({ 
            skip: skip, 
            limit: this.perPage, 
            search: query,
            userId: this.storedUserId
        })
        .then(function(response) {
            if (response && response.data) {
                self.renderAssetsTable(response.data);
                self.updatePagination(response.count > (skip + self.perPage));
                self.updateUrl();
            } else {
                throw new Error('Invalid response format');
            }
        })
        .catch(function(error) {
            if (typeof Utils !== 'undefined' && typeof Utils.handleApiError === 'function') {
                Utils.handleApiError(error, 'assetsTableBody', 'Failed to load assets');
            } else {
                console.error('Failed to load assets:', error);
                var tableBody = document.getElementById('assetsTableBody');
                if (tableBody) {
                    tableBody.innerHTML = '<tr><td colspan="10" class="text-center text-danger">Error loading assets: ' + 
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
    
        return value.toLocaleString('en-US', { 
            minimumFractionDigits: 2,
            maximumFractionDigits: 2 
        });
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

    getAssetStatusClass: function(asset) {
        if (asset.status === "Pending") {
            return 'pending-row';
        } else if (asset.dispose_status !== null) {
            return 'disposed-row';
        } else {
            return '';
        }
    },

    renderAssetsTable: function(assets) {
        var tableBody = document.getElementById('assetsTableBody');
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        
        if (!assets || assets.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="10" class="text-center">No assets found</td></tr>';
            return;
        }
        
        var self = this;
        assets.forEach(function(asset) {
            var row = document.createElement('tr');
            
            // Add appropriate class based on asset status
            var statusClass = self.getAssetStatusClass(asset);
            if (statusClass) {
                row.classList.add(statusClass);
            }
            
            // Build row using direct HTML like liability.js
            row.innerHTML = 
                '<td class="truncate-text" title="' + (asset.status || '') + '">' + (asset.asset_id || 'N/A') + '</td>' +
                '<td>' + (asset.name || 'N/A') + '</td>' +
                '<td>' + (asset.type || 'N/A') + '</td>' +
                '<td title="' + (asset.purchase_date || '') + '">' + (asset.purchase_date ? self.formatDate(asset.purchase_date, true) : 'N/A') + '</td>' +
                '<td>' + (asset.purchased_from || 'N/A') + '</td>' +
                '<td class="truncate-text" title="' + (asset.cost || 0) + '">' + self.formatNumber(Number(asset.cost)) + '</td>' +
                '<td title="' + (asset.salvage_value || 0) + '">' + self.formatNumber(Number(asset.salvage_value)) + '</td>' +
                '<td>' + (asset.head_detaills || 'N/A') + '</td>' +
                '<td>' + (asset.user || 'N/A') + '</td>' +
                '<td>' + ActionsMenu.init('Asset', asset, {
                    delete: false
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
        
        // Go back button
        var goBackBtn = document.getElementById('goBackBtn');
        if (goBackBtn) {
            goBackBtn.addEventListener('click', function() {
                self.goBack();
            });
        }
        
        // Search input
        var searchInput = document.getElementById('searchInput');
        if (searchInput) {
            // Set initial value from searchQuery
            searchInput.value = this.searchQuery;
            
            // Create debounced search handler
            var searchTimeout;
            searchInput.addEventListener('input', function() {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(function() {
                    self.searchQuery = searchInput.value.trim();
                    self.currentPage = 1; // Reset to first page when searching
                    sessionStorage.setItem('assetsCurrentPage', '1');
                    self.loadAssetsData(self.searchQuery);
                }, 500); // Debounce for 500ms
            });
        }
        
        // Pagination buttons
        var prevPageBtn = document.getElementById('prevPage');
        var nextPageBtn = document.getElementById('nextPage');
        
        if (prevPageBtn) {
            this.prevPageHandler = function() {
                if (self.currentPage > 1) {
                    self.currentPage--;
                    sessionStorage.setItem('assetsCurrentPage', self.currentPage.toString());
                    self.loadAssetsData();
                }
            };
            prevPageBtn.addEventListener('click', this.prevPageHandler);
        }
        
        if (nextPageBtn) {
            this.nextPageHandler = function() {
                self.currentPage++;
                sessionStorage.setItem('assetsCurrentPage', self.currentPage.toString());
                self.loadAssetsData();
            };
            nextPageBtn.addEventListener('click', this.nextPageHandler);
        }
    }
};

// Add custom CSS for tooltips and status backgrounds
(function() {
    var style = document.createElement('style');
    style.textContent = `
        .tooltip-container {
            position: relative;
            display: inline-block;
            max-width: 100%;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .tooltip-container .tooltip-text {
            visibility: hidden;
            background-color: #555;
            color: #fff;
            text-align: center;
            border-radius: 6px;
            padding: 5px 10px;
            position: absolute;
            z-index: 1;
            bottom: 125%;
            left: 50%;
            transform: translateX(-50%);
            opacity: 0;
            transition: opacity 0.3s;
            white-space: nowrap;
        }
        
        .tooltip-container:hover .tooltip-text {
            visibility: visible;
            opacity: 1;
        }
        
        .pending-row {
            background-color: rgba(240, 170, 190, 0.2);
        }
        
        .disposed-row {
            background-color: rgba(250, 230, 140, 0.2);
        }
        
        tr:hover {
            background-color: rgba(240, 240, 240, 0.5) !important;
        }
    `;
    document.head.appendChild(style);
})();

// Make AssetsApp globally available
window.AssetsApp = AssetsApp;
