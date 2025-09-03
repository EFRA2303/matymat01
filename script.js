// script.js - VERSIÓN ULTRA RÁPIDA
document.addEventListener('DOMContentLoaded', () => {
    // Elementos del DOM
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const chatContainer = document.getElementById('chatContainer');
    
    if (!userInput || !sendBtn || !chatContainer) {
        console.error('❌ No se encontraron elementos del DOM');
        return;
    }

    // Estados
    let isSending = false;
    window.voiceEnabled = true;

    // === ENVIO ULTRA RÁPIDO ===
    async function sendMessage() {
        if (isSending) return;
        const text = userInput.value.trim();
        if (!text) return;

        isSending = true;
        addMessage(text, 'user');
        userInput.value = '';
        
        // Feedback inmediato
        const typing = addTypingIndicator();
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);
            
            const response = await fetch('/analizar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            const data = await response.json();
            
            typing.remove();
            processBotResponse(data.respuesta);
        } catch (err) {
            typing.remove();
            addMessage("Error de conexión. Intenta de nuevo.", 'bot');
            console.error('Error optimizado:', err);
        } finally {
            isSending = false;
        }
    }

    // === PROCESAMIENTO RÁPIDO DE RESPUESTA ===
    function processBotResponse(response) {
        const steps = extractSteps(response);
        
        if (steps.length > 1) {
            // Mostrar todos los pasos inmediatamente
            steps.forEach((step, index) => {
                addMessage(step, 'bot');
                if (window.voiceEnabled) {
                    // Programar voz sin bloquear
                    setTimeout(() => speakText(cleanTextForSpeech(step)), index * 500);
                }
            });
        } else {
            addMessage(response, 'bot');
            if (window.voiceEnabled) {
                speakText(cleanTextForSpeech(response));
            }
        }
    }

    // === FUNCIONES OPTIMIZADAS ===
    function addTypingIndicator() {
        const typing = document.createElement('div');
        typing.className = 'message bot typing';
        typing.innerHTML = `
            <div class="avatar bot-avatar">
                <img src="tutor-avatar.png" alt="Tutor">
            </div>
            <div class="message-content">Pensando...</div>
        `;
        chatContainer.appendChild(typing);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        return typing;
    }

    function addMessage(text, sender) {
        const div = document.createElement('div');
        div.className = `message ${sender}`;
        
        const avatar = document.createElement('div');
        avatar.className = `avatar ${sender}-avatar`;
        avatar.innerHTML = sender === 'bot' ? 
            '<img src="tutor-avatar.png" alt="Tutor">' : 
            '<i class="fas fa-user"></i>';
        
        const content = document.createElement('div');
        content.className = 'message-content';
        content.innerHTML = formatText(text);
        
        div.appendChild(avatar);
        div.appendChild(content);
        chatContainer.appendChild(div);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        
        // Animación CSS-based (más eficiente)
        requestAnimationFrame(() => {
            div.classList.add('visible');
        });
    }

    // === EXTRACCIÓN RÁPIDA DE PASOS ===
    function extractSteps(text) {
        const stepPattern = /(Paso\s*\d+[:\-\.]\s*[^Paso]+)/gi;
        const matches = text.match(stepPattern);
        return matches && matches.length > 1 ? matches : [text];
    }

    // === VOZ NO BLOQUEANTE ===
    function speakText(texto) {
        if (!window.voiceEnabled || !('speechSynthesis' in window)) return;
        
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(texto.substring(0, 200));
        utterance.lang = 'es-ES';
        utterance.rate = 0.92;
        utterance.volume = 0.8;
        
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            const spanishVoice = voices.find(v => v.lang.includes('es-')) || voices[0];
            utterance.voice = spanishVoice;
            window.speechSynthesis.speak(utterance);
        } else {
            window.speechSynthesis.onvoiceschanged = () => {
                const voices = window.speechSynthesis.getVoices();
                const spanishVoice = voices.find(v => v.lang.includes('es-')) || voices[0];
                utterance.voice = spanishVoice;
                window.speechSynthesis.speak(utterance);
            };
        }
    }

    // === EVENTOS RÁPIDOS ===
    const debouncedSend = debounce(() => sendMessage(), 300);
    sendBtn.addEventListener('click', debouncedSend);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            debouncedSend();
        }
    });

    // === FUNCIÓN DEBOUCE PARA PERFORMANCE ===
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Resto del código (mantener funciones matemáticas, menú, etc.)
    // ... (código existente para cámara, teclado matemático, etc.)
});

