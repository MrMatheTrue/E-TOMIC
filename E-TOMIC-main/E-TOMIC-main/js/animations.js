/* ========================================
   E-TOMIC - JavaScript de Animações
   Partículas, Efeitos Visuais, GSAP-like
======================================== */

// ========================================
// Partículas de Fundo
// ========================================
class ParticleSystem {
    constructor(container) {
        this.container = container;
        this.particles = [];
        this.particleCount = window.innerWidth > 768 ? 30 : 15;
        this.init();
    }

    init() {
        // Criar container de partículas
        const particlesBg = document.createElement('div');
        particlesBg.className = 'particles-bg';
        this.container.appendChild(particlesBg);

        // Criar partículas
        for (let i = 0; i < this.particleCount; i++) {
            this.createParticle(particlesBg);
        }
    }

    createParticle(container) {
        const particle = document.createElement('div');
        particle.className = 'particle';

        // Posição e tamanho aleatórios
        const size = Math.random() * 4 + 2;
        const startX = Math.random() * 100;
        const duration = Math.random() * 10 + 10;
        const delay = Math.random() * 5;

        particle.style.cssText = `
            left: ${startX}%;
            width: ${size}px;
            height: ${size}px;
            animation-duration: ${duration}s;
            animation-delay: ${delay}s;
        `;

        container.appendChild(particle);
        this.particles.push(particle);
    }

    destroy() {
        this.particles.forEach(p => p.remove());
        this.particles = [];
    }
}

// ========================================
// Círculos de Energia
// ========================================
function initEnergyCircles() {
    const hero = document.querySelector('.hero');
    if (!hero) return;

    for (let i = 0; i < 3; i++) {
        const circle = document.createElement('div');
        circle.className = 'energy-circle';
        circle.style.cssText = `
            top: ${Math.random() * 100}%;
            left: ${Math.random() * 100}%;
            animation-delay: ${i * 1.5}s;
            opacity: ${0.3 - i * 0.1};
        `;
        hero.appendChild(circle);
    }
}

// ========================================
// Parallax Scroll
// ========================================
class ParallaxEffect {
    constructor() {
        this.elements = document.querySelectorAll('[data-parallax]');
        this.init();
    }

    init() {
        if (this.elements.length === 0) return;

        window.addEventListener('scroll', () => {
            this.update();
        });

        this.update();
    }

    update() {
        const scrolled = window.pageYOffset;

        this.elements.forEach(element => {
            const speed = element.dataset.parallax || 0.5;
            const yPos = -(scrolled * speed);
            element.style.transform = `translateY(${yPos}px)`;
        });
    }
}

// ========================================
// Hover Magnético
// ========================================
function initMagneticButtons() {
    const buttons = document.querySelectorAll('[data-magnetic]');

    buttons.forEach(button => {
        button.addEventListener('mousemove', function (e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            this.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
        });

        button.addEventListener('mouseleave', function () {
            this.style.transform = 'translate(0, 0)';
        });
    });
}

// ========================================
// Text Reveal Animation
// ========================================
function initTextReveal() {
    const texts = document.querySelectorAll('[data-text-reveal]');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const text = entry.target;
                const content = text.textContent;
                text.textContent = '';
                text.style.opacity = '1';

                // Split em caracteres
                const chars = content.split('');
                chars.forEach((char, index) => {
                    const span = document.createElement('span');
                    span.textContent = char === ' ' ? '\u00A0' : char;
                    span.style.cssText = `
                        opacity: 0;
                        display: inline-block;
                        animation: fadeInChar 0.5s ease forwards;
                        animation-delay: ${index * 0.03}s;
                    `;
                    text.appendChild(span);
                });

                observer.unobserve(text);
            }
        });
    }, { threshold: 0.5 });

    // Adicionar animação CSS
    if (texts.length > 0) {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeInChar {
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            [data-text-reveal] span {
                transform: translateY(10px);
            }
        `;
        document.head.appendChild(style);
    }

    texts.forEach(text => observer.observe(text));
}

// ========================================
// Stagger Animation
// ========================================
function initStaggerAnimation() {
    const groups = document.querySelectorAll('[data-stagger]');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const children = entry.target.children;
                const delay = parseFloat(entry.target.dataset.staggerDelay) || 0.1;

                Array.from(children).forEach((child, index) => {
                    setTimeout(() => {
                        child.classList.add('stagger-animate');
                    }, index * delay * 1000);
                });

                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });

    // CSS para animação
    if (groups.length > 0) {
        const style = document.createElement('style');
        style.textContent = `
            [data-stagger] > * {
                opacity: 0;
                transform: translateY(30px);
                transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
            }
            [data-stagger] > *.stagger-animate {
                opacity: 1;
                transform: translateY(0);
            }
        `;
        document.head.appendChild(style);
    }

    groups.forEach(group => observer.observe(group));
}

// ========================================
// Hover 3D Tilt
// ========================================
function init3DTilt() {
    const cards = document.querySelectorAll('[data-tilt], .card');

    cards.forEach(card => {
        // Criar elemento de brilho/gloss se não existir
        let gloss = card.querySelector('.card-gloss');
        if (!gloss) {
            gloss = document.createElement('div');
            gloss.className = 'card-gloss';
            card.appendChild(gloss);
        }

        card.addEventListener('mousemove', function (e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            // Suavizado drasticamente (/25 ao invés de /12) para manter legibilidade
            const rotateX = (y - centerY) / 25;
            const rotateY = (centerX - x) / 25;

            this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03) translateY(-5px)`;
            this.style.boxShadow = `0 15px 35px rgba(0, 0, 0, 0.4), 0 0 15px rgba(255, 107, 53, 0.15)`;

            // Mover o brilho
            const percentX = (x / rect.width) * 100;
            const percentY = (y / rect.height) * 100;
            gloss.style.background = `radial-gradient(circle at ${percentX}% ${percentY}%, rgba(255, 255, 255, 0.1) 0%, transparent 70%)`;
            gloss.style.opacity = '1';
        });

        card.addEventListener('mouseleave', function () {
            this.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1) translateY(0)';
            this.style.boxShadow = '';
            gloss.style.opacity = '0';
        });
    });
}

