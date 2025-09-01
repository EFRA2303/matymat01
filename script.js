// script.js - Versión con PASOS SECUENCIALES ANIMADOS
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
    window.voiceEnabled = true;

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
                // ✅ MOSTRAR PASOS SECUENCIALMENTE
                await showStepsSequentially(data.respuesta);
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

    // === MOSTRAR PASOS SECUENCIALMENTE ===
    async function showStepsSequentially(fullResponse) {
        // Detectar y separar los pasos
        const steps = extractSteps(fullResponse);
        
        if (steps.length > 0) {
            // Mostrar cada paso con delay
            for (let i = 0; i < steps.length; i++) {
                await addMessageWithDelay(steps[i], 'bot', i * 800); // 800ms entre pasos
                
                // Leer cada paso con voz (opcional)
                if (window.voiceEnabled && i === steps.length - 1) {
                    speakText(steps[i]); // Leer solo el último paso o todo
                }
            }
        } else {
            // Si no detecta pasos, mostrar respuesta completa
            addMessage(fullResponse, 'bot');
            if (window.voiceEnabled) {
                speakText(fullResponse);
            }
        }
    }

    // === EXTRAER PASOS DE LA RESPUESTA ===
    function extractSteps(text) {
        const steps = [];
        
        // Patrones para detectar pasos
        const patterns = [
            /Paso \d+:([^Paso]+)(?=Paso|Solución|$)/gi,
            /Paso \d+[\.\:]?([^Paso]+)(?=Paso|Solución|$)/gi,
            /\d+[\.\)] ([^0-9]+)(?=\d+[\.\)]|Solución|$)/gi,
            /• ([^\n]+)/gi,
            /- ([^\n]+)/gi
        ];

        for (const pattern of patterns) {
            const matches = text.match(pattern);
            if (matches && matches.length > 1) {
                return matches.map(step => step.trim());
            }
        }

        // Si no encuentra patrones, dividir por líneas que contengan números
        const lines = text.split('\n').filter(line => 
            line.trim() && /^(\d+[\.\)]|Paso|•|-)/i.test(line.trim())
        );

        if (lines.length > 1) {
            return lines;
        }

        // Si todo falla, devolver la respuesta completa como un solo "paso"
        return [text];
    }

    // === AÑADIR MENSAJE CON RETRASO ===
    function addMessageWithDelay(text, sender, delay) {
        return new Promise(resolve => {
            setTimeout(() => {
                addMessage(text, sender);
                resolve();
            }, delay);
        });
    }

    // === AÑADIR MENSAJE AL CHAT (MODIFICADA) ===
    function addMessage(text, sender) {
        const div = document.createElement('div');
        div.className = `message ${sender}`;
        div.style.opacity = '0';
        div.style.transform = 'translateY(20px)';
        div.style.transition = 'all 0.5s ease';

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
        
        // Formatear texto para mejor visualización
        content.innerHTML = formatText(text);

        div.appendChild(avatar);
        div.appendChild(content);
        chatContainer.appendChild(div);
        
        // Animación de entrada
        setTimeout(() => {
            div.style.opacity = '1';
            div.style.transform = 'translateY(0)';
        }, 50);

        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    // === FORMATEAR TEXTO PARA MEJOR VISUALIZACIÓN ===
    function formatText(text) {
        // Resaltar "Paso X:", "Solución final:", etc.
        let formatted = text
            .replace(/(Paso \d+:)/gi, '<strong style="color: #4361ee;">$1</strong>')
            .replace(/(Solución final:)/gi, '<strong style="color: #00c853;">$1</strong>')
            .replace(/\n/g, '<br>');
        
        return formatted;
    }

    // === SÍNTESIS DE VOZ MEJORADA ===
    function speakText(texto) {
        if ('speechSynthesis' in window && window.voiceEnabled) {
            window.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(texto);
            utterance.lang = 'es-ES';
            utterance.rate = 0.9;
            utterance.pitch = 1;
            utterance.volume = 1;

            const voices = window.speechSynthesis.getVoices();
            const spanishVoice = voices.find(voice => 
                voice.lang.includes('es') || voice.lang.includes('ES')
            );
            
            if (spanishVoice) {
                utterance.voice = spanishVoice;
            }

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
        }
    }

    // === RESTANTE DEL CÓDIGO (menú, eventos, etc.) ===
    sendBtn.addEventListener('click', sendMessage);

    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Menú de configuración (mantener igual)
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
            localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
        });

        audioOption.addEventListener('click', () => {
            window.voiceEnabled = !window.voiceEnabled;
            const audioText = audioOption.querySelector('span');
            const audioIcon = audioOption.querySelector('i');
            
            if (window.voiceEnabled) {
                audioText.textContent = 'Voz Activada';
                audioIcon.className = 'fas fa-volume-up';
            } else {
                audioText.textContent = 'Voz Desactivada';
                audioIcon.className = 'fas fa-volume-mute';
                window.speechSynthesis.cancel();
            }
            
            localStorage.setItem('voiceEnabled', window.voiceEnabled);
        });

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

    // Funciones matemáticas
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

    // Inicializar voces
    if ('speechSynthesis' in window) {
        window.speechSynthesis.getVoices();
    }
});
