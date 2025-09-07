// script.js - VERSIÓN FINAL CON VOZ Y CHAT DESPLEGABLE
document.addEventListener('DOMContentLoaded', () => {
    // Variables globales
    let isSending = false;
    window.voiceEnabled = true;
    window.sesionActual = null;
    window.estrellasTotales = 0;

    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const chatContainer = document.getElementById('chatContainer');
    const uploadBtn = document.getElementById('uploadBtn');
    const fileInput = document.getElementById('fileInput');
    const toggleMathBtn = document.getElementById('toggleMathBtn');
    const mathToolbar = document.getElementById('mathToolbar');

    // === CHAT DESPLEGABLE ===
    const chatWrapper = document.getElementById('chatWrapper');
    const chatToggle = document.getElementById('chatToggle');
    if (chatWrapper && chatToggle) {
        chatToggle.addEventListener('click', () => {
            chatWrapper.classList.toggle('open');
        });
    }

    if (!userInput || !sendBtn || !chatContainer) {
        console.error('❌ No se encontraron elementos del DOM');
        return;
    }

    // === ACTIVAR CÁMARA ===
    if (uploadBtn && fileInput) {
        uploadBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (event) => {
            if (event.target.files.length > 0) {
                addMessage('📸 Imagen enviada para análisis...', 'user');
                simulateImageAnalysis(event.target.files[0]);
            }
        });
    }

    // === TOGGLE TECLADO MATEMÁTICO ===
    if (toggleMathBtn && mathToolbar) {
        toggleMathBtn.addEventListener('click', () => {
            mathToolbar.style.display =
                mathToolbar.style.display === 'block' ? 'none' : 'block';
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

        const funcionAGraficar = detectarYGraficarFuncion(text);
        if (funcionAGraficar) {
            try {
                const typing = createTypingMessage('Generando gráfica...');
                await graficarFuncion(funcionAGraficar);
                removeTypingMessage(typing);
            } catch (error) {
                addMessage('❌ Error al generar la gráfica.', 'bot');
            } finally {
                isSending = false;
            }
            return;
        }

        const typing = createTypingMessage('Pensando...');
        try {
            const response = await fetch('/analizar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: text }),
            });
            const data = await response.json();
            removeTypingMessage(typing);

            if (data.respuesta) {
                if (data.necesitaGrafica && data.graficaData && data.graficaData.puntos) {
                    addMessage(data.respuesta, 'bot');
                    mostrarGrafica(data.graficaData.puntos, data.graficaData.funcion);
                    isSending = false;
                    return;
                }

                if (data.tipo === 'interactivo' && data.tieneOpciones) {
                    window.sesionActual = data.sesionId;
                    actualizarEstrellas(data.estrellas);
                    addMessage(data.respuesta, 'bot');
                } else {
                    await showStepsSequentially(data.respuesta);
                }
            } else {
                addMessage('⚠️ No pude procesar tu pregunta.', 'bot');
            }
        } catch (err) {
            removeTypingMessage(typing);
            addMessage('🔴 Error de conexión. Intenta recargar.', 'bot');
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

    // === FUNCIÓN PARA ELEGIR OPCIÓN ===
    window.elegirOpcion = async function (opcion) {
        if (!window.sesionActual) return;

        addMessage(`Elegiste: Opción ${opcion}`, 'user');

        try {
            const response = await fetch('/responder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sesionId: window.sesionActual,
                    opcionElegida: opcion,
                }),
            });

            const data = await response.json();
            addMessage(data.respuesta, 'bot');

            if (data.estrellas !== undefined) {
                actualizarEstrellas(data.estrellas);
            }

            if (data.sesionExpirada) {
                window.sesionActual = null;
            }
        } catch (error) {
            addMessage('❌ Error al procesar tu respuesta', 'bot');
        }
    };

    // === ACTUALIZAR ESTRELLAS ===
    function actualizarEstrellas(cantidad) {
        window.estrellasTotales = cantidad;
        const contador = document.getElementById('contadorEstrellas');
        if (contador) contador.textContent = cantidad;
    }

    function createTypingMessage(text) {
        const typing = document.createElement('div');
        typing.className = 'message bot';
        typing.innerHTML = `<div class="message-content">${text}</div>`;
        chatContainer.appendChild(typing);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        return typing;
    }

    function removeTypingMessage(typing) {
        if (typing && typing.parentNode) {
            typing.remove();
        }
    }

    // === MOSTRAR PASOS SECUENCIALMENTE ===
    async function showStepsSequentially(fullResponse) {
        const steps = extractSteps(fullResponse);

        if (steps.length > 0) {
            for (let i = 0; i < steps.length; i++) {
                await addMessageWithDelay(steps[i], 'bot', i * 1500);

                if (window.voiceEnabled) {
                    await new Promise((resolve) => setTimeout(resolve, 300));
                    speakText(cleanTextForSpeech(steps[i]));
                    if (i < steps.length - 1) {
                        await waitForSpeechEnd();
                    }
                } else {
                    await new Promise((resolve) => setTimeout(resolve, 1500));
                }
            }
        } else {
            addMessage(fullResponse, 'bot');
            if (window.voiceEnabled) speakText(fullResponse);
        }
    }

    function waitForSpeechEnd() {
        return new Promise((resolve) => {
            const checkSpeaking = setInterval(() => {
                if (!window.speechSynthesis.speaking) {
                    clearInterval(checkSpeaking);
                    resolve();
                }
            }, 100);
        });
    }

    // === LIMPIAR TEXTO PARA VOZ ===
    function cleanTextForSpeech(text) {
        return text
            .replace(/\+/g, ' más ')
            .replace(/\-/g, ' menos ')
            .replace(/\*/g, ' por ')
            .replace(/\//g, ' entre ')
            .replace(/\=/g, ' igual a ')
            .replace(/\^/g, ' elevado a ');
    }

    // === EXTRAER PASOS ===
    function extractSteps(text) {
        const stepPattern =
            /(Paso\s*\d+[:\-\.]\s*[^Paso]+)(?=Paso|Solución|$)/gi;
        let matches = text.match(stepPattern);
        if (matches && matches.length > 1) return matches.map((s) => s.trim());
        return [text];
    }

    function addMessageWithDelay(text, sender, delay) {
        return new Promise((resolve) => {
            setTimeout(() => {
                addMessage(text, sender);
                resolve();
            }, delay);
        });
    }

    function addMessage(text, sender) {
        const div = document.createElement('div');
        div.className = `message ${sender}`;
        const content = document.createElement('div');
        content.className = 'message-content';
        content.innerHTML = text;
        div.appendChild(content);
        chatContainer.appendChild(div);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    // === VOZ CORREGIDA ===
    function speakText(texto) {
        if ('speechSynthesis' in window && window.voiceEnabled) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(texto);
            utterance.lang = 'es-ES';
            utterance.rate = 0.9;
            utterance.pitch = 1;
            utterance.volume = 1;

            function setVoice() {
                const voices = window.speechSynthesis.getVoices();
                const spanishVoice = voices.find((v) => v.lang.startsWith('es'));
                if (spanishVoice) utterance.voice = spanishVoice;
                window.speechSynthesis.speak(utterance);
            }

            if (window.speechSynthesis.getVoices().length > 0) {
                setVoice();
            } else {
                window.speechSynthesis.onvoiceschanged = setVoice;
            }
        }
    }

    function simulateImageAnalysis(file) {
        setTimeout(() => {
            addMessage(
                '🔍 He detectado un problema matemático en la imagen. Describe qué necesitas resolver.',
                'bot'
            );
        }, 2000);
    }
});

