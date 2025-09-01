// script.js - Versión corregida (sin módulos, compatible con tu backend)

document.addEventListener('DOMContentLoaded', () => {
    // Elementos del DOM
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const uploadBtn = document.getElementById('uploadBtn');
    const fileInput = document.getElementById('fileInput');
    const chatContainer = document.getElementById('chatContainer');
    const menuToggle = document.getElementById('menuToggle');
    const menuPanel = document.getElementById('menuPanel');
    const closeMenu = document.getElementById('closeMenu');
    const themeOption = document.getElementById('themeOption');
    const audioOption = document.getElementById('audioOption');
    const toggleMathBtn = document.getElementById('toggleMathBtn');
    const mathToolbar = document.getElementById('mathToolbar');
    const closeGraph = document.getElementById('closeGraph');
    const graphContainer = document.getElementById('graphContainer');

    // Verificación de elementos
    if (!userInput || !sendBtn || !chatContainer) {
        console.error('❌ No se encontraron elementos del DOM');
        return;
    }

    // Estados
    let isDarkMode = localStorage.getItem('darkMode') === 'true';
    let isVoiceEnabled = localStorage.getItem('isVoiceEnabled') !== 'false';
    let isSending = false;

    // Aplicar modo oscuro
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
    }

    // Actualizar UI de configuración
    function updateThemeUI() {
        const icon = themeOption.querySelector('i');
        const span = themeOption.querySelector('span');
        if (isDarkMode) {
            icon.className = 'fas fa-sun';
            span.textContent = 'Modo Claro';
        } else {
            icon.className = 'fas fa-moon';
            span.textContent = 'Modo Oscuro';
        }
    }

    function updateAudioUI() {
        const icon = audioOption.querySelector('i');
        const span = audioOption.querySelector('span');
        if (isVoiceEnabled) {
            icon.className = 'fas fa-volume-up';
            span.textContent = 'Voz Activada';
        } else {
            icon.className = 'fas fa-volume-mute';
            span.textContent = 'Voz Desactivada';
        }
    }

    // Inicializar UI
    updateThemeUI();
    updateAudioUI();

    // === ENVIAR MENSAJE ===
    async function sendMessage() {
        if (isSending) return;
        const text = userInput.value.trim();
        if (!text) return;

        isSending = true;

        // Mostrar mensaje del usuario
        addMessage(text, 'user');
        userInput.value = '';

        // Mostrar indicador de "pensando"
        const typing = document.createElement('div');
        typing.className = 'message bot';
        typing.innerHTML = `
            <div class="avatar bot-avatar">
                <img src="tutor-avatar.png" alt="Tutor">
            </div>
            <div class="message-content">Pensando...</div>
        `;
        chatContainer.appendChild(typing);
        chatContainer.scrollTop = chatContainer.scrollHeight;

        try {
            const response = await fetch('/analizar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ consulta: text }) // ✅ CLAVE: "consulta", no "text"
            });

            const data = await response.json();
            typing.remove(); // Quitar "Pensando..."

            if (data.respuesta) {
                addMessage(data.respuesta, 'bot');
                if (isVoiceEnabled) {
                    speakText(data.respuesta);
                }
            } else {
                addMessage("⚠️ No pude procesar tu pregunta.", 'bot');
            }
        } catch (err) {
            typing.remove();
            addMessage("🔴 Error de conexión. Intenta recargar.", 'bot');
            console.error('Error:', err);
        } finally {
            isSending = false;
        }
    }

    sendBtn.addEventListener('click', sendMessage);

    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // === AÑADIR MENSAJE AL CHAT ===
    function addMessage(text, sender) {
        const div = document.createElement('div');
        div.className = `message ${sender}`;

        const avatar = document.createElement('div');
        avatar.className = `avatar ${sender}-avatar`;

        if (sender === 'bot') {
            const img = document.createElement('img');
            img.src = 'tutor-avatar.png';
            img.alt = 'Tutor MatyMat-01';
            avatar.appendChild(img);
        } else {
            avatar.innerHTML = '<i class="fas fa-user"></i>';
        }

        const content = document.createElement('div');
        content.className = 'message-content';
        content.textContent = text;

        div.appendChild(avatar);
        div.appendChild(content);
        chatContainer.appendChild(div);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    // === SÍNTESIS DE VOZ (sin importar módulos) ===
    function speakText(texto) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(texto);
            utterance.lang = 'es-ES';
            utterance.rate = 0.9;
            utterance.pitch = 1;
            speechSynthesis.speak(utterance);
        }
    }

    // === MENÚ DE CONFIGURACIÓN ===
    if (menuToggle && menuPanel && closeMenu) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            menuPanel.style.display = 'block';
        });

        closeMenu.addEventListener('click', () => {
            menuPanel.style.display = 'none';
        });

        document.addEventListener('click', (e) => {
            if (!menuPanel.contains(e.target) && !menuToggle.contains(e.target)) {
                menuPanel.style.display = 'none';
            }
        });

        themeOption.addEventListener('click', () => {
            isDarkMode = !isDarkMode;
            document.body.classList.toggle('dark-mode', isDarkMode);
            localStorage.setItem('darkMode', isDarkMode);
            updateThemeUI();
        });

        audioOption.addEventListener('click', () => {
            isVoiceEnabled = !isVoiceEnabled;
            localStorage.setItem('isVoiceEnabled', isVoiceEnabled);
            updateAudioUI();
        });
    }

    // === TECLADO MATEMÁTICO ===
    if (toggleMathBtn && mathToolbar) {
        toggleMathBtn.addEventListener('click', () => {
            mathToolbar.style.display = mathToolbar.style.display === 'flex' ? 'none' : 'flex';
        });

        window.insertAtCursor = function(text) {
            const start = userInput.selectionStart;
            const end = userInput.selectionEnd;
            userInput.value = userInput.value.substring(0, start) + text + userInput.value.substring(end);
            userInput.focus();
            userInput.setSelectionRange(start + text.length, start + text.length);
        };

        window.clearInput = function() {
            userInput.value = '';
            userInput.focus();
        };

        document.addEventListener('click', (e) => {
            if (!mathToolbar.contains(e.target) && !toggleMathBtn.contains(e.target)) {
                mathToolbar.style.display = 'none';
            }
        });
    }

    // === CERRAR GRÁFICA ===
    if (closeGraph && graphContainer) {
        closeGraph.addEventListener('click', () => {
            graphContainer.style.display = 'none';
        });
    }
});
