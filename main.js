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
    
    let totalDownloads = 0;

    async function fetchReleasesData() {
        try {
            const response = await fetch(GITHUB_RELEASES_API);
            const releases = await response.json();
            
            if (!Array.isArray(releases)) return;

            // 1. Calculate Total Downloads across all releases (filtering for installers only)
            totalDownloads = releases.reduce((acc, release) => {
                const releaseDownloads = release.assets.reduce((sum, asset) => {
                    const name = asset.name.toLowerCase();
                    // Only count actual installers, exclude metadata like .yml or .blockmap
                    if (name.endsWith('.exe') || name.endsWith('.dmg') || name.endsWith('.zip') || name.endsWith('.deb')) {
                        return sum + asset.download_count;
                    }
                    return sum;
                }, 0);
                return acc + releaseDownloads;
            }, 0);

            // 2. Update Download Counter UI
            const downloadCountEl = document.getElementById('download-count');
            if (downloadCountEl) {
                // Animate counting up for a "wow" effect
                animateValue(downloadCountEl, 0, totalDownloads, 1500);
            }

            // 3. Handle Latest Release specifically (for buttons and version badge)
            const latest = releases[0]; // GitHub returns them sorted by date (latest first)
            if (latest) {
                const version = latest.tag_name;
                
                const badge = document.getElementById('version-badge');
                if (badge) badge.innerText = `🚀 Version ${version} (BETA) Disponible`;

                const macVer = document.getElementById('mac-version');
                const winVer = document.getElementById('win-version');
                if (macVer) macVer.innerText = `Version ${version}`;
                if (winVer) winVer.innerText = `Version ${version}`;

                const assets = latest.assets;
                const macSilicon = assets.find(a => a.name.includes('arm64.dmg'));
                const macIntel = assets.find(a => a.name.includes('.dmg') && !a.name.includes('arm64'));
                const winExe = assets.find(a => a.name.includes('.exe'));

                if (macSilicon) document.getElementById('btn-mac-silicon').href = macSilicon.browser_download_url;
                if (macIntel) document.getElementById('btn-mac-intel').href = macIntel.browser_download_url;
                if (winExe) document.getElementById('btn-win').href = winExe.browser_download_url;
            }

        } catch (error) {
            console.error('Erreur lors de la récupération des données GitHub:', error);
            const downloadCountEl = document.getElementById('download-count');
            if (downloadCountEl) downloadCountEl.innerText = '150+'; // Fallback
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

    // Local click tracking for immediate feedback
    function setupDownloadTracking() {
        const downloadButtons = [
            document.getElementById('btn-mac-silicon'),
            document.getElementById('btn-mac-intel'),
            document.getElementById('btn-win'),
            document.querySelector('.btn-download-nav')
        ];

        downloadButtons.forEach(btn => {
            if (!btn) return;
            btn.addEventListener('click', () => {
                totalDownloads++;
                const countEl = document.getElementById('download-count');
                const badgeEl = document.getElementById('download-counter');
                
                if (countEl) countEl.innerText = totalDownloads + ' ';
                
                if (badgeEl) {
                    badgeEl.classList.remove('increment');
                    void badgeEl.offsetWidth; // Trigger reflow
                    badgeEl.classList.add('increment');
                }
            });
        });
    }

    fetchReleasesData();
    setupDownloadTracking();

}); // end DOMContentLoaded