function initSpaceReveal() {
    const reveals = document.querySelectorAll('.reveal-space');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    reveals.forEach((el, index) => {
        el.style.animationDelay = `${index * 0.15}s`;
        observer.observe(el);
    });
}

// ========================================
// Scroll Velocity Effect
// ========================================
class ScrollVelocity {
    constructor() {
        this.lastScrollTop = 0;
        this.velocity = 0;
        this.init();
    }

    init() {
        let ticking = false;

        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    this.update();
                    ticking = false;
                });
                ticking = true;
            }
        });
    }

    update() {
        const scrollTop = window.pageYOffset;
        this.velocity = Math.abs(scrollTop - this.lastScrollTop);
        this.lastScrollTop = scrollTop;

        // Aplicar efeito baseado na velocidade
        document.documentElement.style.setProperty('--scroll-velocity', this.velocity);
    }
}

// ========================================
// Image Reveal on Scroll
// ========================================
function initImageReveal() {
    const images = document.querySelectorAll('[data-image-reveal]');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.style.clipPath = 'inset(0 0 0 0)';
                img.style.opacity = '1';
                observer.unobserve(img);
            }
        });
    }, { threshold: 0.2 });

    images.forEach(img => {
        img.style.cssText = `
            clip-path: inset(0 100% 0 0);
            opacity: 0;
            transition: clip-path 1s cubic-bezier(0.77, 0, 0.175, 1),
                        opacity 1s ease;
        `;
        observer.observe(img);
    });
}

// ========================================
// Glow Effect no Mouse
// ========================================
function initMouseGlow() {
    if (window.innerWidth <= 768) return; // Só desktop

    const glow = document.createElement('div');
    glow.style.cssText = `
        position: fixed;
        width: 400px;
        height: 400px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(255, 107, 53, 0.15) 0%, transparent 70%);
        pointer-events: none;
        z-index: 0;
        transition: opacity 0.3s ease;
        opacity: 0;
    `;
    document.body.appendChild(glow);

    document.addEventListener('mousemove', (e) => {
        glow.style.left = (e.clientX - 200) + 'px';
        glow.style.top = (e.clientY - 200) + 'px';
        glow.style.opacity = '1';
    });

    document.addEventListener('mouseleave', () => {
        glow.style.opacity = '0';
    });
}

// ========================================
// Number Count Animation (Alternativa)
// ========================================
function animateNumber(element, target, duration = 2000) {
    const start = 0;
    const increment = target / (duration / 16); // 60fps
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = Math.floor(target);
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
}

