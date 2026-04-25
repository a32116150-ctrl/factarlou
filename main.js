// Initialize Vercel Web Analytics
import { inject } from '@vercel/analytics';
inject();

// Wait for DOM to be fully ready before doing anything
document.addEventListener('DOMContentLoaded', () => {

    // Initialize Lucide icons (must be after DOM is ready)
    lucide.createIcons();

    // ─── Scroll Reveal Animation ───────────────────────────────────────────
    const revealElements = document.querySelectorAll('[data-reveal]');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.1 });
    revealElements.forEach(el => revealObserver.observe(el));

    // ─── Sticky Header ─────────────────────────────────────────────────────
    const nav = document.querySelector('nav');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav.style.padding = '1rem 5%';
            nav.style.background = 'rgba(15, 23, 42, 0.95)';
        } else {
            nav.style.padding = '1.5rem 5%';
            nav.style.background = 'rgba(15, 23, 42, 0.8)';
        }
    });

    // ─── Mobile Menu Toggle ────────────────────────────────────────────────
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            navLinks.classList.toggle('active');
            const icon = menuToggle.querySelector('i');
            if (navLinks.classList.contains('active')) {
                icon.setAttribute('data-lucide', 'x');
            } else {
                icon.setAttribute('data-lucide', 'menu');
            }
            lucide.createIcons();
        });

        // Close menu when clicking a nav link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                const icon = menuToggle.querySelector('i');
                if (icon) {
                    icon.setAttribute('data-lucide', 'menu');
                    lucide.createIcons();
                }
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (
                navLinks.classList.contains('active') &&
                !navLinks.contains(e.target) &&
                !menuToggle.contains(e.target)
            ) {
                navLinks.classList.remove('active');
                const icon = menuToggle.querySelector('i');
                if (icon) {
                    icon.setAttribute('data-lucide', 'menu');
                    lucide.createIcons();
                }
            }
        });
    }

    // ─── Email Subscription Form ───────────────────────────────────────────
    const subscribeBtn = document.getElementById('btn-subscribe');
    const subscribeInput = document.getElementById('input-subscribe');

    if (subscribeBtn && subscribeInput) {
        subscribeBtn.addEventListener('click', () => {
            const email = subscribeInput.value.trim();
            if (!email || !email.includes('@')) {
                subscribeInput.style.borderColor = '#f87171';
                subscribeInput.placeholder = 'Email invalide — réessayez';
                subscribeInput.value = '';
                return;
            }
            // Send via mailto (works without a backend)
            window.location.href = `mailto:a32116150@gmail.com?subject=Abonnement aux mises à jour Factarlou&body=Bonjour, je souhaite être informé(e) des mises à jour de Factarlou.%0D%0AMon email: ${encodeURIComponent(email)}`;
            subscribeInput.value = '';
            subscribeInput.style.borderColor = 'var(--accent)';
            subscribeInput.placeholder = '✓ Merci ! Vérifiez votre messagerie.';
            subscribeBtn.textContent = 'Envoyé !';
            subscribeBtn.style.background = 'var(--accent)';
        });

        // Reset border on typing
        subscribeInput.addEventListener('input', () => {
            subscribeInput.style.borderColor = 'var(--glass-border)';
        });
    }

    // ─── GitHub API — Downloads & Releases ─────────────────────────────────
    const REPO = 'a32116150-ctrl/tuninvoice';
    const GITHUB_RELEASES_API = `https://api.github.com/repos/${REPO}/releases`;
    
    async function fetchReleasesData() {
        // 0. Check Cache First
        const cachedData = localStorage.getItem('factarlou_stats');
        if (cachedData) {
            const data = JSON.parse(cachedData);
            const now = new Date().getTime();
            // Use cache if less than 30 minutes old
            if (now - data.timestamp < 30 * 60 * 1000) {
                updateUI(data.total, data.mac, data.win, data.version, false);
            }
        }

        try {
            const response = await fetch(GITHUB_RELEASES_API);
            const releases = await response.json();
            
            if (!Array.isArray(releases)) return;

            // 1. Calculate OS Breakdown
            let macDownloads = 0;
            let winDownloads = 0;

            releases.forEach(release => {
                release.assets.forEach(asset => {
                    const name = asset.name.toLowerCase();
                    const count = asset.download_count;

                    if (name.endsWith('.dmg')) {
                        macDownloads += count;
                    } else if (name.endsWith('.exe')) {
                        winDownloads += count;
                    }
                });
            });

            const latestVersion = releases[0]?.tag_name || 'v2.6.0';

            // 1.5 Apply Test Offset (Exclude developer testing)
            const TEST_OFFSET = 24;
            macDownloads = Math.max(0, macDownloads - TEST_OFFSET);
            
            // Total is now strictly the sum of visible OS downloads
            let totalDownloads = macDownloads + winDownloads;

            // 2. Save to Cache
            localStorage.setItem('factarlou_stats', JSON.stringify({
                total: totalDownloads,
                mac: macDownloads,
                win: winDownloads,
                version: latestVersion,
                timestamp: new Date().getTime()
            }));

            // 3. Update UI
            updateUI(totalDownloads, macDownloads, winDownloads, latestVersion, true);

            // 4. Handle Latest Release Download Links
            const latest = releases[0];
            if (latest) {
                const assets = latest.assets;
                const macDmg = assets.find(a => a.name.endsWith('.dmg') && !a.name.includes('arm64'));
                const winExe = assets.find(a => a.name.toLowerCase().includes('setup') && a.name.endsWith('.exe')) || 
                               assets.find(a => a.name.endsWith('.exe'));

                if (macDmg) {
                    const btn = document.getElementById('btn-mac-intel');
                    if (btn) {
                        btn.href = macDmg.browser_download_url;
                        btn.setAttribute('download', macDmg.name);
                    }
                }
                if (winExe) {
                    const btn = document.getElementById('btn-win');
                    if (btn) {
                        btn.href = winExe.browser_download_url;
                        btn.setAttribute('download', winExe.name);
                    }
                }
            }

        } catch (error) {
            console.error('Erreur lors de la récupération des données GitHub:', error);
        }
    }

    // Helper to update all UI elements
    function updateUI(total, mac, win, version, animate = true) {
        const totalEl = document.getElementById('download-count');
        const macEl = document.getElementById('mac-downloads');
        const winEl = document.getElementById('win-downloads');
        const badge = document.getElementById('version-badge');
        const macVersionEl = document.getElementById('mac-version');
        const winVersionEl = document.getElementById('win-version');

        if (badge) badge.innerText = `🚀 Version ${version} (BETA) Disponible`;
        if (macVersionEl) macVersionEl.innerText = `Version ${version}`;
        if (winVersionEl) winVersionEl.innerText = `Version ${version}`;

        if (animate) {
            if (totalEl) animateValue(totalEl, 0, total, 1500);
            if (macEl) animateValue(macEl, 0, mac, 1800);
            if (winEl) animateValue(winEl, 0, win, 2000);
        } else {
            if (totalEl) totalEl.innerText = total;
            if (macEl) macEl.innerText = mac;
            if (winEl) winEl.innerText = win;
        }
    }

    // Number counter animation helper
    function animateValue(obj, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    // Local click tracking for immediate feedback & Thank You Modal
    function setupDownloadTracking() {
        const downloadButtons = [
            document.getElementById('btn-mac-intel'),
            document.getElementById('btn-win'),
            document.querySelector('.btn-download-nav')
        ];

        const thankYouModal = document.getElementById('thank-you-modal');
        const closeBtn = document.getElementById('close-thank-you');
        const footerCloseBtn = document.getElementById('btn-modal-close');

        const showModal = () => {
            if (thankYouModal) {
                thankYouModal.classList.add('active');
                // Auto-close after 8 seconds
                setTimeout(hideModal, 8000);
            }
        };

        const hideModal = () => {
            if (thankYouModal) {
                thankYouModal.classList.remove('active');
            }
        };

        downloadButtons.forEach(btn => {
            if (!btn) return;
            btn.addEventListener('click', () => {
                // Trigger counter animation
                const badgeEl = document.getElementById('download-counter');
                if (badgeEl) {
                    badgeEl.classList.remove('increment');
                    void badgeEl.offsetWidth; // Trigger reflow
                    badgeEl.classList.add('increment');
                }
                
                // Show Thank You Modal
                setTimeout(showModal, 500); // Slight delay for better feel
            });
        });

        // Close handlers
        if (closeBtn) closeBtn.addEventListener('click', hideModal);
        if (footerCloseBtn) footerCloseBtn.addEventListener('click', hideModal);
        if (thankYouModal) {
            thankYouModal.addEventListener('click', (e) => {
                if (e.target === thankYouModal) hideModal();
            });
        }
    }

    // ─── 3D Parallax Mockup Effect ──────────────────────────────────────────
    function setupParallax() {
        const mockup = document.getElementById('parallax-mockup');
        const container = document.querySelector('.hero-mockup-container');
        const floaters = document.querySelectorAll('.floating-ui');
        
        if (!mockup || !container) return;

        container.addEventListener('mousemove', (e) => {
            const rect = container.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            // Calculate tilt for main mockup
            const rotateX = ((y - centerY) / centerY) * -10;
            const rotateY = ((x - centerX) / centerX) * 10;
            
            mockup.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;

            // Animate floaters at different depths
            floaters.forEach(el => {
                const depth = parseFloat(el.getAttribute('data-depth')) || 0.2;
                const moveX = (x - centerX) * depth;
                const moveY = (y - centerY) * depth;
                el.style.transform = `translate(${moveX}px, ${moveY}px)`;
            });
        });

        container.addEventListener('mouseleave', () => {
            mockup.style.transform = `rotateX(0deg) rotateY(0deg) scale(1)`;
            floaters.forEach(el => {
                el.style.transform = `translate(0, 0)`;
            });
        });
    }

    // ─── Privacy Shield Toggle ──────────────────────────────────────────────
    function setupPrivacyToggle() {
        const toggle = document.getElementById('privacy-toggle');
        const body = document.body;
        
        if (!toggle) return;

        toggle.addEventListener('change', () => {
            if (toggle.checked) {
                body.classList.add('security-mode');
            } else {
                body.classList.remove('security-mode');
            }
        });
    }

    // ─── Search Functionality ────────────────────────────────────────────────
    const searchBtn = document.getElementById('search-btn');
    const searchOverlay = document.getElementById('search-overlay');
    const closeSearch = document.getElementById('close-search');
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    let searchIndex = null;

    if (searchBtn && searchOverlay) {
        searchBtn.addEventListener('click', async () => {
            searchOverlay.style.display = 'block';
            searchInput.focus();
            
            // Load index if not already loaded
            if (!searchIndex) {
                try {
                    const response = await fetch('/search-index.json');
                    searchIndex = await response.json();
                } catch (e) {
                    console.error('Failed to load search index');
                }
            }
        });

        const closeFunc = () => {
            searchOverlay.style.display = 'none';
        };

        closeSearch.addEventListener('click', closeFunc);
        searchOverlay.addEventListener('click', (e) => {
            if (e.target === searchOverlay) closeFunc();
        });

        searchInput.addEventListener('input', () => {
            const query = searchInput.value.toLowerCase().trim();
            if (!query) {
                searchResults.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">Commencez à taper pour rechercher...</p>';
                return;
            }

            if (!searchIndex) return;

            const filtered = searchIndex.filter(item => 
                item.title.toLowerCase().includes(query) || 
                item.excerpt.toLowerCase().includes(query) ||
                (item.title_ar && item.title_ar.includes(query))
            );

            if (filtered.length === 0) {
                searchResults.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">Aucun résultat trouvé.</p>';
                return;
            }

            searchResults.innerHTML = filtered.map(item => `
                <a href="${item.url}" class="search-result-item" style="display: block; padding: 1rem; text-decoration: none; border-bottom: 1px solid var(--glass-border); transition: 0.3s; border-radius: 8px;">
                    <div style="color: var(--primary); font-weight: 600;">${item.title}</div>
                    <div style="font-size: 0.9rem; color: var(--text-secondary);">${item.excerpt}</div>
                </a>
            `).join('');

            // Add hover effects dynamically
            document.querySelectorAll('.search-result-item').forEach(el => {
                el.addEventListener('mouseenter', () => el.style.background = 'rgba(255,255,255,0.05)');
                el.addEventListener('mouseleave', () => el.style.background = 'none');
            });
        });
    }

    fetchReleasesData();
    setupDownloadTracking();
    setupParallax();
    setupPrivacyToggle();

}); // end DOMContentLoaded
