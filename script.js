// script.js - Versión corregida CON VOZ ACTIVADA
document.addEventListener('DOMContentLoaded', () => {
    // Elementos del DOM
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const chatContainer = document.getElementById('chatContainer');

    // Verificación de elementos
    if (!userInput || !sendBtn || !chatContainer) {
        console.error('❌ No se encontraron elementos del DOM');
        return;
    }

    // Estados
    let isSending = false;
    window.voiceEnabled = true; // VOZ ACTIVADA POR DEFECTO

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
                body: JSON.stringify({ text: text })
            });

            const data = await response.json();
            typing.remove();

            if (data.respuesta) {
                addMessage(data.respuesta, 'bot');
                // ✅ ACTIVAR VOZ CON LA RESPUESTA DEL BOT
                if (window.voiceEnabled) {
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

    // === SÍNTESIS DE VOZ MEJORADA ===
    function speakText(texto) {
        if ('speechSynthesis' in window) {
            // Detener cualquier voz anterior
            window.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(texto);
            utterance.lang = 'es-ES';
            utterance.rate = 0.9; // Velocidad adecuada para tutor
            utterance.pitch = 1;
            utterance.volume = 1;

            // Seleccionar voz en español si está disponible
            const voices = window.speechSynthesis.getVoices();
            const spanishVoice = voices.find(voice => 
                voice.lang.includes('es') || voice.lang.includes('ES')
            );
            
            if (spanishVoice) {
                utterance.voice = spanishVoice;
            }

            // Manejar caso cuando las voces no están cargadas
            if (voices.length === 0) {
                window.speechSynthesis.onvoiceschanged = () => {
                    const newVoices = window.speechSynthesis.getVoices();
                    const newSpanishVoice = newVoices.find(voice => 
                        voice.lang.includes('es') || voice.lang.includes('ES')
                    );
                    if (newSpanishVoice) {
                        utterance.voice = newSpanishVoice;
                    }
                    window.speechSynthesis.speak(utterance);
                };
            } else {
                window.speechSynthesis.speak(utterance);
            }

            // Manejar errores de voz
            utterance.onerror = (event) => {
                console.error('Error en síntesis de voz:', event.error);
            };
        }
    }

    // === MENÚ DE CONFIGURACIÓN MEJORADO ===
    const menuToggle = document.getElementById('menuToggle');
    const menuPanel = document.getElementById('menuPanel');
    const closeMenu = document.getElementById('closeMenu');
    const themeOption = document.getElementById('themeOption');
    const audioOption = document.getElementById('audioOption');

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
            document.body.classList.toggle('dark-mode');
            // Guardar preferencia
            localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
        });

        // ✅ CONFIGURACIÓN DE VOZ MEJORADA
        audioOption.addEventListener('click', () => {
            window.voiceEnabled = !window.voiceEnabled;
            const audioText = audioOption.querySelector('span');
            const audioIcon = audioOption.querySelector('i');
            
            if (window.voiceEnabled) {
                audioText.textContent = 'Voz Activada';
                audioIcon.className = 'fas fa-volume-up';
                // Probar la voz al activar
                speakText('Voz activada');
            } else {
                audioText.textContent = 'Voz Desactivada';
                audioIcon.className = 'fas fa-volume-mute';
                // Detener voz al desactivar
                window.speechSynthesis.cancel();
            }
            
            // Guardar preferencia
            localStorage.setItem('voiceEnabled', window.voiceEnabled);
        });

        // Cargar preferencias guardadas
        if (localStorage.getItem('darkMode') === 'true') {
            document.body.classList.add('dark-mode');
        }
        
        if (localStorage.getItem('voiceEnabled') === 'false') {
            window.voiceEnabled = false;
            const audioText = audioOption.querySelector('span');
            const audioIcon = audioOption.querySelector('i');
            audioText.textContent = 'Voz Desactivada';
            audioIcon.className = 'fas fa-volume-mute';
        }
    }

    // === FUNCIONES MATEMÁTICAS (si las necesitas) ===
    window.insertAtCursor = function(value) {
        const input = document.getElementById('userInput');
        const start = input.selectionStart;
        const end = input.selectionEnd;
        input.value = input.value.substring(0, start) + value + input.value.substring(end);
        input.selectionStart = input.selectionEnd = start + value.length;
        input.focus();
    };

    window.clearInput = function() {
        document.getElementById('userInput').value = '';
        document.getElementById('userInput').focus();
    };

    // Inicializar voces al cargar
    if ('speechSynthesis' in window) {
        // Forzar la carga de voces
        window.speechSynthesis.getVoices();
    }
});
