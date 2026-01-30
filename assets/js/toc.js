/**
 * Table of Contents functionality
 * Highlights current section on scroll
 */

(function() {
    'use strict';

    let headings = [];
    let tocLinks = [];
    let isScrolling = false;

    // Initialize TOC
    function initTOC() {
        const toc = document.getElementById('toc');
        if (!toc) return;

        // Get all headings in content
        headings = Array.from(
            document.querySelectorAll('.markdown-content h2, .markdown-content h3')
        );

        // Get all TOC links
        tocLinks = Array.from(toc.querySelectorAll('.toc-item a'));

        if (headings.length === 0) return;

        // Add smooth scroll behavior to TOC links
        tocLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('href').substring(1);
                const targetHeading = document.getElementById(targetId);

                if (targetHeading) {
                    isScrolling = true;
                    targetHeading.scrollIntoView({ behavior: 'smooth', block: 'start' });

                    // Update URL hash
                    history.pushState(null, null, '#' + targetId);

                    // Re-enable scroll listener after animation
                    setTimeout(() => {
                        isScrolling = false;
                        updateActiveTOC();
                    }, 1000);
                }
            });
        });

        // Handle hash on page load
        if (window.location.hash) {
            setTimeout(() => {
                const targetId = window.location.hash.substring(1);
                const targetHeading = document.getElementById(targetId);
                if (targetHeading) {
                    targetHeading.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 100);
        }
    }

    // Update active TOC item based on scroll position
    function updateActiveTOC() {
        if (isScrolling) return;

        const scrollPosition = window.scrollY + 100; // Offset for top bar

        // Find the current heading
        let currentHeading = null;

        for (let i = headings.length - 1; i >= 0; i--) {
            const heading = headings[i];
            const headingTop = heading.offsetTop;

            if (scrollPosition >= headingTop) {
                currentHeading = heading;
                break;
            }
        }

        // Update active class on TOC items
        tocLinks.forEach(link => {
            const parent = link.parentElement;

            if (currentHeading && link.getAttribute('href') === '#' + currentHeading.id) {
                parent.classList.add('active');
            } else {
                parent.classList.remove('active');
            }
        });
    }

    // Throttle function to limit scroll event frequency
    function throttle(func, wait) {
        let timeout = null;
        let previous = 0;

        return function() {
            const now = Date.now();
            const remaining = wait - (now - previous);

            if (remaining <= 0 || remaining > wait) {
                if (timeout) {
                    clearTimeout(timeout);
                    timeout = null;
                }
                previous = now;
                func();
            } else if (!timeout) {
                timeout = setTimeout(() => {
                    previous = Date.now();
                    timeout = null;
                    func();
                }, remaining);
            }
        };
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTOC);
    } else {
        initTOC();
    }
})();
