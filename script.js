// script.js - VERSIÓN CORREGIDA CON ESTRELLAS, OPCIONES Y CHAT DESPLEGABLE
document.addEventListener('DOMContentLoaded', () => {
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

    let isSending = false;
    window.voiceEnabled = true;
    window.sesionActual = null;
    window.estrellasTotales = 0;

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

        // Detectar si es una solicitud de gráfica
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

        // Flujo normal
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
                if (data.tipo === 'interactivo' && data.tieneOpciones) {
                    window.sesionActual = data.sesionId;
                    actualizarEstrellas(data.estrellas);
                    addMessage(data.respuesta, 'bot');
                    mostrarOpcionesInteractivo(data.respuesta);
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

    // === MOSTRAR OPCIONES INTERACTIVAS ===
    function mostrarOpcionesInteractivo(texto) {
        const opcionesContainer = document.getElementById('opcionesContainer');
        if (!opcionesContainer) return;
        opcionesContainer.innerHTML = '';
        const lineas = texto.split('\n').filter(l => /^[ABC]\)/.test(l.trim()));
        lineas.forEach(l => {
            const letra = l.trim()[0];
            const btn = document.createElement('button');
            btn.className = 'opcion-btn';
            btn.textContent = l.trim();
            btn.onclick = () => elegirOpcion(letra);
            opcionesContainer.appendChild(btn);
        });
        opcionesContainer.style.display = 'block';
    }

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
            if (data.sesionExpirada || data.sesionCompletada) {
                window.sesionActual = null;
                document.getElementById('opcionesContainer').style.display = 'none';
            } else if (data.tieneOpciones) {
                mostrarOpcionesInteractivo(data.respuesta);
            }
        } catch {
            addMessage('❌ Error al procesar tu respuesta', 'bot');
        }
    };

    // === ACTUALIZAR ESTRELLAS ===
    function actualizarEstrellas(cantidad) {
        window.estrellasTotales = cantidad;
        const contador = document.getElementById('contadorEstrellas');
        if (contador) contador.textContent = cantidad;
    }

    // === CREAR MENSAJES ===
    function createTypingMessage(text) {
        const typing = document.createElement('div');
        typing.className = 'message bot';
        typing.innerHTML = `
            <div class="avatar bot-avatar">
                <img src="tutor-avatar.png" alt="Tutor">
            </div>
            <div class="message-content">${text}</div>
        `;
        chatContainer.appendChild(typing);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        return typing;
    }

    function removeTypingMessage(typing) {
        if (typing?.parentNode) typing.remove();
    }

    // === MOSTRAR PASOS SECUENCIALMENTE ===
    async function showStepsSequentially(fullResponse) {
        const steps = extractSteps(fullResponse);
        if (steps.length > 0) {
            for (let i = 0; i < steps.length; i++) {
                await addMessageWithDelay(steps[i], 'bot', i * 1500);
                if (window.voiceEnabled) {
                    await new Promise(r => setTimeout(r, 300));
                    speakText(cleanTextForSpeech(steps[i]));
                    if (i < steps.length - 1) await waitForSpeechEnd();
                }
            }
        } else {
            addMessage(fullResponse, 'bot');
            if (window.voiceEnabled) speakText(fullResponse);
        }
    }

    function waitForSpeechEnd() {
        return new Promise(resolve => {
            const check = setInterval(() => {
                if (!window.speechSynthesis.speaking) {
                    clearInterval(check);
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
        const matches = text.match(stepPattern);
        return matches?.length > 0 ? matches.map(s => s.trim()) : [text];
    }

    function addMessageWithDelay(text, sender, delay) {
        return new Promise(resolve => {
            setTimeout(() => {
                addMessage(text, sender);
                resolve();
            }, delay);
        });
    }

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
        return text
            .replace(/(Paso\s*\d+[:\.\-])/gi, '<strong style="color: #1565c0; font-size: 1.1em;">$1</strong>')
            .replace(/(Solución final[:\.\-])/gi, '<strong style="color: #2e7d32; font-size: 1.1em;">$1</strong>')
            .replace(/\n/g, '<br>')
            .replace(/\b(\d+[\.\)])/g, '<strong>$1</strong>');
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

            function setVoice() {
                const voices = window.speechSynthesis.getVoices();
                const spanishVoice = voices.find(v => v.lang.startsWith('es'));
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

    // === SIMULAR ANÁLISIS DE IMAGEN ===
    function simulateImageAnalysis(file) {
        setTimeout(() => {
            addMessage('🔍 He detectado un problema matemático en la imagen. Describe qué necesitas resolver.', 'bot');
        }, 2000);
    }

    // === INICIALIZAR ===
    if ('speechSynthesis' in window) {
        window.speechSynthesis.getVoices();
    }
});

// === FUNCIONES PARA GRÁFICAS ===
async function graficarFuncion(funcionTexto) {
    try {
        const response = await fetch('/graficar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ funcion: funcionTexto, xMin: -10, xMax: 10 }),
        });
        const data = await response.json();
        if (data.success) {
            mostrarGrafica(data.datos, data.funcion);
        } else {
            addMessage('❌ No se pudo generar la gráfica', 'bot');
        }
    } catch {
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
            datasets: [{
                label: `f(x) = ${funcion}`,
                data: datos,
                borderColor: '#4361ee',
                backgroundColor: 'rgba(67, 97, 238, 0.1)',
                borderWidth: 3,
                pointRadius: 0,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
        }
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



