/**
 * Client-side search functionality
 * Searches titles and headings only
 */

(function() {
    'use strict';

    let searchIndex = [];
    let selectedIndex = -1;

    // Initialize search
    function initSearch() {
        const searchInput = document.getElementById('search-input');
        const searchResults = document.getElementById('search-results');

        if (!searchInput || !searchResults) return;

        // Load search index
        loadSearchIndex();

        // Search on input
        searchInput.addEventListener('input', function() {
            const query = this.value.trim();

            if (query.length < 2) {
                hideResults();
                return;
            }

            performSearch(query);
        });

        // Keyboard navigation
        searchInput.addEventListener('keydown', function(e) {
            const results = searchResults.querySelectorAll('.search-result-item');

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                selectedIndex = Math.min(selectedIndex + 1, results.length - 1);
                updateSelection(results);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                selectedIndex = Math.max(selectedIndex - 1, -1);
                updateSelection(results);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (selectedIndex >= 0 && results[selectedIndex]) {
                    results[selectedIndex].click();
                }
            } else if (e.key === 'Escape') {
                hideResults();
                searchInput.blur();
            }
        });

        // Close search results when clicking outside
        document.addEventListener('click', function(e) {
            if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
                hideResults();
            }
        });

        // Focus search with keyboard shortcut (Ctrl/Cmd + K)
        document.addEventListener('keydown', function(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                searchInput.focus();
                searchInput.select();
            }
        });
    }

    // Load search index from JSON
    function loadSearchIndex() {
        const assetsPath = window.DOCS_CONFIG?.assetsPath || './';

        // Search index is in the root output directory (same level as assets folder)
        // Remove 'assets/' from the path to get to root, then add search-index.json
        const rootPath = assetsPath.replace(/assets\/$/, '');
        const searchIndexPath = rootPath + 'search-index.json';

        fetch(searchIndexPath)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load search index');
                }
                return response.json();
            })
            .then(data => {
                searchIndex = data;
            })
            .catch(error => {
                console.error('Error loading search index:', error);
            });
    }

    // Perform search
    function performSearch(query) {
        const searchResults = document.getElementById('search-results');
        const lowerQuery = query.toLowerCase();

        // Search through index
        const results = searchIndex
            .map(page => {
                const titleMatch = page.title.toLowerCase().includes(lowerQuery);
                const headingMatches = page.headings.filter(h =>
                    h.toLowerCase().includes(lowerQuery)
                );

                if (!titleMatch && headingMatches.length === 0) {
                    return null;
                }

                // Calculate relevance score
                let score = 0;
                if (titleMatch) {
                    score += 100;
                    // Bonus for exact match
                    if (page.title.toLowerCase() === lowerQuery) {
                        score += 50;
                    }
                    // Bonus for starts with
                    if (page.title.toLowerCase().startsWith(lowerQuery)) {
                        score += 25;
                    }
                }
                score += headingMatches.length * 10;

                return {
                    page,
                    headingMatches,
                    score
                };
            })
            .filter(result => result !== null)
            .sort((a, b) => b.score - a.score)
            .slice(0, 10); // Show top 10 results

        displayResults(results, query);
    }

    // Display search results
    function displayResults(results, query) {
        const searchResults = document.getElementById('search-results');

        if (results.length === 0) {
            searchResults.innerHTML = '<div class="search-no-results">No results found</div>';
            searchResults.classList.add('active');
            selectedIndex = -1;
            return;
        }

        const html = results.map((result, index) => {
            const { page, headingMatches } = result;

            let breadcrumbs = page.breadcrumbs.join(' > ');
            let matchInfo = '';

            if (headingMatches.length > 0) {
                matchInfo = ' - ' + headingMatches.slice(0, 2).join(', ');
            }

            return `
                <div class="search-result-item" data-url="${escapeHtml(page.url)}" data-index="${index}">
                    <div class="search-result-title">${highlightMatch(page.title, query)}</div>
                    <div class="search-result-breadcrumbs">${escapeHtml(breadcrumbs)}${escapeHtml(matchInfo)}</div>
                </div>
            `;
        }).join('');

        searchResults.innerHTML = html;
        searchResults.classList.add('active');
        selectedIndex = -1;

        // Add click handlers
        searchResults.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', function() {
                const url = this.getAttribute('data-url');
                window.location.href = url;
            });

            item.addEventListener('mouseenter', function() {
                selectedIndex = parseInt(this.getAttribute('data-index'));
                updateSelection(searchResults.querySelectorAll('.search-result-item'));
            });
        });
    }

    // Update selected result
    function updateSelection(results) {
        results.forEach((item, index) => {
            if (index === selectedIndex) {
                item.classList.add('selected');
                item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            } else {
                item.classList.remove('selected');
            }
        });
    }

    // Hide search results
    function hideResults() {
        const searchResults = document.getElementById('search-results');
        if (searchResults) {
            searchResults.classList.remove('active');
            selectedIndex = -1;
        }
    }

    // Highlight matching text
    function highlightMatch(text, query) {
        const escapedText = escapeHtml(text);
        const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
        return escapedText.replace(regex, '<strong>$1</strong>');
    }

    // Escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Escape regex special characters
    function escapeRegex(text) {
        return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSearch);
    } else {
        initSearch();
    }
})();