// === FUNCIONES PARA GRÁFICAS ===
async function graficarFuncion(funcionTexto) {
    try {
        const response = await fetch('/graficar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                funcion: funcionTexto,
                xMin: -10,
                xMax: 10,
            }),
        });
        const data = await response.json();
        if (data.success) {
            mostrarGrafica(data.datos, data.funcion);
        } else {
            addMessage('❌ No se pudo generar la gráfica', 'bot');
        }
    } catch (error) {
        addMessage('❌ Error al generar la gráfica', 'bot');
    }
}

function mostrarGrafica(datos, funcion) {
    const graphContainer = document.getElementById('graphContainer');
    const graphCanvas = document.getElementById('graphCanvas');
    if (!graphContainer || !graphCanvas) return;
    graphContainer.style.display = 'block';
    const ctx = graphCanvas.getContext('2d');
    if (window.graficaActual) window.graficaActual.destroy();
    window.graficaActual = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: `f(x) = ${funcion}`,
                    data: datos,
                    borderColor: '#4361ee',
                    borderWidth: 3,
                    pointRadius: 0,
                    tension: 0.4,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
        },
    });
}

function detectarYGraficarFuncion(texto) {
    const patrones = [/graficar\s+(.+)/i, /gráfica\s+de\s+(.+)/i];
    for (const p of patrones) {
        const m = texto.match(p);
        if (m && m[1]) return m[1].trim();
    }
    return null;
}


