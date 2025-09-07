// script.js - VERSIÓN CORREGIDA CON VOZ, OPCIONES DINÁMICAS Y SISTEMA DE ESTRELLAS
document.addEventListener('DOMContentLoaded', () => {
    // Variables globales
    let isSending = false;
    window.voiceEnabled = true;
    window.sesionActual = null;
    window.estrellasTotales = 0;
    window.respuestasCorrectas = 0;
    window.totalPreguntas = 0;
    window.opcionesActuales = [];

    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const chatContainer = document.getElementById('chatContainer');
    const uploadBtn = document.getElementById('uploadBtn');
    const fileInput = document.getElementById('fileInput');
    const toggleMathBtn = document.getElementById('toggleMathBtn');
    const mathToolbar = document.getElementById('mathToolbar');
    
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
            mathToolbar.style.display = mathToolbar.style.display === 'block' ? 'none' : 'block';
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
                const typing = createTypingMessage("Generando gráfica...");
                await graficarFuncion(funcionAGraficar);
                removeTypingMessage(typing);
            } catch (error) {
                addMessage("❌ Error al generar la gráfica.", 'bot');
            } finally {
                isSending = false;
            }
            return;
        }
        
        // Flujo normal para consultas
        const typing = createTypingMessage("Pensando...");
        try {
            const response = await fetch('/analizar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: text })
            });
            const data = await response.json();
            removeTypingMessage(typing);
            
            if (data.respuesta) {
                // Si el servidor indica que generó una gráfica
                if (data.necesitaGrafica && data.graficaData && data.graficaData.puntos) {
                    addMessage(data.respuesta, 'bot');
                    mostrarGrafica(data.graficaData.puntos, data.graficaData.funcion);
                    isSending = false;
                    return;
                }

                // MODO INTERACTIVO CON OPCIONES
                if (data.tipo === "interactivo" && data.tieneOpciones) {
                    window.sesionActual = data.sesionId;
                    window.opcionesActuales = data.opciones || [];
                    window.respuestaCorrecta = data.respuestaCorrecta;
                    window.totalPreguntas++;
                    
                    actualizarEstrellas(data.estrellas || 0);
                    addMessage(data.respuesta, 'bot');
                    
                    // Mostrar opciones después de un breve delay
                    setTimeout(() => {
                        mostrarOpcionesInteractivo(data.opciones);
                        if (window.voiceEnabled) {
                            narrarOpciones(data.opciones, data.respuestaCorrecta);
                        }
                    }, 500);
                } else {
                    // MODO NORMAL (sin opciones)
                    await showStepsSequentially(data.respuesta);
                }
            } else {
                addMessage("⚠️ No pude procesar tu pregunta.", 'bot');
            }
        } catch (err) {
            removeTypingMessage(typing);
            addMessage("🔴 Error de conexión. Intenta recargar.", 'bot');
            console.error('Error:', err);
        } finally {
            isSending = false;
        }
    }
    
    // === FUNCIÓN MEJORADA PARA MOSTRAR OPCIONES ===
    function mostrarOpcionesInteractivo(opciones) {
        const opcionesContainer = document.getElementById('opcionesContainer');
        const opcionesBotones = opcionesContainer.querySelector('.opciones-botones');
        if (!opcionesContainer || !opcionesBotones) return;
        
        opcionesBotones.innerHTML = '';
        opcionesContainer.style.display = 'block';
        
        opciones.forEach((opcion, index) => {
            const letra = String.fromCharCode(65 + index);
            const btn = document.createElement('button');
            btn.className = 'opcion-btn';
            btn.dataset.opcion = letra;
            btn.innerHTML = `<strong>${letra})</strong> ${opcion.texto}`;
            btn.onclick = () => window.elegirOpcion(letra, opcion.correcta);
            opcionesBotones.appendChild(btn);
        });
    }
    
    // === FUNCIÓN MEJORADA PARA ELEGIR OPCIÓN ===
    window.elegirOpcion = async function(opcion, esCorrecta) {
        if (!window.sesionActual) return;
        
        const opcionesContainer = document.getElementById('opcionesContainer');
        const botones = opcionesContainer ? opcionesContainer.querySelectorAll('.opcion-btn') : [];
        
        // Deshabilitar todos los botones
        botones.forEach(btn => btn.disabled = true);
        
        // Mostrar feedback visual inmediato
        const botonElegido = Array.from(botones).find(btn => btn.dataset.opcion === opcion);
        if (botonElegido) {
            if (esCorrecta) {
                botonElegido.classList.add('correcta');
                botonElegido.innerHTML += ' ✓';
                window.respuestasCorrectas++;
                
                // Calcular estrellas ganadas
                const estrellasGanadas = 1;
                window.estrellasTotales += estrellasGanadas;
                actualizarEstrellas(window.estrellasTotales);
                
                addMessage(`Elegiste: Opción ${opcion} ✓ (¡Correcto! +${estrellasGanadas}⭐)`, 'user');
            } else {
                botonElegido.classList.add('incorrecta');
                botonElegido.innerHTML += ' ✗';
                addMessage(`Elegiste: Opción ${opcion} ✗ (Incorrecto)`, 'user');
                
                // Resaltar la opción correcta
                const opcionCorrecta = window.opcionesActuales.find(op => op.correcta);
                if (opcionCorrecta) {
                    const botonCorrecto = Array.from(botones).find(btn => btn.dataset.opcion === opcionCorrecta.letra);
                    if (botonCorrecto) {
                        botonCorrecto.classList.add('correcta');
                        botonCorrecto.innerHTML += ' ✓';
                    }
                }
            }
        }
        
        try {
            const response = await fetch('/responder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    sesionId: window.sesionActual, 
                    opcionElegida: opcion
                })
            });

            const data = await response.json();
            addMessage(data.respuesta, 'bot');
            
            if (data.estrellas !== undefined) {
                actualizarEstrellas(data.estrellas);
            }
            
            if (data.tieneOpciones && !data.sesionCompletada) {
                window.opcionesActuales = data.opciones || [];
                window.respuestaCorrecta = data.respuestaCorrecta;
                window.totalPreguntas++;
                
                setTimeout(() => {
                    mostrarOpcionesInteractivo(data.opciones);
                    if (window.voiceEnabled) {
                        narrarOpciones(data.opciones, data.respuestaCorrecta);
                    }
                }, 1500);
            } else {
                if (opcionesContainer) opcionesContainer.style.display = 'none';
                
                // Mostrar resumen final si se completó la sesión
                if (data.sesionCompletada) {
                    const porcentaje = Math.round((window.respuestasCorrectas / window.totalPreguntas) * 100);
                    addMessage(`🎉 ¡Sesión completada! ${window.respuestasCorrectas}/${window.totalPreguntas} correctas (${porcentaje}%)`, 'bot');
                    
                    // Reiniciar contadores
                    window.respuestasCorrectas = 0;
                    window.totalPreguntas = 0;
                }
            }
            
        } catch (error) {
            addMessage("❌ Error al procesar tu respuesta", 'bot');
            console.error('Error:', error);
            botones.forEach(btn => btn.disabled = false);
        }
    }

    // === NARRAR OPCIONES POR VOZ ===
    function narrarOpciones(opciones, respuestaCorrecta) {
        if (!window.voiceEnabled) return;
        
        let textoOpciones = "Tienes las siguientes opciones: ";
        opciones.forEach((opcion, index) => {
            const letra = String.fromCharCode(65 + index);
            textoOpciones += `Opción ${letra}: ${opcion.texto}. `;
        });
        
        speakText(textoOpciones);
    }
    
    // === ACTUALIZAR ESTRELLAS CON ANIMACIÓN ===
    function actualizarEstrellas(cantidad) {
        window.estrellasTotales = cantidad;
        const contador = document.getElementById('contadorEstrellas');
        if (contador) {
            contador.textContent = cantidad;
            contador.classList.add('star-pulse');
            setTimeout(() => contador.classList.remove('star-pulse'), 1000);
        }
    }
    
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
        if (typing && typing.parentNode) {
            typing.remove();
        }
    }
    
    async function showStepsSequentially(fullResponse) {
        const steps = extractSteps(fullResponse);
        
        if (steps.length > 0) {
            for (let i = 0; i < steps.length; i++) {
                await addMessageWithDelay(steps[i], 'bot', i * 1500);
                
                if (window.voiceEnabled) {
                    await new Promise(resolve => setTimeout(resolve, 300));
                    speakText(cleanTextForSpeech(steps[i]));
                    
                    if (i < steps.length - 1) {
                        await waitForSpeechEnd();
                    }
                }
            }
        } else {
            addMessage(fullResponse, 'bot');
            if (window.voiceEnabled) {
                speakText(fullResponse);
            }
        }
    }
    
    function waitForSpeechEnd() {
        return new Promise(resolve => {
            const checkSpeaking = setInterval(() => {
                if (!window.speechSynthesis.speaking) {
                    clearInterval(checkSpeaking);
                    resolve();
                }
            }, 100);
        });
    }
    
    function cleanTextForSpeech(text) {
        return text
            .replace(/(\d+)x/gi, '$1 equis')
            .replace(/\bx\b/gi, 'equis')
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
            .replace(/θ/gi, 'theta');
    }
    
    function extractSteps(text) {
        const stepPattern = /(Paso\s*\d+[:\-\.]\s*[^Paso]+)(?=Paso|Solución|$)/gi;
        let matches = text.match(stepPattern);
        return matches && matches.length > 0 ? matches.map(s => s.trim()) : [text];
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
    
    function formatText(text) {
        return text
            .replace(/(Paso\s*\d+[:\.\-])/gi, '<strong style="color: #1565c0; font-size: 1.1em;">$1</strong>')
            .replace(/(Solución final[:\.\-])/gi, '<strong style="color: #2e7d32; font-size: 1.1em;">$1</strong>')
            .replace(/\n/g, '<br>');
    }
    
    function speakText(texto) {
        if ('speechSynthesis' in window && window.voiceEnabled) {
            window.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(texto);
            utterance.lang = 'es-ES';
            utterance.rate = 0.9;
            utterance.pitch = 1;
            utterance.volume = 1;
            
            const voices = window.speechSynthesis.getVoices();
            const spanishVoice = voices.find(voice => voice.lang.includes('es'));
            
            if (spanishVoice) {
                utterance.voice = spanishVoice;
            }
            
            window.speechSynthesis.speak(utterance);
        }
    }
    
    function simulateImageAnalysis(file) {
        setTimeout(() => {
            addMessage('🔍 He detectado un problema matemático en la imagen. Describe qué necesitas resolver.', 'bot');
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
        const start = userInput.selectionStart;
        const end = userInput.selectionEnd;
        userInput.value = userInput.value.substring(0, start) + value + userInput.value.substring(end);
        userInput.selectionStart = userInput.selectionEnd = start + value.length;
        userInput.focus();
    };
    
    window.insertFunction = function(funcName) {
        const start = userInput.selectionStart;
        const end = userInput.selectionEnd;
        userInput.value = userInput.value.substring(0, start) + funcName + '()' + userInput.value.substring(end);
        userInput.selectionStart = userInput.selectionEnd = start + funcName.length + 1;
        userInput.focus();
    };
    
    window.insertFraction = function() {
        const start = userInput.selectionStart;
        const end = userInput.selectionEnd;
        userInput.value = userInput.value.substring(0, start) + '(a)/(b)' + userInput.value.substring(end);
        userInput.selectionStart = start + 1;
        userInput.selectionEnd = start + 2;
        userInput.focus();
    };
    
    window.insertLimit = function() {
        const start = userInput.selectionStart;
        const end = userInput.selectionEnd;
        userInput.value = userInput.value.substring(0, start) + 'lim_(x→0)' + userInput.value.substring(end);
        userInput.selectionStart = start + 5;
        userInput.selectionEnd = start + 6;
        userInput.focus();
    };
    
    window.insertIntegral = function() {
        const start = userInput.selectionStart;
        const end = userInput.selectionEnd;
        userInput.value = userInput.value.substring(0, start) + '∫_a^b f(x)dx' + userInput.value.substring(end);
        userInput.selectionStart = start + 7;
        userInput.selectionEnd = start + 8;
        userInput.focus();
    };
    
    window.clearInput = function() {
        userInput.value = '';
        userInput.focus();
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

// === FUNCIONES PARA GRÁFICAS ===
async function graficarFuncion(funcionTexto) {
    try {
        const response = await fetch('/graficar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                funcion: funcionTexto,
                xMin: -10,
                xMax: 10
            })
        });
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            mostrarGrafica(data.datos, data.funcion);
        } else {
            addMessage(`❌ Error: ${data.error || 'No se pudo generar la gráfica'}`, 'bot');
        }
    } catch (error) {
        console.error('Error al graficar:', error);
        addMessage("❌ Error al generar la gráfica. Verifica la función.", 'bot');
    }
}

