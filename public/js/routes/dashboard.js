var DashboardApp = {
    init: function() {
        this.content = document.getElementById('content');
        this.userData = JSON.parse(localStorage.getItem('currentUser')) || { name: 'User', id: '', is_superuser: false };
        this.viewMode = 'all'; // Default view mode: 'all', 'range', or 'currentMonth'
        
        // Store initial date range for data loading
        var today = new Date();
        var firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        var lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        this.dateRange = {
            startDate: this.formatISODate(firstDayOfMonth),
            endDate: this.formatISODate(lastDayOfMonth)
        };
        
        this.currentMonth = this.formatMonthYear(today);
        
        // Get selected user ID from session storage or use current user
        this.selectedUserId = sessionStorage.getItem('selectedUserId') || this.userData.id || '';
        this.selectedUserName = sessionStorage.getItem('selectedUserName') || this.userData.name || '';
        
        this.render();
        this.initializeFinancialOverview();
        this.initializeInflowOutflowOverview();
        this.initializeDateRangePicker();
        this.loadDashboardData();
    },
    
    render: function() {
        this.content.innerHTML = `
            <div class="container-fluid">
                <div id="welcome-container"></div>
                
                <!-- Two-column layout for desktop, stack for mobile -->
                <div class="dashboard-grid">
                    <!-- Left Column - Financial Overview -->
                    <div class="dashboard-column financial-column">
                        <div class="content-card">
                            <div id="financial-overview-container"></div>
                        </div>
                    </div>
                    
                    <!-- Right Column - Date Range & Inflow/Outflow -->
                    <div class="dashboard-column control-column">
                        <div class="content-card">
                            <div id="date-range-picker-container"></div>
                            <div id="inflow-outflow-container" class="mb-4"></div>
                            <button id="all-time-btn" class="btn btn-primary all-time-btn">
                                All Time
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="dashboard-stats" id="dashboard-loading">
                    Loading...
                </div>
            </div>
        `;
        
        // Add dashboard grid styles for legacy browser support
        if (!document.getElementById('dashboard-grid-styles')) {
            var style = document.createElement('style');
            style.id = 'dashboard-grid-styles';
            style.textContent = `
                /* Dashboard grid layout - legacy browser compatible */
                .dashboard-grid {
                    display: flex;
                    flex-wrap: wrap;
                    margin: 0 -10px; /* Negative margin to offset padding */
                    margin-bottom: 20px;
                }
                
                .dashboard-column {
                    padding: 0 10px;
                    margin-bottom: 20px;
                    width: 100%;
                }
                
                .content-card {
                    background: linear-gradient(135deg, rgb(215, 245, 210), rgb(239, 252, 240));
                    padding: 24px;
                    border-radius: 8px;
                    box-shadow: 0 10px 15px rgba(0,0,0,0.1);
                    height: 100%;
                }
                
                .all-time-btn {
                    width: 100%;
                    margin-top: 16px;
                    padding: 8px;
                    background: #50C878;
                    border-radius: 4px;
                    text-align: center;
                    color: white;
                    cursor: pointer;
                    border: none;
                    margin-top: -5px;
                    position: relative;
                    z-index: 1;
                }
                
                .all-time-btn:hover {
                    background: #388e3c;
                }
                
                /* Desktop layout */
                @media (min-width: 768px) {
                    .dashboard-column {
                        width: 50%;
                    }
                }
                
                /* Dark mode support */
                @media (prefers-color-scheme: dark) {
                    .content-card {
                        background: #2D3748;
                        color: white;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Initialize the WelcomeBox component
        if (typeof WelcomeBox !== 'undefined') {
            WelcomeBox.init(
                document.getElementById('welcome-container'), 
                {
                    currentUser: this.selectedUserName || this.userData.name,
                    is_superuser: this.userData.is_superuser
                }
            );
        } else {
            console.error('WelcomeBox component not found');
        }
        
        // Attach event listener to All Time button
        var self = this;
        document.getElementById('all-time-btn').addEventListener('click', function() {
            self.handleAllFinanceChange(true);
        });
        
        Utils.showLoading('dashboard-loading', 'Loading dashboard data...');
    },
    
    initializeFinancialOverview: function() {
        // Initialize Financial Overview with dummy decimal numbers initially
        if (typeof FinancialOverview !== 'undefined') {
            this.financialOverviewComponent = FinancialOverview;
            FinancialOverview.init(
                document.getElementById('financial-overview-container'),
                {
                    totalBalance: 0,
                    cashBalance: 0,
                    bankBalance: 0,
                    investmentBalance: 0,
                    liabilityBalance: 0,
                    monthlyChange: 5.5 // Static value as in the React example
                }
            );
        } else {
            console.error('FinancialOverview component not found');
        }
    },
    
    initializeInflowOutflowOverview: function() {
        // Initialize Inflow/Outflow Overview with dummy data initially
        if (typeof InflowOutflowOverview !== 'undefined') {
            this.inflowOutflowComponent = InflowOutflowOverview;
            InflowOutflowOverview.init(
                document.getElementById('inflow-outflow-container'),
                {
                    inflow: 0,
                    outflow: 0
                }
            );
        } else {
            console.error('InflowOutflowOverview component not found');
        }
    },
    
    initializeDateRangePicker: function() {
        var self = this;
        if (typeof DateRangePicker !== 'undefined') {
            // Get today's date for default range
            var today = new Date();
            var firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            var lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            
            DateRangePicker.init(
                document.getElementById('date-range-picker-container'),
                {
                    // Set default date range to current month
                    startDate: firstDayOfMonth,
                    endDate: lastDayOfMonth,
                    // Handle date range changes
                    onDateChange: function(dateRange) {
                        self.handleDateChange(dateRange);
                    },
                    // Handle current month button click
                    onMonthChange: function(monthStr) {
                        self.handleMonthChange(monthStr);
                    }
                }
            );
        } else {
            console.error('DateRangePicker component not found');
        }
    },
    
    handleDateChange: function(range) {
        // Update view mode to 'range'
        this.viewMode = 'range';
        this.currentMonth = '';
        
        // Store date range for API calls
        this.dateRange = {
            startDate: range.startDate,
            endDate: range.endDate
        };
        
        this.loadDashboardData();
    },
    
    handleMonthChange: function(monthStr) {
        // Update view mode to 'currentMonth'
        this.viewMode = 'currentMonth';
        this.currentMonth = monthStr;
        
        // Clear date range
        this.dateRange = null;
        
        this.loadDashboardData();
    },
    
    handleAllFinanceChange: function(allFinance) {
        // Update view mode to 'all'
        this.viewMode = 'all';
        this.currentMonth = '';
        
        // Clear date range
        this.dateRange = null;
        
        this.loadDashboardData();
    },
    
    formatISODate: function(date) {
        var year = date.getFullYear();
        var month = (date.getMonth() + 1).toString().padStart(2, '0');
        var day = date.getDate().toString().padStart(2, '0');
        return year + '-' + month + '-' + day;
    },
    
    formatMonthYear: function(date) {
        // Format as "Month Year" (e.g., "January 2023")
        var months = ['January', 'February', 'March', 'April', 'May', 'June', 
                     'July', 'August', 'September', 'October', 'November', 'December'];
        return months[date.getMonth()] + ' ' + date.getFullYear();
    },
    
    loadDashboardData: function() {
        var self = this;
        // Show loading indicator
        var statsContainer = document.querySelector('.dashboard-stats');
        Utils.showLoading('dashboard-loading', 'Loading dashboard data...');
        
        var apiCall;
        var userId = this.selectedUserId;
        
        // Choose API call based on view mode
        if (this.viewMode === 'range' && this.dateRange) {
            // Date range mode
            apiCall = ApiClient.readRangeFinanceOverview({
                start_date: String(this.dateRange.startDate),
                end_date: String(this.dateRange.endDate),
                userId: userId
            });
        } else if (this.viewMode === 'currentMonth' && this.currentMonth) {
            // Current month mode
            var [month, year] = this.currentMonth.split(' ');
            apiCall = ApiClient.readCurrentMonthFinanceOverview({
                month: month,
                year: parseInt(year),
                userId: userId
            });
        } else {
            // All time / default mode
            apiCall = ApiClient.readFinanceOverview(userId);
        }
        
        // Hide loading and error states initially
        statsContainer.innerHTML = '';
        
        apiCall.then(function(data) {
            
            // Ensure we have valid data with proper default values
            var dashboardData = {
                balance: parseFloat(data.balance || 0),
                cash_in_hand: parseFloat(data.cash_in_hand || 0),
                cash_in_bank: parseFloat(data.cash_in_bank || 0),
                investment: parseFloat(data.investment || 0),
                liability: parseFloat(data.liability || 0),
                inflow: parseFloat(data.inflow || 0),
                outflow: parseFloat(data.outflow || 0),
                recent_transactions: data.recent_transactions || []
            };
            
            // Update the Financial Overview component with actual data
            if (self.financialOverviewComponent && typeof self.financialOverviewComponent.update === 'function') {
                self.financialOverviewComponent.update({
                    totalBalance: dashboardData.balance,
                    cashBalance: dashboardData.cash_in_hand,
                    bankBalance: dashboardData.cash_in_bank,
                    investmentBalance: dashboardData.investment,
                    liabilityBalance: dashboardData.liability,
                    monthlyChange: 5.5 // Static value as in the React example
                });
            } else if (typeof FinancialOverview !== 'undefined') {
                // Fallback: reinitialize the component if update method is not available
                FinancialOverview.init(
                    document.getElementById('financial-overview-container'),
                    {
                        totalBalance: dashboardData.balance,
                        cashBalance: dashboardData.cash_in_hand,
                        bankBalance: dashboardData.cash_in_bank,
                        investmentBalance: dashboardData.investment,
                        liabilityBalance: dashboardData.liability,
                        monthlyChange: 5.5
                    }
                );
            }
            
            // Update the Inflow/Outflow component with actual data
            if (self.inflowOutflowComponent && typeof self.inflowOutflowComponent.update === 'function') {
                self.inflowOutflowComponent.update({
                    inflow: dashboardData.inflow,
                    outflow: dashboardData.outflow
                });
            } else if (typeof InflowOutflowOverview !== 'undefined') {
                // Fallback: reinitialize the component if update method is not available
                InflowOutflowOverview.init(
                    document.getElementById('inflow-outflow-container'),
                    {
                        inflow: dashboardData.inflow,
                        outflow: dashboardData.outflow
                    }
                );
            }
        })
        .catch(function(error) {
            console.error('Failed to load dashboard data:', error);
            Utils.showLoading('dashboard-loading', 'Loading dashboard data...');
            statsContainer.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Failed to load dashboard data. Please try again.</p>
                    <button class="btn btn-primary" onclick="DashboardApp.loadDashboardData()">Retry</button>
                </div>
            `;
        });
    },
    
    renderRecentTransactions: function(transactions) {
        if (!transactions || transactions.length === 0) {
            return '<p class="empty-state">No recent transactions found.</p>';
        }
        
        var html = '<table class="transactions-table"><thead><tr>' +
            '<th>Date</th><th>Type</th><th>Description</th><th>Amount</th></tr></thead><tbody>';
        
        transactions.forEach(function(transaction) {
            var typeClass = transaction.type === 'inflow' ? 'inflow-amount' : 'outflow-amount';
            var typeIcon = transaction.type === 'inflow' ? 
                '<i class="fas fa-arrow-circle-down"></i>' : 
                '<i class="fas fa-arrow-circle-up"></i>';
            
            html += `
                <tr>
                    <td>${this.formatDate(transaction.date)}</td>
                    <td>${typeIcon} ${transaction.type}</td>
                    <td>${transaction.description}</td>
                    <td class="${typeClass}">${this.formatCurrency(transaction.amount)}</td>
                </tr>
            `;
        }, this);
        
        html += '</tbody></table>';
        return html;
    },
    
    formatCurrency: function(amount) {
        // Format as currency with rupee symbol
        return '₨ ' + parseFloat(amount || 0).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    },
    
    formatDate: function(dateString) {
        if (!dateString) return 'N/A';
        
        try {
            var date = new Date(dateString);
            return date.toLocaleDateString();
        } catch (e) {
            return dateString;
        }
    }
};

// Make DashboardApp globally available
window.DashboardApp = DashboardApp;