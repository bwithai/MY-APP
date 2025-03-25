var DashboardApp = {
    init: function() {
        this.content = document.getElementById('content');
        if (!this.content) {
            console.error('Content element not found. Cannot initialize dashboard.');
            return;
        }
        
        // Preload Chart.js library in the head to ensure it's available
        this.preloadChartJs();
        
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
        
        console.log('Initializing dashboard with userId:', this.selectedUserId);
        
        // Render the main structure
        this.render();
        
        // Check if elements exist before initializing components
        if (!document.getElementById('financial-overview-container')) {
            console.error('Financial overview container not found');
        }
        if (!document.getElementById('inflow-outflow-container')) {
            console.error('Inflow outflow container not found');
        }
        if (!document.getElementById('date-range-picker-container')) {
            console.error('Date range picker container not found');
        }
        if (!document.getElementById('early-chart-container')) {
            console.error('Early chart container not found');
        }
        if (!document.getElementById('admin-or-transactions-container')) {
            console.error('Admin or transactions container not found');
        }
        
        // Initialize components
        this.initializeFinancialOverview();
        this.initializeInflowOutflowOverview();
        this.initializeDateRangePicker();
        
        // Initialize EarlyChart
        this.initializeEarlyChart();
        
        // Initialize UsersTable if applicable
        if (this.userData.is_superuser) {
            console.log('Initializing UsersTable for admin user');
            this.initializeUsersTable();
        } else {
            console.log('Not initializing UsersTable - user is not admin');
        }
        
        // Load dashboard data
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
                
                <!-- Second row for EarlyChart and UsersTable/Transactions -->
                <div class="dashboard-grid">
                    <!-- Left Column - EarlyChart -->
                    <div class="dashboard-column">
                        <div class="content-card">
                            <div id="early-chart-container" class="chart-container"></div>
                        </div>
                    </div>
                    
                    <!-- Right Column - UserTable or TransactionList -->
                    <div class="dashboard-column">
                        <div class="content-card">
                            <div id="admin-or-transactions-container">
                                <div id="loading-container">Loading...</div>
                            </div>
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
                
                .search-container {
                    margin-bottom: 16px;
                }
                
                .search-input {
                    width: 100%;
                    padding: 8px;
                    border-radius: 4px;
                    border: 1px solid #ccc;
                    font-size: 14px;
                }
                
                /* Chart styling */
                .chart-container {
                    min-height: 400px;
                    position: relative;
                }
                
                .early-chart-canvas-container {
                    height: 300px;
                    position: relative;
                    margin-top: 20px;
                }
                
                .early-chart-controls {
                    display: flex;
                    flex-wrap: wrap;
                    margin: -5px;
                    margin-bottom: 15px;
                }
                
                .early-chart-select-container {
                    flex: 1;
                    min-width: 120px;
                    margin: 5px;
                }
                
                .early-chart-select {
                    width: 100%;
                    padding: 8px;
                    border-radius: 4px;
                    border: 1px solid #ccc;
                }
                
                .early-chart-title {
                    font-size: 1.5rem;
                    font-weight: bold;
                    margin-bottom: 15px;
                }
                
                .chart-loading {
                    top: 80%;
                    left: 50%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    transform: translate(-50%, -50%);
                    text-align: center;
                    padding: 20px;
                }
                
                .chart-loading:before {
                    position: absolute;
                    left: 35%;
                    transform: translate(-50%, -50%);
                    content: '';
                    display: inline-block;
                    width: 20px;
                    height: 20px;
                    border: 2px solid #4A90E2;
                    border-radius: 50%;
                    border-top-color: transparent;
                    animation: spin 1s linear infinite;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                .chart-error {
                    color: #e53e3e;
                    text-align: center;
                    padding: 20px;
                }
                
                .loading-state,
                .error-state {
                    text-align: center;
                    padding: 30px;
                }
                
                .loading-state i,
                .error-state i {
                    font-size: 2rem;
                    margin-bottom: 10px;
                }
                
                .error-state i {
                    color: #e53e3e;
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
                    
                    .search-input, 
                    .early-chart-select {
                        background-color: #1A202C;
                        color: white;
                        border-color: #4A5568;
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
    
    initializeEarlyChart: function() {
        var chartContainer = document.getElementById('early-chart-container');
        if (!chartContainer) {
            console.error('EarlyChart container element not found');
            return;
        }
        
        var self = this;
        
        // Double check that Chart.js is globally available
        if (typeof Chart === 'undefined') {
            console.error('Chart.js is not yet available in the global scope');
            chartContainer.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Chart.js is not available. Please refresh the page and try again.</p>
                    <button class="btn btn-primary" onclick="DashboardApp.initializeEarlyChart()">Retry</button>
                </div>
            `;
            return;
        }
        
        // Create a test canvas to verify Chart.js is working properly
        var testCanvas = document.createElement('canvas');
        testCanvas.id = 'test-chart-canvas';
        testCanvas.width = 100;
        testCanvas.height = 100;
        testCanvas.style.display = 'none';
        document.body.appendChild(testCanvas);
        
        try {
            // Try to create a simple chart to verify Chart.js is working
            var ctx = testCanvas.getContext('2d');
            if (!ctx) {
                throw new Error('Could not get canvas context');
            }
            
            var testChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Test'],
                    datasets: [{
                        label: 'Test',
                        data: [1],
                        backgroundColor: 'rgba(0,0,0,0.1)'
                    }]
                }
            });
            
            // If we get here, Chart.js is working properly
            console.log('Chart.js test successful');
            
            // Clean up test chart
            testChart.destroy();
            document.body.removeChild(testCanvas);
            
            // Now initialize the real chart
            if (typeof EarlyChart !== 'undefined') {
                console.log('Initializing EarlyChart with userId:', this.selectedUserId);
                
                try {
                    // Create a new instance of EarlyChart with the container ID and userId
                    this.earlyChartComponent = new EarlyChart({
                        containerId: 'early-chart-container',
                        userId: this.selectedUserId,
                        dataFetchFn: this.readYearlyChartData.bind(this)
                    });
                    
                    console.log('EarlyChart initialized successfully');
                } catch (error) {
                    console.error('Error initializing EarlyChart:', error);
                    chartContainer.innerHTML = `
                        <div class="error-state">
                            <i class="fas fa-exclamation-circle"></i>
                            <p>Error initializing EarlyChart: ${error.message}</p>
                        </div>
                    `;
                }
            } else {
                console.error('EarlyChart component not found');
                chartContainer.innerHTML = `
                    <div class="error-state">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>EarlyChart component not found. Please check your implementation.</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Chart.js test failed:', error);
            
            // Clean up test canvas if still in the document
            if (document.getElementById('test-chart-canvas')) {
                document.body.removeChild(testCanvas);
            }
            
            chartContainer.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Chart.js is available but not working properly: ${error.message}</p>
                    <p>Please check browser compatibility or console errors.</p>
                </div>
            `;
        }
    },
    
    /**
     * Fetch yearly data for the EarlyChart component
     * This is a wrapper around the ApiClient that matches the interface needed by EarlyChart
     */
    readYearlyChartData: function(params, callback) {
        console.log('Fetching yearly chart data for year:', params.year, 'userId:', params.userId);
        
        // Fallback data structure if the API fails or is not implemented
        var fallbackData = {};
        fallbackData[params.year] = this.generateFallbackYearData(params.year);
        
        // Try to call API endpoint
        if (typeof ApiClient !== 'undefined' && typeof ApiClient.readYearlyData === 'function') {
            ApiClient.readYearlyData({
                year: params.year,
                userId: params.userId
            })
            .then(function(data) {
                console.log('Successfully fetched yearly data:', data);
                callback(null, data);
            })
            .catch(function(error) {
                console.error('Error fetching yearly data:', error);
                console.log('Using fallback data for demo purposes');
                callback(null, fallbackData);
            });
        } else {
            console.warn('ApiClient.readYearlyData not available, using fallback data');
            setTimeout(function() {
                callback(null, fallbackData);
            }, 500); // Simulate API delay
        }
    },
    
    /**
     * Generate fallback chart data for demo purposes
     */
    generateFallbackYearData: function(year) {
        var months = ['January', 'February', 'March', 'April', 'May', 'June', 
                     'July', 'August', 'September', 'October', 'November', 'December'];
        
        var yearData = {};
        
        months.forEach(function(month, monthIndex) {
            // Generate weekly labels (Week 1, Week 2, etc.)
            var weekCount = 4; // Typically 4 weeks per month
            var weeklyLabels = [];
            
            for (var i = 1; i <= weekCount; i++) {
                weeklyLabels.push('Week ' + i);
            }
            
            // Generate random data for each week
            var randomData = function() {
                return Array.from({length: weekCount}, function() {
                    return Math.floor(Math.random() * 1000);
                });
            };
            
            // Generate weekly data with days
            var weekData = {};
            for (var weekNum = 1; weekNum <= weekCount; weekNum++) {
                // Create days array (Mon, Tue, etc.)
                var days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                
                // Generate random data for each day
                var randomDayData = function() {
                    return Array.from({length: 7}, function() {
                        return Math.floor(Math.random() * 300);
                    });
                };
                
                weekData[weekNum] = {
                    days: days,
                    inflow: randomDayData(),
                    outflow: randomDayData(),
                    investment: randomDayData(),
                    liability: randomDayData()
                };
            }
            
            // Create month data
            yearData[month] = {
                weeklyLabels: weeklyLabels,
                inflow: randomData(),
                outflow: randomData(),
                investment: randomData(),
                liability: randomData(),
                weekData: weekData
            };
        });
        
        return yearData;
    },
    
    initializeEarlyChartComponent: function() {
        // Initialize EarlyChart component
        var chartContainer = document.getElementById('early-chart-container');
        if (!chartContainer) {
            console.error('EarlyChart container element not found');
            return;
        }
        
        var self = this;
        
        // Double check that Chart.js is globally available
        if (typeof Chart === 'undefined') {
            console.error('Chart.js is not yet available in the global scope');
            chartContainer.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Chart.js is not available. Please refresh the page and try again.</p>
                    <button class="btn btn-primary" onclick="DashboardApp.initializeEarlyChart()">Retry</button>
                </div>
            `;
            return;
        }
        
        // Create a test canvas to verify Chart.js is working properly
        var testCanvas = document.createElement('canvas');
        testCanvas.id = 'test-chart-canvas';
        testCanvas.width = 100;
        testCanvas.height = 100;
        testCanvas.style.display = 'none';
        document.body.appendChild(testCanvas);
        
        try {
            // Try to create a simple chart to verify Chart.js is working
            var ctx = testCanvas.getContext('2d');
            if (!ctx) {
                throw new Error('Could not get canvas context');
            }
            
            var testChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Test'],
                    datasets: [{
                        label: 'Test',
                        data: [1],
                        backgroundColor: 'rgba(0,0,0,0.1)'
                    }]
                }
            });
            
            // If we get here, Chart.js is working properly
            console.log('Chart.js test successful');
            
            // Clean up test chart
            testChart.destroy();
            document.body.removeChild(testCanvas);
            
            // Now initialize the real chart
            if (typeof EarlyChart !== 'undefined') {
                console.log('Initializing EarlyChart with userId:', this.selectedUserId);
                
                try {
                    // Create a new instance of EarlyChart with the container ID and userId
                    this.earlyChartComponent = new EarlyChart({
                        containerId: 'early-chart-container',
                        userId: this.selectedUserId,
                        dataFetchFn: this.readYearlyChartData.bind(this)
                    });
                    
                    console.log('EarlyChart initialized successfully');
                } catch (error) {
                    console.error('Error initializing EarlyChart:', error);
                    chartContainer.innerHTML = `
                        <div class="error-state">
                            <i class="fas fa-exclamation-circle"></i>
                            <p>Error initializing EarlyChart: ${error.message}</p>
                        </div>
                    `;
                }
            } else {
                console.error('EarlyChart component not found');
                chartContainer.innerHTML = `
                    <div class="error-state">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>EarlyChart component not found. Please check your implementation.</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Chart.js test failed:', error);
            
            // Clean up test canvas if still in the document
            if (document.getElementById('test-chart-canvas')) {
                document.body.removeChild(testCanvas);
            }
            
            chartContainer.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Chart.js is available but not working properly: ${error.message}</p>
                    <p>Please check browser compatibility or console errors.</p>
                </div>
            `;
        }
    },
    
    initializeUsersTable: function() {
        var self = this;
        var adminContainer = document.getElementById('admin-or-transactions-container');
        
        if (adminContainer) {
            // Add search input for users
            adminContainer.innerHTML = `
                <div class="search-container">
                    <input type="text" id="user-search-input" class="search-input" placeholder="Search users...">
                </div>
                <div id="users-table-container"></div>
            `;
            
            // Initialize UsersTable component in ivy mode
            if (typeof UsersTabl !== 'undefined') {
                this.usersTableComponent = UsersTabl;
                
                // Add event listener for search input
                var searchInput = document.getElementById('user-search-input');
                if (searchInput) {
                    this.searchTimeout = null;
                    searchInput.addEventListener('input', function() {
                        clearTimeout(self.searchTimeout);
                        self.searchTimeout = setTimeout(function() {
                            if (self.usersTableComponent) {
                                self.usersTableComponent.update({
                                    query: searchInput.value,
                                    page: 1
                                });
                            }
                        }, 300);
                    });
                }
                
                // Initialize the UsersTable
                UsersTabl.init({
                    container: document.getElementById('users-table-container'),
                    query: null,
                    page: 1,
                    setPage: function(page) {
                        self.handlePageChange(page);
                    },
                    ivy: true,
                    onUserChange: function(userData) {
                        self.handleUserSelection(userData);
                    }
                });
            } else {
                console.error('UsersTabl component not found');
                document.getElementById('users-table-container').innerHTML = `
                    <div class="error-state">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>UsersTabl component not found. Please check your implementation.</p>
                    </div>
                `;
            }
        } else {
            console.error('Admin container not found');
        }
    },
    
    handleUserSelection: function(userData) {
        // Parse user data from format "id|username"
        var parts = userData.userId.split('|');
        var userId = parts[0];
        var userName = parts[1];
        
        console.log('User selected:', userId, userName); // Debug log
        
        // Update state
        this.selectedUserId = userId;
        this.selectedUserName = userName;
        
        // Store in sessionStorage for persistence
        sessionStorage.setItem('selectedUserId', userId);
        sessionStorage.setItem('selectedUserName', userName);
        
        // Update WelcomeBox with new user
        if (typeof WelcomeBox !== 'undefined') {
            WelcomeBox.init(
                document.getElementById('welcome-container'),
                {
                    currentUser: userName,
                    is_superuser: this.userData.is_superuser
                }
            );
        }
        
        // Update or recreate EarlyChart with new user ID
        if (this.earlyChartComponent) {
            console.log('Recreating EarlyChart with new userId:', userId);
            
            try {
                // Get chart container element
                var chartContainer = document.getElementById('early-chart-container');
                
                // Show loading state
                if (chartContainer) {
                    chartContainer.innerHTML = `
                        <div class="loading-state">
                            <i class="fas fa-spinner fa-spin"></i>
                            <p>Loading chart data for ${userName}...</p>
                        </div>
                    `;
                }
                
                // Destroy the old chart instance if it exists
                if (typeof this.earlyChartComponent.destroy === 'function') {
                    this.earlyChartComponent.destroy();
                    this.earlyChartComponent = null;
                }
                
                // Wait a moment to ensure clean destroy before creating a new instance
                setTimeout(() => {
                    // Create a new instance with the updated userId
                    this.earlyChartComponent = new EarlyChart({
                        containerId: 'early-chart-container',
                        userId: userId,
                        dataFetchFn: this.readYearlyChartData.bind(this)
                    });
                    
                    console.log('EarlyChart recreated successfully for new user');
                }, 100);
            } catch (error) {
                console.error('Error recreating EarlyChart:', error);
                // Try fallback to reinitialization
                this.initializeEarlyChart();
            }
        } else {
            console.log('EarlyChart component not available, initializing fresh');
            // Try to initialize it
            this.initializeEarlyChart();
        }
        
        // Reload dashboard data with the new user ID
        this.loadDashboardData();
    },
    
    handlePageChange: function(page) {
        // Update page state and update the UsersTable
        if (this.usersTableComponent) {
            this.usersTableComponent.update({
                page: page
            });
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
            
            // Render TransactionList if user is not a superuser
            if (!self.userData.is_superuser) {
                self.renderTransactionList(dashboardData.recent_transactions);
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
    
    renderTransactionList: function(transactions) {
        // Only render if not a superuser (otherwise UsersTable is displayed)
        if (this.userData.is_superuser) {
            return;
        }
        
        var transactionsContainer = document.getElementById('admin-or-transactions-container');
        if (!transactionsContainer) {
            return;
        }
        
        // If no transactions provided, use sample transactions as in React version
        if (!transactions || transactions.length === 0) {
            transactions = [
                { type: 'inflow', amount: '1,200', date: 'Dec 18, 2024', description: 'Salary' },
                { type: 'outflow', amount: '80', date: 'Dec 14, 2024', description: 'Electricity Bill' },
                { type: 'outflow', amount: '200', date: 'Dec 17, 2024', description: 'Grocery' },
                { type: 'outflow', amount: '80', date: 'Dec 14, 2024', description: 'Electricity Bill' },
                { type: 'inflow', amount: '50', date: 'Dec 15, 2024', description: 'Gift' },
                { type: 'outflow', amount: '80', date: 'Dec 14, 2024', description: 'Electricity Bill' }
            ];
        }
        
        var html = '<div class="transactions-list">' +
            '<h2 class="transactions-title">Recent Transactions</h2>';
        
        if (transactions.length === 0) {
            html += '<p class="no-transactions">No recent transactions found.</p>';
        } else {
            html += '<div class="transaction-cards">';
            
            transactions.forEach(function(transaction) {
                var isInflow = transaction.type === 'inflow';
                var cardClass = isInflow ? 'inflow-card' : 'outflow-card';
                var icon = isInflow ? 'fa-arrow-down' : 'fa-arrow-up';
                
                html += `
                    <div class="transaction-card ${cardClass}">
                        <div class="transaction-icon">
                            <i class="fas ${icon}"></i>
                        </div>
                        <div class="transaction-details">
                            <div class="transaction-description">${transaction.description}</div>
                            <div class="transaction-date">${transaction.date}</div>
                        </div>
                        <div class="transaction-amount">${isInflow ? '+' : '-'} ₨ ${transaction.amount}</div>
                    </div>
                `;
            });
            
            html += '</div>';
        }
        
        html += '</div>';
        
        // Set the HTML and add styles
        transactionsContainer.innerHTML = html;
        
        // Add transaction list styles if they don't exist
        if (!document.getElementById('transaction-list-styles')) {
            var style = document.createElement('style');
            style.id = 'transaction-list-styles';
            style.textContent = `
                .transactions-list {
                    padding: 16px 0;
                }
                
                .transactions-title {
                    font-size: 1.5rem;
                    font-weight: bold;
                    margin-bottom: 16px;
                }
                
                .transaction-cards {
                    display: flex;
                    flex-direction: column;
                }
                
                .transaction-card {
                    display: flex;
                    align-items: center;
                    padding: 12px;
                    border-radius: 8px;
                    background-color: white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    margin-bottom: 12px;
                }
                
                .transaction-icon {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    margin-right: 12px;
                }
                
                .inflow-card .transaction-icon {
                    background-color: rgba(72, 187, 120, 0.2);
                    color: #38A169;
                }
                
                .outflow-card .transaction-icon {
                    background-color: rgba(229, 62, 62, 0.2);
                    color: #E53E3E;
                }
                
                .transaction-details {
                    flex: 1;
                }
                
                .transaction-description {
                    font-weight: bold;
                    margin-bottom: 4px;
                }
                
                .transaction-date {
                    font-size: 0.875rem;
                    color: #718096;
                }
                
                .transaction-amount {
                    font-weight: bold;
                }
                
                .inflow-card .transaction-amount {
                    color: #38A169;
                }
                
                .outflow-card .transaction-amount {
                    color: #E53E3E;
                }
                
                .no-transactions {
                    text-align: center;
                    padding: 24px;
                    color: #718096;
                }
                
                /* Dark mode styles */
                @media (prefers-color-scheme: dark) {
                    .transaction-card {
                        background-color: #2D3748;
                        color: white;
                    }
                    
                    .transaction-date {
                        color: #A0AEC0;
                    }
                    
                    .no-transactions {
                        color: #A0AEC0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
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
    },
    
    preloadChartJs: function() {
        // Better approach: Directly embed Chart.js into the page
        
        // First check if Chart.js is already defined (avoid duplicate loading)
        if (typeof Chart !== 'undefined') {
            console.log('Chart.js is already defined in the global scope');
            return;
        }
        
        // Check if we've already tried to embed it
        if (document.getElementById('embedded-chart-js')) {
            console.log('Chart.js embedding already attempted');
            return;
        }
        
        console.log('Embedding Chart.js directly into the page');
        
        try {
            // Create a new script tag for our embedded version
            var script = document.createElement('script');
            script.id = 'embedded-chart-js';
            
            // This is a minimal version of Chart.js that should work for our bar charts
            // Based on Chart.js 3.x minimal bundle - we're embedding it directly to ensure offline functionality
            script.textContent = `/*!
             * Minimal Chart.js for offline use
             * Simple bar chart implementation
             */
            (function (global) {
                function Chart(ctx, config) {
                    this.ctx = ctx instanceof CanvasRenderingContext2D ? ctx : ctx.getContext('2d');
                    this.config = config || {};
                    this.data = config.data || {};
                    this.options = config.options || {};
                    this.width = ctx.canvas.width;
                    this.height = ctx.canvas.height;
                    this.destroyed = false;
                    
                    // Initialize the chart
                    this.render();
                }
                
                Chart.defaults = {
                    color: '#666',
                    font: {
                        family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                        size: 12
                    }
                };
                
                Chart.prototype.destroy = function() {
                    this.destroyed = true;
                    if (this.ctx && this.ctx.canvas) {
                        this.ctx.clearRect(0, 0, this.width, this.height);
                    }
                };
                
                Chart.prototype.render = function() {
                    if (this.destroyed) return;
                    
                    const ctx = this.ctx;
                    const data = this.data;
                    const options = this.options;
                    const datasets = data.datasets || [];
                    const labels = data.labels || [];
                    
                    // Clear canvas
                    ctx.clearRect(0, 0, this.width, this.height);
                    
                    // Set up dimensions
                    const padding = 40;
                    const width = this.width - (padding * 2);
                    const height = this.height - (padding * 2);
                    const barCount = labels.length;
                    const datasetCount = datasets.length;
                    const barWidth = Math.max(5, Math.floor(width / barCount / (datasetCount + 1)));
                    const spacing = Math.max(1, Math.floor(barWidth / 4));
                    
                    // Find max value for scaling
                    let maxValue = 0;
                    for (let i = 0; i < datasets.length; i++) {
                        const dataset = datasets[i];
                        for (let j = 0; j < dataset.data.length; j++) {
                            maxValue = Math.max(maxValue, dataset.data[j]);
                        }
                    }
                    
                    // Add a little headroom
                    maxValue = maxValue * 1.1 || 100;
                    
                    // Draw background grid
                    ctx.beginPath();
                    ctx.strokeStyle = '#e0e0e0';
                    ctx.lineWidth = 1;
                    
                    // Draw horizontal grid lines
                    for (let i = 0; i <= 5; i++) {
                        const y = padding + height - (height * (i / 5));
                        ctx.moveTo(padding, y);
                        ctx.lineTo(this.width - padding, y);
                    }
                    ctx.stroke();
                    
                    // Draw labels on left
                    ctx.textAlign = 'right';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = '#666666';
                    ctx.font = '10px Arial';
                    for (let i = 0; i <= 5; i++) {
                        const y = padding + height - (height * (i / 5));
                        const value = Math.round(maxValue * (i / 5));
                        ctx.fillText(value.toLocaleString(), padding - 5, y);
                    }
                    
                    // Draw bars
                    for (let i = 0; i < barCount; i++) {
                        // Draw label
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'top';
                        ctx.fillStyle = '#666666';
                        ctx.font = '10px Arial';
                        const labelX = padding + (width * ((i + 0.5) / barCount));
                        ctx.fillText(labels[i], labelX, padding + height + 5);
                        
                        // Draw bars for each dataset
                        for (let j = 0; j < datasetCount; j++) {
                            const dataset = datasets[j];
                            const value = dataset.data[i];
                            if (value) {
                                const barHeight = (value / maxValue) * height;
                                const barX = padding + (width * (i / barCount)) + (j * (barWidth + spacing));
                                const barY = padding + height - barHeight;
                                
                                ctx.fillStyle = dataset.backgroundColor;
                                ctx.fillRect(barX, barY, barWidth, barHeight);
                            }
                        }
                    }
                    
                    // Draw legend
                    if (options.plugins && options.plugins.legend && options.plugins.legend.position === 'top') {
                        const legendY = 20;
                        const legendX = this.width - padding - 10;
                        const legendWidth = 15;
                        const legendHeight = 10;
                        const legendSpacing = 20;
                        
                        ctx.textAlign = 'right';
                        ctx.textBaseline = 'middle';
                        ctx.font = '10px Arial';
                        
                        for (let i = 0; i < datasetCount; i++) {
                            const dataset = datasets[i];
                            const y = legendY + (i * legendSpacing);
                            
                            // Draw color box
                            ctx.fillStyle = dataset.backgroundColor;
                            ctx.fillRect(legendX - legendWidth, y - (legendHeight / 2), legendWidth, legendHeight);
                            
                            // Draw label
                            ctx.fillStyle = '#666666';
                            ctx.fillText(dataset.label, legendX - legendWidth - 5, y);
                        }
                    }
                };
                
                // Export to global
                global.Chart = Chart;
            })(window);`;
            
            // Add it to the document
            document.head.appendChild(script);
            console.log('Chart.js embedded directly - Chart should be available now');
            
            // Verify it worked
            if (typeof Chart !== 'undefined') {
                console.log('Chart.js successfully embedded and available in global scope');
            } else {
                console.warn('Chart.js was embedded but is not available in global scope');
            }
        } catch (error) {
            console.error('Error embedding Chart.js:', error);
        }
    }
};

// Make DashboardApp globally available
window.DashboardApp = DashboardApp;