function mostrarGrafica(datos, funcion) {
    const graphContainer = document.getElementById('graphContainer');
    const graphCanvas = document.getElementById('graphCanvas');
    
    if (!graphContainer || !graphCanvas) {
        console.error("❌ No se encontraron los elementos de la gráfica");
        return;
    }
    
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
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: { display: true, text: 'Eje X' },
                    min: -10,
                    max: 10
                },
                y: {
                    title: { display: true, text: 'Eje Y' },
                    min: -10,
                    max: 10
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: `Gráfica de: ${funcion}`,
                    font: { size: 16 }
                },
                legend: { position: 'top' }
            }
        }
    });
}

function detectarYGraficarFuncion(texto) {
    const patronesExplicitos = [
        /graficar\s+(.+)/i,
        /gráfica\s+de\s+(.+)/i,
        /dibujar\s+(.+)/i,
        /plot\s+(.+)/i,
        /generar\s+gráfica\s+de\s+(.+)/i,
        /muestra\s+la\s+gráfica\s+de\s+(.+)/i,
        /representar\s+gráficamente\s+(.+)/i
    ];
    
    for (const patron of patronesExplicitos) {
        const match = texto.match(patron);
        if (match && match[1]) {
            return match[1].trim();
        }
    }
    
    const esFuncionPura = 
        texto.length <= 30 &&
        (/[\^\+\-\*\/\(\)]/.test(texto) || /f\(x\)/i.test(texto)) &&
        !/(resolver|calcular|explicar|ayuda|ejemplo|problema|ejercicio|derivada|integral|límite|ecuación|despejar|simplificar)/i.test(texto) &&
        !/\?/.test(texto) &&
        !/^\d+$/.test(texto);
    
    if (esFuncionPura) {
        return texto;
    }
    
    return null;
}

