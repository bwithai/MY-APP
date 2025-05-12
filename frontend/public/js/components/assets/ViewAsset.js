var ViewAsset = {
    asset: null,
    isOpen: false,
    onClose: null,
    type: null,
    version: new Date().getTime(), // Add version timestamp
    
    init: function(asset, onClose) {
        this.asset = asset;
        console.log("Viewing asset:", this.asset); // For debugging
        console.log("ViewAsset version:", this.version); // Log version to verify loading
        this.onClose = onClose || function() {};
        this.render();
        this.setupEventListeners();
        return this;
    },
    
    cleanup: function() {
        Utils.cleanup('viewAssetModal');
        
        // Remove any stray style elements
        var oldStyles = document.getElementById('asset-detail-styles');
        if (oldStyles) {
            oldStyles.parentNode.removeChild(oldStyles);
        }
        
        // Remove any existing zoom overlays
        var zoomOverlay = document.getElementById('zoom-overlay');
        if (zoomOverlay) {
            zoomOverlay.parentNode.removeChild(zoomOverlay);
        }
    },
    
    render: function() {
        // Clean up any existing modal
        this.cleanup();
        
        var modal = document.createElement('div');
        modal.id = 'viewAssetModal';
        modal.className = 'modal';
        
        // Format values for display
        var cost = this.formatNumber(this.asset.cost || 0);
        var salvageValue = this.formatNumber(this.asset.salvage_value || 0);
        var purchaseDate = this.formatDate(this.asset.purchase_date, true);
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 800px;">
                <div class="modal-header">
                    <h2>${this.asset.name} Details</h2>
                    <button type="button" class="close-btn" id="closeViewAssetModal">&times;</button>
                </div>
                <div class="modal-body">
                    <!-- Asset Overview -->
                    <div class="detail-section">
                        <h3 class="section-title">Overview</h3>
                        <table class="detail-table">
                            <tr>
                                <td class="table-cell">
                                    <div class="detail-item">
                                        <span class="detail-label">Asset ID:</span>
                                        <span class="detail-value">${this.asset.asset_id || this.asset.id || 'N/A'}</span>
                                    </div>
                                </td>
                                <td class="table-cell">
                                    <div class="detail-item">
                                        <span class="detail-label">Name:</span>
                                        <span class="detail-value">${this.asset.name || 'N/A'}</span>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td class="table-cell">
                                    <div class="detail-item">
                                        <span class="detail-label">Model:</span>
                                        <span class="detail-value">${this.asset.model || 'N/A'}</span>
                                    </div>
                                </td>
                                <td class="table-cell">
                                    <div class="detail-item">
                                        <span class="detail-label">Brand:</span>
                                        <span class="detail-value">${this.asset.brand || 'N/A'}</span>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td class="table-cell">
                                    <div class="detail-item">
                                        <span class="detail-label">Type:</span>
                                        <span class="detail-value">${this.asset.type || 'N/A'}</span>
                                    </div>
                                </td>
                                <td class="table-cell">
                                    <div class="detail-item">
                                        <span class="detail-label">User:</span>
                                        <span class="detail-value">${this.asset.user || 'N/A'}</span>
                                    </div>
                                </td>
                            </tr>
                        </table>
                    </div>
                    
                    <!-- Images -->
                    <div class="detail-section">
                        <h3 class="section-title">Images</h3>
                        <table class="detail-table">
                            <tr>
                                <td class="table-cell">
                                    <div class="image-container">
                                        <span class="detail-label">Asset Image:</span>
                                        <img src="${this.asset.asset_image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YxZjFmMSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmaWxsPSIjODg4ODg4Ij5Bc3NldCBJbWFnZTwvdGV4dD48L3N2Zz4='}" 
                                             alt="Asset" class="asset-image" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YxZjFmMSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmaWxsPSIjODg4ODg4Ij5Bc3NldCBJbWFnZTwvdGV4dD48L3N2Zz4=';">
                                    </div>
                                </td>
                                <td class="table-cell">
                                    <div class="image-container">
                                        <span class="detail-label">Receipt:</span>
                                        <img src="${this.asset.receipt_image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YxZjFmMSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmaWxsPSIjODg4ODg4Ij5SZWNlaXB0PC90ZXh0Pjwvc3ZnPg=='}" 
                                             alt="Receipt" class="asset-image" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YxZjFmMSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmaWxsPSIjODg4ODg4Ij5SZWNlaXB0PC90ZXh0Pjwvc3ZnPg==';">
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td class="table-cell" colspan="2">
                                    <div class="image-container" style="margin: 0 auto; max-width: 300px;">
                                        <span class="detail-label">QR Code:</span>
                                        <img src="${this.asset.QR_path || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YxZjFmMSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmaWxsPSIjODg4ODg4Ij5RUiBDb2RlPC90ZXh0Pjwvc3ZnPg=='}" 
                                             alt="QR Code" class="asset-image" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YxZjFmMSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmaWxsPSIjODg4ODg4Ij5RUiBDb2RlPC90ZXh0Pjwvc3ZnPg==';">
                                    </div>
                                </td>
                            </tr>
                        </table>
                    </div>
                    
                    <!-- Purchase Details -->
                    <div class="detail-section">
                        <h3 class="section-title">Purchase Details</h3>
                        <table class="detail-table">
                            <tr>
                                <td class="table-cell">
                                    <div class="detail-item">
                                        <span class="detail-label">Purchased From:</span>
                                        <span class="detail-value">${this.asset.purchased_from || 'N/A'}</span>
                                    </div>
                                </td>
                                <td class="table-cell">
                                    <div class="detail-item">
                                        <span class="detail-label">Cost:</span>
                                        <span class="detail-value">₨ ${cost}</span>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td class="table-cell">
                                    <div class="detail-item">
                                        <span class="detail-label">Useful Life:</span>
                                        <span class="detail-value">${this.asset.useful_life || 'N/A'} years</span>
                                    </div>
                                </td>
                                <td class="table-cell">
                                    <div class="detail-item">
                                        <span class="detail-label">Salvage Value:</span>
                                        <span class="detail-value">₨ ${salvageValue}</span>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td class="table-cell" colspan="2">
                                    <div class="detail-item">
                                        <span class="detail-label">Purchase Date:</span>
                                        <span class="detail-value">${purchaseDate}</span>
                                    </div>
                                </td>
                            </tr>
                        </table>
                    </div>
                    
                    <!-- Additional Details -->
                    <div class="detail-section">
                        <h3 class="section-title">Additional Details</h3>
                        <table class="detail-table">
                            <tr>
                                <td class="table-cell">
                                    <div class="detail-item">
                                        <span class="detail-label">Remarks:</span>
                                        <span class="detail-value">${this.asset.remarks || 'N/A'}</span>
                                    </div>
                                </td>
                                <td class="table-cell">
                                    <div class="detail-item">
                                        <span class="detail-label">Place Type:</span>
                                        <span class="detail-value">${this.asset.place_type || 'N/A'}</span>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td class="table-cell">
                                    <div class="detail-item">
                                        <span class="detail-label">Status:</span>
                                        <span class="detail-value">${this.asset.status || 'Active'}</span>
                                    </div>
                                </td>
                                <td class="table-cell">
                                    <div class="detail-item">
                                        <span class="detail-label">Head Details:</span>
                                        <span class="detail-value">${this.asset.head_details || 'N/A'}</span>
                                    </div>
                                </td>
                            </tr>
                        </table>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" id="closeAssetDetailBtn" class="btn btn-primary">Close</button>
                </div>
            </div>
        `;
        
        // Add custom styles for the detail view
        this.addCustomStyles();
        
        document.body.appendChild(modal);
        this.isOpen = true;
        
        // Show the modal
        setTimeout(function() {
            modal.style.display = 'flex';
        }, 10);
    },
    
    addCustomStyles: function() {
        // Check if styles are already added
        if (document.getElementById('asset-detail-styles')) {
            return;
        }
        
        var styleElement = document.createElement('style');
        styleElement.id = 'asset-detail-styles';
        styleElement.innerHTML = `
            .detail-section {
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 16px;
                margin-bottom: 24px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                background-color: #fff;
            }
            
            .modal-content {
                max-width: 800px;
                position: relative;
                z-index: 1;
                margin: 0 auto;
            }
            
            .modal-body {
                padding: 16px;
                overflow-y: auto;
                max-height: 70vh;
            }
            
            .section-title {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 16px;
                color: var(--pak-green);
                border-bottom: 1px solid #edf2f7;
                padding-bottom: 8px;
            }
            
            /* Table-based layout for maximum browser compatibility */
            .detail-table {
                width: 100%;
                border-collapse: separate;
                border-spacing: 8px;
                table-layout: fixed;
            }
            
            .table-cell {
                vertical-align: top;
                width: 50%;
                padding: 0;
            }
            
            .detail-item {
                margin-bottom: 16px;
            }
            
            .detail-label {
                font-weight: 600;
                color: #4a5568;
                margin-bottom: 4px;
                display: block;
            }
            
            .detail-value {
                color: #2d3748;
                display: block;
                word-break: break-word;
            }
            
            .image-container {
                margin-bottom: 16px;
            }
            
            .image-container img {
                width: 100%;
                height: auto;
                max-width: 100%;
                display: block;
                cursor: zoom-in;
                border-radius: 6px;
            }
            
            .asset-image {
                max-height: 200px;
                width: 100%;
                object-fit: cover;
                border-radius: 6px;
                border: 1px solid #e2e8f0;
                margin-top: 8px;
            }
            
            @media (max-width: 640px) {
                .table-cell {
                    display: block;
                    width: 100%;
                }
                
                .detail-table {
                    display: block;
                    width: 100%;
                }
                
                tr, tbody {
                    display: block;
                    width: 100%;
                }
            }
        `;
        
        document.head.appendChild(styleElement);
    },
    
    setupEventListeners: function() {
        var self = this;
        
        // Close button event
        var closeBtn = document.getElementById('closeViewAssetModal');
        if (closeBtn) {
            closeBtn.onclick = this.close.bind(this);
        }
        
        // Close button in footer
        var closeDetailBtn = document.getElementById('closeAssetDetailBtn');
        if (closeDetailBtn) {
            closeDetailBtn.onclick = this.close.bind(this);
        }
        
        // Close modal when clicking outside
        var modal = document.getElementById('viewAssetModal');
        if (modal) {
            window.onclick = function(event) {
                if (event.target === modal) {
                    self.close();
                }
            };
        }

        // Set up image zoom functionality
        this.setupImageZoom();
    },
    
    setupImageZoom: function() {
        // Remove any existing overlay if present
        var existingOverlay = document.getElementById('zoom-overlay');
        if (existingOverlay) {
            document.body.removeChild(existingOverlay);
        }
        
        // Create zoom overlay element
        var zoomOverlay = document.createElement('div');
        zoomOverlay.id = 'zoom-overlay';
        zoomOverlay.style.display = 'none';
        zoomOverlay.style.position = 'fixed';
        zoomOverlay.style.top = '0';
        zoomOverlay.style.left = '0';
        zoomOverlay.style.width = '100%';
        zoomOverlay.style.height = '100%';
        zoomOverlay.style.backgroundColor = 'rgba(0,0,0,0.7)';
        zoomOverlay.style.zIndex = '10000';
        zoomOverlay.style.justifyContent = 'center';
        zoomOverlay.style.alignItems = 'center';
        zoomOverlay.style.cursor = 'zoom-out';
        
        document.body.appendChild(zoomOverlay);
        
        // Get all asset images
        var assetImages = document.querySelectorAll('.asset-image');
        
        // Add hover event listeners to each image
        assetImages.forEach(function(img) {
            // Change cursor style
            img.style.cursor = 'zoom-in';
            
            // Click event to zoom
            img.addEventListener('click', function() {
                var zoomedImg = document.createElement('img');
                zoomedImg.src = this.src;
                zoomedImg.style.maxHeight = '90vh';
                zoomedImg.style.maxWidth = '90vw';
                zoomedImg.style.objectFit = 'contain';
                zoomedImg.style.boxShadow = '0 5px 25px rgba(0,0,0,0.5)';
                zoomedImg.style.border = '2px solid white';
                
                // Clear previous image
                zoomOverlay.innerHTML = '';
                zoomOverlay.appendChild(zoomedImg);
                zoomOverlay.style.display = 'flex';
                
                // Prevent scrolling while zoomed
                document.body.style.overflow = 'hidden';
            });
        });
        
        // Close zoom overlay when clicked
        zoomOverlay.addEventListener('click', function() {
            this.style.display = 'none';
            document.body.style.overflow = '';
        });
    },
    
    formatNumber: function(value) {
        if (value === null || value === undefined) {
            return '0.00';
        }
        
        value = Number(value);
        return value.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    },
    
    formatDate: function(dateString, includeTime) {
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
    
    close: function() {
        var modal = document.getElementById('viewAssetModal');
        if (modal) {
            modal.style.display = 'none';
            this.cleanup();
        }
        this.isOpen = false;
        if (typeof this.onClose === 'function') {
            this.onClose();
        }
    },
    
    open: function(asset, onClose) {
        if (asset) {
            this.asset = asset;
        }
        if (onClose) {
            this.onClose = onClose;
        }
        this.render();
        this.setupEventListeners();
        this.isOpen = true;
    },
    
    // Method to force a refresh of the asset view
    forceRefresh: function() {
        console.log("Forcing refresh of asset view");
        this.cleanup();
        
        // Wait a brief moment before re-rendering
        var self = this;
        setTimeout(function() {
            self.render();
            self.setupEventListeners();
        }, 50);
    }
};

// Make ViewAsset globally available
window.ViewAsset = ViewAsset;

// If needed, you can access the forceRefresh method from the console with:
// ViewAsset.forceRefresh();
