/* ========================================
   E-TOMIC - JavaScript do Formulário
   Validação, Submissão, Integração
   VERSÃO SEM CORS - 100% Funcional
======================================== */

// ========================================
// Configuração do Formulário
// ========================================
const FORM_CONFIG = {
    // URL do Google Sheets Apps Script ou API
    submitURL: 'https://script.google.com/macros/s/AKfycbzbmyq-ZQHw6SVi-nsy04n2nZwp55bu7_W9PepG1qlNYMCnkjCaWDyyzS38mITKnlbd6Q/exec',

    // Mensagens
    messages: {
        success: '✅ Mensagem enviada com sucesso! Entraremos em contato em breve.',
        error: '❌ Erro ao enviar. Por favor, tente novamente.',
        invalidEmail: 'Por favor, insira um e-mail válido.',
        requiredField: 'Este campo é obrigatório.',
        invalidPhone: 'Por favor, insira um telefone válido.',
    },

    // Validação
    emailRegex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phoneRegex: /^[\d\s\(\)\-\+]+$/,
};

// ========================================
// Classe Form Handler
// ========================================
class FormHandler {
    constructor(formId) {
        this.form = document.getElementById(formId);
        if (!this.form) return;

        this.submitButton = this.form.querySelector('[type="submit"]');
        this.fields = this.form.querySelectorAll('input, textarea, select');

        this.init();
    }

    init() {
        // Prevenir submit padrão
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        // Validação em tempo real
        this.fields.forEach(field => {
            field.addEventListener('blur', () => this.validateField(field));
            field.addEventListener('input', () => this.clearFieldError(field));
        });

        // Máscaras
        this.initMasks();
    }

    // ========================================
    // Validação de Campos
    // ========================================
    validateField(field) {
        const value = field.value.trim();
        const type = field.type;
        const required = field.hasAttribute('required');

        // Limpar erros anteriores
        this.clearFieldError(field);

        // Campo obrigatório vazio
        if (required && !value) {
            this.showFieldError(field, FORM_CONFIG.messages.requiredField);
            return false;
        }

        // Validar e-mail
        if (type === 'email' && value && !FORM_CONFIG.emailRegex.test(value)) {
            this.showFieldError(field, FORM_CONFIG.messages.invalidEmail);
            return false;
        }

        // Validar telefone
        if (type === 'tel' && value && !FORM_CONFIG.phoneRegex.test(value)) {
            this.showFieldError(field, FORM_CONFIG.messages.invalidPhone);
            return false;
        }

        return true;
    }

    validateForm() {
        let isValid = true;

        this.fields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        return isValid;
    }

    showFieldError(field, message) {
        field.classList.add('error');

        // Criar mensagem de erro
        let errorElement = field.parentElement.querySelector('.field-error');
        if (!errorElement) {
            errorElement = document.createElement('span');
            errorElement.className = 'field-error';
            field.parentElement.appendChild(errorElement);
        }
        errorElement.textContent = message;
        errorElement.style.cssText = `
            color: var(--atomic-red);
            font-size: 0.85rem;
            margin-top: 0.3rem;
            display: block;
            animation: shake 0.3s ease;
        `;
    }

    clearFieldError(field) {
        field.classList.remove('error');
        const errorElement = field.parentElement.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
    }

    // ========================================
    // Submit do Formulário
    // ========================================
    async handleSubmit() {
        // Validar formulário
        if (!this.validateForm()) {
            this.showNotification(FORM_CONFIG.messages.error, 'error');
            return;
        }

        // Coletar dados
        const formData = new FormData(this.form);
        const data = Object.fromEntries(formData.entries());
        data.timestamp = new Date().toISOString();
        data.page = window.location.pathname;

        // Desabilitar botão
        this.setLoading(true);

        try {
            // Enviar para backend (SEM CORS)
            if (FORM_CONFIG.submitURL) {
                await this.submitViaIframe(data);
            } else {
                // Modo demo - apenas log
                console.log('📝 Dados do formulário:', data);
                await this.simulateSubmit();
            }

            // Sucesso
            this.showNotification(FORM_CONFIG.messages.success, 'success');
            this.resetForm();

            // Fechar modal após 1.5s
            setTimeout(() => {
                const overlay = document.querySelector('.form-overlay.active');
                if (overlay) {
                    overlay.classList.remove('active');
                    document.body.style.overflow = '';
                }
            }, 1500);

            // Tracking (opcional)
            this.trackConversion();

        } catch (error) {
            console.error('Erro no envio:', error);
            this.showNotification(FORM_CONFIG.messages.error, 'error');
        } finally {
            this.setLoading(false);
        }
    }

