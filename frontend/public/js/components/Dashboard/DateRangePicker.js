var DateRangePicker = {
    init: function(container, options) {
        this.container = container;
        this.options = options || {};
        this.onDateChange = options.onDateChange || function() {};
        this.onMonthChange = options.onMonthChange || function() {};
        
        // Default date range (today to today)
        var today = new Date();
        this.startDate = options.startDate || today;
        this.endDate = options.endDate || today;
        
        // Flag to track if calendar is open
        this.isOpen = false;
        
        this.render();
        this.attachEventListeners();
    },
    
    render: function() {
        this.container.innerHTML = `
            <div class="date-range-picker-container">
                <div class="date-range-grid">
                    <!-- Date Range Selector -->
                    <div class="date-range-button-container">
                        <div class="date-range-button" id="dateRangeToggle">
                            <span id="dateRangeDisplay">${this.formatDate(this.startDate)} - ${this.formatDate(this.endDate)}</span>
                        </div>
                        
                        <!-- Popover Content -->
                        <div class="date-range-popover" id="dateRangePopover">
                            <div class="popover-header">
                                <span class="popover-title">Pick a Date Range</span>
                                <button class="popover-close" id="popoverClose">&times;</button>
                            </div>
                            <div class="popover-body">
                                <div class="calendar-container">
                                    <div class="calendar-header">
                                        <button class="month-nav" id="prevMonth">&lt;</button>
                                        <span id="currentMonthYear"></span>
                                        <button class="month-nav" id="nextMonth">&gt;</button>
                                    </div>
                                    
                                    <!-- Fixed calendar grid structure -->
                                    <div class="calendar-grid">
                                        <div class="weekday">Sun</div>
                                        <div class="weekday">Mon</div>
                                        <div class="weekday">Tue</div>
                                        <div class="weekday">Wed</div>
                                        <div class="weekday">Thu</div>
                                        <div class="weekday">Fri</div>
                                        <div class="weekday">Sat</div>
                                    </div>
                                    <div id="calendarDays" class="calendar-days"></div>
                                </div>
                                
                                <div class="date-range-actions">
                                    <button class="apply-btn" id="applyDateRange">Apply</button>
                                    <button class="cancel-btn" id="cancelDateRange">Cancel</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Current Month Button -->
                    <div class="current-month-container">
                        <button class="current-month-button" id="currentMonthBtn" style="font-size: 1em;">
                            Current Month
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Link the stylesheet if not already linked
        if (!document.getElementById('date-range-picker-styles')) {
            var link = document.createElement('link');
            link.id = 'date-range-picker-styles';
            link.rel = 'stylesheet';
            link.type = 'text/css';
            link.href = '/css/DateRangePicker.css';
            document.head.appendChild(link);
        }
        
        // Initialize calendar
        this.calendarView = {
            month: this.startDate.getMonth(),
            year: this.startDate.getFullYear()
        };
        
        this.selectedDates = {
            start: this.startDate,
            end: this.endDate,
            selecting: false
        };
        
        this.updateCalendar();
    },
    
    attachEventListeners: function() {
        var self = this;
        
        // Date Range Toggle Button
        var dateRangeToggle = this.container.querySelector('#dateRangeToggle');
        var dateRangePopover = this.container.querySelector('#dateRangePopover');
        var popoverClose = this.container.querySelector('#popoverClose');
        var prevMonth = this.container.querySelector('#prevMonth');
        var nextMonth = this.container.querySelector('#nextMonth');
        var applyBtn = this.container.querySelector('#applyDateRange');
        var cancelBtn = this.container.querySelector('#cancelDateRange');
        var currentMonthBtn = this.container.querySelector('#currentMonthBtn');
        
        // Toggle date range popover
        dateRangeToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            if (!self.isOpen) {
                dateRangePopover.style.display = 'block';
                self.isOpen = true;
                
                // Reset to show month of start date
                self.calendarView.month = self.startDate.getMonth();
                self.calendarView.year = self.startDate.getFullYear();
                self.updateCalendar();
                
                // Position the popover
                var buttonRect = dateRangeToggle.getBoundingClientRect();
                dateRangePopover.style.top = (buttonRect.bottom + window.scrollY) + 'px';
                dateRangePopover.style.left = (buttonRect.left + window.scrollX) + 'px';
                
                // Click outside to close - use a properly bound function
                self.boundHandleOutsideClick = self.handleOutsideClick.bind(self);
                document.addEventListener('click', self.boundHandleOutsideClick);
            }
        });
        
        // Close button
        popoverClose.addEventListener('click', function(e) {
            e.stopPropagation();
            self.closePopover();
        });
        
        // Month navigation
        prevMonth.addEventListener('click', function(e) {
            e.stopPropagation();
            self.navigateMonth(-1);
        });
        
        nextMonth.addEventListener('click', function(e) {
            e.stopPropagation();
            self.navigateMonth(1);
        });
        
        // Apply button
        applyBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            self.applyDateRange();
            self.closePopover();
        });
        
        // Cancel button
        cancelBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            self.closePopover();
        });
        
        // Current Month button
        currentMonthBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            self.setCurrentMonth();
        });
        
        // Prevent clicks inside popover from closing it
        dateRangePopover.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    },
    
    handleOutsideClick: function(e) {
        // Don't close if click is inside the popover or on the toggle
        var dateRangePopover = this.container.querySelector('#dateRangePopover');
        var dateRangeToggle = this.container.querySelector('#dateRangeToggle');
        
        if (dateRangePopover && !dateRangePopover.contains(e.target) && 
            dateRangeToggle && !dateRangeToggle.contains(e.target)) {
            this.closePopover();
        }
    },
    
    closePopover: function() {
        var dateRangePopover = this.container.querySelector('#dateRangePopover');
        dateRangePopover.style.display = 'none';
        this.isOpen = false;
        
        // Remove event listener using the bound function
        if (this.boundHandleOutsideClick) {
            document.removeEventListener('click', this.boundHandleOutsideClick);
            this.boundHandleOutsideClick = null;
        }
    },
    
    updateCalendar: function() {
        var monthYearDisplay = this.container.querySelector('#currentMonthYear');
        var calendarDays = this.container.querySelector('#calendarDays');
        
        // Set month and year display
        var months = [
            'January', 'February', 'March', 'April', 'May', 'June', 
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        monthYearDisplay.textContent = months[this.calendarView.month] + ' ' + this.calendarView.year;
        
        // Clear previous days
        calendarDays.innerHTML = '';
        
        // Get first day of month and last day of month
        var firstDay = new Date(this.calendarView.year, this.calendarView.month, 1);
        var lastDay = new Date(this.calendarView.year, this.calendarView.month + 1, 0);
        
        // Create a grid for the days
        var calendarGrid = document.createElement('div');
        calendarGrid.className = 'days-grid';
        
        // Add empty cells for days before first day of month
        var startingDayOfWeek = firstDay.getDay();
        for (var i = 0; i < startingDayOfWeek; i++) {
            var emptyDay = document.createElement('div');
            emptyDay.className = 'day empty';
            calendarGrid.appendChild(emptyDay);
        }
        
        // Add days of month
        for (var day = 1; day <= lastDay.getDate(); day++) {
            var dayEl = document.createElement('div');
            dayEl.className = 'day';
            dayEl.textContent = day;
            
            // Current date
            var currentDate = new Date(this.calendarView.year, this.calendarView.month, day);
            
            // Add today class for current date
            var today = new Date();
            if (this.isSameDate(currentDate, today)) {
                dayEl.classList.add('today');
            }
            
            // Check if day is in selected range
            if (this.isDateInRange(currentDate)) {
                dayEl.classList.add('in-range');
            }
            
            // Check if day is start or end date
            if (this.isSameDate(currentDate, this.selectedDates.start)) {
                dayEl.classList.add('range-start');
            }
            
            if (this.isSameDate(currentDate, this.selectedDates.end)) {
                dayEl.classList.add('range-end');
            }
            
            // Add click handler for day selection
            dayEl.addEventListener('click', this.handleDayClick.bind(this, currentDate));
            
            calendarGrid.appendChild(dayEl);
        }
        
        // Add empty cells for days after last day of month to complete grid
        var daysInGrid = startingDayOfWeek + lastDay.getDate();
        var remainingCells = 7 - (daysInGrid % 7);
        if (remainingCells < 7) {
            for (var i = 0; i < remainingCells; i++) {
                var emptyDay = document.createElement('div');
                emptyDay.className = 'day empty';
                calendarGrid.appendChild(emptyDay);
            }
        }
        
        calendarDays.appendChild(calendarGrid);
        
        // Add helper text to show selection state
        var selectionHelp = document.createElement('div');
        selectionHelp.className = 'selection-help';
        if (this.selectedDates.selecting) {
            selectionHelp.textContent = 'Select end date';
        } else {
            selectionHelp.textContent = 'Click to select start date';
        }
        calendarDays.appendChild(selectionHelp);
    },
    
    handleDayClick: function(date, e) {
        e.stopPropagation();
        
        if (!this.selectedDates.selecting) {
            // First click - start new selection
            this.selectedDates.start = new Date(date);
            this.selectedDates.end = new Date(date);
            this.selectedDates.selecting = true;
        } else {
            // Second click - complete selection
            if (date < this.selectedDates.start) {
                this.selectedDates.end = new Date(this.selectedDates.start);
                this.selectedDates.start = new Date(date);
            } else {
                this.selectedDates.end = new Date(date);
            }
            this.selectedDates.selecting = false;
        }
        
        this.updateCalendar();
    },
    
    navigateMonth: function(direction) {
        // Move to previous or next month
        this.calendarView.month += direction;
        
        // Handle year change
        if (this.calendarView.month < 0) {
            this.calendarView.month = 11;
            this.calendarView.year--;
        } else if (this.calendarView.month > 11) {
            this.calendarView.month = 0;
            this.calendarView.year++;
        }
        
        this.updateCalendar();
    },
    
    applyDateRange: function() {
        // Update the displayed date range
        this.startDate = new Date(this.selectedDates.start);
        this.endDate = new Date(this.selectedDates.end);
        
        var dateRangeDisplay = this.container.querySelector('#dateRangeDisplay');
        dateRangeDisplay.textContent = this.formatDate(this.startDate) + ' - ' + this.formatDate(this.endDate);
        
        // Format dates for the callback (ISO format for backend)
        var formattedStartDate = this.formatISODate(this.startDate);
        var formattedEndDate = this.formatISODate(this.endDate);
        
        // Call the callback function
        if (typeof this.onDateChange === 'function') {
            this.onDateChange({
                startDate: formattedStartDate,
                endDate: formattedEndDate
            });
        }
    },
    
    setCurrentMonth: function() {
        var today = new Date();
        var firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        var lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        // Update selected dates
        this.selectedDates.start = firstDay;
        this.selectedDates.end = lastDay;
        
        // Apply the date range
        this.applyDateRange();
        
        // Get current month string
        var currentMonth = this.getCurrentMonth();
        
        // Call the month change callback
        if (typeof this.onMonthChange === 'function') {
            this.onMonthChange(currentMonth);
        }
    },
    
    getCurrentMonth: function() {
        var options = { year: 'numeric', month: 'long' };
        return new Date().toLocaleDateString('en-US', options);
    },
    
    formatDate: function(date) {
        var options = { year: 'numeric', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    },
    
    formatISODate: function(date) {
        var year = date.getFullYear();
        var month = (date.getMonth() + 1).toString().padStart(2, '0');
        var day = date.getDate().toString().padStart(2, '0');
        return year + '-' + month + '-' + day;
    },
    
    isDateInRange: function(date) {
        return date >= this.selectedDates.start && date <= this.selectedDates.end;
    },
    
    isSameDate: function(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }
};

// Make DateRangePicker globally available
window.DateRangePicker = DateRangePicker;
