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
        
        // Create title
        var title = document.createElement('h2');
        title.className = 'early-chart-title';
        title.textContent = 'Balance Chart';
        container.appendChild(title);
        
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
        canvas.height = 300; // Default height

        // For older browsers, explicitly set style dimensions as well
        canvas.style.width = '100%';
        canvas.style.height = '300px';

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
        
        var legendItems = [
            { label: 'Inflow', colorClass: 'legend-inflow' },
            { label: 'Outflow', colorClass: 'legend-outflow' },
            { label: 'Investment', colorClass: 'legend-investment' },
            { label: 'Liability', colorClass: 'legend-liability' }
        ];
        
        for (var i = 0; i < legendItems.length; i++) {
            var item = document.createElement('div');
            item.className = 'chart-legend-item';
            
            var color = document.createElement('span');
            color.className = 'chart-legend-color ' + legendItems[i].colorClass;
            
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
     * Fetch data from API
     */
    EarlyChart.prototype.fetchData = function() {
        var self = this;
        
        if (!this.selectedYear || !this.userId) {
            this.showError('Please select a year and ensure user ID is provided');
            return;
        }
        
        this.showLoading();
        
        this.dataFetchFn({
            year: this.selectedYear,
            userId: this.userId
        }, function(error, data) {
            if (error) {
                self.showError('Error loading data: ' + error.message);
                return;
            }
            
            self.allData = data || {};
            
            // Update month select with available months
            if (self.allData[self.selectedYear]) {
                var months = Object.keys(self.allData[self.selectedYear]);
                self.populateMonthSelect(months);
            }
            
            // Update chart
            self.updateChart();
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
            // Ensure the canvas is visible but wait to render until after we create the chart
            canvas.style.visibility = 'visible';
            
            // Make sure canvas is properly sized to its container
            if (canvas.parentNode) {
                var containerWidth = canvas.parentNode.clientWidth || 300;
                var containerHeight = canvas.parentNode.clientHeight || 300;
                
                // Only set dimensions if they're different to avoid unnecessary redraws
                if (canvas.width !== containerWidth || canvas.height !== containerHeight) {
                    canvas.width = containerWidth;
                    canvas.height = containerHeight;
                }
            }
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
                            borderRadius: 6,
                            hoverBackgroundColor: "rgba(72, 187, 120, 0.9)"
                        },
                        {
                            label: "Outflow",
                            data: weekData.outflow,
                            backgroundColor: "rgba(229, 57, 53, 0.7)",
                            borderColor: "rgba(229, 57, 53, 1)",
                            borderWidth: 2,
                            borderRadius: 6,
                            hoverBackgroundColor: "rgba(229, 57, 53, 0.9)"
                        },
                        {
                            label: "Investment",
                            data: weekData.investment,
                            backgroundColor: "rgba(224, 183, 36, 0.7)",
                            borderColor: "rgba(224, 183, 36, 1)",
                            borderWidth: 2,
                            borderRadius: 6,
                            hoverBackgroundColor: "rgba(224, 183, 36, 0.9)"
                        },
                        {
                            label: "Liability",
                            data: weekData.liability,
                            backgroundColor: "rgba(221, 28, 131, 0.7)",
                            borderColor: "rgba(221, 28, 131, 1)", 
                            borderWidth: 2,
                            borderRadius: 6,
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
                            backgroundColor: "rgba(224, 183, 36, 0.7)",
                            borderColor: "rgba(224, 183, 36, 1)",
                            borderWidth: 2,
                            borderRadius: 6,
                            hoverBackgroundColor: "rgba(224, 183, 36, 0.9)"
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
                        backgroundColor: "rgba(72, 187, 120, 0.7)",
                        borderColor: "rgba(72, 187, 120, 1)",
                        borderWidth: 2,
                        borderRadius: 6,
                        hoverBackgroundColor: "rgba(72, 187, 120, 0.9)"
                    },
                    {
                        label: "Outflow",
                        data: outflowData,
                        backgroundColor: "rgba(229, 57, 53, 0.7)",
                        borderColor: "rgba(229, 57, 53, 1)",
                        borderWidth: 2,
                        borderRadius: 6,
                        hoverBackgroundColor: "rgba(229, 57, 53, 0.9)"
                    },
                    {
                        label: "Investment",
                        data: investmentData,
                        backgroundColor: "rgba(224, 183, 36, 0.7)",
                        borderColor: "rgba(224, 183, 36, 1)",
                        borderWidth: 2,
                        borderRadius: 6,
                        hoverBackgroundColor: "rgba(224, 183, 36, 0.9)"
                    },
                    {
                        label: "Liability",
                        data: liabilityData,
                        backgroundColor: "rgba(221, 28, 131, 0.7)",
                        borderColor: "rgba(221, 28, 131, 1)",
                        borderWidth: 2,
                        borderRadius: 6,
                        hoverBackgroundColor: "rgba(221, 28, 131, 0.9)"
                    }
                ]
            };
        }
        
        // Enhanced Chart options
        var chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1000, // Animation duration in milliseconds
                easing: 'easeOutQuart' // Smoother easing function
            },
            plugins: {
                legend: {
                    display: false, // We're using our custom legend
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: true,
                    usePointStyle: true,
                    callbacks: {
                        label: function(context) {
                            var label = context.dataset.label || '';
                            var value = context.raw || 0;
                            return label + ': ' + value.toLocaleString('en-US', { 
                                style: 'currency', 
                                currency: 'USD',
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0
                            });
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 12
                        },
                        color: '#718096'
                    }
                },
                y: {
                    grid: {
                        color: "rgba(229, 229, 229, 0.4)",
                        lineWidth: 1,
                        drawBorder: false
                    },
                    ticks: {
                        font: {
                            size: 12
                        },
                        color: '#718096',
                        callback: function(value) {
                            if (value >= 1000) {
                                return '$' + (value / 1000) + 'k';
                            }
                            return '$' + value;
                        }
                    },
                    beginAtZero: true
                }
            },
            layout: {
                padding: {
                    top: 20,
                    right: 25,
                    bottom: 20,
                    left: 25
                }
            },
            elements: {
                bar: {
                    borderRadius: 6
                }
            }
        };
        
        // Update or create the chart
        this.hideLoading();
        
        if (this.chart) {
            // Destroy previous chart to prevent memory leaks
            this.chart.destroy();
        }
        
        try {
            // Make sure the canvas is visible before creating the chart
            canvas.style.display = 'block';
            
            // Ensure canvas has proper dimensions
            if (canvas.parentNode) {
                var parentWidth = canvas.parentNode.clientWidth || 300;
                var parentHeight = canvas.parentNode.clientHeight || 300;
                canvas.width = parentWidth;
                canvas.height = parentHeight;
            }
            
            // Get the 2D context from the canvas
            var ctx = canvas.getContext('2d');
            if (!ctx) {
                console.error('Could not get canvas context');
                this.showError('Could not initialize chart - canvas context unavailable');
                return;
            }
            
            // Create new chart with the 2D context
            this.chart = new Chart(ctx, {
                type: 'bar',
                data: chartData,
                options: chartOptions
            });
            
            // Update custom legend
            this.updateLegend();
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
            { label: 'Inflow', colorClass: 'legend-inflow', color: 'rgba(72, 187, 120, 0.8)' },
            { label: 'Outflow', colorClass: 'legend-outflow', color: 'rgba(229, 57, 53, 0.8)' },
            { label: 'Investment', colorClass: 'legend-investment', color: 'rgba(224, 183, 36, 0.8)' },
            { label: 'Liability', colorClass: 'legend-liability', color: 'rgba(221, 28, 131, 0.8)' }
        ];
        
        // Create the items
        var self = this;
        for (var i = 0; i < legendItems.length; i++) {
            var item = document.createElement('div');
            item.className = 'chart-legend-item';
            item.setAttribute('data-index', i);
            
            var color = document.createElement('span');
            color.className = 'chart-legend-color ' + legendItems[i].colorClass;
            
            var label = document.createElement('span');
            label.className = 'chart-legend-label';
            label.textContent = legendItems[i].label;
            
            item.appendChild(color);
            item.appendChild(label);
            
            // Add click event to toggle dataset visibility
            var clickHandler = function(idx) {
                return function() {
                    if (self.chart && self.chart.isDatasetVisible(idx)) {
                        self.chart.hide(idx);
                        this.classList.add('inactive');
                    } else if (self.chart) {
                        self.chart.show(idx);
                        this.classList.remove('inactive');
                    }
                };
            }(i);  // Pass current index to closure

            if (item.addEventListener) {
                item.addEventListener('click', clickHandler);
            } else if (item.attachEvent) {
                // For IE8 and below
                item.attachEvent('onclick', clickHandler);
            }
            
            legend.appendChild(item);
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
