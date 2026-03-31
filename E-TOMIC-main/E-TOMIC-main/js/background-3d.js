import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// --- CONFIGURAÇÃO DA CENA ---
const scene = new THREE.Scene();
scene.background = new THREE.Color('#020205'); // Fundo azulado escuro original
scene.fog = new THREE.FogExp2('#020205', 0.02);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 20, 30);
camera.lookAt(0, 0, 5);

const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ReinhardToneMapping;

// Procurar container específico ou fallback para o body
const container = document.getElementById('hero-3d-bg') || document.body;
const isGlobal = container === document.body;

renderer.domElement.style.position = isGlobal ? 'fixed' : 'absolute';
renderer.domElement.style.top = '0';
renderer.domElement.style.left = '0';
renderer.domElement.style.width = '100%';
renderer.domElement.style.height = '100%';
renderer.domElement.style.zIndex = '0'; // Atrás do conteúdo, mas visível no container
renderer.domElement.style.pointerEvents = 'none';
container.appendChild(renderer.domElement);

if (!isGlobal) {
    container.style.position = 'relative';
    container.style.overflow = 'hidden';
}

// --- POST-PROCESSING (BLOOM CIANO) ---
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.strength = 2.0;
bloomPass.radius = 0.5;
bloomPass.threshold = 0.1;

const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);

// --- GRID DE PARTÍCULAS ---
const rows = 60;
const cols = 60;
const particleCount = rows * cols;
const spacing = 1.5;

const geometry = new THREE.SphereGeometry(0.15, 16, 16);
const material = new THREE.MeshStandardMaterial({
    color: 0x111111,
    emissive: 0x000000,
    roughness: 0.1,
    metalness: 0.9,
});

const mesh = new THREE.InstancedMesh(geometry, material, particleCount);
scene.add(mesh);

const dummy = new THREE.Object3D();
const positions = [];
const currentY = new Float32Array(particleCount);
const currentEmissive = new Float32Array(particleCount * 3);

// Cores Originais (Ciano Neon: #00ffff)
const colorIdle = new THREE.Color('#050510');
const colorActive = new THREE.Color('#00ffff');

let i = 0;
for (let x = 0; x < rows; x++) {
    for (let z = 0; z < cols; z++) {
        const posX = (x - rows / 2) * spacing;
        const posZ = (z - cols / 2) * spacing;
        positions.push({ x: posX, z: posZ });
        currentY[i] = 0;

        dummy.position.set(posX, 0, posZ);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);

        mesh.setColorAt(i, colorIdle);

        currentEmissive[i * 3] = 0;
        currentEmissive[i * 3 + 1] = 0;
        currentEmissive[i * 3 + 2] = 0;
        i++;
    }
}

// --- LUZ QUE SEGUE O MOUSE ---
const mouseLight = new THREE.PointLight(0x00ffff, 100, 20);
scene.add(mouseLight);

// --- INTERAÇÃO ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const mouseWorldPos = new THREE.Vector3();

window.addEventListener('mousemove', (e) => {
    // Cálculo de mouse relativo ao container se não for global
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    mouse.x = (x / rect.width) * 2 - 1;
    mouse.y = -(y / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    raycaster.ray.intersectPlane(plane, mouseWorldPos);

    mouseLight.position.set(mouseWorldPos.x, 2, mouseWorldPos.z);
});

// --- ANIMAÇÃO ---
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();
    const hoverRadius = 8;

    for (let i = 0; i < particleCount; i++) {
        const px = positions[i].x;
        const pz = positions[i].z;

        const dx = px - mouseWorldPos.x;
        const dz = pz - mouseWorldPos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        let force = 0;
        if (dist < hoverRadius) {
            force = 1 - (dist / hoverRadius);
            force = Math.pow(force, 2);
        }

        const wave = Math.sin(px * 0.5 + time) * Math.cos(pz * 0.3 + time) * 0.2;
        const mouseLift = force * 4;
        const targetHeight = wave + mouseLift;

        currentY[i] += (targetHeight - currentY[i]) * 0.1;

        const targetR = colorActive.r * force * 2;
        const targetG = colorActive.g * force * 2;
        const targetB = colorActive.b * force * 2;

        currentEmissive[i * 3] += (targetR - currentEmissive[i * 3]) * 0.1;
        currentEmissive[i * 3 + 1] += (targetG - currentEmissive[i * 3 + 1]) * 0.1;
        currentEmissive[i * 3 + 2] += (targetB - currentEmissive[i * 3 + 2]) * 0.1;

        dummy.position.set(px, currentY[i], pz);
        const scale = 1 + force;
        dummy.scale.setScalar(scale);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);

        const r = THREE.MathUtils.lerp(colorIdle.r, 1, currentEmissive[i * 3]);
        const g = THREE.MathUtils.lerp(colorIdle.g, 1, currentEmissive[i * 3 + 1]);
        const b = THREE.MathUtils.lerp(colorIdle.b, 1, currentEmissive[i * 3 + 2]);
        mesh.setColorAt(i, new THREE.Color(r, g, b));
    }

    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor.needsUpdate = true;

    // Atualizar tamanho do renderer caso o container mude (ajuste responsivo)
    if (!isGlobal) {
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight;
        if (renderer.domElement.width !== newWidth || renderer.domElement.height !== newHeight) {
            camera.aspect = newWidth / newHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(newWidth, newHeight);
            composer.setSize(newWidth, newHeight);
        }
    }

    composer.render();
}

window.addEventListener('resize', () => {
    if (isGlobal) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        composer.setSize(window.innerWidth, window.innerHeight);
    }
});

animate();