// === FUNCIONES DE CONTROL DE GRÁFICA ===
function zoomIn() {
    if (window.graficaActual) {
        const chart = window.graficaActual;
        const xRange = chart.options.scales.x.max - chart.options.scales.x.min;
        const yRange = chart.options.scales.y.max - chart.options.scales.y.min;
        
        chart.options.scales.x.min += xRange * 0.1;
        chart.options.scales.x.max -= xRange * 0.1;
        chart.options.scales.y.min += yRange * 0.1;
        chart.options.scales.y.max -= yRange * 0.1;
        
        chart.update();
    }
}

function zoomOut() {
    if (window.graficaActual) {
        const chart = window.graficaActual;
        const xRange = chart.options.scales.x.max - chart.options.scales.x.min;
        const yRange = chart.options.scales.y.max - chart.options.scales.y.min;
        
        chart.options.scales.x.min -= xRange * 0.1;
        chart.options.scales.x.max += xRange * 0.1;
        chart.options.scales.y.min -= yRange * 0.1;
        chart.options.scales.y.max += yRange * 0.1;
        
        chart.update();
    }
}

function resetZoom() {
    if (window.graficaActual) {
        const chart = window.graficaActual;
        chart.options.scales.x.min = -10;
        chart.options.scales.x.max = 10;
        chart.options.scales.y.min = -10;
        chart.options.scales.y.max = 10;
        chart.update();
    }
}

function descargarGrafica() {
    if (window.graficaActual) {
        const canvas = document.getElementById('graphCanvas');
        const url = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url;
        a.download = 'grafica.png';
        a.click();
    }
}

function compartirGrafica() {
    if (navigator.share) {
        const canvas = document.getElementById('graphCanvas');
        canvas.toBlob(blob => {
            const file = new File([blob], 'grafica.png', { type: 'image/png' });
            navigator.share({
                title: 'Gráfica Matemática',
                text: 'Mira esta gráfica que generé',
                files: [file]
            }).catch(err => console.error('Error al compartir:', err));
        });
    } else {
        alert('Tu navegador no soporta la función de compartir');
    }
}