    // ========================================
    // NOVO MÉTODO: Submit via Iframe (SEM CORS)
    // ========================================
    async submitViaIframe(data) {
        return new Promise((resolve) => {
            // Criar iframe oculto
            const iframe = document.createElement('iframe');
            iframe.name = 'etomic-submit-frame';
            iframe.style.display = 'none';
            document.body.appendChild(iframe);

            // Criar formulário temporário
            const form = document.createElement('form');
            form.action = FORM_CONFIG.submitURL;
            form.method = 'POST';
            form.target = 'etomic-submit-frame';

            // Adicionar campos ao formulário
            Object.entries(data).forEach(([key, value]) => {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = key;
                input.value = value;
                form.appendChild(input);
            });

            // Adicionar formulário ao body
            document.body.appendChild(form);

            // Log para debug
            console.log('📤 Enviando dados:', data);

            // Submeter formulário
            form.submit();

            // Aguardar 2 segundos e considerar sucesso
            // (Não conseguimos ler resposta cross-domain, mas o Apps Script vai processar)
            setTimeout(() => {
                // Limpar
                document.body.removeChild(form);
                document.body.removeChild(iframe);
                resolve();
            }, 2000);
        });
    }

    async simulateSubmit() {
        // Simular delay de envio
        return new Promise(resolve => setTimeout(resolve, 1500));
    }

