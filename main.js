// Initialize Lucide icons
lucide.createIcons();

// Scroll Reveal Animation
const revealElements = document.querySelectorAll('[data-reveal]');

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
        }
    });
}, {
    threshold: 0.1
});

revealElements.forEach(el => revealObserver.observe(el));

// Sticky Header
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

// Mobile Menu Toggle
document.addEventListener('DOMContentLoaded', () => {
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

        // Close menu when clicking a link
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
            if (navLinks.classList.contains('active') && !navLinks.contains(e.target) && !menuToggle.contains(e.target)) {
                navLinks.classList.remove('active');
                const icon = menuToggle.querySelector('i');
                if (icon) {
                    icon.setAttribute('data-lucide', 'menu');
                    lucide.createIcons();
                }
            }
        });
    }
});

// GitHub API Integration
const REPO = 'a32116150-ctrl/tuninvoice';
const GITHUB_API = `https://api.github.com/repos/${REPO}/releases/latest`;

async function fetchLatestRelease() {
    try {
        const response = await fetch(GITHUB_API);
        const data = await response.json();
        
        const version = data.tag_name;
        
        // Update Badge
        const badge = document.getElementById('version-badge');
        if (badge) badge.innerText = `🚀 Version ${version} (BETA) Disponible`;

        // Update Version Texts
        const macVer = document.getElementById('mac-version');
        const winVer = document.getElementById('win-version');
        if (macVer) macVer.innerText = `Version ${version}`;
        if (winVer) winVer.innerText = `Version ${version}`;

        // Find assets
        const assets = data.assets;
        const macSilicon = assets.find(a => a.name.includes('arm64.dmg'));
        const macIntel = assets.find(a => a.name.includes('.dmg') && !a.name.includes('arm64'));
        const winExe = assets.find(a => a.name.includes('.exe'));

        // Update Buttons
        if (macSilicon) document.getElementById('btn-mac-silicon').href = macSilicon.browser_download_url;
        if (macIntel) document.getElementById('btn-mac-intel').href = macIntel.browser_download_url;
        if (winExe) document.getElementById('btn-win').href = winExe.browser_download_url;

    } catch (error) {
        console.error('Erreur lors de la récupération de la release GitHub:', error);
    }
}

fetchLatestRelease();
