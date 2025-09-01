// script.js - Versión con VOZ EN CADA PASO y MEJOR VISIBILIDAD
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
                // ✅ MOSTRAR PASOS SECUENCIALMENTE CON VOZ
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
        // Detectar y separar los pasos
        const steps = extractSteps(fullResponse);
        
        if (steps.length > 0) {
            // Mostrar cada paso con delay
            for (let i = 0; i < steps.length; i++) {
                await addMessageWithDelay(steps[i], 'bot', i * 1500); // 1500ms entre pasos
                
                // ✅ LEER CADA PASO CON VOZ (no solo el último)
                if (window.voiceEnabled) {
                    // Pequeña pausa antes de hablar
                    await new Promise(resolve => setTimeout(resolve, 300));
                    speakText(cleanTextForSpeech(steps[i]));
                    
                    // Esperar a que termine de hablar antes del siguiente paso
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
                    // Espera normal si no hay voz
                    await new Promise(resolve => setTimeout(resolve, 1500));
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

    // === LIMPIAR TEXTO PARA VOZ (MEJORADO PARA MATEMÁTICAS) ===
function cleanTextForSpeech(text) {
    let cleanText = text
        // Primero: convertir variables matemáticas
        .replace(/(\d+)x/gi, '$1 equis') // 3x → "3 equis"
        .replace(/(\d+)y/gi, '$1 ye')    // 2y → "2 ye"
        .replace(/(\d+)z/gi, '$1 zeta')  // 5z → "5 zeta"
        .replace(/\bx\b/gi, 'equis')     // x sola → "equis"
        .replace(/\by\b/gi, 'ye')        // y sola → "ye"
        .replace(/\bz\b/gi, 'zeta')      // z sola → "zeta"
        
        // Símbolos matemáticos
        .replace(/\+/g, ' más ')
        .replace(/\-/g, ' menos ')
        .replace(/\*/g, ' por ')
        .replace(/\//g, ' entre ')
        .replace(/\=/g, ' igual a ')
        .replace(/\^/g, ' elevado a ')
        
        // Expresiones comunes
        .replace(/sin\(/gi, 'seno de ')
        .replace(/cos\(/gi, 'coseno de ')
        .replace(/tan\(/gi, 'tangente de ')
        .replace(/sqrt\(/gi, 'raíz cuadrada de ')
        .replace(/π/gi, 'pi')
        .replace(/θ/gi, 'theta')
        
        // Limpieza general
        .replace(/\([^)]*\)/g, '') // Remover contenido entre paréntesis
        .replace(/[\(\)\[\]\{\}]/g, '') // Remover paréntesis y brackets
        .replace(/\\/g, '') // Remover backslashes
        .replace(/\$/g, '') // Remover símbolos $
        .replace(/#/g, '')  // Remover numerales
        
        // Mejorar fluidez
        .replace(/\s+/g, ' ') // Múltiples espacios a uno
        .replace(/\s\./g, '.') // Espacio antes de punto
        .replace(/\s\,/g, ',') // Espacio antes de coma
        .trim();
    
    // Asegurar que suene natural como un maestro
    cleanText = cleanText
        .replace(/equis/gi, ' equis ') // Espacios alrededor de variables
        .replace(/ye/gi, ' ye ')
        .replace(/zeta/gi, ' zeta ')
        .replace(/\s+/g, ' ') // Limpiar espacios again
        .replace(/^Paso\s*\d+[:\-\.]\s*/i, '') // Remover "Paso X:" al inicio
        .trim();
    
    // Capitalizar primera letra
    if (cleanText.length > 0) {
        cleanText = cleanText.charAt(0).toUpperCase() + cleanText.slice(1);
    }
    
    return cleanText;
}

    // === EXTRACT STEPS MEJORADA ===
    function extractSteps(text) {
        // Primero intentar con el formato "Paso X:"
        const stepPattern = /(Paso\s*\d+[:\-\.]\s*[^Paso]+)(?=Paso|Solución|$)/gi;
        let matches = text.match(stepPattern);
        
        if (matches && matches.length > 1) {
            return matches.map(step => step.trim());
        }
        
        // Intentar con números seguidos de punto
        const numberPattern = /\d+[\.\)]\s*([^\n]+)/g;
        matches = [];
        let match;
        
        while ((match = numberPattern.exec(text)) !== null) {
            matches.push(match[0].trim());
        }
        
        if (matches.length > 1) {
            return matches;
        }
        
        // Si todo falla, dividir por líneas significativas
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

    // === FORMATEAR TEXTO MEJORADO ===
    function formatText(text) {
        // Resaltar más intensamente los pasos
        let formatted = text
            .replace(/(Paso\s*\d+[:\.\-])/gi, '<strong style="color: #1565c0; font-size: 1.1em;">$1</strong>')
            .replace(/(Solución final[:\.\-])/gi, '<strong style="color: #2e7d32; font-size: 1.1em;">$1</strong>')
            .replace(/\n/g, '<br>')
            .replace(/\b(\d+[\.\)])/g, '<strong>$1</strong>'); // Resaltar números de paso
        
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

    // === RESTANTE DEL CÓDIGO ===
    sendBtn.addEventListener('click', sendMessage);

    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Menú de configuración
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

    if ('speechSynthesis' in window) {
        window.speechSynthesis.getVoices();
    }
});


