// script.js - VERSIÓN COMPLETA CON TECLADO MATEMÁTICO Y CÁMARA
document.addEventListener('DOMContentLoaded', () => {
    // Elementos del DOM
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const chatContainer = document.getElementById('chatContainer');
    const uploadBtn = document.getElementById('uploadBtn');
    const fileInput = document.getElementById('fileInput');
    const toggleMathBtn = document.getElementById('toggleMathBtn');
    const mathToolbar = document.getElementById('mathToolbar');

    // Verificación de elementos
    if (!userInput || !sendBtn || !chatContainer) {
        console.error('❌ No se encontraron elementos del DOM');
        return;
    }

    // Estados
    let isSending = false;
    window.voiceEnabled = true;

    // === ACTIVAR CÁMARA ===
    if (uploadBtn && fileInput) {
        uploadBtn.addEventListener('click', () => {
            fileInput.click();
        });
        
        fileInput.addEventListener('change', (event) => {
            if (event.target.files.length > 0) {
                const file = event.target.files[0];
                addMessage('📸 Imagen enviada para análisis...', 'user');
                simulateImageAnalysis(file);
            }
        });
    }

    // === TOGGLE TECLADO MATEMÁTICO ===
    if (toggleMathBtn && mathToolbar) {
        toggleMathBtn.addEventListener('click', () => {
            const isVisible = mathToolbar.style.display === 'block';
            mathToolbar.style.display = isVisible ? 'none' : 'block';
        });
    }

    // === ENVIAR MENSAJE ===
    async function sendMessage() {
        if (isSending) return;
        const text = userInput.value.trim();
        if (!text) return;

        isSending = true;
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

    // === MOSTRAR PASOS SECUENCIALMENTE CON VOZ ===
    async function showStepsSequentially(fullResponse) {
        const steps = extractSteps(fullResponse);
        
        if (steps.length > 0) {
            for (let i = 0; i < steps.length; i++) {
                await addMessageWithDelay(steps[i], 'bot', i * 1500);
                
                if (window.voiceEnabled) {
                    await new Promise(resolve => setTimeout(resolve, 300));
                    speakText(cleanTextForSpeech(steps[i]));
                    
                    if (i < steps.length - 1) {
                        await new Promise(resolve => {
                            const checkSpeaking = setInterval(() => {
                                if (!window.speechSynthesis.speaking) {
                                    clearInterval(checkSpeaking);
                                    resolve();
                                }
                            }, 100);
                        });
                    }
                } else {
                    await new Promise(resolve => setTimeout(resolve, 1500));
                }
            }
        } else {
            addMessage(fullResponse, 'bot');
            if (window.voiceEnabled) {
                speakText(fullResponse);
            }
        }
    }

    // === LIMPIAR TEXTO PARA VOZ ===
    function cleanTextForSpeech(text) {
        let cleanText = text
            .replace(/(\d+)x/gi, '$1 equis')
            .replace(/(\d+)y/gi, '$1 ye')
            .replace(/(\d+)z/gi, '$1 zeta')
            .replace(/\bx\b/gi, 'equis')
            .replace(/\by\b/gi, 'ye')
            .replace(/\bz\b/gi, 'zeta')
            .replace(/\+/g, ' más ')
            .replace(/\-/g, ' menos ')
            .replace(/\*/g, ' por ')
            .replace(/\//g, ' entre ')
            .replace(/\=/g, ' igual a ')
            .replace(/\^/g, ' elevado a ')
            .replace(/sin\(/gi, 'seno de ')
            .replace(/cos\(/gi, 'coseno de ')
            .replace(/tan\(/gi, 'tangente de ')
            .replace(/sqrt\(/gi, 'raíz cuadrada de ')
            .replace(/π/gi, 'pi')
            .replace(/θ/gi, 'theta')
            .replace(/\([^)]*\)/g, '')
            .replace(/[\(\)\[\]\{\}]/g, '')
            .replace(/\\/g, '')
            .replace(/\$/g, '')
            .replace(/#/g, '')
            .replace(/\s+/g, ' ')
            .replace(/\s\./g, '.')
            .replace(/\s\,/g, ',')
            .trim();
        
        cleanText = cleanText
            .replace(/equis/gi, ' equis ')
            .replace(/ye/gi, ' ye ')
            .replace(/zeta/gi, ' zeta ')
            .replace(/\s+/g, ' ')
            .replace(/^Paso\s*\d+[:\-\.]\s*/i, '')
            .trim();
        
        if (cleanText.length > 0) {
            cleanText = cleanText.charAt(0).toUpperCase() + cleanText.slice(1);
        }
        
        return cleanText;
    }

    // === EXTRAER PASOS ===
    function extractSteps(text) {
        const stepPattern = /(Paso\s*\d+[:\-\.]\s*[^Paso]+)(?=Paso|Solución|$)/gi;
        let matches = text.match(stepPattern);
        
        if (matches && matches.length > 1) {
            return matches.map(step => step.trim());
        }
        
        const numberPattern = /\d+[\.\)]\s*([^\n]+)/g;
        matches = [];
        let match;
        
        while ((match = numberPattern.exec(text)) !== null) {
            matches.push(match[0].trim());
        }
        
        if (matches.length > 1) {
            return matches;
        }
        
        const lines = text.split('\n').filter(line => 
            line.trim().length > 10 && 
            !line.includes('¡Hola!') && 
            !line.includes('Puedes escribir')
        );
        
        return lines.length > 1 ? lines : [text];
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

    // === AÑADIR MENSAJE AL CHAT ===
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
        content.innerHTML = formatText(text);

        div.appendChild(avatar);
        div.appendChild(content);
        chatContainer.appendChild(div);
        
        setTimeout(() => {
            div.style.opacity = '1';
            div.style.transform = 'translateY(0)';
        }, 50);

        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    // === FORMATEAR TEXTO ===
    function formatText(text) {
        let formatted = text
            .replace(/(Paso\s*\d+[:\.\-])/gi, '<strong style="color: #1565c0; font-size: 1.1em;">$1</strong>')
            .replace(/(Solución final[:\.\-])/gi, '<strong style="color: #2e7d32; font-size: 1.1em;">$1</strong>')
            .replace(/\n/g, '<br>')
            .replace(/\b(\d+[\.\)])/g, '<strong>$1</strong>');
        
        return formatted;
    }

    // === SÍNTESIS DE VOZ ===
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

    // === SIMULAR ANÁLISIS DE IMAGEN ===
    function simulateImageAnalysis(file) {
        setTimeout(() => {
            addMessage('🔍 He detectado un problema matemático en la imagen. Por favor describe qué necesitas resolver.', 'bot');
        }, 2000);
    }

    // === EVENTOS ===
    sendBtn.addEventListener('click', sendMessage);

    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // === FUNCIONES MATEMÁTICAS GLOBALES ===
    window.insertAtCursor = function(value) {
        const input = document.getElementById('userInput');
        const start = input.selectionStart;
        const end = input.selectionEnd;
        input.value = input.value.substring(0, start) + value + input.value.substring(end);
        input.selectionStart = input.selectionEnd = start + value.length;
        input.focus();
    };

    window.insertFunction = function(funcName) {
        const input = document.getElementById('userInput');
        const start = input.selectionStart;
        const end = input.selectionEnd;
        input.value = input.value.substring(0, start) + funcName + '()' + input.value.substring(end);
        input.selectionStart = input.selectionEnd = start + funcName.length + 1;
        input.focus();
    };

    window.insertFraction = function() {
        const input = document.getElementById('userInput');
        const start = input.selectionStart;
        const end = input.selectionEnd;
        input.value = input.value.substring(0, start) + '(a)/(b)' + input.value.substring(end);
        input.selectionStart = start + 1;
        input.selectionEnd = start + 2;
        input.focus();
    };

    window.insertLimit = function() {
        const input = document.getElementById('userInput');
        const start = input.selectionStart;
        const end = input.selectionEnd;
        input.value = input.value.substring(0, start) + 'lim_(x→0)' + input.value.substring(end);
        input.selectionStart = start + 5;
        input.selectionEnd = start + 6;
        input.focus();
    };

    window.insertIntegral = function() {
        const input = document.getElementById('userInput');
        const start = input.selectionStart;
        const end = input.selectionEnd;
        input.value = input.value.substring(0, start) + '∫_a^b f(x)dx' + input.value.substring(end);
        input.selectionStart = start + 7;
        input.selectionEnd = start + 8;
        input.focus();
    };

    window.clearInput = function() {
        document.getElementById('userInput').value = '';
        document.getElementById('userInput').focus();
    };

    // === MENÚ CONFIGURACIÓN ===
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

    // === INICIALIZAR ===
    if ('speechSynthesis' in window) {
        window.speechSynthesis.getVoices();
    }
});

