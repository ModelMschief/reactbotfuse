document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Search Index
    const searchData = [];
    document.querySelectorAll('section').forEach(section => {
        const id = section.getAttribute('id');
        if (!id) return;
        
        const titleEl = section.querySelector('h1, h2');
        const title = titleEl ? titleEl.innerText : 'Unknown Section';
        
        // Grab paragraphs inside this section
        const pEls = section.querySelectorAll('p, li');
        let content = Array.from(pEls).map(p => p.innerText).join(' ');
        
        searchData.push({ id, title, content });
    });

    // 2. Setup Fuse.js
    const fuse = new Fuse(searchData, {
        keys: [
            { name: 'title', weight: 0.7 },
            { name: 'content', weight: 0.3 }
        ],
        includeMatches: true,
        threshold: 0.3,
        ignoreLocation: true
    });

    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');

    if (searchInput && searchResults) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value;
            if (query.trim() === '') {
                searchResults.innerHTML = '';
                searchResults.style.display = 'none';
                return;
            }

            const results = fuse.search(query).slice(0, 5); // Limit to top 5
            
            if (results.length === 0) {
                searchResults.innerHTML = '<div class="p-4 text-sm text-gray-500 text-center">No results found</div>';
                searchResults.style.display = 'block';
                return;
            }

            searchResults.innerHTML = results.map(result => `
                <a href="#${result.item.id}" class="search-result-item" onclick="document.getElementById('search-results').style.display='none'; document.getElementById('search-input').value='';">
                    <div class="search-result-title">${result.item.title}</div>
                    <div class="search-result-snippet">${result.item.content.substring(0, 80)}...</div>
                </a>
            `).join('');
            
            searchResults.style.display = 'block';
        });

        // Close search when clicking outside
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
                searchResults.style.display = 'none';
            }
        });
    }

    // 3. TOC Intersection Observer
    const tocLinks = document.querySelectorAll('.toc-link');
    const sections = document.querySelectorAll('section');

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                tocLinks.forEach(link => link.classList.remove('active'));
                const activeLink = document.querySelector(`.toc-link[href="#${id}"]`);
                if (activeLink) activeLink.classList.add('active');
            }
        });
    }, { rootMargin: '0px 0px -70% 0px', threshold: 0 });

    sections.forEach(s => observer.observe(s));
});


    // 4. Mobile Menu Logic
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('mobile-overlay');
    const mainNavLinks = document.querySelectorAll('.sidebar .nav-link, .sidebar .toc-link');

    function toggleMenu() {
        if(sidebar && overlay) {
            sidebar.classList.toggle('open');
            overlay.classList.toggle('open');
            document.body.style.overflow = sidebar.classList.contains('open') ? 'hidden' : '';
        }
    }

    if (mobileMenuBtn && overlay) {
        mobileMenuBtn.addEventListener('click', toggleMenu);
        overlay.addEventListener('click', toggleMenu);
    }

    // Close menu when a nav link is clicked on mobile
    if(mainNavLinks) {
        mainNavLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 850 && sidebar.classList.contains('open')) {
                    toggleMenu();
                }
            });
        });
    }
