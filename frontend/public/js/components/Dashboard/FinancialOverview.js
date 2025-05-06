var FinancialOverview = {
    init: function(container, data) {
        this.container = container;
        this.data = data || {
            totalBalance: 0,
            cashBalance: 0,
            bankBalance: 0,
            investmentBalance: 0,
            liabilityBalance: 0
        };
        
        this.render();
        this.attachEventListeners();
    },
    
    update: function(data) {
        this.data = data || this.data;
        this.render();
        this.attachEventListeners();
    },
    
    render: function() {
        // Create HTML structure
        this.container.innerHTML = `
            <div class="financial-overview-grid">
                <!-- Total Balance Card -->
                <div class="total-balance-card">
                    <i class="fas fa-chart-line"></i>
                    <div class="stat">
                        <div class="stat-label">Total Balance</div>
                        <div class="divider"></div>
                        <div class="stat-number tooltip" data-tooltip="₨ ${this.formatDecimal(this.data.totalBalance)}">
                            ₨ ${Utils.formatNumber(this.data.totalBalance)}
                        </div>
                    </div>
                </div>
                
                <!-- Other Balance Cards Grid -->
                <div class="balance-cards-grid">
                    <!-- Cash Balance Card -->
                    <div class="balance-card cash-balance">
                        <i class="fas fa-money-bill"></i>
                        <div class="stat">
                            <div class="stat-label">Cash Balance</div>
                            <div class="divider"></div>
                            <div class="stat-number tooltip" data-tooltip="₨ ${this.formatDecimal(this.data.cashBalance)}">
                                ₨ ${Utils.formatNumber(this.data.cashBalance)}
                            </div>
                        </div>
                    </div>
                    
                    <!-- Bank Balance Card -->
                    <div class="balance-card bank-balance">
                        <i class="fas fa-university"></i>
                        <div class="stat">
                            <div class="stat-label">Bank Balance</div>
                            <div class="divider"></div>
                            <div class="stat-number tooltip" data-tooltip="₨ ${this.formatDecimal(this.data.bankBalance)}">
                                ₨ ${Utils.formatNumber(this.data.bankBalance)}
                            </div>
                        </div>
                    </div>
                    
                    <!-- Investment Balance Card -->
                    <div class="balance-card investment-balance clickable" data-navigate="/investment">
                        <i class="fas fa-hand-holding-usd"></i>
                        <div class="stat">
                            <div class="stat-label">Investment Balance</div>
                            <div class="divider"></div>
                            <div class="stat-number tooltip" data-tooltip="₨ ${this.formatDecimal(this.data.investmentBalance)}">
                                ₨ ${Utils.formatNumber(this.data.investmentBalance)}
                            </div>
                        </div>
                    </div>
                    
                    <!-- Liability Balance Card -->
                    <div class="balance-card liability-balance clickable" data-navigate="/liability">
                        <i class="fas fa-minus-circle"></i>
                        <div class="stat">
                            <div class="stat-label">Liability Balance</div>
                            <div class="divider"></div>
                            <div class="stat-number tooltip" data-tooltip="₨ ${this.formatDecimal(this.data.liabilityBalance)}">
                                ₨ ${Utils.formatNumber(this.data.liabilityBalance)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add styles to the document head if they don't already exist
        if (!document.getElementById('financial-overview-styles')) {
            var styleEl = document.createElement('style');
            styleEl.id = 'financial-overview-styles';
            styleEl.textContent = this.getStyles();
            document.head.appendChild(styleEl);
        }
    },
    
    getStyles: function() {
        return `
            .financial-overview-grid {
                display: grid;
                grid-template-columns: 1fr;
                margin: 0 -0.5rem;
            }
            
            .financial-overview-grid > * {
                margin: 0.5rem;
            }
            
            @media (min-width: 768px) {
                .financial-overview-grid {
                    grid-template-columns: 1fr 2fr;
                }
            }
            
            .total-balance-card {
                background: #415540;
                padding: 1rem;
                border-radius: 0.5rem;
                box-shadow: 0 1px 3px rgba(0,0,0,0.12);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                text-align: center;
                min-height: 150px;
                color: white;
                margin-top: -5px;
                position: relative;
                z-index: 1;
            }
            
            .total-balance-card i {
                font-size: 3rem;
                margin-bottom: 0.75rem;
            }
            
            .balance-cards-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                margin: 0 -0.375rem;
            }
            
            .balance-cards-grid > * {
                margin: 0.375rem;
            }
            
            .balance-card {
                padding: 0.5rem;
                border-radius: 0.5rem;
                box-shadow: 0 1px 3px rgba(0,0,0,0.12);
                display: flex;
                flex-direction: column;
                align-items: center;
                text-align: center;
                color: white;
            }
            
            .balance-card i {
                font-size: 2rem;
                margin-bottom: 0.25rem;
            }
            
            .cash-balance {
                background:rgb(56, 117, 131);
            }
            
            .bank-balance {
                background: #17475c;
            }
            
            .investment-balance {
                background: linear-gradient(135deg, rgb(167, 102, 50),rgb(177, 107, 51));
            }
            
            .liability-balance {
                background:rgb(175, 58, 49);
            }
            
            .clickable {
                cursor: pointer;
                transition: transform 0.2s;
            }
            
            .clickable:hover {
                transform: scale(1.02);
            }
            
            .stat {
                width: 100%;
            }
            
            .stat-label {
                font-size: 10px;
                font-weight: bold;
            }
            
            .total-balance-card .stat-label {
                font-size: 1.25rem;
            }
            
            .divider {
                border-top: 1px solid white;
                width: 60%;
                margin: 0.25rem auto;
            }
            
            .total-balance-card .divider {
                border-top-width: 4px;
                width: 80%;
                margin: 0.5rem auto;
            }
            
            .stat-number {
                font-size: 15px;
                font-weight: bold;
            }
            
            .total-balance-card .stat-number {
                font-size: 1.25rem;
            }
            
            /* Tooltip styles */
            .tooltip {
                position: relative;
            }
            
            .tooltip:hover::after {
                content: attr(data-tooltip);
                position: absolute;
                bottom: 100%;
                left: 50%;
                transform: translateX(-50%);
                background-color: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 0.25rem 0.5rem;
                border-radius: 0.25rem;
                font-size: 0.75rem;
                white-space: nowrap;
                z-index: 10;
                margin-bottom: 0.25rem;
            }
            
            .tooltip:hover::before {
                content: "";
                position: absolute;
                bottom: 100%;
                left: 50%;
                transform: translateX(-50%);
                border: 0.25rem solid transparent;
                border-top-color: rgba(0, 0, 0, 0.8);
                margin-bottom: -0.25rem;
                z-index: 10;
            }
            
            /* Dark mode overrides */
            @media (prefers-color-scheme: dark) {
                .total-balance-card {
                    background: linear-gradient(135deg, #388e3c, rgb(10, 95, 14));
                }
                
                .cash-balance {
                    background: linear-gradient(135deg, rgb(45, 109, 181), rgb(37, 150, 194));
                }
                
                .bank-balance {
                    background: linear-gradient(135deg, #006064, #004d40);
                }
                
                .investment-balance {
                    background: linear-gradient(135deg, #6d4c41, #8d6e63);
                }
                
                .liability-balance {
                    background: linear-gradient(135deg, rgb(183, 28, 137), #880e4f);
                }
            }
        `;
    },
    
    attachEventListeners: function() {
        // Add click handlers to clickable cards
        var clickableCards = this.container.querySelectorAll('.clickable');
        clickableCards.forEach(function(card) {
            card.addEventListener('click', function() {
                var route = card.getAttribute('data-navigate');
                if (route) {
                    this.navigateTo(route);
                }
            }.bind(this));
        }.bind(this));
    },
    
    navigateTo: function(route) {
        // Change the URL and trigger navigation
        window.location.href = route;
    },
    
    formatDecimal: function(value) {
        // Format decimal with 2 decimal places
        return parseFloat(value).toFixed(2);
    }
};

// Make FinancialOverview globally available
window.FinancialOverview = FinancialOverview;