// === FUNCIONES PARA GRÁFICAS (optimizadas) ===
async function graficarFuncion(funcionTexto) {
    try {
        addMessage(`📈 Generando gráfica de: ${funcionTexto}`, 'bot');
        
        const response = await fetch('/graficar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                funcion: funcionTexto,
                xMin: -10,
                xMax: 10
            })
        });

        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        const data = await response.json();
        
        if (data.success) {
            mostrarGrafica(data.datos, data.funcion);
        } else {
            addMessage(`❌ Error: ${data.error}`, 'bot');
        }
    } catch (error) {
        addMessage("❌ Error al generar la gráfica.", 'bot');
    }
}

function mostrarGrafica(datos, funcion) {
    const graphContainer = document.getElementById('graphContainer');
    const graphCanvas = document.getElementById('graphCanvas');
    
    if (!graphContainer || !graphCanvas) return;
    
    graphContainer.style.display = 'block';
    const ctx = graphCanvas.getContext('2d');
    
    if (window.graficaActual) {
        window.graficaActual.destroy();
    }
    
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
            scales: {
                x: { type: 'linear', position: 'bottom', title: { display: true, text: 'Eje X' } },
                y: { title: { display: true, text: 'Eje Y' } }
            },
            plugins: {
                title: { display: true, text: `Gráfica de: ${funcion}`, font: { size: 16 } },
                legend: { position: 'top' }
            }
        }
    });
}

// === DETECTOR DE GRÁFICAS MEJORADO ===
function detectarYGraficarFuncion(texto) {
    // Patrones explícitos
    const patronesExplicitos = [
        /graficar\s+(.+)/i, /gráfica\s+de\s+(.+)/i, 
        /dibujar\s+(.+)/i, /plot\s+(.+)/i
    ];
    
    for (const patron of patronesExplicitos) {
        const match = texto.match(patron);
        if (match && match[1]) return match[1].trim();
    }
    
    // Funciones matemáticas puras
    const esFuncionPura = 
        texto.length <= 30 &&
        /[\^\+\-\*\/\(\)]/.test(texto) &&
        !/(resolver|calcular|explicar|ayuda|ejemplo|problema|\?)/i.test(texto);
    
    return esFuncionPura ? texto : null;
}
// Funciones para el teclado matemático
function insertAtCursor(text) {
    const input = document.getElementById('userInput');
    const start = input.selectionStart;
    const end = input.selectionEnd;
    input.value = input.value.substring(0, start) + text + input.value.substring(end);
    input.selectionStart = input.selectionEnd = start + text.length;
    input.focus();
}

function insertFunction(funcName) {
    insertAtCursor(funcName + '()');
    const input = document.getElementById('userInput');
    input.selectionStart = input.selectionEnd = input.selectionStart - 1;
    input.focus();
}

function insertFraction() {
    insertAtCursor('(/)');
    const input = document.getElementById('userInput');
    input.selectionStart = input.selectionEnd = input.selectionStart - 2;
    input.focus();
}

function clearInput() {
    document.getElementById('userInput').value = '';
}

function formatText(text) {
    // Formatear texto para mostrar correctamente en el chat
    return text.replace(/\n/g, '<br>')
               .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
               .replace(/_([^_]+)_/g, '<em>$1</em>');
}

function cleanTextForSpeech(text) {
    // Limpiar texto para síntesis de voz
    return text.replace(/\*/g, '')
               .replace(/#/g, '')
               .replace(/\//g, ' dividido por ')
               .replace(/\*/g, ' por ')
               .replace(/\(/g, '')
               .replace(/\)/g, '')
               .replace(/\[/g, '')
               .replace(/\]/g, '');
}

// Toggle para teclado matemático
document.getElementById('toggleMathBtn').addEventListener('click', function() {
    const mathToolbar = document.getElementById('mathToolbar');
    mathToolbar.style.display = mathToolbar.style.display === 'none' ? 'grid' : 'none';
});

// Funciones para la cámara
document.getElementById('uploadBtn').addEventListener('click', function() {
    document.getElementById('fileInput').click();
});

document.getElementById('fileInput').addEventListener('change', function(e) {
    if (e.target.files && e.target.files[0]) {
        // Aquí puedes procesar la imagen
        addMessage('📷 Imagen recibida. Procesando...', 'user');
        // Simular procesamiento
        setTimeout(() => {
            addMessage('He recibido tu imagen. Por favor, describe el problema matemático que necesitas resolver.', 'bot');
        }, 2000);
    }
});

