var InvestHistory = {
    init: function(investment, onClose) {
        this.investment = investment;
        this.onClose = onClose;
        this.currentPage = 1;
        this.perPage = 10; // Equivalent to PER_PAGE in React component
        this.historyData = [];
        this.isLoading = true;
        
        this.cleanup();
        this.render();
        this.loadHistoryData();
    },
    
    cleanup: function() {
        Utils.cleanup('investHistoryModal');
    },
    
    loadHistoryData: function() {
        var self = this;
        
        // Show loading state
        this.updateModalContent('<div class="loading-container"><div class="loading-spinner"></div><p>Loading history data...</p></div>');
        
        // Make API call to get history data
        ApiClient.getInvestmentHistory(this.investment.id)
            .then(function(response) {
                // Check if response has data property or is an array
                var historyData = Array.isArray(response) ? response : (response.data || []);
                self.historyData = historyData;
                self.isLoading = false;
                self.renderTableContent();
            })
            .catch(function(error) {
                console.error('Failed to load investment history:', error);
                self.isLoading = false;
                self.updateModalContent('<div class="error-message">Failed to load history data: ' + (error.message || 'Unknown error') + '</div>');
            });
    },
    
    render: function() {
        var modalHtml = '<div class="modal extra-large-modal" id="investHistoryModal">' +
            '<div class="modal-content wide-modal-content">' +
                '<div class="modal-header">' +
                    '<h2>'+ this.investment.name + ' History' + '</h2>' +
                    '<button type="button" class="close-btn">&times;</button>' +
                '</div>' +
                '<div class="modal-body" id="investHistoryModalBody">' +
                    '<div class="loading-container"><div class="loading-spinner"></div><p>Loading history data...</p></div>' +
                '</div>' +
                '<div class="modal-footer" id="investHistoryPagination"></div>' +
            '</div>' +
        '</div>';
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Apply additional styles to make modal wider
        var modal = document.getElementById('investHistoryModal');
        if (modal) {
            modal.style.maxWidth = '100%';
            var modalContent = modal.querySelector('.modal-content');
            if (modalContent) {
                modalContent.style.width = '100%';
                modalContent.style.maxWidth = '1400px';
            }
            
            setTimeout(function() {
                modal.classList.add('show');
            }, 10);
        }
        
        // Set up event listeners
        this.setupEventListeners();
    },
    
    updateModalContent: function(content) {
        var modalBody = document.getElementById('investHistoryModalBody');
        if (modalBody) {
            modalBody.innerHTML = content;
        }
    },
    
    renderTableContent: function() {
        if (this.historyData.length === 0) {
            this.updateModalContent(
                '<div class="no-data-container">' +
                    '<h3>No History</h3>' +
                    '<p>No history available for this investment.</p>' +
                '</div>'
            );
            // Hide pagination since there's no data
            var paginationContainer = document.getElementById('investHistoryPagination');
            if (paginationContainer) {
                paginationContainer.innerHTML = '';
            }
            return;
        }
        
        // Calculate pagination
        var startIndex = (this.currentPage - 1) * this.perPage;
        var endIndex = startIndex + this.perPage;
        var paginatedData = this.historyData.slice(startIndex, endIndex);
        var hasNextPage = endIndex < this.historyData.length;
        var hasPreviousPage = this.currentPage > 1;
        
        // Build table HTML with the specific columns
        var tableHtml = '<div class="table-responsive horizontal-scroll">' +
            '<table class="table">' +
                '<thead>' +
                    '<tr>' +
                        '<th>STATUS</th>' +
                        '<th>DESCRIPTION</th>' +
                        '<th>FIRST BALANCE</th>' +
                        '<th>LAST BALANCE</th>' +
                        '<th>DATE</th>' +
                        '<th>USER</th>' +
                        '<th>INVESTMENT</th>' +
                    '</tr>' +
                '</thead>' +
                '<tbody>';
        
        // Add rows with color coding based on status
        var self = this;
        paginatedData.forEach(function(item, index) {
            // Determine row background color based on status
            var rowClass = '';
            var rowStyle = '';
            
            if (item.status === 'Increase') {
                rowStyle = 'background-color: rgba(154, 230, 180, 0.3);'; // Light green for increase
            } else if (item.status === 'Decrease') {
                rowStyle = 'background-color: rgba(254, 178, 178, 0.3);'; // Light red for decrease
            }
            
            tableHtml += '<tr class="' + rowClass + '" style="' + rowStyle + '">' +
                '<td>' + (item.status || 'N/A') + '</td>' +
                '<td class="long-text">' +
                    '<div class="truncate-text" title="' + (item.description || '') + '">' +
                        (item.description || 'N/A') +
                    '</div>' +
                '</td>' +
                '<td title="' + (item.first_balance || 0) + '">' + Utils.formatNumber(item.first_balance) + '</td>' +
                '<td title="' + (item.last_balance || 0) + '">' + Utils.formatNumber(item.last_balance) + '</td>' +
                '<td>' + Utils.formatDate(item.date, true) + '</td>' +
                '<td>' + (item.user || 'N/A') + '</td>' +
                '<td class="long-text">' +
                    '<div class="truncate-text" title="' + (item.investment || '') + '">' +
                        (item.investment || 'N/A') +
                    '</div>' +
                '</td>' +
            '</tr>';
        });
        
        tableHtml += '</tbody></table></div>';
        
        // Update modal content with table
        this.updateModalContent(tableHtml);
        
        // Update pagination
        this.renderPagination(hasPreviousPage, hasNextPage);
    },
    
    renderPagination: function(hasPreviousPage, hasNextPage) {
        var self = this;
        var paginationContainer = document.getElementById('investHistoryPagination');
        if (!paginationContainer) return;
        
        var paginationHtml = '<div class="pagination-controls">' +
            '<button class="btn btn-sm" ' + (hasPreviousPage ? '' : 'disabled') + ' id="prevPageBtn">' +
            '<i class="fas fa-chevron-left"></i> Previous' +
            '</button>' +
            '<span class="pagination-info">Page ' + this.currentPage + '</span>' +
            '<button class="btn btn-sm" ' + (hasNextPage ? '' : 'disabled') + ' id="nextPageBtn">' +
            'Next <i class="fas fa-chevron-right"></i>' +
            '</button>' +
        '</div>';
        
        paginationContainer.innerHTML = paginationHtml;
        
        // Add event listeners for pagination buttons
        var prevBtn = document.getElementById('prevPageBtn');
        var nextBtn = document.getElementById('nextPageBtn');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', function() {
                if (hasPreviousPage) {
                    self.changePage(self.currentPage - 1);
                }
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', function() {
                if (hasNextPage) {
                    self.changePage(self.currentPage + 1);
                }
            });
        }
    },
    
    changePage: function(newPage) {
        this.currentPage = newPage;
        this.renderTableContent();
    },
    
    setupEventListeners: function() {
        var self = this;
        var modal = document.getElementById('investHistoryModal');
        var closeButtons = modal.querySelectorAll('.close-btn');
        
        // Close button event handlers
        closeButtons.forEach(function(button) {
            button.onclick = function(e) {
                e.preventDefault();
                self.close();
            };
        });
    },
    
    close: function() {
        Utils.cleanup('investHistoryModal');
    }
};

// Make InvestHistory globally available
window.InvestHistory = InvestHistory;
