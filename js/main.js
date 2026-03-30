/* ========================================
   E-TOMIC - JavaScript Principal
   Menu, Navegação, Scroll Effects
======================================== */

// ========================================
// Variáveis Globais
// ========================================
const menuToggle = document.querySelector('.menu-toggle');
const navMobile = document.querySelector('.nav-mobile');
const menuOverlay = document.querySelector('.menu-overlay');
const header = document.querySelector('.header');
const navLinks = document.querySelectorAll('.nav-link, .nav-mobile-link');

// ========================================
// Menu Mobile
// ========================================
function initMobileMenu() {
    if (!menuToggle || !navMobile) return;

    // Toggle menu
    menuToggle.addEventListener('click', () => {
        menuToggle.classList.toggle('active');
        navMobile.classList.toggle('active');
        menuOverlay.classList.toggle('active');
        document.body.style.overflow = navMobile.classList.contains('active') ? 'hidden' : '';
    });

    // Fechar ao clicar no overlay
    if (menuOverlay) {
        menuOverlay.addEventListener('click', closeMenu);
    }

    // Fechar ao clicar em link
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 992) {
                closeMenu();
            }
        });
    });
}

function closeMenu() {
    menuToggle?.classList.remove('active');
    navMobile?.classList.remove('active');
    menuOverlay?.classList.remove('active');
    document.body.style.overflow = '';
}

// ========================================
// Header Scroll Effect
// ========================================
function initHeaderScroll() {
    if (!header) return;

    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        // Adiciona classe quando rolar
        if (currentScroll > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        // Esconde header ao rolar para baixo, mostra ao rolar para cima
        if (currentScroll > lastScroll && currentScroll > 500) {
            header.style.transform = 'translateY(-100%)';
        } else {
            header.style.transform = 'translateY(0)';
        }

        lastScroll = currentScroll;
    });
}

// ========================================
// Scroll Progress Bar
// ========================================
function initScrollProgress() {
    const progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress';
    document.body.appendChild(progressBar);

    window.addEventListener('scroll', () => {
        const winScroll = document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height);
        progressBar.style.transform = `scaleX(${scrolled})`;
    });
}

// ========================================
// Active Navigation Link
// ========================================
function initActiveNav() {
    const sections = document.querySelectorAll('section[id]');

    window.addEventListener('scroll', () => {
        const scrollY = window.pageYOffset;

        sections.forEach(section => {
            const sectionHeight = section.offsetHeight;
            const sectionTop = section.offsetTop - 150;
            const sectionId = section.getAttribute('id');

            if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    });
}

// ========================================
// Smooth Scroll
// ========================================
function initSmoothScroll() {
    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            const href = this.getAttribute('href');

            // Se for link interno (#)
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(href);

                if (target) {
                    const offsetTop = target.offsetTop - 80; // Compensar header fixo
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
}

// ========================================
// Scroll Reveal Animation
// ========================================
function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                // Opcional: parar de observar após revelar
                // revealObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    });

    reveals.forEach(element => {
        revealObserver.observe(element);
    });
}

// ========================================
// Counter Animation
// ========================================
function initCounters() {
    const counters = document.querySelectorAll('.stat-number');

    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                entry.target.classList.add('counted');
                animateCounter(entry.target);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(counter => {
        counterObserver.observe(counter);
    });
}

function animateCounter(element) {
    const text = element.textContent;
    const hasPercent = text.includes('%');
    const target = parseInt(text.replace(/\D/g, ''));

    let count = 0;
    const increment = target / 60; // 60 frames para animar
    const duration = 2000; // 2 segundos
    const stepTime = duration / 60;

    const timer = setInterval(() => {
        count += increment;
        if (count >= target) {
            element.textContent = target + (hasPercent ? '%' : '');
            clearInterval(timer);
        } else {
            element.textContent = Math.ceil(count) + (hasPercent ? '%' : '');
        }
    }, stepTime);
}

// ========================================
// HUD Seamless Transition
// ========================================
function initHUDTransition() {
    const wipe = document.createElement('div');
    wipe.className = 'hud-wipe';
    wipe.innerHTML = '<div class="hud-wipe-grid"></div><div class="hud-wipe-scanner"></div>';
    document.body.appendChild(wipe);

    const internalLinks = document.querySelectorAll('a[href]:not([target="_blank"]):not([href^="#"]):not([href^="mailto:"]):not([href^="tel:"])');

    internalLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (!href) return;

            e.preventDefault();
            wipe.classList.add('active');

            setTimeout(() => {
                window.location.href = href;
            }, 400); // Meio da animação do wipe
        });
    });
}

