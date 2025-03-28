var HeadsManagement = {
    init: function(container) {
        this.container = container;
        this.expandedHeads = {};  // Track which heads are expanded
        
        // Initialize components state
        this.state = {
            heads: [],
            inflows: [],
            outflows: []
        };
        
        this.render();
    },
    
    render: function() {
        this.container.innerHTML = `
            <div class="settings-panel">
                <h2 class="section-title">Heads Management</h2>
                
                <div class="heads-toolbar">
                    <button id="addHeadBtn" class="btn btn-primary">Add New Head</button>
                    <div class="search-box">
                        <input type="text" id="searchHeads" placeholder="Search heads..." class="form-control">
                    </div>
                </div>
                
                <div class="heads-container">
                    <div class="heads-grid-container">
                        <!-- Two column layout for inflows and outflows -->
                        <div class="heads-column inflow-column">
                            <h3 class="column-title inflow-title">Inflows</h3>
                            <div id="inflowsList" class="heads-list">
                                <div class="loading-indicator">Loading inflows...</div>
                            </div>
                        </div>
                        
                        <div class="heads-column outflow-column">
                            <h3 class="column-title outflow-title">Outflows</h3>
                            <div id="outflowsList" class="heads-list">
                                <div class="loading-indicator">Loading outflows...</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load all heads
        this.loadAllHeads();
    },
    
    setupEventListeners: function() {
        // Add head button event
        var addBtn = this.container.querySelector('#addHeadBtn');
        if (addBtn) {
            addBtn.addEventListener('click', this.handleAddHead.bind(this));
        }
        
        // Search functionality
        var searchInput = this.container.querySelector('#searchHeads');
        if (searchInput) {
            searchInput.addEventListener('input', this.handleSearchHeads.bind(this));
        }
    },
    
    loadAllHeads: function() {
        var inflowsContainer = this.container.querySelector('#inflowsList');
        var outflowsContainer = this.container.querySelector('#outflowsList');
        
        if (!inflowsContainer || !outflowsContainer) return;
        
        inflowsContainer.innerHTML = '<div class="loading-indicator">Loading inflows...</div>';
        outflowsContainer.innerHTML = '<div class="loading-indicator">Loading outflows...</div>';
        
        // Call API to get all heads
        ApiClient.getAllHeads()
            .then(function(response) {
                console.log("all heads Response:", response.data);
                if (response) {
                    // Store the original heads data
                    this.state.heads = response;
                    
                    // Separate inflows and outflows
                    this.state.inflows = response.filter(function(head) {
                        return head.type === 1;
                    });
                    
                    this.state.outflows = response.filter(function(head) {
                        return head.type === 2;
                    });
                    
                    console.log("Heads data:", this.state);
                    
                    // Render inflows and outflows separately
                    this.renderHeadsList(this.state.inflows, inflowsContainer, 'inflow');
                    this.renderHeadsList(this.state.outflows, outflowsContainer, 'outflow');
                } else {
                    throw new Error('Invalid API response');
                }
            }.bind(this))
            .catch(function(error) {
                console.error('Error loading heads:', error);
                inflowsContainer.innerHTML = '<div class="error-state">Failed to load inflows. Please try again.</div>';
                outflowsContainer.innerHTML = '<div class="error-state">Failed to load outflows. Please try again.</div>';
            }.bind(this));
    },
    
    renderHeadsList: function(heads, container, type) {
        if (!heads || heads.length === 0) {
            container.innerHTML = '<div class="empty-state">No ' + type + ' heads found.</div>';
            return;
        }
        
        var html = '<div class="heads-items">';
        
        heads.forEach(function(head) {
            // Determine if this head is expanded
            var isExpanded = this.expandedHeads[head.id] || false;
            var expandIconClass = isExpanded ? 'fa-chevron-down' : 'fa-chevron-right';
            var subHeadsClass = isExpanded ? 'expanded' : 'collapsed';
            var hasSubHeads = head.sub_heads && head.sub_heads.length > 0;
            
            var headClass = type === 'inflow' ? 'inflow-head' : 'outflow-head';
            var iconType = type === 'inflow' ? 'fa-arrow-circle-down' : 'fa-arrow-circle-up';
            var badgeClass = type === 'inflow' ? 'badge-inflow' : 'badge-outflow';
            var badgeText = type === 'inflow' ? 'INFLOW' : 'OUTFLOW';
            
            html += `
                <div class="head-card ${headClass}">
                    <div class="head-content">
                        <div class="head-details">
                            <div class="head-icon">
                                <i class="fas ${iconType}"></i>
                            </div>
                            <div class="head-info">
                                <div class="head-name">${head.heads}</div>
                                <div class="head-badge ${badgeClass}">${badgeText}</div>
                            </div>
                        </div>
                        <div class="head-actions">
                            ${hasSubHeads ? `
                                <button class="toggle-subheads-btn" data-id="${head.id}">
                                    <i class="fas ${expandIconClass}"></i>
                                </button>
                            ` : ''}
                            <div class="action-buttons">
                                <button class="edit-head-btn" data-id="${head.id}">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="add-subhead-btn" data-id="${head.id}">
                                    <i class="fas fa-plus"></i>
                                </button>
                                <button class="delete-head-btn" data-id="${head.id}">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    ${hasSubHeads ? `
                        <div class="subheads-container ${subHeadsClass}" id="subheads-${head.id}">
                            ${head.sub_heads.map(function(subhead) {
                                return `
                                    <div class="subhead-card">
                                        <div class="subhead-content">
                                            <div class="subhead-name">${subhead.subheads}</div>
                                            <div class="subhead-actions">
                                                <button class="edit-subhead-btn" data-id="${subhead.id}" data-head-id="${head.id}">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                <button class="delete-subhead-btn" data-id="${subhead.id}" data-head-id="${head.id}">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </div>
                                        <div class="subhead-created">
                                            Created at: ${this.formatDate(subhead.created_at)}
                                        </div>
                                    </div>
                                `;
                            }, this).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        }, this);
        
        html += '</div>';
        container.innerHTML = html;
        
        // Attach event listeners to the newly created elements
        this.attachHeadEventListeners(container);
    },
    
    attachHeadEventListeners: function(container) {
        // Toggle subheads visibility
        var toggleButtons = container.querySelectorAll('.toggle-subheads-btn');
        toggleButtons.forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                var headId = btn.dataset.id;
                this.toggleSubheads(headId, btn);
            }.bind(this));
        }.bind(this));
        
        // Edit head buttons
        var editButtons = container.querySelectorAll('.edit-head-btn');
        editButtons.forEach(function(btn) {
            btn.addEventListener('click', function() {
                this.handleEditHead(btn.dataset.id);
            }.bind(this));
        }.bind(this));
        
        // Add subhead buttons
        var addSubheadButtons = container.querySelectorAll('.add-subhead-btn');
        addSubheadButtons.forEach(function(btn) {
            btn.addEventListener('click', function() {
                this.handleAddSubhead(btn.dataset.id);
            }.bind(this));
        }.bind(this));
        
        // Delete head buttons
        var deleteButtons = container.querySelectorAll('.delete-head-btn');
        deleteButtons.forEach(function(btn) {
            btn.addEventListener('click', function() {
                this.handleDeleteHead(btn.dataset.id);
            }.bind(this));
        }.bind(this));
        
        // Edit subhead buttons
        var editSubheadButtons = container.querySelectorAll('.edit-subhead-btn');
        editSubheadButtons.forEach(function(btn) {
            btn.addEventListener('click', function() {
                this.handleEditSubhead(btn.dataset.id, btn.dataset.headId);
            }.bind(this));
        }.bind(this));
        
        // Delete subhead buttons
        var deleteSubheadButtons = container.querySelectorAll('.delete-subhead-btn');
        deleteSubheadButtons.forEach(function(btn) {
            btn.addEventListener('click', function() {
                this.handleDeleteSubhead(btn.dataset.id, btn.dataset.headId);
            }.bind(this));
        }.bind(this));
    },
    
    toggleSubheads: function(headId, button) {
        var subheadsContainer = document.getElementById('subheads-' + headId);
        var isExpanded = this.expandedHeads[headId] || false;
        
        if (isExpanded) {
            subheadsContainer.classList.remove('expanded');
            subheadsContainer.classList.add('collapsed');
            button.querySelector('i').classList.remove('fa-chevron-down');
            button.querySelector('i').classList.add('fa-chevron-right');
        } else {
            subheadsContainer.classList.remove('collapsed');
            subheadsContainer.classList.add('expanded');
            button.querySelector('i').classList.remove('fa-chevron-right');
            button.querySelector('i').classList.add('fa-chevron-down');
        }
        
        // Toggle the expanded state
        this.expandedHeads[headId] = !isExpanded;
    },
    
    handleSearchHeads: function() {
        var searchTerm = this.container.querySelector('#searchHeads').value.toLowerCase();
        
        // Filter inflows
        var filteredInflows = this.state.inflows.filter(function(head) {
            var headName = head.heads.toLowerCase();
            var subheadMatch = head.sub_heads.some(function(subhead) {
                return subhead.subheads.toLowerCase().includes(searchTerm);
            });
            
            return headName.includes(searchTerm) || subheadMatch;
        });
        
        // Filter outflows
        var filteredOutflows = this.state.outflows.filter(function(head) {
            var headName = head.heads.toLowerCase();
            var subheadMatch = head.sub_heads.some(function(subhead) {
                return subhead.subheads.toLowerCase().includes(searchTerm);
            });
            
            return headName.includes(searchTerm) || subheadMatch;
        });
        
        // Re-render the filtered lists
        var inflowsContainer = this.container.querySelector('#inflowsList');
        var outflowsContainer = this.container.querySelector('#outflowsList');
        
        this.renderHeadsList(filteredInflows, inflowsContainer, 'inflow');
        this.renderHeadsList(filteredOutflows, outflowsContainer, 'outflow');
    },
    
    handleAddHead: function() {
        // Use the new AddHead component
        if (typeof AddHead !== 'undefined') {
            AddHead.open(function() {
                // Reload heads after successful creation
                this.loadAllHeads();
            }.bind(this));
        } else {
            console.error('AddHead component not found');
            alert('Add Head component not loaded');
        }
    },
    
    handleEditHead: function(headId) {
        // Find the head to edit
        var headToEdit = this.findHeadById(headId);
        
        if (!headToEdit) {
            console.error('Head not found with ID:', headId);
            return;
        }
        
        // Use the new EditHeads component
        if (typeof EditHeads !== 'undefined') {
            EditHeads.open(headToEdit, function() {
                // Reload heads after successful update
                this.loadAllHeads();
            }.bind(this));
        } else {
            console.error('EditHeads component not found');
            alert('Edit Head component not loaded');
        }
    },
    
    handleAddSubhead: function(headId) {
        // Find the head to add subhead to
        var headForSubhead = this.findHeadById(headId);
        
        if (!headForSubhead) {
            console.error('Head not found with ID:', headId);
            return;
        }
        
        // Use the new AddSubHead component
        if (typeof AddSubHead !== 'undefined') {
            AddSubHead.open(headForSubhead, function() {
                // Reload heads after successful creation
                this.loadAllHeads();
            }.bind(this));
        } else {
            // Fallback to simple prompt
            var subheadName = prompt('Enter new subhead name:');
            if (!subheadName) return;
            
            // Call API to add the subhead
            ApiClient.addSubhead(headId, { 
                subheads: subheadName,
                head_id: parseInt(headId),
                type: headForSubhead.type
            })
                .then(function(response) {
                    Utils.showMessage('success', 'Subhead added successfully');
                    // Reload the heads list
                    this.loadAllHeads();
                }.bind(this))
                .catch(function(error) {
                    Utils.showMessage('error', 'Failed to add subhead: ' + error.message);
                });
        }
    },
    
    handleEditSubhead: function(subheadId, headId) {
        alert('Edit subhead functionality to be implemented');
        // This would be similar to handleEditHead but for subheads
    },
    
    handleDeleteHead: function(headId) {
        if (confirm('Are you sure you want to delete this head? This action cannot be undone.')) {
            // Call API to delete the head
            ApiClient.deleteHead(headId)
                .then(function(response) {
                    Utils.showMessage('success', 'Head deleted successfully');
                    // Reload the heads list
                    this.loadAllHeads();
                }.bind(this))
                .catch(function(error) {
                    Utils.showMessage('error', 'Failed to delete head: ' + error.message);
                });
        }
    },
    
    handleDeleteSubhead: function(subheadId, headId) {
        if (confirm('Are you sure you want to delete this subhead? This action cannot be undone.')) {
            // Call API to delete the subhead
            ApiClient.deleteSubhead(subheadId)
                .then(function(response) {
                    Utils.showMessage('success', 'Subhead deleted successfully');
                    // Reload the heads list
                    this.loadAllHeads();
                }.bind(this))
                .catch(function(error) {
                    Utils.showMessage('error', 'Failed to delete subhead: ' + error.message);
                });
        }
    },
    
    findHeadById: function(id) {
        id = parseInt(id);
        return this.state.heads.find(function(head) {
            return head.id === id;
        });
    },
    
    formatDate: function(dateString) {
        if (!dateString) return 'N/A';
        
        try {
            var date = new Date(dateString);
            return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        } catch (e) {
            return dateString;
        }
    }
};

// Make HeadsManagement globally available
window.HeadsManagement = HeadsManagement;
