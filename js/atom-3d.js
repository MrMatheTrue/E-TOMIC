/* ========================================
   E-TOMIC - 3D Atom Scene (Three.js)
======================================== */

// Variáveis Globais para controle externo
window.atomState = {
    expansion: 0, // 0 = Fechado, 1 = Aberto
    speedMultiplier: 1
};

class AtomScene {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.nucleusGroup = null;
        this.electronGroups = [];
        this.time = 0;

        this.init();
        this.animate();

        window.addEventListener('resize', () => this.onWindowResize(), false);
    }

    init() {
        // Cena
        this.scene = new THREE.Scene();

        // Câmera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 15;

        // Renderizador
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            alpha: true,
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Luzes
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xff6b35, 2, 100);
        pointLight.position.set(10, 10, 10);
        this.scene.add(pointLight);

        // Criar Átomo
        this.createNucleus();
        this.createElectrons();
    }

    createNucleus() {
        this.nucleusGroup = new THREE.Group();
        const geometry = new THREE.SphereGeometry(0.8, 32, 32);
        const material = new THREE.MeshPhongMaterial({
            color: 0xff6b35,
            emissive: 0xff2e2e,
            emissiveIntensity: 0.5,
            shininess: 100
        });

        // Criar várias esferas para o núcleo
        for (let i = 0; i < 8; i++) {
            const sphere = new THREE.Mesh(geometry, material);
            const offset = 0.8;
            sphere.position.set(
                (Math.random() - 0.5) * offset,
                (Math.random() - 0.5) * offset,
                (Math.random() - 0.5) * offset
            );
            this.nucleusGroup.add(sphere);
        }

        // Adicionar Glow (Fake Glow com sprite)
        // Simplificado para mesh maior com transparência
        const glowGeo = new THREE.SphereGeometry(2.5, 32, 32);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0xff6b35,
            transparent: true,
            opacity: 0.15,
            side: THREE.BackSide
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        this.nucleusGroup.add(glow);

        this.scene.add(this.nucleusGroup);
    }

    createElectrons() {
        const colors = [0x4CC9F0, 0xB5179E, 0xFFD600];

        for (let i = 0; i < 3; i++) {
            const group = new THREE.Group();

            // Trilha (Orbit)
            const curve = new THREE.EllipseCurve(
                0, 0,            // ax, aY
                5 + i, 5 + i,    // xRadius, yRadius
                0, 2 * Math.PI,  // aStartAngle, aEndAngle
                false, 0         // aClockwise, aRotation
            );

            const points = curve.getPoints(50);
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({
                color: colors[i],
                transparent: true,
                opacity: 0.3
            });

            const ellipse = new THREE.Line(geometry, material);
            ellipse.rotation.x = Math.PI / 2; // Deitado
            group.add(ellipse);

            // Elétron (Partícula)
            const elGeometry = new THREE.SphereGeometry(0.3, 16, 16);
            const elMaterial = new THREE.MeshBasicMaterial({ color: colors[i] });
            const electron = new THREE.Mesh(elGeometry, elMaterial);

            // Adicionando propriedade customizada para animar posição
            electron.userData = { angle: Math.random() * Math.PI * 2, radius: 5 + i, speed: 1 + (i * 0.2) };

            group.add(electron);

            // Rotação inicial aleatória da órbita par não ficarem todas planas
            group.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );

            this.electronGroups.push({ group, electron });
            this.scene.add(group);
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const dt = 0.01;
        this.time += dt;

        // Ler estado global
        // Interpolar valor atual para o alvo suavizado
        if (window.atomApp) {
            const target = typeof window.atomTargetExpansion !== 'undefined' ? window.atomTargetExpansion : 0;
            window.atomState.expansion += (target - window.atomState.expansion) * 0.1;
        }

        const expansion = window.atomState.expansion; // 0 a 1
        const speed = 1 + (expansion * 5); // Mais rápido quando "aberto"

        // Animar Núcleo
        // Se expansion = 1, núcleo "vibra" mais e explode um pouco
        this.nucleusGroup.rotation.y += 0.005 * speed;
        this.nucleusGroup.rotation.z += 0.002 * speed;

        const pulse = 1 + Math.sin(this.time * 2 * speed) * 0.1;
        // Expansão do núcleo baseada na mão - núcleo fica um pouco maior e mais instável
        const size = 1 + (expansion * 0.5);
        this.nucleusGroup.scale.set(size * pulse, size * pulse, size * pulse);

        // Animar Elétrons
        this.electronGroups.forEach((item, index) => {
            // Rotacionar o grupo orbital inteiro
            item.group.rotation.y += 0.002 * (index + 1) * speed;

            // Mover elétron na órbita
            const el = item.electron;
            el.userData.angle += dt * el.userData.speed * speed;

            // Expansão da órbita
            // A órbita real (linha) também precisa crescer visualmente.
            const orbitScale = 1 + (expansion * 1.5);
            item.group.scale.set(orbitScale, orbitScale, orbitScale);

            // O elétron é filho do grupo, então ele escala junto.
            // A posição dele é relativa ao grupo.
            el.position.x = Math.cos(el.userData.angle) * el.userData.radius;
            el.position.z = Math.sin(el.userData.angle) * el.userData.radius;
        });

        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    // Definir variável de alvo global
    window.atomTargetExpansion = 0;

    // Verificar se Three.js foi carregado
    if (typeof THREE !== 'undefined') {
        window.atomApp = new AtomScene('atom-canvas');
        console.log("Atom Scene Initialized");
    } else {
        console.error('Three.js not loaded. Make sure to include CDN in index.html');
    }
});
