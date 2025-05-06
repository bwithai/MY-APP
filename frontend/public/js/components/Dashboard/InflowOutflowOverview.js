/**
 * InflowOutflowOverview Component
 * Displays inflow and outflow balances in visually appealing cards
 */
var InflowOutflowOverview = {
    /**
     * Initialize the InflowOutflowOverview component
     * 
     * @param {HTMLElement} container - Container element to render the component in
     * @param {Object} options - Configuration options
     * @param {number} options.inflow - Inflow amount
     * @param {number} options.outflow - Outflow amount
     */
    init: function(container, options) {
        this.container = container;
        this.options = options || {};
        
        // Set defaults if not provided
        this.inflow = this.options.inflow || 0;
        this.outflow = this.options.outflow || 0;
        
        this.render();
        this.attachEventListeners();
    },
    
    /**
     * Render the InflowOutflowOverview component
     */
    render: function() {
        this.container.innerHTML = `
            <div class="inflow-outflow-overview">
                <!-- Inflow Card -->
                <div class="balance-card inflow-card" id="inflowCard">
                    <div class="card-icon">
                        <i class="fas fa-arrow-down"></i>
                    </div>
                    <div class="card-stat">
                        <div class="stat-label">Inflow Balance</div>
                        <div class="stat-divider"></div>
                        <div class="stat-number tooltip" data-tooltip="₨ ${this.formatExact(this.inflow)}">
                            ₨ ${Utils.formatNumber(this.inflow)}
                        </div>
                    </div>
                </div>
                
                <!-- Outflow Card -->
                <div class="balance-card outflow-card" id="outflowCard">
                    <div class="card-icon">
                        <i class="fas fa-arrow-up"></i>
                    </div>
                    <div class="card-stat">
                        <div class="stat-label">Outflow Balance</div>
                        <div class="stat-divider"></div>
                        <div class="stat-number tooltip" data-tooltip="₨ ${this.formatExact(this.outflow)}">
                            ₨ ${Utils.formatNumber(this.outflow)}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add stylesheet if not already added
        if (!document.getElementById('inflow-outflow-styles')) {
            var style = document.createElement('style');
            style.id = 'inflow-outflow-styles';
            style.textContent = `
                /* InflowOutflowOverview Styles - Legacy browser compatible */
                .inflow-outflow-overview {
                    display: grid;
                    grid-template-columns: 1fr;
                    /* gap is not used for legacy browser compatibility */
                    margin-top: 16px;
                    width: 100%;
                    /* Negative margin to offset child margins */
                    margin-left: -8px;
                    margin-right: -8px;
                }
                
                .balance-card {
                    padding: 8px;
                    border-radius: 8px;
                    text-align: center;
                    height: auto;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
                    cursor: pointer;
                    max-width: 100%;
                    transition: transform 0.2s;
                    color: white;
                    /* Add margin to create spacing between cards */
                    margin: 0 8px 16px 8px;
                }
                
                @media (min-width: 768px) {
                    .inflow-outflow-overview {
                        grid-template-columns: 1fr 1fr;
                        margin-left: 1px;
                    }
                    
                    /* In grid layouts, ensure cards have proper width */
                    .balance-card {
                        width: calc(100% - 16px);
                    }
                }
                
                .balance-card:hover {
                    transform: scale(1.02);
                }
                
                .inflow-card {
                    background: linear-gradient(135deg, rgb(34, 122, 86) 0%,rgb(34, 122, 86) 100%);
                }
                .inflow-card .stat-label, .inflow-card i, .inflow-card .stat-number {
                    color: rgb(245, 232, 120);
                }
                

                .outflow-card {
                    background: linear-gradient(135deg, rgb(143, 35, 35),rgb(143, 35, 35));
                }
                .outflow-card .stat-label, .outflow-card i, .outflow-card .stat-number {
                    color: rgb(245, 232, 120);
                }
                
                .card-icon {
                    margin-bottom: 16px;
                }
                
                .card-icon i {
                    font-size: 32px;
                }
                
                .card-stat {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }
                
                .stat-label {
                    font-size: 18px;
                    font-weight: bold;
                }
                
                .stat-divider {
                    width: 100%;
                    height: 1px;
                    background-color: rgb(245, 232, 120);
                    margin: 4px auto;
                }
                
                .stat-number {
                    font-size: 20px;
                    font-weight: bold;
                }
                
                /* Tooltip styles */
                .tooltip {
                    position: relative;
                    display: inline-block;
                }
                
                .tooltip:hover::after {
                    content: attr(data-tooltip);
                    position: absolute;
                    bottom: 100%;
                    left: 50%;
                    transform: translateX(-50%);
                    background-color: rgba(0, 0, 0, 0.8);
                    color: white;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    white-space: nowrap;
                    z-index: 10;
                    margin-bottom: 4px;
                }
            `;
            document.head.appendChild(style);
        }
    },
    
    /**
     * Attach event listeners to the component
     */
    attachEventListeners: function() {
        var inflowCard = this.container.querySelector('#inflowCard');
        var outflowCard = this.container.querySelector('#outflowCard');
        
        inflowCard.addEventListener('click', function() {
            window.location.href = '/inflow';
        });
        
        outflowCard.addEventListener('click', function() {
            window.location.href = '/outflow';
        });
    },
    
    /**
     * Update the component with new data
     * 
     * @param {Object} data - New data for the component
     * @param {number} data.inflow - New inflow amount
     * @param {number} data.outflow - New outflow amount
     */
    update: function(data) {
        if (data.inflow !== undefined) {
            this.inflow = data.inflow;
        }
        
        if (data.outflow !== undefined) {
            this.outflow = data.outflow;
        }
        
        this.render();
        this.attachEventListeners();
    },
    
    /**
     * Format a number with exact decimal places for tooltip
     * 
     * @param {number} value - Number to format
     * @returns {string} - Formatted number string with 2 decimal places
     */
    formatExact: function(value) {
        var num = parseFloat(value);
        
        if (isNaN(num)) {
            return '0.00';
        }
        
        return num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    }
};

// Make InflowOutflowOverview globally available
window.InflowOutflowOverview = InflowOutflowOverview;