// ========================================
// Ripple Effect nos Botões
// ========================================
function initRippleEffect() {
    const buttons = document.querySelectorAll('.btn, button');

    buttons.forEach(button => {
        button.addEventListener('click', function (e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.5);
                top: ${y}px;
                left: ${x}px;
                transform: scale(0);
                animation: ripple 0.6s ease-out;
                pointer-events: none;
            `;

            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);

            setTimeout(() => ripple.remove(), 600);
        });
    });

    // CSS da animação
    if (!document.getElementById('ripple-style')) {
        const style = document.createElement('style');
        style.id = 'ripple-style';
        style.textContent = `
            @keyframes ripple {
                to {
                    transform: scale(2);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// ========================================
// Smooth Scroll com Easing
// ========================================
function smoothScrollTo(target, duration = 1000) {
    const targetPosition = target.offsetTop - 80;
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    let startTime = null;

    function animation(currentTime) {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const run = ease(timeElapsed, startPosition, distance, duration);
        window.scrollTo(0, run);
        if (timeElapsed < duration) requestAnimationFrame(animation);
    }

    // Easing function (easeInOutCubic)
    function ease(t, b, c, d) {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t * t + b;
        t -= 2;
        return c / 2 * (t * t * t + 2) + b;
    }
}

// ========================================
// HUD Cursor & Magnetic Effects
// ========================================
class HUDCursor {
    constructor() {
        if (window.innerWidth <= 1024) return;
        this.cursor = document.createElement('div');
        this.cursor.className = 'custom-cursor-hud';
        this.coords = document.createElement('div');
        this.coords.className = 'custom-cursor-hud-coords';
        this.cursor.appendChild(this.coords);
        document.body.appendChild(this.cursor);
        this.init();
    }

    init() {
        document.addEventListener('mousemove', (e) => {
            requestAnimationFrame(() => {
                this.cursor.style.transform = `translate(${e.clientX - 10}px, ${e.clientY - 10}px)`;
                this.coords.textContent = `X:${Math.round(e.clientX)} Y:${Math.round(e.clientY)}`;
            });
        });

        const interactives = document.querySelectorAll('a, button, .card');
        interactives.forEach(el => {
            el.addEventListener('mouseenter', () => this.cursor.classList.add('hover'));
            el.addEventListener('mouseleave', () => this.cursor.classList.remove('hover'));
        });
    }
}

// ========================================
// Text Scramble Effect (HUD Decrypt)
// ========================================
class TextScramble {
    constructor(el) {
        this.el = el;
        this.chars = '!<>-_\\/[]{}—=+*^?#________';
        this.update = this.update.bind(this);
    }
    setText(newText) {
        const oldText = this.el.innerText;
        const length = Math.max(oldText.length, newText.length);
        const promise = new Promise((resolve) => this.resolve = resolve);
        this.queue = [];
        for (let i = 0; i < length; i++) {
            const from = oldText[i] || '';
            const to = newText[i] || '';
            const start = Math.floor(Math.random() * 40);
            const end = start + Math.floor(Math.random() * 40);
            this.queue.push({ from, to, start, end });
        }
        cancelAnimationFrame(this.frameRequest);
        this.frame = 0;
        this.update();
        return promise;
    }
    update() {
        let output = '';
        let complete = 0;
        for (let i = 0, n = this.queue.length; i < n; i++) {
            let { from, to, start, end, char } = this.queue[i];
            if (this.frame >= end) {
                complete++;
                output += to;
            } else if (this.frame >= start) {
                if (!char || Math.random() < 0.28) {
                    char = this.randomChar();
                    this.queue[i].char = char;
                }
                output += `<span class="scramble-char">${char}</span>`;
            } else {
                output += from;
            }
        }
        this.el.innerHTML = output;
        if (complete === this.queue.length) {
            this.resolve();
        } else {
            this.frameRequest = requestAnimationFrame(this.update);
            this.frame++;
        }
    }
    randomChar() {
        return this.chars[Math.floor(Math.random() * this.chars.length)];
    }
}

function initHUDInteractions() {
    new HUDCursor();
    const scrollers = document.querySelectorAll('.nav-link, .btn-header');
    scrollers.forEach(el => {
        const fx = new TextScramble(el);
        const original = el.innerText;
        el.addEventListener('mouseenter', () => fx.setText(original));
    });
}

// ========================================
// Inicialização de Todas as Animações
// ========================================
function initAnimations() {
    console.log('%c✨ Inicializando animações...', 'color: #FFB800; font-weight: bold;');

    // Inicializar sistemas
    const hero = document.querySelector('.hero');
    if (hero && window.innerWidth > 768) {
        new ParticleSystem(hero);
    }

    initEnergyCircles();
    new ParallaxEffect();
    initMagneticButtons();
    initTextReveal();
    initStaggerAnimation();
    init3DTilt();
    initSpaceReveal();
    new ScrollVelocity();
    initImageReveal();
    initMouseGlow();
    initRippleEffect();
    initHUDInteractions();
}

// ========================================
// Inicializar quando DOM estiver pronto
// ========================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAnimations);
} else {
    initAnimations();
}

// ========================================
// Exportar para uso global
// ========================================
window.ETOMICAnimations = {
    ParticleSystem,
    ParallaxEffect,
    ScrollVelocity,
    animateNumber,
    smoothScrollTo
};
