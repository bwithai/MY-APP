var WelcomeBox = {
    init: function(container, options) {
        this.container = container;
        this.currentUser = options.currentUser || 'User';
        this.is_superuser = options.is_superuser || false;
        this.messageIndex = 0;
        this.messages = [
            "Welcome back! Here's your financial overview.",
            "Did you check your latest transactions?",
            "Stay on top of your budget today!",
            "Great to see you! Explore your insights."
        ];
        
        this.render();
        this.startMessageRotation();
    },
    
    render: function() {
        // Create greeting based on user type
        var greeting = '';

        if (this.is_superuser) {
            greeting = this.currentUser.toLowerCase() === 'admin' ? 'Hi Admin 👋🏼' : `🤔 ${this.currentUser} 🧐`;
        } else {
            greeting = `Hi ${this.currentUser} 👋🏼`;
        }
        
        // Create welcome box HTML
        this.container.innerHTML = `
            <div class="welcome-box">
                <div class="welcome-content">
                    <h2 class="welcome-title">${greeting}</h2>
                    <p class="welcome-message">${this.messages[this.messageIndex]}</p>
                </div>
            </div>
        `;
        
        // Add styles to the welcome box
        var boxStyles = `
            .welcome-box {
                background-color: #ebf8ff;
                border-radius: 6px;
                padding: 1rem 1.5rem;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                margin-bottom: 1.5rem;
                animation: fadeIn 0.5s ease-in-out;
            }
            
            .welcome-content {
                display: flex;
                flex-direction: row;
                justify-content: space-between;
                align-items: center;
                gap: 1rem;
            }
            
            .welcome-title {
                font-size: 1.5rem;
                font-weight: 700;
                color: #3182ce;
                margin: 0;
            }
            
            .welcome-message {
                font-size: 1.125rem;
                color: #4a5568;
                margin: 0;
                animation: fadeIn 0.5s ease-in-out;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @media (max-width: 768px) {
                .welcome-content {
                    flex-direction: column;
                    align-items: flex-start;
                }
                
                .welcome-message {
                    margin-top: 0.5rem;
                }
            }
        `;
        
        // Add styles to the document head if they don't already exist
        if (!document.getElementById('welcome-box-styles')) {
            var styleEl = document.createElement('style');
            styleEl.id = 'welcome-box-styles';
            styleEl.textContent = boxStyles;
            document.head.appendChild(styleEl);
        }
    },
    
    updateMessage: function() {
        // Update message index
        this.messageIndex = (this.messageIndex + 1) % this.messages.length;
        
        // Update message text with fade effect
        var messageElement = this.container.querySelector('.welcome-message');
        if (messageElement) {
            // Create fade out effect
            messageElement.style.opacity = '0';
            
            // Wait for fade out, then update text and fade in
            setTimeout(() => {
                messageElement.textContent = this.messages[this.messageIndex];
                messageElement.style.opacity = '1';
            }, 300);
        }
    },
    
    startMessageRotation: function() {
        // Rotate messages every 5 seconds
        this.messageInterval = setInterval(() => {
            this.updateMessage();
        }, 5000);
    },
    
    stopMessageRotation: function() {
        // Clear interval when component is destroyed
        if (this.messageInterval) {
            clearInterval(this.messageInterval);
        }
    },
    
    destroy: function() {
        // Cleanup when component is removed
        this.stopMessageRotation();
        this.container.innerHTML = '';
    }
};

// Make WelcomeBox globally available
window.WelcomeBox = WelcomeBox;
