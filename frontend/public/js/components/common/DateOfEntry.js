/**
 * RestrictedDatePicker attaches a calendar to the given input.
 * Allowed dates are:
 *   - For the previous month: only the last 10 days.
 *   - For the current month: only the current day.
 */
function RestrictedDatePicker(input) {
    // Determine allowed dates based on today
    var today = new Date();
    var currentYear = today.getFullYear();
    var currentMonth = today.getMonth();
    var currentDay = today.getDate();

    var previousMonth, previousMonthYear;
    if (currentMonth === 0) {
        previousMonth = 11;
        previousMonthYear = currentYear - 1;
    } else {
        previousMonth = currentMonth - 1;
        previousMonthYear = currentYear;
    }

    // Calculate the last day of the previous month and the start of the allowed period (last 10 days)
    var daysInPreviousMonth = new Date(previousMonthYear, previousMonth + 1, 0).getDate();
    var allowedPreviousStart = daysInPreviousMonth - 9; // e.g. for 31 days: allowed from 22 to 31

    // Create the datepicker container
    var datePickerDiv = document.createElement('div');
    datePickerDiv.className = 'datepicker';
    datePickerDiv.style.display = 'none';
    document.body.appendChild(datePickerDiv);

    // Render calendar for a given year/month
    function renderCalendar(year, month) {
        datePickerDiv.innerHTML = ''; // Clear previous content

        var isAllowedPrevious = (year === previousMonthYear && month === previousMonth);
        var isAllowedCurrent = (year === currentYear && month === currentMonth);

        // Header with month navigation
        var header = document.createElement('div');
        header.className = 'datepicker-header';

        // Allow navigation only between the two allowed months:
        // If showing the current month, allow going back to previous month.
        // If showing the previous month, allow going forward to the current month.
        var canGoPrev = isAllowedCurrent; // from current month you can go to previous
        var canGoNext = isAllowedPrevious; // from previous month you can go to current

        var prev = document.createElement('span');
        prev.innerHTML = '&#9664;'; // left arrow
        if (canGoPrev) {
            prev.style.cursor = 'pointer';
            prev.onclick = function(e) {
                e.stopPropagation();
                renderCalendar(previousMonthYear, previousMonth);
            };
        } else {
            prev.style.color = '#ccc';
        }

        var title = document.createElement('span');
        var dateForTitle = new Date(year, month, 1);
        title.textContent = dateForTitle.toLocaleString('default', { month: 'long' }) + ' ' + year;
        title.style.margin = '0 20px';

        var next = document.createElement('span');
        next.innerHTML = '&#9654;'; // right arrow
        if (canGoNext) {
            next.style.cursor = 'pointer';
            next.onclick = function(e) {
                e.stopPropagation();
                renderCalendar(currentYear, currentMonth);
            };
        } else {
            next.style.color = '#ccc';
        }

        header.appendChild(prev);
        header.appendChild(title);
        header.appendChild(next);
        datePickerDiv.appendChild(header);

        // Create table for the days
        var table = document.createElement('table');
        var thead = document.createElement('thead');
        var tr = document.createElement('tr');
        var daysOfWeek = ['Su','Mo','Tu','We','Th','Fr','Sa'];
        for (var i = 0; i < daysOfWeek.length; i++) {
            var th = document.createElement('th');
            th.textContent = daysOfWeek[i];
            tr.appendChild(th);
        }
        thead.appendChild(tr);
        table.appendChild(thead);

        var tbody = document.createElement('tbody');
        var firstDay = new Date(year, month, 1).getDay();
        var daysInMonth = new Date(year, month + 1, 0).getDate();
        var date = 1;

        // Render up to 6 rows
        for (var i = 0; i < 6; i++) {
            var row = document.createElement('tr');
            for (var j = 0; j < 7; j++) {
                var cell = document.createElement('td');
                if (i === 0 && j < firstDay || date > daysInMonth) {
                    cell.textContent = '';
                } else {
                    cell.textContent = date;
                    var enableDate = false;
                    // If this is the allowed previous month, only enable dates in the last 10 days
                    if (isAllowedPrevious && date >= allowedPreviousStart) {
                        enableDate = true;
                    }
                    // If this is the allowed current month, only enable the current day
                    else if (isAllowedCurrent && date <= currentDay) {
                        enableDate = true;
                    }
                    if (enableDate) {
                        cell.style.cursor = 'pointer';
                        cell.onclick = (function(d) {
                            return function(e) {
                                e.stopPropagation();
                                var m = month + 1;
                                var mStr = m < 10 ? '0' + m : m;
                                var dStr = d < 10 ? '0' + d : d;
                                input.value = year + '-' + mStr + '-' + dStr;
                                datePickerDiv.style.display = 'none';
                            };
                        })(date);
                    } else {
                        // Mark non-selectable dates as disabled
                        cell.className = 'disabled';
                        cell.style.color = '#ccc';
                    }
                    date++;
                }
                row.appendChild(cell);
            }
            tbody.appendChild(row);
        }
        table.appendChild(tbody);
        datePickerDiv.appendChild(table);
    }

    // On input focus, show the calendar.
    input.addEventListener('focus', function() {
        var rect = input.getBoundingClientRect();
        datePickerDiv.style.position = 'absolute';
        datePickerDiv.style.left = rect.left + 'px';
        datePickerDiv.style.top = (rect.bottom + window.scrollY) + 'px';

        // Default display: if the input already holds an allowed date, show that month;
        // otherwise, default to the current month.
        var defaultYear, defaultMonth;
        if (input.value) {
            var parts = input.value.split('-');
            if (parts.length === 3) {
                defaultYear = parseInt(parts[0], 10);
                defaultMonth = parseInt(parts[1], 10) - 1;
            }
        }
        if (typeof defaultYear === 'undefined' || typeof defaultMonth === 'undefined' ||
           !((defaultYear === previousMonthYear && defaultMonth === previousMonth) ||
             (defaultYear === currentYear && defaultMonth === currentMonth))) {
            defaultYear = currentYear;
            defaultMonth = currentMonth;
        }
        renderCalendar(defaultYear, defaultMonth);
        datePickerDiv.style.display = 'block';
    });

    // Hide the datepicker when clicking outside the input and calendar.
    document.addEventListener('click', function(e) {
        if (!datePickerDiv.contains(e.target) && e.target !== input) {
            datePickerDiv.style.display = 'none';
        }
    });
}
