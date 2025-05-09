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
        Utils.storeLastVisited('assets');
        
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
                    '<h1 class="page-title">' + Utils.getPageTitle('Assets', this.currentUser, this.storedUserName) + '</h1>' +
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
            // Create a row with a cell that spans all columns
            tableBody.innerHTML = '<tr><td colspan="10" class="text-center" id="loadingCell"></td></tr>';
            // Apply loading to the single cell instead of the whole tbody
            Utils.showLoading('loadingCell', 'Loading assets...');
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
            Utils.handleApiError(error, 'assetsTableBody', 'Failed to load assets');
        });
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
                '<td title="' + (asset.status || '') + '">' + (asset.asset_id || 'N/A') + '</td>' +
                '<td>' + (asset.name || 'N/A') + '</td>' +
                '<td>' + (asset.type || 'N/A') + '</td>' +
                '<td title="' + (asset.purchase_date || '') + '">' + (asset.purchase_date ? Utils.formatDate(asset.purchase_date, true) : 'N/A') + '</td>' +
                '<td>' + (asset.purchased_from || 'N/A') + '</td>' +
                '<td class="truncate-text" title="' + (asset.cost || 0) + '">' + Utils.formatNumber(Number(asset.cost)) + '</td>' +
                '<td title="' + (asset.salvage_value || 0) + '">' + Utils.formatNumber(Number(asset.salvage_value)) + '</td>' +
                '<td>' + (asset.head_details || 'N/A') + '</td>' +
                '<td>' + (asset.user || 'N/A') + '</td>' +
                '<td>' + ActionsMenu.init('Asset', asset, {
                    delete: false
                }) + '</td>';
            
            tableBody.appendChild(row);
        });
    },

    updatePagination: function(hasMore) {
        Utils.updatePagination(this, hasMore);
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
            background-color: rgba(226, 100, 136, 0.2);
        }
        
        .disposed-row {
            background-color: rgba(218, 194, 89, 0.2);
        }
        
        tr:hover {
            background-color: rgba(240, 240, 240, 0.5) !important;
        }
    `;
    document.head.appendChild(style);
})();

// Make AssetsApp globally available
window.AssetsApp = AssetsApp;
