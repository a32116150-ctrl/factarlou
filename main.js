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

    // ─── GitHub API — Latest Release ───────────────────────────────────────
    const REPO = 'a32116150-ctrl/tuninvoice';
    const GITHUB_API = `https://api.github.com/repos/${REPO}/releases/latest`;

    async function fetchLatestRelease() {
        try {
            const response = await fetch(GITHUB_API);
            const data = await response.json();
            const version = data.tag_name;

            // Update badge
            const badge = document.getElementById('version-badge');
            if (badge) badge.innerText = `🚀 Version ${version} (BETA) Disponible`;

            // Update version texts
            const macVer = document.getElementById('mac-version');
            const winVer = document.getElementById('win-version');
            if (macVer) macVer.innerText = `Version ${version}`;
            if (winVer) winVer.innerText = `Version ${version}`;

            // Find assets and update download buttons
            const assets = data.assets;
            const macSilicon = assets.find(a => a.name.includes('arm64.dmg'));
            const macIntel = assets.find(a => a.name.includes('.dmg') && !a.name.includes('arm64'));
            const winExe = assets.find(a => a.name.includes('.exe'));

            if (macSilicon) document.getElementById('btn-mac-silicon').href = macSilicon.browser_download_url;
            if (macIntel) document.getElementById('btn-mac-intel').href = macIntel.browser_download_url;
            if (winExe) document.getElementById('btn-win').href = winExe.browser_download_url;

        } catch (error) {
            console.error('Erreur lors de la récupération de la release GitHub:', error);
        }
    }

    fetchLatestRelease();

}); // end DOMContentLoaded