// ========================================
// Back to Top Button
// ========================================
function initBackToTop() {
    const button = document.createElement('button');
    button.className = 'back-to-top';
    button.innerHTML = '↑';
    button.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 50px;
        height: 50px;
        background: linear-gradient(135deg, var(--atomic-orange), var(--atomic-red));
        color: white;
        border: none;
        border-radius: 50%;
        font-size: 1.5rem;
        cursor: pointer;
        opacity: 0;
        pointer-events: none;
        transition: all 0.3s ease;
        z-index: 999;
        box-shadow: 0 5px 20px rgba(255, 107, 53, 0.3);
    `;

    document.body.appendChild(button);

    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 500) {
            button.style.opacity = '1';
            button.style.pointerEvents = 'all';
        } else {
            button.style.opacity = '0';
            button.style.pointerEvents = 'none';
        }
    });

    button.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    button.addEventListener('mouseenter', () => {
        button.style.transform = 'translateY(-5px) scale(1.1)';
    });

    button.addEventListener('mouseleave', () => {
        button.style.transform = 'translateY(0) scale(1)';
    });
}

// ========================================
// Lazy Loading de Imagens
// ========================================
function initLazyLoad() {
    const images = document.querySelectorAll('img[data-src]');

    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                imageObserver.unobserve(img);
            }
        });
    });

    images.forEach(img => {
        imageObserver.observe(img);
    });
}

// ========================================
// Preload de Links Importantes
// ========================================
function initLinkPreload() {
    const links = document.querySelectorAll('a[href^="/"]:not([href^="//"]), a[href^="."]:not([href^="//"])');

    links.forEach(link => {
        link.addEventListener('mouseenter', function () {
            const href = this.getAttribute('href');
            if (href && !href.startsWith('#')) {
                // Criar link de preload
                const preloadLink = document.createElement('link');
                preloadLink.rel = 'prefetch';
                preloadLink.href = href;
                document.head.appendChild(preloadLink);
            }
        });
    });
}

// ========================================
// Cursor Customizado (Desktop)
// ========================================
function initCustomCursor() {
    if (window.innerWidth <= 992) return; // Só desktop

    const cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    document.body.appendChild(cursor);

    document.addEventListener('mousemove', (e) => {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
    });

    // Hover em elementos interativos
    const interactives = document.querySelectorAll('a, button, .card, input, textarea');
    interactives.forEach(el => {
        el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
    });
}

// ========================================
// Performance: Debounce
// ========================================
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ========================================
// Resize Handler
// ========================================
function initResizeHandler() {
    const debouncedResize = debounce(() => {
        // Fechar menu mobile se resize para desktop
        if (window.innerWidth > 992) {
            closeMenu();
        }
    }, 250);

    window.addEventListener('resize', debouncedResize);
}

// ========================================
// Log de Carregamento
// ========================================
function logPerformance() {
    window.addEventListener('load', () => {
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        console.log(`%c🚀 E-TOMIC carregado em ${loadTime}ms`, 'color: #FF6B35; font-weight: bold; font-size: 16px;');
    });
}

// ========================================
// Inicialização
// ========================================
function init() {
    console.log('%c⚛️ E-TOMIC v1.0', 'color: #FF6B35; font-weight: bold; font-size: 20px;');

    // Inicializar todos os módulos
    initMobileMenu();
    initHeaderScroll();
    initScrollProgress();
    initActiveNav();
    initSmoothScroll();
    initScrollReveal();
    initCounters();
    initPageTransition();
    initBackToTop();
    initLazyLoad();
    initLinkPreload();
    initResizeHandler();
    initHUDTransition();
    logPerformance();
}

// ========================================
// DOM Ready
// ========================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// ========================================
// Exportar funções úteis
// ========================================
window.ETOMICUtils = {
    closeMenu,
    debounce
};