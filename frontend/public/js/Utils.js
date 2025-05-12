// Global Utils object for compatibility with older browsers
var Utils = {
    cleanup: function (modalId) {
        var existingModal = document.getElementById(modalId);
        if (existingModal) {
            if (existingModal.parentNode) {
                existingModal.parentNode.removeChild(existingModal);
            }
        }
        window.onclick = null;
    },

    loadHeadsData: function (type) {
        ApiClient.getHeads(type)
            .then(function (response) {
                var headSelect = document.getElementById('head');
                headSelect.innerHTML = '<option value="">Select a head</option>';
                response.data.forEach(function (head) {
                    var option = document.createElement('option');
                    option.value = head.id;
                    option.textContent = head.heads;
                    option.dataset.subheads = JSON.stringify(head.sub_heads || []);
                    headSelect.appendChild(option);
                });
            })
            .catch(console.error);
    },

    loadSubHeads: function (headId) {
        var subHeadContainer = document.getElementById('subHeadContainer');
        var subHeadSelect = document.getElementById('subhead');
        var selectedHead = document.querySelector('#head option[value="' + headId + '"]');
        subHeadSelect.innerHTML = '<option value="">Select a sub-head</option>';
        var subHeads = selectedHead && selectedHead.dataset.subheads ? JSON.parse(selectedHead.dataset.subheads) : [];
        if (subHeads.length > 0) {
            subHeads.forEach(function (subHead) {
                var option = document.createElement('option');
                option.value = subHead.id;
                option.textContent = subHead.subheads;
                subHeadSelect.appendChild(option);
            });
            subHeadContainer.style.display = 'block';
        } else {
            subHeadContainer.style.display = 'none';
        }
    },

    loadIBANs: function() {
        var self = this;
        var userId = sessionStorage.getItem('selectedUserId');
        if (!userId) return;

        ApiClient.getIBANs(userId)
            .then(function(response) {
                var ibanSelect = document.getElementById('iban');
                ibanSelect.innerHTML = '<option value="">Select IBAN</option>';
                response.forEach(function(iban) {
                    var option = document.createElement('option');
                    option.value = iban.id;
                    option.textContent = iban.iban;
                    ibanSelect.appendChild(option);
                });
            })
            .catch(function(error) {
                console.error('Failed to load IBANs:', error);
            });
    },

    onSuccess: function(action, type) {
        type = type || '';
        var message = '';
        switch (action) {
            case 'add':
                message = 'Added ' + type + ' successfully!';
                break;
            case 'edit':
                message = 'Updated ' + type + ' successfully!';
                break; 
            case 'delete':
                message = 'Deleted ' + type + ' successfully!';
                break;
            case 'error':
                message = 'Error: ' + type;
                break;
        }
    
        // Display success message
        var successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        
        // Change background color to red if action is delete
        if (action === 'delete' || action === 'error') {
            successDiv.style.backgroundColor = '#d63031';
        }
        
        successDiv.innerText = message;
    
        document.body.appendChild(successDiv);
    
        // Remove the message after 3 seconds
        setTimeout(function () {
            successDiv.remove();
        }, 4000);
    
        // Close the modal if it's open
        if (typeof ModalHandler !== 'undefined' && typeof ModalHandler.close === 'function') {
            ModalHandler.close();
        }
    },

    close: function() {
        this.cleanup();
    },

    formatNumber: function(value) {
        value = Number(value);
        if (value == null || isNaN(value)) {
            return 'Invalid number'; // Handle null, undefined, or NaN
        }
    
        if (value < 1000) {
            return value.toFixed(2); // Less than 1,000
        } else if (value < 1000000) {
            return (value / 1000).toFixed(2) + 'K'; // Thousands
        } else {
            return (value / 1000000).toFixed(2) + 'M'; // Millions
        }
    },

    // formatNumber: function(value) {
    //     value = Number(value);
    //     if (value == null || isNaN(value)) {
    //         return 'Invalid number'; // Handle null, undefined, or NaN
    //     }
    
    //     if (value < 1000) {
    //         return value.toFixed(2); // Less than 1,000
    //     } else if (value < 1000000) {
    //         return (value / 1000).toFixed(2) + 'K'; // Thousands
    //     } else if (value < 1000000000) {
    //         return (value / 1000000).toFixed(2) + 'M'; // Millions
    //     } else if (value < 1000000000000) {
    //         return (value / 1000000000).toFixed(2) + 'B'; // Billions
    //     } else if (value < 1000000000000000) {
    //         return (value / 1000000000000).toFixed(2) + 'T'; // Trillions
    //     } else if (value < 1000000000000000000) {
    //         return (value / 1000000000000000).toFixed(2) + 'Q'; // Quadrillions
    //     } else {
    //         return (value / 1000000000000000000).toFixed(2) + 'Qi'; // Quintillions or more
    //     }
    // },
    
    // Common formatDate function to be used across all components
    formatDate: function(dateString, includeTime = false) {
        if (!dateString) return 'N/A';
        
        try {
            var date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return 'Invalid date';
            }
            
            var day = date.getDate();
            var month = date.toLocaleString('en-US', { month: 'short' });
            var year = date.getFullYear();
            
            var formattedDate = day + ' ' + month + ' ' + year;
            
            if (includeTime) {
                var hours = date.getHours().toString().padStart(2, '0');
                var minutes = date.getMinutes().toString().padStart(2, '0');
                formattedDate += ' ' + hours + ':' + minutes;
            }
            
            return formattedDate;
        } catch (e) {
            console.error('Error formatting date:', e);
            return 'Error';
        }
    },
    
    // Format date for input fields (YYYY-MM-DD format)
    formatDateForInput: function(dateString) {
        if (!dateString) return '';
        
        try {
            var date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return '';
            }
            
            var year = date.getFullYear();
            var month = (date.getMonth() + 1) < 10 ? '0' + (date.getMonth() + 1) : '' + (date.getMonth() + 1);
            var day = date.getDate() < 10 ? '0' + date.getDate() : '' + date.getDate();
            
            return year + '-' + month + '-' + day;
        } catch (e) {
            console.error('Error formatting date for input:', e);
            return '';
        }
    },
    
    // Common pagination update function
    updatePagination: function(component, hasMore) {
        var prevPageBtn = document.getElementById('prevPage');
        var nextPageBtn = document.getElementById('nextPage');
        var currentPageSpan = document.getElementById('currentPage');
        
        if (currentPageSpan) {
            currentPageSpan.textContent = component.currentPage;
        }
        
        if (prevPageBtn) {
            prevPageBtn.disabled = component.currentPage <= 1;
        }
        
        if (nextPageBtn) {
            nextPageBtn.disabled = !hasMore;
        }
    },

    // Handle API error responses
    handleApiError: function(error, elementId, defaultMessage) {
        console.error('API Error:', error);
        var element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = '<div class="alert alert-danger">' +
                (error.message || defaultMessage || 'An error occurred') +
                '</div>';
        }
    },
    
    // Show a loading spinner
    showLoading: function(elementId, message) {
        var element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = '<div class="text-center" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">' +
                '<div class="spinner" style="width: 30px; height: 30px; border: 3px solid #f3f3f3; border-top: 3px solid #3498db; border-radius: 50%; animation: spin 2s linear infinite;"></div>' +
                (message ? '<p style="margin-top: 10px;">' + message + '</p>' : '') +
                '</div>';
            
            if (!document.getElementById('spin-animation')) {
                var style = document.createElement('style');
                style.id = 'spin-animation';
                style.innerHTML = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
                document.head.appendChild(style);
            }
        }
    },
    
    // Initialize pagination for any component
    initPagination: function(component, loadDataFunction) {
        var prevPage = document.getElementById('prevPage');
        var nextPage = document.getElementById('nextPage');
        var searchInput = document.getElementById('searchInput');
        
        if (prevPage) {
            if (prevPage.onclick) {
                prevPage.onclick = null;
            }
            prevPage.onclick = function() {
                if (component.currentPage > 1) {
                    component.currentPage--;
                    sessionStorage.setItem(component.storageKey + 'CurrentPage', component.currentPage);
                    loadDataFunction();
                }
            };
        }
        
        if (nextPage) {
            if (nextPage.onclick) {
                nextPage.onclick = null;
            }
            nextPage.onclick = function() {
                component.currentPage++;
                sessionStorage.setItem(component.storageKey + 'CurrentPage', component.currentPage);
                loadDataFunction();
            };
        }
        
        if (searchInput) {
            if (searchInput.oninput) {
                searchInput.oninput = null;
            }
            
            var timeout = null;
            searchInput.oninput = function() {
                if (timeout) {
                    clearTimeout(timeout);
                }
                timeout = setTimeout(function() {
                    component.currentPage = 1;
                    sessionStorage.setItem(component.storageKey + 'CurrentPage', '1');
                    loadDataFunction(searchInput.value);
                }, 500);
            };
        }
    },
    
    // Common function to store last visited page
    storeLastVisited: function(pageName) {
        sessionStorage.setItem('lastVisited', pageName);
    },
    
    // Get a properly formatted page title with user name if applicable
    getPageTitle: function(pageName, currentUser, storedUserName) {
        if (currentUser.is_superuser) {
            return storedUserName.toLowerCase() === 'admin' ? 
                'All Users ' + pageName : 
                storedUserName + '\'s ' + pageName;
        }
        return 'My ' + pageName;
    },
    
    // Generate label HTML with red asterisk for required fields
    createLabel: function(forId, text, isRequired) {
        var requiredAttr = isRequired ? ' data-required="*"' : '';
        return '<label for="' + forId + '"' + requiredAttr + '>' + text + '</label>';
    },
    
    // Common function to set current date in YYYY-MM-DD format
    setCurrentDate: function(inputElement) {
        if (!inputElement) return;
        
        var today = new Date();
        var year = today.getFullYear();
        var month = (today.getMonth() + 1) < 10 ? '0' + (today.getMonth() + 1) : '' + (today.getMonth() + 1);
        var day = today.getDate() < 10 ? '0' + today.getDate() : '' + today.getDate();
        
        inputElement.value = year + '-' + month + '-' + day;
    },
    
    // Initialize datepicker on an input element
    initDatePicker: function(inputElement) {
        if (!inputElement) return;
        
        if (typeof RestrictedDatePicker === 'function') {
            RestrictedDatePicker(inputElement);
        } else {
            // Fallback: use the native date input if supported
            inputElement.type = 'date';
            inputElement.readOnly = false;
        }
    },

    // Initialize Google-style pagination for any component
    initNumberedPagination: function(component, loadDataFunction, totalPages, targetContainer) {
        var self = this;
        var container = targetContainer || document.querySelector('.pagination-footer');
        if (!container) return;
        
        // Create numbered pagination
        this.renderPageNumbers(container, component.currentPage, totalPages, function(pageNum) {
            component.currentPage = pageNum;
            sessionStorage.setItem(component.storageKey + 'CurrentPage', pageNum);
            loadDataFunction();
        });
    },
    
    // Render page numbers for Google-style pagination
    renderPageNumbers: function(container, currentPage, totalPages, onPageClick) {
        // Clear existing pagination content
        container.innerHTML = '';
        
        // Create a wrapper for the pagination
        var paginationWrapper = document.createElement('div');
        paginationWrapper.className = 'pagination-wrapper';
        
        // Add previous button
        var prevButton = document.createElement('button');
        prevButton.className = 'btn btn-secondary pagination-btn';
        prevButton.textContent = 'Previous';
        prevButton.disabled = currentPage <= 1;
        prevButton.onclick = function() {
            if (currentPage > 1) {
                onPageClick(currentPage - 1);
            }
        };
        paginationWrapper.appendChild(prevButton);
        
        // Calculate which page numbers to show
        var startPage = Math.max(1, currentPage - 4);
        var endPage = Math.min(totalPages, startPage + 9);
        
        // Adjust start page if we're near the end
        if (endPage - startPage < 9) {
            startPage = Math.max(1, endPage - 9);
        }
        
        // Add first page button if not visible in current range
        if (startPage > 1) {
            var firstPageBtn = document.createElement('button');
            firstPageBtn.className = 'btn pagination-number';
            firstPageBtn.textContent = '1';
            firstPageBtn.dataset.page = 1;
            firstPageBtn.onclick = function() {
                onPageClick(1);
            };
            paginationWrapper.appendChild(firstPageBtn);
            
            // Add ellipsis if there's a gap
            if (startPage > 2) {
                var ellipsis = document.createElement('span');
                ellipsis.className = 'pagination-ellipsis';
                ellipsis.textContent = '...';
                paginationWrapper.appendChild(ellipsis);
            }
        }
        
        // Add page numbers
        for (var i = startPage; i <= endPage; i++) {
            var pageButton = document.createElement('button');
            pageButton.className = 'btn pagination-number';
            if (i === currentPage) {
                pageButton.className += ' pagination-active';
            }
            pageButton.textContent = i;
            pageButton.dataset.page = i;
            pageButton.onclick = function() {
                onPageClick(parseInt(this.dataset.page));
            };
            paginationWrapper.appendChild(pageButton);
        }
        
        // Add last page button if not visible in current range
        if (endPage < totalPages) {
            // Add ellipsis if there's a gap
            if (endPage < totalPages - 1) {
                var ellipsis = document.createElement('span');
                ellipsis.className = 'pagination-ellipsis';
                ellipsis.textContent = '...';
                paginationWrapper.appendChild(ellipsis);
            }
            
            var lastPageBtn = document.createElement('button');
            lastPageBtn.className = 'btn pagination-number';
            lastPageBtn.textContent = totalPages;
            lastPageBtn.dataset.page = totalPages;
            lastPageBtn.onclick = function() {
                onPageClick(totalPages);
            };
            paginationWrapper.appendChild(lastPageBtn);
        }
        
        // Add next button
        var nextButton = document.createElement('button');
        nextButton.className = 'btn btn-secondary pagination-btn';
        nextButton.textContent = 'Next';
        nextButton.disabled = currentPage >= totalPages;
        nextButton.onclick = function() {
            if (currentPage < totalPages) {
                onPageClick(currentPage + 1);
            }
        };
        paginationWrapper.appendChild(nextButton);
        
        // Add to container
        container.appendChild(paginationWrapper);
        
        // Add CSS for pagination if it doesn't exist
        if (!document.getElementById('pagination-styles')) {
            var style = document.createElement('style');
            style.id = 'pagination-styles';
            style.innerHTML = `
                .pagination-wrapper {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    margin: 20px 0;
                    flex-wrap: wrap;
                    font-family: Arial, sans-serif;
                }
                .pagination-number {
                    margin: 0 3px;
                    min-width: 40px;
                    height: 40px;
                    background-color: transparent;
                    color: var(--office-blue);
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    border: none;
                    border-radius: 50%;
                    font-size: 14px;
                }
                .pagination-number:hover {
                    background-color: #f1f3f4;
                    text-decoration: underline;
                }
                .pagination-active {
                    background-color: var(--office-green);
                    color: #fff;
                    font-weight: bold;
                }
                .pagination-active:hover {
                    background-color: var(--office-blue);
                    color: #fff;
                    text-decoration: none;
                }
                .pagination-btn {
                    margin: 0 8px;
                    color: var(--office-green);
                    background-color: transparent;
                    border: none;
                    font-weight: bold;
                    cursor: pointer;
                    padding: 8px 12px;
                    border-radius: 4px;
                }
                .pagination-btn:hover {
                    background-color: #f1f3f4;
                    text-decoration: underline;
                }
                .pagination-ellipsis {
                    margin: 0 3px;
                    min-width: 20px;
                    text-align: center;
                    color: #5f6368;
                }
                @media (max-width: 576px) {
                    .pagination-wrapper {
                        justify-content: center;
                    }
                    .pagination-number {
                        margin: 0 2px;
                        min-width: 32px;
                        height: 32px;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    },
    
    // Create a per-page selector dropdown
    createPerPageSelector: function(component, loadDataFunction) {
        // Get current per-page value from session storage or default to 10
        var storageKey = component.storageKey || 'default';
        var currentPerPage = parseInt(sessionStorage.getItem(storageKey + 'PerPage')) || 10;
        
        // Create the select element and its container
        var container = document.createElement('div');
        container.className = 'per-page-selector';
        
        var label = document.createElement('label');
        label.textContent = 'Show ';
        
        var select = document.createElement('select');
        select.id = 'perPageSelect';
        select.className = 'form-control form-control-sm';
        
        // Add options: 10, 20, 50
        [10, 20, 50].forEach(function(value) {
            var option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            option.selected = value === currentPerPage;
            select.appendChild(option);
        });
        
        // Add label for entries
        var entriesLabel = document.createElement('span');
        entriesLabel.textContent = ' entries';
        
        // Assemble the container
        label.appendChild(select);
        label.appendChild(entriesLabel);
        container.appendChild(label);
        
        // Add event listener
        select.addEventListener('change', function() {
            var newPerPage = parseInt(this.value);
            component.perPage = newPerPage;
            component.currentPage = 1; // Reset to first page when changing per-page
            
            // Store in session storage
            sessionStorage.setItem(storageKey + 'PerPage', newPerPage);
            sessionStorage.setItem(storageKey + 'CurrentPage', '1');
            
            // Reload data
            if (typeof loadDataFunction === 'function') {
                loadDataFunction();
            }
        });
        
        // Set the per-page on the component
        component.perPage = currentPerPage;
        
        // Add styles if they don't exist
        if (!document.getElementById('per-page-selector-styles')) {
            var style = document.createElement('style');
            style.id = 'per-page-selector-styles';
            style.innerHTML = `
                .per-page-selector {
                    text-align: right;
                }
                .per-page-selector label {
                    display: inline-flex;
                    align-items: center;
                    margin-bottom: 0;
                }
                .per-page-selector select {
                    width: auto;
                    margin: 0 5px;
                    display: inline-block;
                    background-color: #415540;
                    color: white;
                    font-size: 14px;
                }
                .pagination-container {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                }
                .pagination-wrapper {
                    margin: 10px 0;
                }
                @media (max-width: 768px) {
                    .per-page-selector {
                        text-align: left;
                        margin-bottom: 10px;
                    }
                    .pagination-container {
                        flex-direction: column;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        return container;
    },

    // Update pagination with total pages information and add per-page selector
    updateNumberedPagination: function(component, totalItems, hasMore) {
        var totalPages = Math.ceil(totalItems / component.perPage);
        if (totalPages === 0) totalPages = 1;
        
        var self = this;
        
        // Determine the proper data loading function
        var loadDataFunction = function(query) {
            if (typeof component.loadData === 'function') {
                component.loadData(query);
            } else if (typeof component.loadActivityData === 'function') {
                component.loadActivityData(query);
            } else if (typeof component.loadInflowData === 'function') {
                component.loadInflowData(query);
            } else if (typeof component.loadOutflowData === 'function') {
                component.loadOutflowData(query);
            } else if (typeof component.loadInvestmentData === 'function') {
                component.loadInvestmentData(query);
            } else if (typeof component.loadLiabilityData === 'function') {
                component.loadLiabilityData(query);
            } else if (typeof component.loadAssetsData === 'function') {
                component.loadAssetsData(query);
            } else if (typeof component.loadUsers === 'function') {
                component.loadUsers();
            } else {
                console.error('No appropriate load function found for component', component);
            }
        };
        
        // Get pagination footer
        var paginationFooter = document.querySelector('.pagination-footer');
        if (!paginationFooter) return;
        
        // Clear existing content
        paginationFooter.innerHTML = '';
        
        // Create container for pagination and per-page selector
        var container = document.createElement('div');
        container.className = 'pagination-container';
        
        // Add per-page selector
        var perPageSelector = this.createPerPageSelector(component, function() {
            var searchInput = document.getElementById('searchInput');
            var searchValue = searchInput ? searchInput.value : '';
            loadDataFunction(searchValue);
        });
        container.appendChild(perPageSelector);
        
        // Create wrapper for pagination numbers
        var paginationWrapper = document.createElement('div');
        paginationWrapper.className = 'pagination-wrapper-container';
        container.appendChild(paginationWrapper);
        
        // Add container to footer
        paginationFooter.appendChild(container);
        
        // Initialize pagination in the wrapper
        this.initNumberedPagination(component, function() {
            var searchInput = document.getElementById('searchInput');
            var searchValue = searchInput ? searchInput.value : '';
            loadDataFunction(searchValue);
        }, totalPages, paginationWrapper);
    },

    // Limit textarea to a specific number of words
    limitTextareaWords: function(textareaElement, maxWords, options) {
        if (!textareaElement) return;
        
        // Default options
        options = options || {};
        var warningThreshold = options.warningThreshold || 0.7; // 70% of max by default
        var countDisplay = options.countDisplay || null; // Element to show word count
        var errorClass = options.errorClass || 'word-limit-error';
        var warningClass = options.warningClass || 'word-limit-warning';
        
        // Create a count display if it doesn't exist and was not provided
        if (!countDisplay) {
            countDisplay = document.createElement('div');
            countDisplay.className = 'word-count-display';
            textareaElement.parentNode.insertBefore(countDisplay, textareaElement.nextSibling);
        }
        
        // Add styles for the count display and warnings if they don't exist
        if (!document.getElementById('word-limit-styles')) {
            var style = document.createElement('style');
            style.id = 'word-limit-styles';
            style.textContent = `
                .word-count-display {
                    text-align: right;
                    margin-top: 5px;
                    font-size: 12px;
                    color: #666;
                }
                .word-limit-warning {
                    color: #f39c12;
                }
                .word-limit-error {
                    color: #e74c3c;
                }
                textarea.word-limit-error {
                    border-color: #e74c3c;
                }
                textarea.word-limit-warning {
                    border-color: #f39c12;
                }
            `;
            document.head.appendChild(style);
        }
        
        // Count words function
        function countWords(text) {
            // Trim whitespace and split by multiple spaces
            return text.trim().split(/\s+/).filter(function(word) { 
                return word.length > 0; 
            }).length;
        }
        
        // Update display and status
        function updateWordCount() {
            var text = textareaElement.value;
            var wordCount = countWords(text);
            var remaining = maxWords - wordCount;
            
            // Update display
            countDisplay.textContent = wordCount + '/' + maxWords + ' words';
            
            // Add warning/error classes
            textareaElement.classList.remove(errorClass, warningClass);
            countDisplay.classList.remove(errorClass, warningClass);
            
            if (wordCount >= maxWords) {
                textareaElement.classList.add(errorClass);
                countDisplay.classList.add(errorClass);
                
                // Trim excess words
                if (wordCount > maxWords) {
                    var words = text.trim().split(/\s+/);
                    textareaElement.value = words.slice(0, maxWords).join(' ');
                }
            } else if (wordCount >= (maxWords * warningThreshold)) {
                textareaElement.classList.add(warningClass);
                countDisplay.classList.add(warningClass);
            }
        }
        
        // Add event listeners
        if (typeof textareaElement.addEventListener !== 'undefined') {
            textareaElement.addEventListener('input', updateWordCount);
            textareaElement.addEventListener('paste', function() {
                // Use setTimeout to execute after paste is complete
                setTimeout(updateWordCount, 10);
            });
        } else if (typeof textareaElement.attachEvent !== 'undefined') {
            // For older IE browsers
            textareaElement.attachEvent('oninput', updateWordCount);
            textareaElement.attachEvent('onpaste', function() {
                setTimeout(updateWordCount, 10);
            });
        }
        
        // Initialize
        updateWordCount();
        
        // Return the update function for manual updates
        return updateWordCount;
    },

    // Table sorting functionality
    initTableSorting: function(tableId, component, renderFunction) {
        var table = document.getElementById(tableId);
        if (!table) return;
        
        // Add CSS styles for sort indicators if not already present
        if (!document.getElementById('table-sort-styles')) {
            var style = document.createElement('style');
            style.id = 'table-sort-styles';
            style.innerHTML = `
                .sort-indicator {
                    display: inline-block;
                    width: 12px;
                    margin-left: 5px;
                    font-size: 0.8em;
                    color: rgba(255, 255, 255, 0.8);
                }
                th {
                    position: relative;
                }
                th:not(.no-sort):hover:after {
                    content: "▲ ▼";
                    position: absolute;
                    right: 8px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: rgba(255, 255, 255, 0.5);
                    font-size: 0.7em;
                    pointer-events: none;
                }
                th.asc-sort:hover:after {
                    content: "▲ ▼";
                    opacity: 0.5;
                }
                th.desc-sort:hover:after {
                    content: "▲ ▼";
                    opacity: 0.5;
                }
                th:hover .sort-indicator:empty:before {
                    opacity: 0;
                }
                .sort-tooltip {
                    position: absolute;
                    display: none;
                    background: rgba(0, 0, 0, 0.8);
                    color: white;
                    padding: 5px 10px;
                    border-radius: 3px;
                    font-size: 11px;
                    bottom: -30px;
                    left: 50%;
                    transform: translateX(-50%);
                    white-space: nowrap;
                    z-index: 10;
                    pointer-events: none;
                }
                th:not(.no-sort):hover .sort-tooltip {
                    display: block;
                }
                .sort-tooltip:after {
                    content: "";
                    position: absolute;
                    top: -5px;
                    left: 50%;
                    transform: translateX(-50%);
                    border-width: 0 5px 5px;
                    border-style: solid;
                    border-color: transparent transparent rgba(0, 0, 0, 0.8);
                }
            `;
            document.head.appendChild(style);
        }
        
        // Store sorting state in the component
        component.sortColumn = component.sortColumn || null;
        component.sortDirection = component.sortDirection || 'asc';
        
        // Get all sortable headers (those without the 'no-sort' class)
        var headers = table.querySelectorAll('th:not(.no-sort)');
        
        // Add click event listeners to headers
        for (var i = 0; i < headers.length; i++) {
            headers[i].style.cursor = 'pointer';
            headers[i].style.userSelect = 'none';
            
            // Add sort indicator
            var indicator = document.createElement('span');
            indicator.className = 'sort-indicator';
            indicator.innerHTML = '';
            headers[i].appendChild(indicator);
            
            // Add tooltip
            var tooltip = document.createElement('div');
            tooltip.className = 'sort-tooltip';
            tooltip.innerHTML = 'Click to sort';
            headers[i].appendChild(tooltip);
            
            // Add click handler
            this.addHeaderClickHandler(headers[i], i, component, renderFunction);
        }
        
        // Update sort indicators based on initial state
        this.updateSortIndicators(table, component);
    },
    
    addHeaderClickHandler: function(header, columnIndex, component, renderFunction) {
        var self = this;
        
        function clickHandler() {
            // If clicking the same column, toggle direction
            if (component.sortColumn === columnIndex) {
                component.sortDirection = component.sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                // New column, default to ascending
                component.sortColumn = columnIndex;
                component.sortDirection = 'asc';
            }
            
            // Update visual indicators
            self.updateSortIndicators(header.closest('table'), component);
            
            // Re-render the table with sorted data
            if (typeof renderFunction === 'function') {
                renderFunction();
            }
        }
        
        // Add event listener with proper cross-browser support
        if (header.addEventListener) {
            header.addEventListener('click', clickHandler);
        } else if (header.attachEvent) {
            header.attachEvent('onclick', clickHandler);
        } else {
            header.onclick = clickHandler;
        }
    },
    
    updateSortIndicators: function(table, component) {
        if (!table) return;
        
        // Clear all indicators and classes
        var indicators = table.querySelectorAll('.sort-indicator');
        var headers = table.querySelectorAll('th:not(.no-sort)');
        
        // Remove sort classes from all headers
        for (var i = 0; i < headers.length; i++) {
            headers[i].classList.remove('asc-sort', 'desc-sort');
            
            // Reset tooltip text for inactive headers
            var tooltip = headers[i].querySelector('.sort-tooltip');
            if (tooltip) {
                tooltip.innerHTML = 'Click to sort';
            }
        }
        
        // Clear indicator contents
        for (var i = 0; i < indicators.length; i++) {
            indicators[i].innerHTML = '';
        }
        
        // Set indicator for currently sorted column
        if (component.sortColumn !== null) {
            var activeHeader = table.querySelectorAll('th:not(.no-sort)')[component.sortColumn];
            var activeIndicator = activeHeader ? activeHeader.querySelector('.sort-indicator') : null;
            
            if (activeHeader) {
                // Add appropriate class based on sort direction
                activeHeader.classList.add(component.sortDirection === 'asc' ? 'asc-sort' : 'desc-sort');
                
                // Update tooltip for active header
                var tooltip = activeHeader.querySelector('.sort-tooltip');
                if (tooltip) {
                    tooltip.innerHTML = 'Sort ' + (component.sortDirection === 'asc' ? 'descending' : 'ascending');
                }
                
                if (activeIndicator) {
                    activeIndicator.innerHTML = component.sortDirection === 'asc' ? ' ▲' : ' ▼';
                }
            }
        }
    },
    
    sortData: function(data, columnName, direction) {
        if (!data || !data.length) return data;
        
        // Create a copy of the data to avoid modifying the original
        var sortedData = data.slice();
        
        sortedData.sort(function(a, b) {
            var valueA = a[columnName] !== undefined ? a[columnName] : '';
            var valueB = b[columnName] !== undefined ? b[columnName] : '';
            
            // Convert to lowercase strings for string comparison
            if (typeof valueA === 'string') valueA = valueA.toLowerCase();
            if (typeof valueB === 'string') valueB = valueB.toLowerCase();
            
            // Check if values are dates (special handling)
            if (columnName.indexOf('date') !== -1 || 
                (valueA && typeof valueA === 'string' && valueA.match(/^\d{4}-\d{2}-\d{2}/)) || 
                (valueB && typeof valueB === 'string' && valueB.match(/^\d{4}-\d{2}-\d{2}/))) {
                valueA = new Date(valueA).getTime() || 0;
                valueB = new Date(valueB).getTime() || 0;
            }
            
            // Check if values are numbers (special handling)
            if (typeof valueA === 'string' && !isNaN(parseFloat(valueA))) valueA = parseFloat(valueA);
            if (typeof valueB === 'string' && !isNaN(parseFloat(valueB))) valueB = parseFloat(valueB);
            
            // Compare values
            if (valueA < valueB) return direction === 'asc' ? -1 : 1;
            if (valueA > valueB) return direction === 'asc' ? 1 : -1;
            return 0;
        });
        
        return sortedData;
    },

    // Form validation utility to highlight fields and show error messages
    showFieldError: function(field, message) {
        if (!field) return;
        
        // Add error class to the field
        field.classList.add('field-error');
        
        // Find or create error message container
        var errorId = field.id + '-error';
        var errorElement = document.getElementById(errorId);
        
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.id = errorId;
            errorElement.className = 'field-error-message';
            
            // Insert after the field
            field.parentNode.insertBefore(errorElement, field.nextSibling);
        }
        
        errorElement.textContent = message;
        
        // Add CSS if not already added
        if (!document.getElementById('field-error-styles')) {
            var style = document.createElement('style');
            style.id = 'field-error-styles';
            style.textContent = `
                .field-error {
                    border-color: #e74c3c !important;
                    background-color: rgba(231, 76, 60, 0.05);
                }
                .field-error-message {
                    color: #e74c3c;
                    font-size: 12px;
                    margin-top: 5px;
                    font-weight: 500;
                }
                .field-error::placeholder {
                    color: rgba(231, 76, 60, 0.7);
                }
            `;
            document.head.appendChild(style);
        }
        
        // Focus on the field
        field.focus();
        
        // Remove error on input
        var clearError = function() {
            field.classList.remove('field-error');
            if (errorElement && errorElement.parentNode) {
                errorElement.parentNode.removeChild(errorElement);
            }
            
            // Remove event listeners
            if (field.removeEventListener) {
                field.removeEventListener('input', clearError);
                field.removeEventListener('change', clearError);
            } else if (field.detachEvent) {
                field.detachEvent('oninput', clearError);
                field.detachEvent('onchange', clearError);
            }
        };
        
        // Add event listeners with browser compatibility
        if (field.addEventListener) {
            field.addEventListener('input', clearError);
            field.addEventListener('change', clearError);
        } else if (field.attachEvent) {
            field.attachEvent('oninput', clearError);
            field.attachEvent('onchange', clearError);
        }
        
        return false; // For easy chaining in validation functions
    },
    
    clearFieldErrors: function(formElement) {
        if (!formElement) return;
        
        // Remove error classes from all fields
        var errorFields = formElement.querySelectorAll('.field-error');
        for (var i = 0; i < errorFields.length; i++) {
            errorFields[i].classList.remove('field-error');
        }
        
        // Remove error messages
        var errorMessages = document.querySelectorAll('.field-error-message');
        for (var i = 0; i < errorMessages.length; i++) {
            if (errorMessages[i].parentNode) {
                errorMessages[i].parentNode.removeChild(errorMessages[i]);
            }
        }
    }
};

// Make Utils globally available
window.Utils = Utils;