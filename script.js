// script.js
import { speakText } from './tts.js';

// === INICIALIZACIÓN Y EVENTOS (espera al DOM) ===
document.addEventListener('DOMContentLoaded', () => {
    // Elementos del DOM (ahora seguros, porque el DOM está listo)
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
    const graphBtn = document.getElementById('graphBtn');
    const graphContainer = document.getElementById('graphContainer');
    const graphCanvas = document.getElementById('graphCanvas');

    // Verifica que todos los elementos existan
    if (!userInput || !sendBtn || !uploadBtn || !fileInput || !chatContainer) {
        console.error('❌ No se encontraron elementos del DOM principales');
        return;
    }

    // Estados
    let isDarkMode = localStorage.getItem('darkMode') === 'true';
    let isVoiceEnabled = localStorage.getItem('isVoiceEnabled') !== 'false';
    let isSending = false;
    let selectedImage = null;
    let graphChart = null;

    // Aplicar modo oscuro al cargar
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

    // === MANEJAR SELECCIÓN DE IMAGEN ===
    uploadBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            selectedImage = reader.result;
            addMessage(`📸 Imagen seleccionada. Escribe y envía.`, 'user');
            if (userInput.value.trim()) sendMessage();
        };
        reader.readAsDataURL(file);
    });

    // === ENVIAR MENSAJE ===
    async function sendMessage() {
        if (isSending) return;
        isSending = true;

        const text = userInput.value.trim();
        if (!text && !selectedImage) {
            isSending = false;
            return;
        }

        if (text) addMessage(text, 'user');
        userInput.value = '';
        showTypingIndicator();

        const body = { text: text || 'Analiza esta imagen.' };
        if (selectedImage) {
            body.image = selectedImage.split(',')[1];
            body.mimeType = selectedImage.includes('png') ? 'image/png' : 'image/jpeg';
        }

        try {
            const response = await fetch('/analizar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await response.json();
            hideTypingIndicator();

            if (data.respuesta) {
                addMessage(data.respuesta, 'bot');
                if (isVoiceEnabled) speakText(data.respuesta);
            } else if (data.error) {
                addMessage("⚠️ " + data.error, 'bot');
            }
        } catch (err) {
            hideTypingIndicator();
            addMessage("🔴 No pude conectar con el servidor. Intenta recargar.", 'bot');
            console.error('Error de conexión:', err);
        } finally {
            selectedImage = null;
            isSending = false;
        }
    }

    sendBtn.addEventListener('click', () => {
        if (userInput.value.trim() || selectedImage) sendMessage();
    });

    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (userInput.value.trim() || selectedImage) sendMessage();
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
            img.src = 'logo-tutor.png';
            img.alt = 'Tutor Avatar';
            img.onerror = () => img.src = 'https://via.placeholder.com/150?text=Tutor';
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

        // Efecto de parpadeo del avatar del bot
        if (sender === 'bot') {
            requestAnimationFrame(() => {
                const img = avatar.querySelector('img');
                if (img) {
                    img.classList.add('blinking');
                    const textLength = text.length;
                    const estimatedTime = Math.max(2000, textLength * 60);

                    setTimeout(() => img.classList.remove('blinking'), estimatedTime);
                    if (isVoiceEnabled) {
                        setTimeout(() => img.classList.remove('blinking'), estimatedTime + 1000);
                    }
                }
            });
        }
    }

    // === INDICADOR DE ESCRIBIENDO ===
    function showTypingIndicator() {
        const typing = document.createElement('div');
        typing.className = 'typing-indicator';
        typing.id = 'typing';
        typing.innerHTML = `
            <div class="avatar bot-avatar">
                <img src="logo-tutor.png" alt="Tutor">
            </div>
            <div class="message-content">Pensando...</div>
        `;
        chatContainer.appendChild(typing);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    function hideTypingIndicator() {
        const typing = document.getElementById('typing');
        if (typing) typing.remove();
    }

    // === MENÚ DE CONFIGURACIÓN (⋯) ===
    if (menuToggle && menuPanel && closeMenu) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            menuPanel.style.display = 'block';
        });

        closeMenu.addEventListener('click', () => {
            menuPanel.style.display = 'none';
        });

        // Cerrar al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!menuPanel.contains(e.target) && !menuToggle.contains(e.target)) {
                menuPanel.style.display = 'none';
            }
        });

        // Modo oscuro
        themeOption.addEventListener('click', () => {
            isDarkMode = !isDarkMode;
            document.body.classList.toggle('dark-mode', isDarkMode);
            localStorage.setItem('darkMode', isDarkMode);
            updateThemeUI();
        });

        // Voz
        audioOption.addEventListener('click', () => {
            isVoiceEnabled = !isVoiceEnabled;
            localStorage.setItem('isVoiceEnabled', isVoiceEnabled);
            updateAudioUI();
        });
    }

    // === TECLADO MATEMÁTICO INTEGRADO ===
    if (toggleMathBtn && mathToolbar) {
        toggleMathBtn.addEventListener('click', () => {
            mathToolbar.style.display = mathToolbar.style.display === 'none' || mathToolbar.style.display === '' ? 'flex' : 'none';
        });

        // Insertar texto en el cursor
        window.insertAtCursor = function(text) {
            const start = userInput.selectionStart;
            const end = userInput.selectionEnd;
            userInput.value = userInput.value.substring(0, start) + text + userInput.value.substring(end);
            userInput.focus();
            userInput.setSelectionRange(start + text.length, start + text.length);
            userInput.dispatchEvent(new Event('input'));
        };

        // Limpiar input
        window.clearInput = function() {
            userInput.value = '';
            userInput.focus();
        };

        // Cerrar teclado al enviar
        sendBtn.addEventListener('click', () => {
            mathToolbar.style.display = 'none';
        });

        // Cerrar al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!mathToolbar.contains(e.target) && !toggleMathBtn.contains(e.target)) {
                mathToolbar.style.display = 'none';
            }
        });
    }

    // === GRÁFICA CON CHART.JS ===
    if (graphBtn && graphContainer && graphCanvas) {
        graphBtn.addEventListener('click', () => {
            const func = userInput.value.trim();
            if (!func) return;

            graphContainer.style.display = 'block';

            const x = Array.from({ length: 100 }, (_, i) => i / 10 - 5);
            const y = x.map(val => {
                try {
                    return eval(func.replace(/x/g, `(${val})`));
                } catch {
                    return NaN;
                }
            });

            if (graphChart) graphChart.destroy();

            graphChart = new Chart(graphCanvas, {
                type: 'line',
                data: {
                    labels: x,
                    datasets: [{
                        label: func,
                        data: y,
                        borderColor: '#4361ee',
                        backgroundColor: 'rgba(67, 97, 238, 0.1)',
                        borderWidth: 2,
                        pointRadius: 0,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { display: true, grid: { color: 'rgba(255,255,255,0.1)' } },
                        y: { display: true, grid: { color: 'rgba(255,255,255,0.1)' } }
                    }
                }
            });
        });

        document.getElementById('closeGraph')?.addEventListener('click', () => {
            graphContainer.style.display = 'none';
        });
    }
});





