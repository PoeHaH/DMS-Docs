/**
 * Navigation tree functionality
 * Handles expand/collapse and state persistence
 */

(function() {
    'use strict';

    const STORAGE_KEY = 'docs_nav_state';

    // Initialize navigation
    function initNavigation() {
        const navigation = document.getElementById('navigation');
        if (!navigation) return;

        // Load saved state
        const savedState = loadState();

        // Apply saved state or auto-expand to current page
        if (savedState && Object.keys(savedState).length > 0) {
            applyState(savedState);
        } else {
            expandToCurrentPage();
        }

        // Add click handlers to toggles
        attachToggleHandlers();
    }

    // Expand navigation to show current page
    function expandToCurrentPage() {
        const activeItem = document.querySelector('.nav-item.active');
        if (!activeItem) return;

        // Expand all parent items
        let parent = activeItem.parentElement;
        while (parent) {
            if (parent.classList.contains('nav-children')) {
                const parentItem = parent.parentElement;
                if (parentItem && parentItem.classList.contains('nav-item')) {
                    parentItem.classList.add('expanded');
                }
            }
            parent = parent.parentElement;
        }

        // Scroll active item into view
        setTimeout(() => {
            activeItem.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }, 100);
    }

    // Attach click handlers to nav toggles
    function attachToggleHandlers() {
        const toggles = document.querySelectorAll('.nav-toggle');

        toggles.forEach(toggle => {
            toggle.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();

                const navItem = this.parentElement;
                navItem.classList.toggle('expanded');

                // Save state
                saveState();
            });
        });

        // Also toggle on clicking items with children
        const itemsWithChildren = document.querySelectorAll('.nav-item.has-children > a');

        itemsWithChildren.forEach(link => {
            link.addEventListener('click', function(e) {
                const navItem = this.parentElement;

                // Only toggle if not navigating to the page itself
                // If the item is already active, allow navigation
                if (!navItem.classList.contains('active')) {
                    e.preventDefault();
                    navItem.classList.toggle('expanded');
                    saveState();
                }
            });
        });
    }

    // Save navigation state to localStorage
    function saveState() {
        const state = {};
        const expandedItems = document.querySelectorAll('.nav-item.expanded');

        expandedItems.forEach((item, index) => {
            const link = item.querySelector('a');
            if (link) {
                const href = link.getAttribute('href');
                state[href] = true;
            }
        });

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
            // localStorage might be disabled
            console.warn('Could not save navigation state:', e);
        }
    }

    // Load navigation state from localStorage
    function loadState() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            console.warn('Could not load navigation state:', e);
            return {};
        }
    }

    // Apply saved state to navigation
    function applyState(state) {
        Object.keys(state).forEach(href => {
            const link = document.querySelector(`.nav-item a[href="${href}"]`);
            if (link) {
                const navItem = link.parentElement;
                if (navItem.classList.contains('has-children')) {
                    navItem.classList.add('expanded');
                }
            }
        });
    }

    // Mobile menu toggle (for responsive design)
    function initMobileMenu() {
        // Add hamburger button for mobile
        const topBar = document.querySelector('.top-bar');
        if (!topBar) return;

        const hamburger = document.createElement('button');
        hamburger.className = 'mobile-menu-toggle';
        hamburger.innerHTML = '☰';
        hamburger.style.cssText = 'display: none; border: none; background: none; font-size: 24px; cursor: pointer; padding: 8px;';

        topBar.insertBefore(hamburger, topBar.firstChild);

        hamburger.addEventListener('click', function() {
            const sidebar = document.querySelector('.sidebar-left');
            if (sidebar) {
                sidebar.classList.toggle('open');
            }
        });

        // Show hamburger on mobile
        const mediaQuery = window.matchMedia('(max-width: 768px)');
        function handleMobileView(e) {
            hamburger.style.display = e.matches ? 'block' : 'none';
        }
        handleMobileView(mediaQuery);
        mediaQuery.addListener(handleMobileView);

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', function(e) {
            const sidebar = document.querySelector('.sidebar-left');
            const hamburger = document.querySelector('.mobile-menu-toggle');

            if (sidebar && sidebar.classList.contains('open')) {
                if (!sidebar.contains(e.target) && e.target !== hamburger) {
                    sidebar.classList.remove('open');
                }
            }
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            initNavigation();
            initMobileMenu();
        });
    } else {
        initNavigation();
        initMobileMenu();
    }
})();
