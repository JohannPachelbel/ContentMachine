class PresentationApp {
    constructor() {
        this.currentSlide = 1;
        this.totalSlides = 11;
        this.isAutoPlaying = false;
        this.autoInterval = null;
        this.autoDelay = 5000; // 5 seconds per slide
        this.isTransitioning = false; // Prevent multiple transitions

        this.initializeElements();
        this.bindEvents();
        this.updateSlideCounter();
        this.updateProgressDots();
    }

    initializeElements() {
        // Navigation elements
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.autoToggle = document.getElementById('autoToggle');

        // Slide elements
        this.slidesContainer = document.getElementById('slidesContainer');
        this.slides = document.querySelectorAll('.slide');

        // Progress elements
        this.currentSlideSpan = document.getElementById('currentSlide');
        this.totalSlidesSpan = document.getElementById('totalSlides');
        this.progressDots = document.querySelectorAll('.dot');

        // Set total slides
        this.totalSlidesSpan.textContent = this.totalSlides;
    }

    bindEvents() {
        // Navigation button events
        this.prevBtn.addEventListener('click', () => this.previousSlide());
        this.nextBtn.addEventListener('click', () => this.nextSlide());

        // Auto-advance toggle
        this.autoToggle.addEventListener('click', () => this.toggleAutoAdvance());

        // Keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // Progress dot navigation
        this.progressDots.forEach((dot, index) => {
            dot.addEventListener('click', () => this.goToSlide(index + 1));
        });

        // Enhanced touch/swipe support
        this.addTouchSupport();

        // Prevent auto-advance on user interaction
        this.slidesContainer.addEventListener('mouseenter', () => this.pauseAutoAdvance());
        this.slidesContainer.addEventListener('mouseleave', () => this.resumeAutoAdvance());
    }

    addTouchSupport() {
        let startX = 0;
        let startY = 0;
        let endX = 0;
        let endY = 0;
        let isSwiping = false;

        // Enhanced touch event handling
        this.slidesContainer.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                const touch = e.touches[0];
                startX = touch.clientX;
                startY = touch.clientY;
                isSwiping = true;
            }
        }, { passive: true });

        this.slidesContainer.addEventListener('touchmove', (e) => {
            if (!isSwiping || e.touches.length !== 1) return;
            
            const touch = e.touches[0];
            endX = touch.clientX;
            endY = touch.clientY;

            const deltaX = endX - startX;
            const deltaY = endY - startY;

            // Prevent vertical scrolling if horizontal swipe is detected
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 30) {
                e.preventDefault();
            }
        }, { passive: false });

        this.slidesContainer.addEventListener('touchend', (e) => {
            if (!isSwiping) return;
            
            isSwiping = false;
            const deltaX = endX - startX;
            const deltaY = endY - startY;
            
            this.handleSwipe(startX, startY, endX, endY);
        }, { passive: true });

        // Reset on touch cancel
        this.slidesContainer.addEventListener('touchcancel', () => {
            isSwiping = false;
        }, { passive: true });
    }

    handleSwipe(startX, startY, endX, endY) {
        const deltaX = endX - startX;
        const deltaY = endY - startY;
        const minSwipeDistance = 80; // Increased for better recognition
        const maxVerticalThreshold = 100;

        // Only handle horizontal swipes that are significantly horizontal
        if (Math.abs(deltaX) > minSwipeDistance && 
            Math.abs(deltaX) > Math.abs(deltaY) && 
            Math.abs(deltaY) < maxVerticalThreshold) {
            
            if (deltaX > 0) {
                // Swipe right - go to previous slide
                this.previousSlide();
            } else {
                // Swipe left - go to next slide
                this.nextSlide();
            }
        }
    }

    handleKeyboard(e) {
        // Prevent navigation during transitions
        if (this.isTransitioning) return;

        switch(e.key) {
            case 'ArrowLeft':
            case 'ArrowUp':
                e.preventDefault();
                this.previousSlide();
                break;
            case 'ArrowRight':
            case 'ArrowDown':
            case ' ': // Spacebar
                e.preventDefault();
                this.nextSlide();
                break;
            case 'Home':
                e.preventDefault();
                this.goToSlide(1);
                break;
            case 'End':
                e.preventDefault();
                this.goToSlide(this.totalSlides);
                break;
            case 'Escape':
                e.preventDefault();
                this.stopAutoAdvance();
                break;
        }
    }

    nextSlide() {
        if (this.isTransitioning) return;
        
        if (this.currentSlide < this.totalSlides) {
            this.goToSlide(this.currentSlide + 1);
        } else {
            // Loop back to first slide
            this.goToSlide(1);
        }
    }

    previousSlide() {
        if (this.isTransitioning) return;
        
        if (this.currentSlide > 1) {
            this.goToSlide(this.currentSlide - 1);
        } else {
            // Loop to last slide
            this.goToSlide(this.totalSlides);
        }
    }

    goToSlide(slideNumber) {
        if (slideNumber < 1 || 
            slideNumber > this.totalSlides || 
            slideNumber === this.currentSlide ||
            this.isTransitioning) {
            return;
        }

        this.isTransitioning = true;
        const previousSlide = this.currentSlide;
        this.currentSlide = slideNumber;

        // Update slide visibility with animation
        this.animateSlideTransition(previousSlide, this.currentSlide);

        // Update UI elements
        this.updateSlideCounter();
        this.updateProgressDots();
        this.updateNavigationButtons();

        // Reset auto-advance timer if active
        if (this.isAutoPlaying) {
            this.resetAutoAdvance();
        }

        // Allow new transitions after animation completes
        setTimeout(() => {
            this.isTransitioning = false;
        }, 800);
    }

    animateSlideTransition(fromSlide, toSlide) {
        const currentSlideEl = document.querySelector(`[data-slide="${fromSlide}"]`);
        const nextSlideEl = document.querySelector(`[data-slide="${toSlide}"]`);

        if (!currentSlideEl || !nextSlideEl) return;

        // Determine animation direction
        const direction = toSlide > fromSlide ? 'next' : 'prev';

        // Prepare next slide
        nextSlideEl.style.visibility = 'visible';
        nextSlideEl.style.pointerEvents = 'auto';
        
        if (direction === 'next') {
            nextSlideEl.style.transform = 'translateX(100%)';
        } else {
            nextSlideEl.style.transform = 'translateX(-100%)';
        }

        // Force reflow
        nextSlideEl.offsetHeight;

        // Start animation
        requestAnimationFrame(() => {
            // Remove active class from current slide
            currentSlideEl.classList.remove('active');
            
            // Animate current slide out
            if (direction === 'next') {
                currentSlideEl.style.transform = 'translateX(-100%)';
            } else {
                currentSlideEl.style.transform = 'translateX(100%)';
            }

            // Animate next slide in
            nextSlideEl.classList.add('active');
            nextSlideEl.style.transform = 'translateX(0)';

            // Clean up after animation
            setTimeout(() => {
                // Hide previous slide completely
                currentSlideEl.style.visibility = 'hidden';
                currentSlideEl.style.pointerEvents = 'none';
                currentSlideEl.style.transform = '';
                
                // Clean up next slide styles
                nextSlideEl.style.transform = '';
            }, 800);
        });
    }

    updateSlideCounter() {
        this.currentSlideSpan.textContent = this.currentSlide;
    }

    updateProgressDots() {
        this.progressDots.forEach((dot, index) => {
            if (index + 1 === this.currentSlide) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    updateNavigationButtons() {
        // Visual feedback for navigation state
        this.prevBtn.style.opacity = this.currentSlide === 1 ? '0.5' : '1';
        this.nextBtn.style.opacity = this.currentSlide === this.totalSlides ? '0.5' : '1';
    }

    toggleAutoAdvance() {
        if (this.isAutoPlaying) {
            this.stopAutoAdvance();
        } else {
            this.startAutoAdvance();
        }
    }

    startAutoAdvance() {
        this.isAutoPlaying = true;
        this.autoToggle.classList.add('active');
        this.autoToggle.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="6" y="4" width="4" height="16"></rect>
                <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
            <span>Pause</span>
        `;

        this.autoInterval = setInterval(() => {
            this.nextSlide();
        }, this.autoDelay);
    }

    stopAutoAdvance() {
        this.isAutoPlaying = false;
        this.autoToggle.classList.remove('active');
        this.autoToggle.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            <span>Auto</span>
        `;

        if (this.autoInterval) {
            clearInterval(this.autoInterval);
            this.autoInterval = null;
        }
    }

    resetAutoAdvance() {
        if (this.isAutoPlaying) {
            clearInterval(this.autoInterval);
            this.autoInterval = setInterval(() => {
                this.nextSlide();
            }, this.autoDelay);
        }
    }

    pauseAutoAdvance() {
        if (this.isAutoPlaying && this.autoInterval) {
            clearInterval(this.autoInterval);
        }
    }

    resumeAutoAdvance() {
        if (this.isAutoPlaying && !this.autoInterval) {
            this.autoInterval = setInterval(() => {
                this.nextSlide();
            }, this.autoDelay);
        }
    }
}

// Enhanced presentation utilities
class PresentationEnhancements {
    constructor(app) {
        this.app = app;
        this.init();
    }

    init() {
        this.addLoadingAnimation();
        this.showShortcutsTooltip();
        this.addVisibilityChangeHandler();
        this.addPerformanceOptimizations();
        this.addGestureHints();
    }

    addLoadingAnimation() {
        // Smooth page load
        setTimeout(() => {
            document.body.classList.add('loaded');
        }, 100);
    }

    showShortcutsTooltip() {
        // Only show once per session
        if (sessionStorage.getItem('shortcuts-shown')) return;

        const tooltip = document.createElement('div');
        tooltip.className = 'shortcuts-tooltip';
        tooltip.innerHTML = `
            <div class="tooltip-content">
                <h4>Управление презентацией</h4>
                <ul>
                    <li><kbd>←/→</kbd> <span>Навигация</span></li>
                    <li><kbd>Пробел</kbd> <span>Следующий слайд</span></li>
                    <li><kbd>Home/End</kbd> <span>Первый/Последний</span></li>
                    <li><kbd>Esc</kbd> <span>Остановить авто-прокрутку</span></li>
                    <li><span>👆 Свайп</span> <span>Мобильная навигация</span></li>
                </ul>
                <button>Понятно</button>
            </div>
        `;

        tooltip.querySelector('button').addEventListener('click', () => {
            tooltip.remove();
            sessionStorage.setItem('shortcuts-shown', 'true');
        });

        tooltip.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.95);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 15px;
            padding: 2rem;
            z-index: 1000;
            color: white;
            font-family: Inter, sans-serif;
            backdrop-filter: blur(10px);
            animation: fadeIn 0.3s ease;
            max-width: 400px;
            width: 90%;
        `;

        document.body.appendChild(tooltip);

        // Auto-remove after 8 seconds
        setTimeout(() => {
            if (tooltip.parentElement) {
                tooltip.style.animation = 'fadeOut 0.3s ease';
                setTimeout(() => tooltip.remove(), 300);
                sessionStorage.setItem('shortcuts-shown', 'true');
            }
        }, 8000);
    }

    addGestureHints() {
        // Visual feedback for touch devices
        if ('ontouchstart' in window) {
            const hintElement = document.createElement('div');
            hintElement.className = 'swipe-hint';
            hintElement.innerHTML = '← Свайп для навигации →';
            hintElement.style.cssText = `
                position: fixed;
                bottom: 80px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.7);
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 14px;
                z-index: 50;
                animation: swipeHintFade 4s ease-in-out;
                pointer-events: none;
            `;

            document.body.appendChild(hintElement);

            // Remove hint after animation
            setTimeout(() => {
                if (hintElement.parentElement) {
                    hintElement.remove();
                }
            }, 4000);
        }
    }

    addVisibilityChangeHandler() {
        // Pause auto-advance when tab is not visible
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.app.pauseAutoAdvance();
            } else {
                this.app.resumeAutoAdvance();
            }
        });
    }

    addPerformanceOptimizations() {
        // Reduce motion for users who prefer it
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.documentElement.style.setProperty('--duration-fast', '0ms');
            document.documentElement.style.setProperty('--duration-normal', '0ms');
            
            // Disable background animation
            const style = document.createElement('style');
            style.textContent = `
                body::before { animation: none !important; }
                .cta-action { animation: none !important; }
            `;
            document.head.appendChild(style);
        }

        // Optimize for touch devices
        if ('ontouchstart' in window) {
            document.body.classList.add('touch-device');
        }
    }
}

// Simple analytics for presentation usage
class PresentationAnalytics {
    constructor(app) {
        this.app = app;
        this.startTime = Date.now();
        this.slideViewTimes = {};
        this.interactions = 0;
        this.init();
    }

    init() {
        this.trackSlideViews();
        this.trackUserEngagement();
    }

    trackSlideViews() {
        let slideStartTime = Date.now();

        const originalGoToSlide = this.app.goToSlide.bind(this.app);
        this.app.goToSlide = (slideNumber) => {
            // Record time spent on previous slide
            const timeSpent = Date.now() - slideStartTime;
            this.slideViewTimes[this.app.currentSlide] = 
                (this.slideViewTimes[this.app.currentSlide] || 0) + timeSpent;

            // Call original function
            originalGoToSlide(slideNumber);

            // Reset timer for new slide
            slideStartTime = Date.now();
        };
    }

    trackUserEngagement() {
        // Track user interactions
        ['click', 'keydown', 'touchstart'].forEach(eventType => {
            document.addEventListener(eventType, () => {
                this.interactions++;
            }, { passive: true });
        });

        // Log engagement summary when user leaves
        window.addEventListener('beforeunload', () => {
            const totalTime = Date.now() - this.startTime;
            const avgTimePerSlide = Math.round(totalTime / this.app.currentSlide / 1000);
            
            console.log('📊 Презентация "Контент-Машина" - Статистика:', {
                totalTime: Math.round(totalTime / 1000) + 's',
                slidesViewed: this.app.currentSlide,
                avgTimePerSlide: avgTimePerSlide + 's',
                interactions: this.interactions,
                completionRate: Math.round((this.app.currentSlide / this.app.totalSlides) * 100) + '%'
            });
        });
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new PresentationApp();
    new PresentationEnhancements(app);
    new PresentationAnalytics(app);

    // Make app globally available for debugging
    window.presentationApp = app;

    console.log('🎯 Презентация "Контент-Машина" загружена!');
    console.log('💡 Навигация: стрелки ←/→, пробел, клики, свайпы');
});

// Add enhanced tooltip and hint styles
const enhancedStyles = document.createElement('style');
enhancedStyles.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
        to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    }
    
    @keyframes fadeOut {
        from { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        to { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
    }
    
    @keyframes swipeHintFade {
        0% { opacity: 0; }
        20% { opacity: 1; }
        80% { opacity: 1; }
        100% { opacity: 0; }
    }

    .shortcuts-tooltip .tooltip-content {
        text-align: left;
    }

    .shortcuts-tooltip h4 {
        margin: 0 0 1rem 0;
        color: #58a6ff;
        text-align: center;
        font-size: 1.1rem;
    }

    .shortcuts-tooltip ul {
        list-style: none;
        padding: 0;
        margin: 0 0 1.5rem 0;
    }

    .shortcuts-tooltip li {
        padding: 0.5rem 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .shortcuts-tooltip li:last-child {
        border-bottom: none;
    }

    .shortcuts-tooltip kbd {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        padding: 0.25rem 0.5rem;
        font-family: monospace;
        font-size: 0.9rem;
        min-width: 60px;
        text-align: center;
    }

    .shortcuts-tooltip button {
        background: linear-gradient(135deg, #1da1f2 0%, #0d8bd9 100%);
        border: none;
        border-radius: 8px;
        padding: 0.75rem 1.5rem;
        color: white;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.3s ease;
        width: 100%;
        font-size: 1rem;
    }

    .shortcuts-tooltip button:hover {
        background: linear-gradient(135deg, #0d8bd9 0%, #0a7bc4 100%);
        transform: translateY(-2px);
    }

    .touch-device .nav-btn {
        width: 70px;
        height: 70px;
    }

    .touch-device .nav-btn:active {
        transform: scale(0.9);
    }
`;
document.head.appendChild(enhancedStyles);