/* ========================================
   E-TOMIC – BrandScan Integration
   Vanilla JS · Supabase Edge Function
   Fluxo: Modal (form + loading) → redireciona para diagnostico.html
======================================== */

const BRANDSCAN_CONFIG = {
  supabaseUrl: 'https://fuqjlfbwbgxumtxmjbjt.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1cWpsZmJ3Ymd4dW10eG1qYmp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NzQ4NzEsImV4cCI6MjA5MDQ1MDg3MX0.9Cn32jJ3_peD9mcxM17YzTah9-uo_dFp8R1B-MyS5wM',
  functionName: 'brand-scan',
};

// ============================
// Chamar a Supabase Edge Function
// ============================
async function callBrandScan(nome, email, telefone, siteUrl) {
  const url = `${BRANDSCAN_CONFIG.supabaseUrl}/functions/v1/${BRANDSCAN_CONFIG.functionName}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${BRANDSCAN_CONFIG.supabaseKey}`,
      'apikey': BRANDSCAN_CONFIG.supabaseKey,
    },
    body: JSON.stringify({ nome, email, telefone, site_url: siteUrl }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || `Erro HTTP ${resp.status}`);
  }

  const data = await resp.json();
  if (data.error) throw new Error(data.error);
  return data;
}

// ============================
// Trocar fase dentro do modal
// ============================
function showPhase(phase) {
  ['bs-phase-form', 'bs-phase-loading'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  const target = document.getElementById(`bs-phase-${phase}`);
  if (target) target.style.display = phase === 'form' ? 'block' : 'flex';
}

// ============================
// Toast notification
// ============================
function showToast(msg, type = 'info') {
  const t = document.createElement('div');
  t.className = `bs-toast bs-toast--${type}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('bs-toast--visible'), 10);
  setTimeout(() => {
    t.classList.remove('bs-toast--visible');
    setTimeout(() => t.remove(), 400);
  }, 3500);
}

// ============================
// Progress bar steps
// ============================
function updateProgress(phase) {
  const steps = document.querySelectorAll('.bs-progress-step');
  if (!steps.length) return;
  steps.forEach(s => s.classList.remove('bs-progress-step--active', 'bs-progress-step--done'));

  if (phase === 'form') {
    steps[0]?.classList.add('bs-progress-step--active');
  } else if (phase === 'loading') {
    steps[0]?.classList.add('bs-progress-step--done');
    steps[1]?.classList.add('bs-progress-step--active');
  } else if (phase === 'redirect') {
    steps[0]?.classList.add('bs-progress-step--done');
    steps[1]?.classList.add('bs-progress-step--done');
    steps[2]?.classList.add('bs-progress-step--active');
  }
}

// ============================
// Loading animation
// ============================
let loadingInterval = null;
let loadingStepIdx  = 0;
const loadingSteps  = [
  'Acessando o site…',
  'Capturando screenshot…',
  'Analisando identidade visual…',
  'Avaliando proposta de valor…',
  'Checando tom de voz…',
  'Verificando diferenciação…',
  'Calculando score de marca…',
  'Montando relatório completo…',
];

function startLoadingAnim() {
  const el = document.getElementById('bs-loading-step');
  if (!el) return;
  loadingStepIdx = 0;
  el.textContent = loadingSteps[0];
  el.style.opacity = '1';

  loadingInterval = setInterval(() => {
    loadingStepIdx = (loadingStepIdx + 1) % loadingSteps.length;
    el.style.opacity = '0';
    setTimeout(() => {
      el.textContent = loadingSteps[loadingStepIdx];
      el.style.opacity = '1';
    }, 300);
  }, 3800);
}

function stopLoadingAnim() {
  if (loadingInterval) { clearInterval(loadingInterval); loadingInterval = null; }
}

// ============================
// Init BrandScan form (called on pages that have the modal)
// ============================
function initBrandScan() {
  const form = document.getElementById('bs-form');
  if (!form) return;

  console.log('%c⚛️ E-TOMIC BrandScan – pronto', 'color: #FF6B35; font-weight: bold;');

  // Máscara telefone
  const telInput = document.getElementById('bs-telefone');
  if (telInput) {
    telInput.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '');
      if (v.length <= 11) {
        v = v.replace(/^(\d{2})(\d)/, '($1) $2');
        v = v.replace(/(\d)(\d{4})$/, '$1-$2');
      }
      e.target.value = v;
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nome     = document.getElementById('bs-nome')?.value.trim();
    const email    = document.getElementById('bs-email')?.value.trim();
    const telefone = document.getElementById('bs-telefone')?.value.trim();
    const siteUrl  = document.getElementById('bs-site')?.value.trim();

    if (!nome || !email || !telefone || !siteUrl) {
      showToast('Preencha todos os campos.', 'error');
      return;
    }

    // Transição para loading
    showPhase('loading');
    updateProgress('loading');
    startLoadingAnim();

    try {
      const result = await callBrandScan(nome, email, telefone, siteUrl);

      // Salvar no localStorage para a página de relatório
      result.siteUrl = siteUrl;
      result.nome    = nome;
      localStorage.setItem('brandscan_result', JSON.stringify(result));

      // Atualizar progresso visual brevemente antes de redirecionar
      updateProgress('redirect');
      stopLoadingAnim();

      const stepEl = document.getElementById('bs-loading-step');
      if (stepEl) { stepEl.style.opacity = '1'; stepEl.textContent = 'Relatório pronto! Abrindo…'; }

      // Redirecionar para a página de diagnóstico
      setTimeout(() => { window.location.href = 'diagnostico.html'; }, 700);

    } catch (err) {
      console.error('BrandScan error:', err);
      stopLoadingAnim();
      showToast('Erro na análise: ' + (err.message || 'Tente novamente.'), 'error');
      showPhase('form');
      updateProgress('form');
    }
  });
}

// ============================
// DOM Ready
// ============================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBrandScan);
} else {
  initBrandScan();
}

window.ETOMICBrandScan = { showPhase, showToast, updateProgress };
