(function () {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        const canvas = document.createElement('canvas');
        document.body.prepend(canvas);

        Object.assign(canvas.style, {
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            zIndex: '-1'
        });

        const ctx = canvas.getContext('2d');

        let w, h, dpr;
        let particles = [];
        let time = 0;

        const mouse = { x: -9999, y: -9999 };
        let mouseActive = false;

        const CONFIG = {
            count: 320,
            color: '#FF6B35', // Atomic Orange

            // campo
            fieldScale: 0.0025,
            fieldTime: 0.0006,
            fieldForce: 0.25,
            curlBoost: 3.2,
            curlEps: 1.2,

            // tecido
            neighborRadius: 42,
            neighborForce: 0.0028,

            // mouse
            mouseRadius: 180,
            mouseForce: 0.12,

            // estabilidade
            friction: 0.992,
            idleMotion: 0.06,
            reviveMotion: 0.9,
            centerPull: 0.000002,

            // visual
            strokeMin: 0.2,
            strokeMax: 1.4,
            lengthMin: 0.5,
            lengthMax: 12
        };

        function fieldAngle(x, y, t) {
            const nx = x * CONFIG.fieldScale;
            const ny = y * CONFIG.fieldScale;

            return (
                Math.sin(nx + t) +
                Math.sin(ny * 1.3 - t * 1.2) +
                Math.sin((nx + ny) * 0.7 + t * 0.8)
            );
        }

        class Particle {
            constructor() {
                this.x = Math.random() * w;
                this.y = Math.random() * h;
                this.vx = 0;
                this.vy = 0;
                this.angle = 0;
                this.stroke = CONFIG.strokeMin;
                this.len = CONFIG.lengthMin;
            }

            update() {
                // --- CURL NOISE (campo rotacional) ---
                const e = CONFIG.curlEps;

                const a1 = fieldAngle(this.x + e, this.y, time);
                const a2 = fieldAngle(this.x - e, this.y, time);
                const a3 = fieldAngle(this.x, this.y + e, time);
                const a4 = fieldAngle(this.x, this.y - e, time);

                const dx = a1 - a2;
                const dy = a3 - a4;

                this.vx += -dy * CONFIG.fieldForce * CONFIG.curlBoost;
                this.vy += dx * CONFIG.fieldForce * CONFIG.curlBoost;

                // --- INTERAÇÃO LOCAL (tecido) ---
                for (const other of particles) {
                    if (other === this) continue;

                    const dx = other.x - this.x;
                    const dy = other.y - this.y;
                    const d2 = dx * dx + dy * dy;

                    if (d2 > 0 && d2 < CONFIG.neighborRadius ** 2) {
                        const d = Math.sqrt(d2);
                        const f = (1 - d / CONFIG.neighborRadius) * CONFIG.neighborForce;
                        this.vx -= dx * f;
                        this.vy -= dy * f;
                    }
                }

                // --- MOUSE ---
                const mdx = this.x - mouse.x;
                const mdy = this.y - mouse.y;
                const md = Math.hypot(mdx, mdy);

                let influence = 0;

                if (mouseActive && md < CONFIG.mouseRadius && md > 0.001) {
                    influence = 1 - md / CONFIG.mouseRadius;
                    this.vx += (mdx / md) * influence * CONFIG.mouseForce;
                    this.vy += (mdy / md) * influence * CONFIG.mouseForce;
                }

                // --- FORÇA DE RETORNO (anti fuga) ---
                const cx = w * 0.5;
                const cy = h * 0.5;
                this.vx += (cx - this.x) * CONFIG.centerPull;
                this.vy += (cy - this.y) * CONFIG.centerPull;

                // --- FRICÇÃO ---
                this.vx *= CONFIG.friction;
                this.vy *= CONFIG.friction;

                // --- MOTION PERPÉTUO ---
                const idle = CONFIG.idleMotion;
                this.vx += (Math.random() - 0.5) * idle;
                this.vy += (Math.random() - 0.5) * idle;

                // --- REVIVE QUANDO MOUSE SAI ---
                if (!mouseActive) {
                    const r = CONFIG.reviveMotion;
                    this.vx += (Math.random() - 0.5) * r;
                    this.vy += (Math.random() - 0.5) * r;
                }

                // --- POSIÇÃO ---
                this.x += this.vx;
                this.y += this.vy;

                // wrap
                if (this.x < 0) this.x = w;
                if (this.x > w) this.x = 0;
                if (this.y < 0) this.y = h;
                if (this.y > h) this.y = 0;

                // --- VISUAL ---
                this.angle = Math.atan2(this.vy, this.vx);

                // zonas
                const paddingR = CONFIG.mouseRadius * 0.45; // empurra (já usado na física)
                const marginR = CONFIG.mouseRadius;        // limite visual

                let visualInfluence = 0;

                if (mouseActive && md < marginR) {
                    // distância relativa ao padding (borda visual)
                    const d = Math.abs(md - paddingR);

                    // quanto mais perto da BORDA do padding, maior o stroke
                    visualInfluence = Math.max(0, 1 - d / (marginR - paddingR));
                }

                // easing suave (anti banding)
                visualInfluence = visualInfluence * visualInfluence;

                const targetStroke =
                    CONFIG.strokeMin +
                    visualInfluence * (CONFIG.strokeMax - CONFIG.strokeMin);

                const targetLen =
                    CONFIG.lengthMin +
                    visualInfluence * (CONFIG.lengthMax - CONFIG.lengthMin);

                this.stroke += (targetStroke - this.stroke) * 0.18;
                this.len += (targetLen - this.len) * 0.18;
            }

            draw() {
                if (this.len < 1.5) {
                    ctx.fillRect(this.x, this.y, 1, 1);
                } else {
                    ctx.lineWidth = this.stroke;
                    ctx.beginPath();
                    ctx.moveTo(this.x, this.y);
                    ctx.lineTo(
                        this.x - Math.cos(this.angle) * this.len,
                        this.y - Math.sin(this.angle) * this.len
                    );
                    ctx.stroke();
                }
            }
        }

        function resize() {
            dpr = window.devicePixelRatio || 1;
            w = window.innerWidth;
            h = window.innerHeight;

            canvas.width = w * dpr;
            canvas.height = h * dpr;
            canvas.style.width = w + 'px';
            canvas.style.height = h + 'px';
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            particles = Array.from({ length: CONFIG.count }, () => new Particle());
        }

        function animate() {
            time += CONFIG.fieldTime * w;

            ctx.clearRect(0, 0, w, h);
            ctx.strokeStyle = CONFIG.color;
            ctx.fillStyle = CONFIG.color;
            ctx.lineCap = 'round';

            for (const p of particles) {
                p.update();
                p.draw();
            }

            requestAnimationFrame(animate);
        }

        window.addEventListener('mousemove', e => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
            mouseActive = true;
        }, { passive: true });

        window.addEventListener('mouseleave', () => {
            mouseActive = false;
        });

        window.addEventListener('resize', resize);

        resize();
        animate();
    }
})();
