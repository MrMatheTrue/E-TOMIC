/* ========================================
   E-TOMIC - Hand Tracking (MediaPipe)
======================================== */

// Configuração do MediaPipe
const videoElement = document.createElement('video');
videoElement.style.display = 'none'; // Escondido, processamento interno
document.body.appendChild(videoElement);

let camera = null;
let hands = null;
let isTrackingActive = false;

// Elementos de UI
const startButton = document.getElementById('start-experience-btn'); // Será criado no HTML
const statusIndicator = document.getElementById('tracking-status');

// Inicialização
async function initHandTracking() {
    if (isTrackingActive) return;

    try {
        console.log("Iniciando Hand Tracking...");

        // Carregar Bibliotecas dinamicamente se não estiverem no head
        // (Mas vamos assumir que estão no HTML via CDN conforme plano)

        hands = new Hands({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            }
        });

        hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        hands.onResults(onResults);

        camera = new Camera(videoElement, {
            onFrame: async () => {
                await hands.send({ image: videoElement });
            },
            width: 640,
            height: 480
        });

        await camera.start();
        isTrackingActive = true;
        console.log("Câmera iniciada.");

        if (statusIndicator) statusIndicator.innerText = "Câmera Ativa: Mostre sua mão!";

    } catch (error) {
        console.error("Erro ao iniciar câmera:", error);
        alert("Não foi possível acessar a câmera. Verifique as permissões.");
    }
}

// Processamento de Resultados
function onResults(results) {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];

        // Detectar Gesto: Aberto ou Fechado?
        // Lógica simples: Distância média da ponta dos dedos ao pulso (landmark 0)

        const wrist = landmarks[0];
        const fingertips = [8, 12, 16, 20]; // Indicador, Médio, Anelar, Mínimo

        let totalDistance = 0;
        fingertips.forEach(index => {
            const tip = landmarks[index];
            const dist = Math.hypot(tip.x - wrist.x, tip.y - wrist.y);
            totalDistance += dist;
        });

        const avgDistance = totalDistance / 4;

        // Calibrar limiares empiricamente
        // Mão aberta ~ 0.3 a 0.5 (depende da proximidade)
        // Mão fechada ~ 0.1 a 0.2

        // Normalizar
        // Vamos considerar "Aberto" se avg > 0.3, "Fechado" se avg < 0.15
        // Mas a profundidade afeta isso. Uma métrica melhor é relativa ao tamanho da palma.
        // Distância WRIST (0) -> MIDDLE_FINGER_MCP (9) é uma boa base de escala.

        const palmSize = Math.hypot(landmarks[9].x - wrist.x, landmarks[9].y - wrist.y);
        const normalizedOpenness = avgDistance / palmSize; // Ratio

        // Ratio Aberto ~ 1.8 a 2.5
        // Ratio Fechado ~ 0.5 a 1.0

        let gestureValue = 0; // 0 = Fechado

        if (normalizedOpenness > 1.6) {
            gestureValue = 1; // Aberto totalmente
        } else if (normalizedOpenness < 0.8) {
            gestureValue = 0; // Fechado
        } else {
            // Interpolar entre
            gestureValue = (normalizedOpenness - 0.8) / (1.6 - 0.8);
        }

        // Atualizar estado global do Átomo
        if (typeof window.atomTargetExpansion !== 'undefined') {
            window.atomTargetExpansion = gestureValue;
        }

        // Debug visual (opcional)
        // console.log(`Openness: ${normalizedOpenness.toFixed(2)} -> Value: ${gestureValue.toFixed(2)}`);
    } else {
        // Nenhuma mão detectada, voltar ao estado de repouso (fechado ou leve pulso)
        if (typeof window.atomTargetExpansion !== 'undefined') {
            window.atomTargetExpansion = 0.2; // Repouso leve
        }
    }
}

// Expor função de start globalmente
window.startHandTracking = initHandTracking;