    // ========================================
    // UI Helpers
    // ========================================
    setLoading(isLoading) {
        if (!this.submitButton) return;

        if (isLoading) {
            this.submitButton.disabled = true;
            this.submitButton.dataset.originalText = this.submitButton.textContent;
            this.submitButton.textContent = 'Enviando...';
            this.submitButton.style.opacity = '0.7';
        } else {
            this.submitButton.disabled = false;
            this.submitButton.textContent = this.submitButton.dataset.originalText;
            this.submitButton.style.opacity = '1';
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            padding: 1.5rem 2rem;
            background: ${type === 'success' ? 'var(--atomic-orange)' : 'var(--atomic-red)'};
            color: white;
            border-radius: 10px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            font-weight: 600;
            animation: slideInRight 0.5s ease, slideOutRight 0.5s ease 3s forwards;
        `;

        document.body.appendChild(notification);

        // CSS de animação
        if (!document.getElementById('notification-style')) {
            const style = document.createElement('style');
            style.id = 'notification-style';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(400px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(400px); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        setTimeout(() => notification.remove(), 3500);
    }

    resetForm() {
        this.form.reset();
        this.fields.forEach(field => this.clearFieldError(field));
    }

    trackConversion() {
        // Google Analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'form_submit', {
                'event_category': 'engagement',
                'event_label': 'contact_form'
            });
        }

        // Facebook Pixel
        if (typeof fbq !== 'undefined') {
            fbq('track', 'Lead');
        }

        console.log('📊 Conversão rastreada');

        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
            event: 'lead_submit_success',
            page_path: location.pathname
        });
    }

    // ========================================
    // Máscaras de Input
    // ========================================
    initMasks() {
        // Máscara de telefone
        const phoneInputs = this.form.querySelectorAll('input[type="tel"]');
        phoneInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');

                if (value.length <= 11) {
                    value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
                    value = value.replace(/(\d)(\d{4})$/, '$1-$2');
                }

                e.target.value = value;
            });
        });

        // Máscara de CEP
        const cepInputs = this.form.querySelectorAll('input[data-mask="cep"]');
        cepInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                value = value.replace(/^(\d{5})(\d)/, '$1-$2');
                e.target.value = value.slice(0, 9);
            });
        });
    }
}

// ========================================
// Modal de Formulário
// ========================================
class FormModal {
    constructor(modalId) {
        this.modal = document.getElementById(modalId);
        if (!this.modal) return;

        this.overlay = this.modal.closest('.form-overlay');
        this.closeBtn = this.modal.querySelector('.form-close');

        this.init();
    }

    init() {
        // Botões de abrir
        const openButtons = document.querySelectorAll('[data-form-open]');
        openButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.open();
            });
        });

        // Botão de fechar
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.close());
        }

        // Fechar ao clicar no overlay
        if (this.overlay) {
            this.overlay.addEventListener('click', (e) => {
                if (e.target === this.overlay) {
                    this.close();
                }
            });
        }

        // Fechar com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen()) {
                this.close();
            }
        });
    }

    open() {
        if (this.overlay) {
            this.overlay.classList.add('active');
            document.body.style.overflow = 'hidden';

            // Focar primeiro campo
            const firstInput = this.modal.querySelector('input, textarea');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    }

    close() {
        if (this.overlay) {
            this.overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    isOpen() {
        return this.overlay?.classList.contains('active');
    }
}

// ========================================
// Integração com Google Sheets (Backup)
// ========================================
async function submitToGoogleSheets(data) {
    // Backup usando fetch direto (pode ter CORS)
    const scriptURL = FORM_CONFIG.submitURL;

    if (!scriptURL) {
        console.warn('URL do Google Sheets não configurada');
        return;
    }

    try {
        const response = await fetch(scriptURL, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'text/plain',
            }
        });

        return response.json();
    } catch (error) {
        console.error('Erro ao enviar para Google Sheets:', error);
        throw error;
    }
}

// ========================================
// Validação de E-mail via API (opcional)
// ========================================
async function validateEmailAPI(email) {
    // Exemplo usando API de validação de e-mail
    try {
        const response = await fetch(`https://api.email-validator.net/api/verify?EmailAddress=${email}`);
        const data = await response.json();
        return data.status === 200;
    } catch (error) {
        console.warn('Não foi possível validar e-mail via API:', error);
        return true; // Assumir válido se API falhar
    }
}

// ========================================
// Auto-save (salvar localmente enquanto preenche)
// ========================================
class FormAutoSave {
    constructor(formId) {
        this.form = document.getElementById(formId);
        if (!this.form) return;

        this.storageKey = `form_autosave_${formId}`;
        this.init();
    }

    init() {
        // Carregar dados salvos
        this.loadSavedData();

        // Salvar a cada mudança
        this.form.addEventListener('input', () => {
            this.saveData();
        });

        // Limpar ao enviar
        this.form.addEventListener('submit', () => {
            this.clearSavedData();
        });
    }

    saveData() {
        const formData = new FormData(this.form);
        const data = Object.fromEntries(formData.entries());
        localStorage.setItem(this.storageKey, JSON.stringify(data));
    }

    loadSavedData() {
        const savedData = localStorage.getItem(this.storageKey);
        if (!savedData) return;

        const data = JSON.parse(savedData);
        Object.entries(data).forEach(([name, value]) => {
            const field = this.form.querySelector(`[name="${name}"]`);
            if (field) {
                field.value = value;
            }
        });
    }

    clearSavedData() {
        localStorage.removeItem(this.storageKey);
    }
}

// ========================================
// Inicialização
// ========================================
function initForms() {
    console.log('%c📝 Inicializando formulários E-TOMIC...', 'color: #FFB800; font-weight: bold;');
    console.log('%c✅ Método SEM CORS ativado', 'color: #4CAF50; font-weight: bold;');

    // Inicializar formulário principal
    const contactForm = new FormHandler('leadForm');

    // Inicializar modal
    const formModal = new FormModal('formOverlay');

    // Auto-save (opcional)
    // const autoSave = new FormAutoSave('leadForm');
}

// ========================================
// DOM Ready
// ========================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initForms);
} else {
    initForms();
}

// ========================================
// Exportar
// ========================================
window.ETOMICForms = {
    FormHandler,
    FormModal,
    FormAutoSave,
    submitToGoogleSheets,
    validateEmailAPI
};