/**
 * EarlyChart.js - Vanilla JS implementation of the Balance Chart
 * Compatible with legacy browsers including Firefox 50
 */

(function() {
    // Chart.js needs to be included in your HTML via script tag before this file
    
    /**
     * EarlyChart constructor
     * @param {Object} config - Configuration settings
     * @param {string} config.containerId - ID of the container element
     * @param {string} config.userId - User ID for fetching data
     * @param {Function} config.dataFetchFn - Function to fetch data (fallback to default if not provided)
     */
    function EarlyChart(config) {
        // Save reference to this for closures
        var self = this;
        
        // Configuration
        this.containerId = config.containerId;
        this.userId = config.userId || '';
        this.dataFetchFn = config.dataFetchFn || this.defaultDataFetch;
        
        // State
        this.startYear = 2000;
        this.currentYear = new Date().getFullYear();
        this.selectedYear = this.currentYear;
        this.selectedMonth = null;
        this.selectedWeek = null;
        this.allData = {};
        this.chart = null;
        
        // Storage settings
        this.storageKey = 'early_chart_data';
        this.dataExpiryHours = 24; // Data expires after 24 hours
        
        // Initialize the component
        this.init();
    }
    
    /**
     * Initialize the chart component
     */
    EarlyChart.prototype.init = function() {
        // Create the DOM structure
        this.createDomStructure();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Fetch initial data
        this.fetchData();
    };
    
    /**
     * Create the DOM structure for the chart
     */
    EarlyChart.prototype.createDomStructure = function() {
        var container = document.getElementById(this.containerId);
        if (!container) {
            console.error('Container element not found: ' + this.containerId);
            return;
        }
        
        // Add container class
        container.className = 'early-chart-container';
        
        // Add styles if they don't exist
        if (!document.getElementById('early-chart-styles')) {
            var style = document.createElement('style');
            style.id = 'early-chart-styles';
            style.textContent = `
                .early-chart-title-container {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                }
                
                .early-chart-refresh-btn {
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 8px;
                    border-radius: 50%;
                    transition: background-color 0.3s;
                }
                
                .early-chart-refresh-btn:hover {
                    background-color: rgba(0, 0, 0, 0.05);
                }
                
                .early-chart-refresh-btn i {
                    font-size: 1.2rem;
                    color: #4A90E2;
                }
                
                .early-chart-refresh-btn.rotating i {
                    animation: rotate 1s linear infinite;
                }
                
                @keyframes rotate {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                
                /* Dark mode support */
                @media (prefers-color-scheme: dark) {
                    .early-chart-refresh-btn:hover {
                        background-color: rgba(255, 255, 255, 0.1);
                    }
                    
                    .early-chart-refresh-btn i {
                        color: #63B3ED;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Create title and refresh button container
        var titleContainer = document.createElement('div');
        titleContainer.className = 'early-chart-title-container';
        
        var title = document.createElement('h2');
        title.className = 'early-chart-title';
        title.textContent = 'Balance Chart';
        
        // Create refresh button
        var refreshButton = document.createElement('button');
        refreshButton.className = 'early-chart-refresh-btn';
        refreshButton.innerHTML = '<i class="fas fa-sync-alt"></i>';
        refreshButton.title = 'Refresh Data';
        
        // Add click handler for refresh button
        var self = this;
        if (refreshButton.addEventListener) {
            refreshButton.addEventListener('click', function() {
                self.handleRefresh();
            });
        } else if (refreshButton.attachEvent) {
            refreshButton.attachEvent('onclick', function() {
                self.handleRefresh();
            });
        }
        
        titleContainer.appendChild(title);
        titleContainer.appendChild(refreshButton);
        container.appendChild(titleContainer);
        
        // Create controls container
        var controls = document.createElement('div');
        controls.className = 'early-chart-controls';
        
        // Year select
        var yearSelectContainer = document.createElement('div');
        yearSelectContainer.className = 'early-chart-select-container';
        
        var yearSelect = document.createElement('select');
        yearSelect.className = 'early-chart-select';
        yearSelect.id = this.containerId + '-year-select';
        
        var yearOption = document.createElement('option');
        yearOption.value = '';
        yearOption.textContent = 'Select Year';
        yearSelect.appendChild(yearOption);
        
        for (var y = this.startYear; y <= this.currentYear; y++) {
            var option = document.createElement('option');
            option.value = y;
            option.textContent = y;
            if (y === this.currentYear) {
                option.selected = true;
            }
            yearSelect.appendChild(option);
        }
        
        yearSelectContainer.appendChild(yearSelect);
        controls.appendChild(yearSelectContainer);
        
        // Month select
        var monthSelectContainer = document.createElement('div');
        monthSelectContainer.className = 'early-chart-select-container';
        
        var monthSelect = document.createElement('select');
        monthSelect.className = 'early-chart-select';
        monthSelect.id = this.containerId + '-month-select';
        monthSelect.disabled = true; // Initially disabled
        
        var monthOption = document.createElement('option');
        monthOption.value = '';
        monthOption.textContent = 'Select Month';
        monthSelect.appendChild(monthOption);
        
        monthSelectContainer.appendChild(monthSelect);
        controls.appendChild(monthSelectContainer);
        
        // Week select
        var weekSelectContainer = document.createElement('div');
        weekSelectContainer.className = 'early-chart-select-container';
        
        var weekSelect = document.createElement('select');
        weekSelect.className = 'early-chart-select';
        weekSelect.id = this.containerId + '-week-select';
        weekSelect.disabled = true; // Initially disabled
        
        var weekOption = document.createElement('option');
        weekOption.value = '';
        weekOption.textContent = 'Select Week';
        weekSelect.appendChild(weekOption);
        
        weekSelectContainer.appendChild(weekSelect);
        controls.appendChild(weekSelectContainer);
        
        container.appendChild(controls);
        
        // Canvas container
        var canvasContainer = document.createElement('div');
        canvasContainer.className = 'early-chart-canvas-container';
        canvasContainer.style.height = '400px'; // Increased height from 300px to 400px
        
        // Loading indicator
        var loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'chart-loading';
        loadingIndicator.id = this.containerId + '-loading';
        canvasContainer.appendChild(loadingIndicator);
        
        // Canvas for Chart.js
        var canvas = document.createElement('canvas');
        canvas.id = this.containerId + '-canvas';
        canvas.style.display = 'none'; // Hide initially until data is loaded
        canvas.width = canvasContainer.clientWidth || 300;
        canvas.height = 400; // Increased from 300 to 400 to match container

        // For older browsers, explicitly set style dimensions as well
        canvas.style.width = '100%';
        canvas.style.height = '400px'; // Increased from 300px to 400px

        // Add fallback text for older browsers that don't support canvas
        var fallbackText = document.createElement('div');
        fallbackText.className = 'canvas-fallback';
        fallbackText.style.display = 'none';
        fallbackText.textContent = 'Your browser does not support HTML5 Canvas. Please upgrade your browser.';
        canvasContainer.appendChild(fallbackText);
        
        canvasContainer.appendChild(canvas);
        
        container.appendChild(canvasContainer);
        
        // Legend
        var legend = document.createElement('div');
        legend.className = 'chart-legend';
        legend.style.marginTop = '-20px';
        
        var legendItems = [
            { label: 'Inflow', colorClass: 'legend-inflow', color: 'rgba(31, 107, 1, 0.8)' },
            { label: 'Outflow', colorClass: 'legend-outflow', color: 'rgba(143, 1, 1, 0.8)' },
            { label: 'Investment', colorClass: 'legend-investment', color: 'rgba(177, 107, 51, 0.8)' },
            { label: 'Liability', colorClass: 'legend-liability', color: 'rgba(248, 3, 3, 0.8)' }
        ];
        
        for (var i = 0; i < legendItems.length; i++) {
            var item = document.createElement('div');
            item.className = 'chart-legend-item';
            
            var color = document.createElement('span');
            color.className = 'chart-legend-color ' + legendItems[i].colorClass;
            color.style.backgroundColor = legendItems[i].color;
            
            var label = document.createElement('span');
            label.className = 'chart-legend-label';
            label.textContent = legendItems[i].label;
            
            item.appendChild(color);
            item.appendChild(label);
            legend.appendChild(item);
        }
        
        container.appendChild(legend);
    };
    
    /**
     * Setup event listeners for select elements
     */
    EarlyChart.prototype.setupEventListeners = function() {
        var self = this;
        
        var yearSelect = document.getElementById(this.containerId + '-year-select');
        var monthSelect = document.getElementById(this.containerId + '-month-select');
        var weekSelect = document.getElementById(this.containerId + '-week-select');
        
        // Store event handler references for later cleanup
        this._yearChangeHandler = function(e) {
            var year = parseInt(e.target.value, 10);
            if (isNaN(year)) {
                self.selectedYear = null;
            } else {
                self.selectedYear = year;
            }
            self.selectedMonth = null;
            self.selectedWeek = null;
            
            // Reset dependent selects
            if (monthSelect) {
                self.resetSelect(monthSelect, 'Select Month');
                monthSelect.disabled = !self.selectedYear;
            }
            
            if (weekSelect) {
                self.resetSelect(weekSelect, 'Select Week');
                weekSelect.disabled = true;
            }
            
            // Fetch new data
            self.fetchData();
        };
        
        this._monthChangeHandler = function(e) {
            self.selectedMonth = e.target.value || null;
            self.selectedWeek = null;
            
            // Reset week select
            if (weekSelect) {
                self.resetSelect(weekSelect, 'Select Week');
                weekSelect.disabled = !self.selectedMonth;
                
                // Populate weeks if month is selected
                if (self.selectedMonth && self.allData[self.selectedYear]) {
                    var monthData = self.allData[self.selectedYear][self.selectedMonth];
                    if (monthData && monthData.weeklyLabels) {
                        self.populateWeekSelect(monthData.weeklyLabels);
                    }
                }
            }
            
            // Update chart
            self.updateChart();
        };
        
        this._weekChangeHandler = function(e) {
            var week = parseInt(e.target.value, 10);
            self.selectedWeek = isNaN(week) ? null : week;
            
            // Update chart
            self.updateChart();
        };
        
        // Year select change event
        if (yearSelect) {
            if (yearSelect.addEventListener) {
                yearSelect.addEventListener('change', this._yearChangeHandler);
            } else if (yearSelect.attachEvent) {
                // For IE8 and below
                yearSelect.attachEvent('onchange', this._yearChangeHandler);
            }
        }
        
        // Month select change event
        if (monthSelect) {
            if (monthSelect.addEventListener) {
                monthSelect.addEventListener('change', this._monthChangeHandler);
            } else if (monthSelect.attachEvent) {
                monthSelect.attachEvent('onchange', this._monthChangeHandler);
            }
        }
        
        // Week select change event
        if (weekSelect) {
            if (weekSelect.addEventListener) {
                weekSelect.addEventListener('change', this._weekChangeHandler);
            } else if (weekSelect.attachEvent) {
                weekSelect.attachEvent('onchange', this._weekChangeHandler);
            }
        }
    };
    
    /**
     * Reset a select element by clearing options and adding the placeholder
     */
    EarlyChart.prototype.resetSelect = function(selectElement, placeholderText) {
        // Clear all options
        while (selectElement.options.length > 0) {
            selectElement.remove(0);
        }
        
        // Add placeholder option
        var placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = placeholderText;
        selectElement.appendChild(placeholder);
    };
    
    /**
     * Populate the month select with available months
     */
    EarlyChart.prototype.populateMonthSelect = function(months) {
        var monthSelect = document.getElementById(this.containerId + '-month-select');
        if (!monthSelect) return;
        
        this.resetSelect(monthSelect, 'Select Month');
        
        for (var i = 0; i < months.length; i++) {
            var option = document.createElement('option');
            option.value = months[i];
            option.textContent = months[i];
            monthSelect.appendChild(option);
        }
        
        monthSelect.disabled = months.length === 0;
    };
    
    /**
     * Populate the week select with available weeks
     */
    EarlyChart.prototype.populateWeekSelect = function(weeks) {
        var weekSelect = document.getElementById(this.containerId + '-week-select');
        if (!weekSelect) return;
        
        this.resetSelect(weekSelect, 'Select Week');
        
        for (var i = 0; i < weeks.length; i++) {
            var option = document.createElement('option');
            option.value = i + 1; // Week index starts at 1
            option.textContent = weeks[i];
            weekSelect.appendChild(option);
        }
        
        weekSelect.disabled = weeks.length === 0;
    };
    
    /**
     * Default data fetch function (override with custom implementation if needed)
     */
    EarlyChart.prototype.defaultDataFetch = function(params, callback) {
        var url = '/api/dashboard/yearly-data?year=' + params.year + '&userId=' + params.userId;
        
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    var data;
                    try {
                        data = JSON.parse(xhr.responseText);
                    } catch (e) {
                        data = [];
                        console.error('Error parsing JSON response', e);
                    }
                    callback(null, data);
                } else {
                    callback(new Error('Failed to fetch data: ' + xhr.status), null);
                }
            }
        };
        
        xhr.send();
    };
    
    /**
     * Handle refresh button click
     */
    EarlyChart.prototype.handleRefresh = function() {
        var refreshBtn = document.querySelector('.early-chart-refresh-btn');
        if (refreshBtn) {
            refreshBtn.classList.add('rotating');
        }
        
        // Clear stored data for current year
        this.clearStoredData(this.selectedYear);
        
        // Fetch fresh data
        this.fetchData();
    };
    
    /**
     * Store chart data in localStorage
     */
    EarlyChart.prototype.storeData = function(year, data) {
        try {
            var storageData = {
                data: data,
                timestamp: new Date().getTime(),
                userId: this.userId
            };
            localStorage.setItem(this.storageKey + '_' + year, JSON.stringify(storageData));
        } catch (e) {
            console.error('Error storing chart data:', e);
        }
    };
    
    /**
     * Get stored chart data
     */
    EarlyChart.prototype.getStoredData = function(year) {
        try {
            var storedData = localStorage.getItem(this.storageKey + '_' + year);
            if (!storedData) return null;
            
            var parsedData = JSON.parse(storedData);
            
            // Check if data is expired
            var now = new Date().getTime();
            var expiryTime = this.dataExpiryHours * 60 * 60 * 1000;
            if (now - parsedData.timestamp > expiryTime) {
                this.clearStoredData(year);
                return null;
            }
            
            // Check if data belongs to current user
            if (parsedData.userId !== this.userId) {
                this.clearStoredData(year);
                return null;
            }
            
            return parsedData.data;
        } catch (e) {
            console.error('Error retrieving stored chart data:', e);
            return null;
        }
    };
    
    /**
     * Clear stored data for a specific year
     */
    EarlyChart.prototype.clearStoredData = function(year) {
        try {
            localStorage.removeItem(this.storageKey + '_' + year);
        } catch (e) {
            console.error('Error clearing stored chart data:', e);
        }
    };
    
    /**
     * Fetch data from API or storage
     */
    EarlyChart.prototype.fetchData = function() {
        var self = this;
        
        if (!this.selectedYear || !this.userId) {
            this.showError('Please select a year and ensure user ID is provided');
            return;
        }
        
        this.showLoading();
        
        // Try to get data from storage first
        var storedData = this.getStoredData(this.selectedYear);
        if (storedData) {
            console.log('Using stored data for year:', this.selectedYear);
            this.allData = storedData;
            
            // Update month select with available months
            if (this.allData[this.selectedYear]) {
                var months = Object.keys(this.allData[this.selectedYear]);
                this.populateMonthSelect(months);
            }
            
            // Update chart
            this.updateChart();
            return;
        }
        
        // If no stored data, fetch from API
        this.dataFetchFn({
            year: this.selectedYear,
            userId: this.userId
        }, function(error, data) {
            if (error) {
                self.showError('Error loading data: ' + error.message);
                return;
            }
            
            self.allData = data || {};
            
            // Store the fetched data
            self.storeData(self.selectedYear, self.allData);
            
            // Update month select with available months
            if (self.allData[self.selectedYear]) {
                var months = Object.keys(self.allData[self.selectedYear]);
                self.populateMonthSelect(months);
            }
            
            // Update chart
            self.updateChart();
            
            // Remove rotating class from refresh button
            var refreshBtn = document.querySelector('.early-chart-refresh-btn');
            if (refreshBtn) {
                refreshBtn.classList.remove('rotating');
            }
        });
    };
    
    /**
     * Show loading indicator
     */
    EarlyChart.prototype.showLoading = function() {
        var loading = document.getElementById(this.containerId + '-loading');
        var canvas = document.getElementById(this.containerId + '-canvas');
        
        if (loading) {
            loading.className = 'chart-loading';
            loading.innerHTML = '<span class="loading-icon"></span><span class="loading-text">Loading chart data...</span>';
            loading.style.display = 'block';
        }
        
        if (canvas) {
            canvas.style.display = 'none';
        }
    };
    
    /**
     * Show error message
     */
    EarlyChart.prototype.showError = function(message) {
        var loading = document.getElementById(this.containerId + '-loading');
        var canvas = document.getElementById(this.containerId + '-canvas');
        
        if (loading) {
            loading.className = 'chart-loading chart-error';
            loading.innerHTML = '<span class="error-icon">!</span><span class="loading-text">' + (message || 'An error occurred') + '</span>';
            loading.style.display = 'block';
        }
        
        if (canvas) {
            canvas.style.display = 'none';
        }
    };
    
    /**
     * Hide loading indicator
     */
    EarlyChart.prototype.hideLoading = function() {
        var loading = document.getElementById(this.containerId + '-loading');
        var canvas = document.getElementById(this.containerId + '-canvas');
        
        if (loading) {
            loading.style.display = 'none';
        }
        
        if (canvas) {
            // Make canvas visible
            canvas.style.display = 'block';
            canvas.style.visibility = 'visible';
        }
    };
    
    /**
     * Update chart with current data
     */
    EarlyChart.prototype.updateChart = function() {
        var canvas = document.getElementById(this.containerId + '-canvas');
        if (!canvas) return;
        
        // Check if we have data to display
        if (!this.allData || !this.allData[this.selectedYear]) {
            this.showError('No data available for the selected year');
            return;
        }
        
        // Hide loading first
        this.hideLoading();
        
        // For Firefox 50 compatibility, we need to be careful with how we handle high DPI
        var dpr = 1;
        // Check for window.devicePixelRatio in a way compatible with older browsers
        if (window.devicePixelRatio !== undefined) {
            dpr = window.devicePixelRatio || 1;
        }
        
        // Get the display size of the canvas
        var rect = canvas.getBoundingClientRect();
        var displayWidth = Math.floor(rect.width);
        var displayHeight = Math.floor(rect.height);
        
        // Ensure minimum dimensions to avoid canvas errors
        if (displayWidth < 100) displayWidth = 300;
        if (displayHeight < 100) displayHeight = 300;
        
        // Set the canvas size for high-DPI displays
        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;
        
        // Set the CSS size 
        canvas.style.width = displayWidth + 'px';
        canvas.style.height = displayHeight + 'px';
        
        // Get context and apply DPR scaling
        var ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        
        // Continue with data preparation
        var yearlyData = this.allData[this.selectedYear] || {};
        var chartData;
        
        // Prepare the chart data based on selections
        if (this.selectedMonth) {
            var monthlyData = yearlyData[this.selectedMonth];
            
            if (!monthlyData) {
                this.showError('No data available for the selected month');
                return;
            }
            
            if (this.selectedWeek) {
                // Weekly view
                if (!monthlyData.weekData || !monthlyData.weekData[this.selectedWeek]) {
                    this.showError('No data available for the selected week');
                    return;
                }
                
                var weekData = monthlyData.weekData[this.selectedWeek];
                
                chartData = {
                    labels: weekData.days,
                    datasets: [
                        {
                            label: "Inflow",
                            data: weekData.inflow,
                            backgroundColor: "rgba(72, 187, 120, 0.7)",
                            borderColor: "rgba(72, 187, 120, 1)",
                            borderWidth: 2,
                            hoverBackgroundColor: "rgba(72, 187, 120, 0.9)"
                        },
                        {
                            label: "Outflow",
                            data: weekData.outflow,
                            backgroundColor: "rgba(229, 57, 53, 0.7)",
                            borderColor: "rgba(229, 57, 53, 1)",
                            borderWidth: 2,
                            hoverBackgroundColor: "rgba(229, 57, 53, 0.9)"
                        },
                        {
                            label: "Investment",
                            data: weekData.investment,
                            backgroundColor: "rgba(177, 107, 51, 0.7)",
                            borderColor: "rgb(172, 137, 14)",
                            borderWidth: 2,
                            hoverBackgroundColor: "rgba(177, 107, 51, 0.9)"
                        },
                        {
                            label: "Liability",
                            data: weekData.liability,
                            backgroundColor: "rgba(221, 28, 131, 0.7)",
                            borderColor: "rgba(221, 28, 131, 1)",
                            borderWidth: 2,
                            hoverBackgroundColor: "rgba(221, 28, 131, 0.9)"
                        }
                    ]
                };
            } else {
                // Monthly view
                chartData = {
                    labels: monthlyData.weeklyLabels,
                    datasets: [
                        {
                            label: "Inflow",
                            data: monthlyData.inflow,
                            backgroundColor: "rgba(72, 187, 120, 0.7)",
                            borderColor: "rgba(72, 187, 120, 1)",
                            borderWidth: 2,
                            borderRadius: 6,
                            hoverBackgroundColor: "rgba(72, 187, 120, 0.9)"
                        },
                        {
                            label: "Outflow",
                            data: monthlyData.outflow,
                            backgroundColor: "rgba(229, 57, 53, 0.7)",
                            borderColor: "rgba(229, 57, 53, 1)",
                            borderWidth: 2,
                            borderRadius: 6,
                            hoverBackgroundColor: "rgba(229, 57, 53, 0.9)"
                        },
                        {
                            label: "Investment",
                            data: monthlyData.investment,
                            backgroundColor: "rgba(211, 153, 106, 0.7)",
                            borderColor: "rgb(211, 153, 106)",
                            borderWidth: 2,
                            borderRadius: 6,
                            hoverBackgroundColor: "rgba(211, 153, 106, 0.9)"
                        },
                        {
                            label: "Liability",
                            data: monthlyData.liability,
                            backgroundColor: "rgba(221, 28, 131, 0.7)",
                            borderColor: "rgba(221, 28, 131, 1)",
                            borderWidth: 2,
                            borderRadius: 6,
                            hoverBackgroundColor: "rgba(221, 28, 131, 0.9)"
                        }
                    ]
                };
            }
        } else {
            // Yearly view
            var months = Object.keys(yearlyData);
            
            // Calculate the sum for each month and category
            var inflowData = [], outflowData = [], investmentData = [], liabilityData = [];
            
            for (var i = 0; i < months.length; i++) {
                var month = months[i];
                var monthData = yearlyData[month];
                
                // Helper function to sum an array or return 0 if not valid
                var sumArray = function(arr) {
                    if (!arr || !arr.length) return 0;
                    var sum = 0;
                    for (var j = 0; j < arr.length; j++) {
                        sum += (arr[j] || 0);
                    }
                    return sum;
                };
                
                inflowData.push(sumArray(monthData.inflow));
                outflowData.push(sumArray(monthData.outflow));
                investmentData.push(sumArray(monthData.investment));
                liabilityData.push(sumArray(monthData.liability));
            }
            
            chartData = {
                labels: months,
                datasets: [
                    {
                        label: "Inflow",
                        data: inflowData,
                        backgroundColor: "rgba(31, 107, 1, 0.7)",
                        borderColor: "rgb(31, 107, 1)",
                        borderWidth: 2,
                        borderRadius: 6,
                        hoverBackgroundColor: "rgba(31, 107, 1, 0.9)"
                    },
                    {
                        label: "Outflow",
                        data: outflowData,
                        backgroundColor: "rgba(143, 1, 1, 0.7)",
                        borderColor: "rgb(143, 1, 1)",
                        borderWidth: 2,
                        borderRadius: 6,
                        hoverBackgroundColor: "rgba(143, 1, 1, 0.9)"
                    },
                    {
                        label: "Investment",
                        data: investmentData,
                        backgroundColor: "rgba(211, 153, 106, 0.7)",
                        borderColor: "rgb(211, 153, 106)",
                        borderWidth: 2,
                        borderRadius: 6,
                        hoverBackgroundColor: "rgba(211, 153, 106, 0.9)"
                    },
                    {
                        label: "Liability",
                        data: liabilityData,
                        backgroundColor: "rgba(248, 3, 3, 0.7)",
                        borderColor: "rgb(248, 3, 3)",
                        borderWidth: 2,
                        borderRadius: 6,
                        hoverBackgroundColor: "rgba(248, 3, 3, 0.9)"
                    }
                ]
            };
        }
        
        // Firefox 50 compatible chart options
        var chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 600
            },
            interaction: {
                mode: 'nearest',
                intersect: true,
                includeInvisible: true
            },
            tooltips: {
                enabled: true,
                mode: 'nearest',
                intersect: true,
                backgroundColor: 'rgba(37, 37, 37, 0.8)',
                titleFontFamily: 'Helvetica, Arial, sans-serif',
                titleFontSize: 13,
                titleFontStyle: 'normal',
                titleMarginBottom: 10,
                bodyFontFamily: 'Helvetica, Arial, sans-serif',
                bodyFontSize: 12,
                bodySpacing: 8,
                xPadding: 12,
                yPadding: 12,
                cornerRadius: 6,
                displayColors: true,
                callbacks: {
                    title: function(tooltipItems) {
                        return tooltipItems[0].xLabel || '';
                    },
                    label: function(tooltipItem, data) {
                        var datasetLabel = data.datasets[tooltipItem.datasetIndex].label || '';
                        var value = tooltipItem.yLabel || 0;
                        return datasetLabel + ': Rs ' + value.toLocaleString();
                    }
                }
            },
            hover: {
                mode: 'nearest',
                intersect: true,
                animationDuration: 400
            },
            onClick: function(evt, elements) {
                if (elements && elements.length > 0) {
                    var element = elements[0];
                    var datasetIndex = element.datasetIndex;
                    var dataIndex = element.index;
                    var dataset = this.data.datasets[datasetIndex];
                    var value = dataset.data[dataIndex];
                    console.log('Clicked on:', dataset.label, 'value:', value);
                }
            },
            scales: {
                xAxes: [{
                    gridLines: {
                        display: false
                    },
                    ticks: {
                        fontColor: '#333',
                        fontSize: 12,
                        fontFamily: 'Helvetica, Arial, sans-serif',
                        fontStyle: 'normal',
                        align: 'start',
                        anchor: 'start',
                        textAlign: '10',
                        padding: 0
                    },
                    categoryPercentage: 0.8,
                    barPercentage: 0.9,
                    offset: true
                }],
                yAxes: [{
                    gridLines: {
                        color: 'rgba(229, 229, 229, 0.4)',
                        zeroLineColor: 'rgba(229, 229, 229, 0.4)',
                        drawBorder: false
                    },
                    ticks: {
                        beginAtZero: true,
                        fontColor: '#333',
                        fontSize: 12,
                        fontFamily: 'Helvetica, Arial, sans-serif',
                        fontStyle: 'normal',
                        padding: 8,
                        maxTicksLimit: 5,
                        callback: function(value) {
                            return 'Rs ' + Utils.formatNumber(value);
                        }
                    }
                }]
            },
            layout: {
                padding: {
                    top: 20,
                    right: 20,
                    bottom: 20,
                    left: 0
                }
            },
            legend: {
                display: false
            },
            elements: {
                rectangle: {
                    borderWidth: 2
                }
            }
        };
        
        // For Firefox 50 compatibility, we need to recreate the chart each time
        if (this.chart) {
            try {
                this.chart.destroy();
            } catch (e) {
                console.error('Error destroying chart:', e);
            }
        }
        
        try {
            // Create new chart with Chart.js v2.x compatible options
            this.chart = new Chart(ctx, {
                type: 'bar',
                data: chartData,
                options: chartOptions
            });
            
            // Update custom legend
            this.updateLegend();
            
            // Ensure the canvas is visible
            canvas.style.display = 'block';
            canvas.style.visibility = 'visible';
        } catch (error) {
            console.error('Error creating chart:', error);
            this.showError('Error creating chart: ' + error.message);
        }
    };
    
    /**
     * Update custom legend with interactive elements
     */
    EarlyChart.prototype.updateLegend = function() {
        var container = document.getElementById(this.containerId);
        if (!container) return;
        
        // Find the legend element
        var legend = container.querySelector('.chart-legend');
        if (!legend) return;
        
        // Clear existing legend items
        legend.innerHTML = '';
        
        var legendItems = [
            { label: 'Inflow', colorClass: 'legend-inflow', color: 'rgba(31, 107, 1, 0.8)' },
            { label: 'Outflow', colorClass: 'legend-outflow', color: 'rgba(143, 1, 1, 0.8)' },
            { label: 'Investment', colorClass: 'legend-investment', color: 'rgba(211, 153, 106, 0.8)' },
            { label: 'Liability', colorClass: 'legend-liability', color: 'rgba(248, 3, 3, 0.8)' }
        ];
        
        // Create the items
        var self = this;
        for (var i = 0; i < legendItems.length; i++) {
            var item = document.createElement('div');
            item.className = 'chart-legend-item';
            item.setAttribute('data-index', i);
            item.setAttribute('role', 'button');
            item.setAttribute('aria-pressed', 'true');
            item.setAttribute('tabindex', '0');
            
            var color = document.createElement('span');
            color.className = 'chart-legend-color ' + legendItems[i].colorClass;
            color.style.backgroundColor = legendItems[i].color;
            
            var label = document.createElement('span');
            label.className = 'chart-legend-label';
            label.textContent = legendItems[i].label;
            
            // Add visible toggle indicator
            var toggle = document.createElement('span');
            toggle.className = 'chart-legend-toggle';
            toggle.innerHTML = '<i class="fas fa-eye"></i>';
            
            item.appendChild(color);
            item.appendChild(label);
            item.appendChild(toggle);
            
            // Add click event to toggle dataset visibility
            var clickHandler = function(idx) {
                return function() {
                    if (self.chart) {
                        var meta = self.chart.getDatasetMeta(idx);
                        meta.hidden = !meta.hidden;
                        self.chart.update();
                        
                        // Update visual state
                        if (meta.hidden) {
                            this.classList.add('inactive');
                            this.setAttribute('aria-pressed', 'false');
                            var toggleIcon = this.querySelector('.chart-legend-toggle i');
                            if (toggleIcon) toggleIcon.className = 'fas fa-eye-slash';
                        } else {
                            this.classList.remove('inactive');
                            this.setAttribute('aria-pressed', 'true');
                            var toggleIcon = this.querySelector('.chart-legend-toggle i');
                            if (toggleIcon) toggleIcon.className = 'fas fa-eye';
                        }
                    }
                };
            }(i);

            // Add keyboard support
            var keyHandler = function(idx) {
                return function(e) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        clickHandler.call(this, idx)();
                    }
                };
            }(i);

            if (item.addEventListener) {
                item.addEventListener('click', clickHandler);
                item.addEventListener('keydown', keyHandler);
            } else if (item.attachEvent) {
                // For IE8 and below
                item.attachEvent('onclick', clickHandler);
                item.attachEvent('onkeydown', keyHandler);
            }
            
            legend.appendChild(item);
        }

        // Add legend styles if they don't exist
        if (!document.getElementById('chart-legend-styles')) {
            var style = document.createElement('style');
            style.id = 'chart-legend-styles';
            style.textContent = `
                .chart-legend {
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: center;
                    gap: 12px;
                    margin-top: 20px;
                }
                
                .chart-legend-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 15px;
                    border-radius: 50px;
                    cursor: pointer;
                    user-select: none;
                    transition: all 0.2s ease;
                    background-color: #f5f5f5;
                    border: 1px solid #e0e0e0;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                }
                
                .chart-legend-item:hover {
                    background-color: #efefef;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                }
                
                .chart-legend-item.inactive {
                    opacity: 0.6;
                    background-color: #e0e0e0;
                }
                
                .chart-legend-color {
                    width: 14px;
                    height: 14px;
                    border-radius: 50%;
                    box-shadow: 0 0 0 1px rgba(0,0,0,0.1);
                }
                
                .chart-legend-label {
                    font-size: 13px;
                    font-weight: 500;
                    color: #333;
                }
                
                .chart-legend-toggle {
                    margin-left: 5px;
                    font-size: 12px;
                    color: #555;
                }
                
                .chart-legend-item.inactive .chart-legend-toggle {
                    color: #999;
                }
                
                /* Dark mode support */
                @media (prefers-color-scheme: dark) {
                    .chart-legend-item {
                        background-color: #2d3748;
                        border-color: #4a5568;
                    }
                    
                    .chart-legend-item:hover {
                        background-color: #3a4a63;
                    }
                    
                    .chart-legend-item.inactive {
                        background-color: #1a202c;
                    }
                    
                    .chart-legend-label {
                        color: #e2e8f0;
                    }
                    
                    .chart-legend-toggle {
                        color: #a0aec0;
                    }
                    
                    .chart-legend-item.inactive .chart-legend-toggle {
                        color: #718096;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    };
    
    /**
     * Destroy the chart and clean up resources
     * This method should be called when the component is no longer needed
     */
    EarlyChart.prototype.destroy = function() {
        // Clean up Chart.js instance
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
        
        // Remove event listeners from select elements to prevent memory leaks
        var yearSelect = document.getElementById(this.containerId + '-year-select');
        var monthSelect = document.getElementById(this.containerId + '-month-select');
        var weekSelect = document.getElementById(this.containerId + '-week-select');
        
        // Only remove event listeners if we have both the element and the handler reference
        if (yearSelect && this._yearChangeHandler) {
            if (yearSelect.removeEventListener) {
                yearSelect.removeEventListener('change', this._yearChangeHandler);
            } else if (yearSelect.detachEvent) {
                yearSelect.detachEvent('onchange', this._yearChangeHandler);
            }
        }
        
        if (monthSelect && this._monthChangeHandler) {
            if (monthSelect.removeEventListener) {
                monthSelect.removeEventListener('change', this._monthChangeHandler);
            } else if (monthSelect.detachEvent) {
                monthSelect.detachEvent('onchange', this._monthChangeHandler);
            }
        }
        
        if (weekSelect && this._weekChangeHandler) {
            if (weekSelect.removeEventListener) {
                weekSelect.removeEventListener('change', this._weekChangeHandler);
            } else if (weekSelect.detachEvent) {
                weekSelect.detachEvent('onchange', this._weekChangeHandler);
            }
        }
        
        // Clean up container element
        var container = document.getElementById(this.containerId);
        if (container) {
            container.innerHTML = '';
        }
        
        // Clear data references
        this.allData = null;
        this._yearChangeHandler = null;
        this._monthChangeHandler = null;
        this._weekChangeHandler = null;
    };
    
    // Export to global scope
    window.EarlyChart = EarlyChart;
})();
