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
        if (action === 'delete') {
            successDiv.style.backgroundColor = '#d63031';
        }
        
        successDiv.innerText = message;
    
        document.body.appendChild(successDiv);
    
        // Remove the message after 3 seconds
        setTimeout(function () {
            successDiv.remove();
        }, 3000);
    
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
};

// Make Utils globally available
window.Utils = Utils;