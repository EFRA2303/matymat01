document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const chatContainer = document.getElementById('chatContainer');
    const toggleKeyboardBtn = document.getElementById('toggleKeyboardBtn');
    const mathKeyboard = document.getElementById('mathKeyboard');
    const closeMathKeyboard = document.getElementById('closeMathKeyboard');
    const switchToTextKeyboard = document.getElementById('switchToTextKeyboard');
    const keyboardTabs = mathKeyboard.querySelectorAll('.keyboard-tab');
    const keyboardExtras = document.getElementById('keyboardExtras');
    const extraSections = keyboardExtras.querySelectorAll('.extra-section');
    const uploadBtn = document.getElementById('uploadBtn');
    const fileInput = document.getElementById('fileInput');
    const optionsContainer = document.getElementById('optionsContainer');
    const optionsGrid = document.getElementById('optionsGrid');
    const questionDisplay = document.getElementById('questionDisplay');
    const contadorEstrellas = document.getElementById('contadorEstrellas');
    
    // Variables globales (MANTIENE TODAS LAS ORIGINALES)
    let isSending = false;
    window.voiceEnabled = true;
    window.colaVoz = [];
    window.hablando = false;
    window.sesionActual = null;
    window.opcionesActuales = [];
    window.respuestaCorrecta = null;
    window.respuestasCorrectas = 0;
    window.totalPreguntas = 0;
    window.estrellasTotales = 0;
    window.pasoActual = null;
    window.felicitacionReproducida = false;
    window.mensajeInicialReproducido = false;
    window.ggbApp = null;
    window.isMathKeyboardActive = false;
    
    // === INICIALIZACIÓN DEL TECLADO ===
    function initKeyboard() {
        // Configurar eventos de tabs
        keyboardTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remover clase active de todos
                keyboardTabs.forEach(t => t.classList.remove('active'));
                extraSections.forEach(s => s.classList.remove('active'));
                
                // Agregar clase active al tab clickeado
                tab.classList.add('active');
                const tabName = tab.dataset.tab;
                const extraSection = document.getElementById('extra' + tabName.charAt(0).toUpperCase() + tabName.slice(1));
                if (extraSection) {
                    extraSection.classList.add('active');
                }
            });
        });
        
        // Evento cerrar teclado
        closeMathKeyboard.addEventListener('click', closeMathKeyboardFunc);
        
        // Evento cambiar a teclado de texto
        switchToTextKeyboard.addEventListener('click', () => {
            closeMathKeyboardFunc();
            userInput.focus();
        });
        
        // Cerrar teclado al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (mathKeyboard.style.display === 'block' && 
                !mathKeyboard.contains(e.target) && 
                e.target !== toggleKeyboardBtn && 
                !toggleKeyboardBtn.contains(e.target)) {
                closeMathKeyboardFunc();
            }
        });
    }
    
    // === FUNCIONES DEL TECLADO (MANTIENE TODAS LAS ORIGINALES) ===
    window.insertAtCursor = function(value) {
        const start = userInput.selectionStart;
        const end = userInput.selectionEnd;
        userInput.value = userInput.value.substring(0, start) + value + userInput.value.substring(end);
        userInput.selectionStart = userInput.selectionEnd = start + value.length;
        userInput.focus();
        autoResizeTextarea();
    };
    
    window.clearAll = function() {
        userInput.value = '';
        userInput.focus();
        autoResizeTextarea();
    };
    
    window.backspaceInput = function() {
        const start = userInput.selectionStart;
        const end = userInput.selectionEnd;
        
        if (start === end && start > 0) {
            userInput.value = userInput.value.substring(0, start - 1) + userInput.value.substring(end);
            userInput.selectionStart = userInput.selectionEnd = start - 1;
        } else if (start !== end) {
            userInput.value = userInput.value.substring(0, start) + userInput.value.substring(end);
            userInput.selectionStart = userInput.selectionEnd = start;
        }
        userInput.focus();
        autoResizeTextarea();
    };
    
    window.insertFraction = function() {
        const start = userInput.selectionStart;
        const end = userInput.selectionEnd;
        userInput.value = userInput.value.substring(0, start) + '(a)/(b)' + userInput.value.substring(end);
        userInput.selectionStart = start + 1;
        userInput.selectionEnd = start + 2;
        userInput.focus();
        autoResizeTextarea();
    };
    
    window.insertFunction = function(funcName) {
        const start = userInput.selectionStart;
        const end = userInput.selectionEnd;
        userInput.value = userInput.value.substring(0, start) + funcName + '()' + userInput.value.substring(end);
        userInput.selectionStart = userInput.selectionEnd = start + funcName.length + 1;
        userInput.focus();
        autoResizeTextarea();
    };
    
    window.insertIntegral = function() {
        const start = userInput.selectionStart;
        const end = userInput.selectionEnd;
        userInput.value = userInput.value.substring(0, start) + '∫_a^b f(x)dx' + userInput.value.substring(end);
        userInput.selectionStart = start + 7;
        userInput.selectionEnd = start + 8;
        userInput.focus();
        autoResizeTextarea();
    };
    
    // Funciones del teclado matemático
    function toggleKeyboard() {
        if (mathKeyboard.style.display === 'block') {
            closeMathKeyboardFunc();
        } else {
            openMathKeyboard();
        }
    }
    
    function openMathKeyboard() {
        mathKeyboard.style.display = 'block';
        toggleKeyboardBtn.classList.add('active');
        window.isMathKeyboardActive = true;
        
        // Ajustar chat para que no quede tapado
        chatContainer.style.paddingBottom = 'calc(60vh + 80px)';
        
        // Scroll al final del chat
        setTimeout(() => {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }, 100);
    }
    
    function closeMathKeyboardFunc() {
        mathKeyboard.style.display = 'none';
        toggleKeyboardBtn.classList.remove('active');
        window.isMathKeyboardActive = false;
        chatContainer.style.paddingBottom = '80px';
    }
    
    function autoResizeTextarea() {
        userInput.style.height = 'auto';
        const newHeight = Math.min(userInput.scrollHeight, 120);
        userInput.style.height = newHeight + 'px';
    }
    
    // === SISTEMA DE VOZ COMPLETO (MANTIENE TODO) ===
    window.hablarConCola = function(texto) {
        if (!window.voiceEnabled || !texto) return;
        
        window.colaVoz.push(texto);
        procesarColaVoz();
    };

    function procesarColaVoz() {
        if (window.hablando || window.colaVoz.length === 0) return;
        
        window.hablando = true;
        const texto = window.colaVoz.shift();
        
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
        
        utterance.onend = function() {
            window.hablando = false;
            setTimeout(procesarColaVoz, 300);
        };
        
        utterance.onerror = function() {
            window.hablando = false;
            setTimeout(procesarColaVoz, 300);
        };
        
        window.speechSynthesis.speak(utterance);
    }
    
    // === MEJORAR MENSAJE INICIAL CON VOZ ===
    function mejorarMensajeInicial() {
        if (window.voiceEnabled && !window.mensajeInicialReproducido) {
            window.mensajeInicialReproducido = true;
            
            const textoVoz = `¡Hola! Soy MatyMat cero uno, tu tutor virtual de matemáticas. Te ayudaré a entender y aprender álgebra, trigonometría y geometría. 

Puedes escribir tu pregunta, tomar fotos de ejercicios, resolver paso a paso con opciones interactivas, ganar estrellas y visualizar gráficas. 

Por ejemplo, puedes preguntar: resolver ecuaciones como dos equis más cinco igual a quince, calcular funciones trigonométricas como seno de treinta grados, o hallar áreas y volúmenes como el área de un círculo. 

¿En qué tema matemático necesitas ayuda?`;
            
            setTimeout(() => {
                window.hablarConCola(textoVoz);
            }, 1500);
        }
    }
    
    // === MOSTRAR OPCIONES (EMERGENTE, NO FULL SCREEN) ===
    window.mostrarOpcionesInteractivo = function(opciones, pregunta = '') {
        // Cerrar teclado matemático si está abierto
        if (window.isMathKeyboardActive) {
            closeMathKeyboardFunc();
        }
        
        // Mostrar pregunta
        if (pregunta) {
            questionDisplay.innerHTML = `<p>${formatText(pregunta)}</p>`;
        } else {
            questionDisplay.innerHTML = `<p>Selecciona la opción correcta:</p>`;
        }
        
        // Limpiar opciones anteriores
        optionsGrid.innerHTML = '';
        
        // Agregar nuevas opciones
        opciones.forEach((opcion, index) => {
            const letra = String.fromCharCode(65 + index);
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.dataset.opcion = letra;
            btn.dataset.correcta = opcion.correcta;
            btn.innerHTML = `
                <span class="option-letter">${letra}</span>
                <span class="option-text">${opcion.texto}</span>
            `;
            btn.onclick = () => window.elegirOpcion(letra, opcion.correcta);
            optionsGrid.appendChild(btn);
        });
        
        // Mostrar contenedor de opciones (emergente)
        optionsContainer.style.display = 'block';
        
        // Scroll al popup de opciones
        setTimeout(() => {
            optionsContainer.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
        }, 300);
    };
    
    // Cerrar opciones
    window.closeOptions = function() {
        optionsContainer.style.display = 'none';
    };
    
    // === FUNCIÓN MEJORADA PARA ELEGIR OPCIÓN (MANTIENE TODO) ===
    window.elegirOpcion = async function(opcion, esCorrecta) {
        if (!window.sesionActual) return;
        
        const botones = optionsGrid.querySelectorAll('.option-btn');
        
        // Deshabilitar todos los botones
        botones.forEach(btn => btn.disabled = true);
        
        // Encontrar botón elegido
        const botonElegido = Array.from(botones).find(btn => btn.dataset.opcion === opcion);
        if (botonElegido) {
            if (esCorrecta) {
                botonElegido.classList.add('correct');
                botonElegido.innerHTML += ' <i class="fas fa-check"></i>';
                window.respuestasCorrectas++;
                
                const estrellasGanadas = 1;
                window.estrellasTotales += estrellasGanadas;
                actualizarEstrellas(window.estrellasTotales);
                
                addMessage(`Elegiste: Opción ${opcion} ✓ (¡Correcto! +${estrellasGanadas}⭐)`, 'user');
                
                if (window.voiceEnabled) {
                    window.hablarConCola("¡Correcto! Excelente trabajo. Avanzando al siguiente paso.");
                }
            } else {
                botonElegido.classList.add('incorrect');
                botonElegido.innerHTML += ' <i class="fas fa-times"></i>';
                addMessage(`Elegiste: Opción ${opcion} ✗ (Incorrecto)`, 'user');
                
                const opcionCorrecta = window.opcionesActuales.find(op => op.correcta);
                if (opcionCorrecta) {
                    const botonCorrecto = Array.from(botones).find(btn => btn.dataset.opcion === opcionCorrecta.letra);
                    if (botonCorrecto) {
                        botonCorrecto.classList.add('correct');
                        botonCorrecto.innerHTML += ' <i class="fas fa-check"></i>';
                    }
                    
                    if (window.voiceEnabled) {
                        const explicacion = `Incorrecto. La opción correcta es la ${opcionCorrecta.letra}. `;
                        window.hablarConCola(explicacion);
                        
                        setTimeout(() => {
                            const textoOpciones = `Recuerda que: ${window.pasoActual?.explicacionError || 'revisa los conceptos básicos.'}`;
                            window.hablarConCola(textoOpciones);
                        }, 2000);
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
            
            // Cerrar opciones actuales después de 2 segundos
            setTimeout(() => {
                closeOptions();
                addMessage(data.respuesta, 'bot');
            }, 2000);
            
            if (data.estrellas !== undefined) {
                actualizarEstrellas(data.estrellas);
            }
            
            if (data.tieneOpciones && !data.sesionCompletada) {
                window.opcionesActuales = data.opciones || [];
                window.respuestaCorrecta = data.respuestaCorrecta;
                window.totalPreguntas++;
                
                window.pasoActual = {
                    explicacionError: data.explicacionError || "Revisa los conceptos básicos.",
                    opcionCorrecta: data.respuestaCorrecta
                };
                
                setTimeout(() => {
                    mostrarOpcionesInteractivo(data.opciones, data.respuesta);
                    if (window.voiceEnabled) {
                        narrarPasoCompleto(data.respuesta, data.opciones, data.respuestaCorrecta);
                    }
                }, 3000);
            } else {
                if (data.sesionCompletada) {
                    const porcentaje = Math.round((window.respuestasCorrectas / window.totalPreguntas) * 100);
                    const mensajeFinal = `🎉 ¡Sesión completada! ${window.respuestasCorrectas}/${window.totalPreguntas} correctas (${porcentaje}%)`;
                    
                    setTimeout(() => {
                        addMessage(mensajeFinal, 'bot');
                    }, 1000);
                    
                    if (window.voiceEnabled && !window.felicitacionReproducida) {
                        window.felicitacionReproducida = true;
                        
                        let felicitacion = "";
                        if (porcentaje >= 80) {
                            felicitacion = "¡Excelente trabajo! Has demostrado un gran entendimiento del tema. ";
                        } else if (porcentaje >= 60) {
                            felicitacion = "Buen trabajo. Sigue practicando para mejorar. ";
                        } else {
                            felicitacion = "Sigue intentándolo, la práctica hace al maestro. ";
                        }
                        felicitacion += `Obtuviste ${window.estrellasTotales} estrellas. ¡Felicidades!`;
                        window.hablarConCola(felicitacion);
                    }
                    
                    window.respuestasCorrectas = 0;
                    window.totalPreguntas = 0;
                    window.felicitacionReproducida = false;
                }
            }
            
        } catch (error) {
            addMessage("❌ Error al procesar tu respuesta", 'bot');
            console.error('Error:', error);
            botones.forEach(btn => btn.disabled = false);
            closeOptions();
        }
    };
    
    // === NARRAR EXPLICACIÓN COMPLETA DEL PASO ===
    function narrarPasoCompleto(respuestaCompleta, opciones, respuestaCorrecta) {
        if (!window.voiceEnabled) return;
        
        const lineas = respuestaCompleta.split('\n');
        let explicacionPaso = "";
        
        for (const linea of lineas) {
            if (linea.includes('Opciones:')) break;
            explicacionPaso += linea + ". ";
        }
        
        explicacionPaso = explicacionPaso.replace(/\*\*/g, '').replace(/📝\s*\*?\*?Paso\s*\d+[:\.\-]\s*\*?\*?/i, '');
        
        window.hablarConCola(explicacionPaso);
        
        setTimeout(() => {
            let textoOpciones = " Ahora tienes estas opciones: ";
            opciones.forEach((opcion, index) => {
                const letra = String.fromCharCode(65 + index);
                textoOpciones += `Opción ${letra}. `;
            });
            textoOpciones += "¿Cuál eliges?";
            window.hablarConCola(textoOpciones);
        }, 5000);
    }
    
    // === ACTUALIZAR ESTRELLAS CON ANIMACIÓN ===
    function actualizarEstrellas(cantidad) {
        window.estrellasTotales = cantidad;
        
        if (contadorEstrellas) {
            let currentCount = parseInt(contadorEstrellas.textContent) || 0;
            const increment = cantidad > currentCount ? 1 : -1;
            
            const animateCount = () => {
                currentCount += increment;
                contadorEstrellas.textContent = currentCount;
                
                if (increment > 0) {
                    crearConfeti();
                }
                
                if ((increment > 0 && currentCount < cantidad) || 
                    (increment < 0 && currentCount > cantidad)) {
                    requestAnimationFrame(animateCount);
                }
            };
            
            animateCount();
            
            contadorEstrellas.classList.add('star-pulse');
            setTimeout(() => {
                contadorEstrellas.classList.remove('star-pulse');
            }, 1000);
        }
    }
    
    // === CREAR EFECTO CONFETI ===
    function crearConfeti() {
        const confettiContainer = document.createElement('div');
        confettiContainer.className = 'star-confetti';
        
        for (let i = 0; i < 30; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti-piece';
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.animationDelay = Math.random() * 2 + 's';
            confetti.style.background = ['#FFD700', '#FF8C00', '#FF6347', '#00CED1', '#9370DB'][Math.floor(Math.random() * 5)];
            confettiContainer.appendChild(confetti);
        }
        
        document.body.appendChild(confettiContainer);
        
        setTimeout(() => {
            confettiContainer.remove();
        }, 3000);
    }
    
    // === FUNCIONES PRINCIPALES DE CHAT ===
    function addMessage(text, sender) {
        const div = document.createElement('div');
        div.className = `message ${sender}`;
        div.style.opacity = '0';
        div.style.transform = 'translateY(10px)';
        div.style.transition = 'all 0.3s ease';
        
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
        
        // Scroll al final
        setTimeout(() => {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }, 100);
    }
    
    function formatText(text) {
        return text
            .replace(/(Paso\s*\d+[:\.\-])/gi, '<strong style="color: #1565c0; font-size: 1.1em;">$1</strong>')
            .replace(/(Solución final[:\.\-])/gi, '<strong style="color: #2e7d32; font-size: 1.1em;">$1</strong>')
            .replace(/\n/g, '<br>');
    }
    
    // === SIMULACIÓN DE ANÁLISIS DE IMAGEN ===
    async function simulateImageAnalysis(file) {
        // Mostrar opciones directamente sin OCR
        setTimeout(() => {
            addMessage('✅ Foto recibida. ¿Qué te gustaría hacer con esta actividad matemática?', 'bot');
            
            const opciones = [
                { letra: 'A', texto: "📝 Describir el problema para resolverlo", accion: "describir" },
                { letra: 'B', texto: "📚 Pedir explicación de conceptos", accion: "explicar" },
                { letra: 'C', texto: "🔄 Tomar otra foto", accion: "otra" }
            ];
            
            mostrarOpcionesInteractivo(opciones, "¿Qué te gustaría hacer con la foto del ejercicio?");
        }, 1000);
    }
    
    // === ENVIAR MENSAJE COMPLETO ===
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
                await graficarFuncionGeoGebra(funcionAGraficar);
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
                if (data.necesitaGrafica && data.graficaData && data.graficaData.funcion) {
                    addMessage(data.respuesta, 'bot');
                    graficarFuncionGeoGebra(data.graficaData.funcion);
                    isSending = false;
                    return;
                }

                // MODO INTERACTIVO CON OPCIONES
                if (data.tipo === "interactivo" && data.tieneOpciones) {
                    window.sesionActual = data.sesionId;
                    window.opcionesActuales = data.opciones || [];
                    window.respuestaCorrecta = data.respuestaCorrecta;
                    window.totalPreguntas++;
                    
                    window.pasoActual = {
                        explicacionError: data.explicacionError || "Revisa los conceptos básicos.",
                        opcionCorrecta: data.respuestaCorrecta
                    };
                    
                    actualizarEstrellas(data.estrellas || 0);
                    addMessage(data.respuesta, 'bot');
                    
                    setTimeout(() => {
                        mostrarOpcionesInteractivo(data.opciones);
                        if (window.voiceEnabled) {
                            narrarPasoCompleto(data.respuesta, data.opciones, data.respuestaCorrecta);
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
                    window.hablarConCola(cleanTextForSpeech(steps[i]));
                    
                    if (i < steps.length - 1) {
                        await waitForSpeechEnd();
                    }
                }
            }
        } else {
            addMessage(fullResponse, 'bot');
            if (window.voiceEnabled) {
                window.hablarConCola(cleanTextForSpeech(fullResponse));
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
    
    // === EVENTOS PRINCIPALES ===
    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    userInput.addEventListener('input', autoResizeTextarea);
    
    // Configurar botón de teclado matemático
    toggleKeyboardBtn.addEventListener('click', toggleKeyboard);
    
    // Subir imagen
    if (uploadBtn && fileInput) {
        uploadBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (event) => {
            if (event.target.files.length > 0) {
                addMessage('📸 Imagen enviada para análisis...', 'user');
                simulateImageAnalysis(event.target.files[0]);
                event.target.value = '';
            }
        });
    }
    
    // Atajos de teclado
    document.addEventListener('keydown', function(e) {
        // ESC para cerrar teclado u opciones
        if (e.key === 'Escape') {
            if (mathKeyboard.style.display === 'block') {
                closeMathKeyboardFunc();
            } else if (optionsContainer.style.display === 'block') {
                closeOptions();
            }
        }
        
        // Ctrl+M para teclado matemático
        if (e.ctrlKey && e.key === 'm') {
            e.preventDefault();
            toggleKeyboard();
        }
        
        // Ctrl+Enter para enviar
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            sendMessage();
        }
        
        // Ctrl+L para limpiar
        if (e.ctrlKey && e.key === 'l') {
            e.preventDefault();
            clearAll();
        }
    });
    
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
                window.colaVoz = [];
                window.hablando = false;
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
    
    // Inicializar componentes
    initKeyboard();
    mejorarMensajeInicial();
});

// === FUNCIONES PARA GRÁFICAS CON GEOGEBRA ===
async function graficarFuncionGeoGebra(funcionTexto) {
    try {
        if (!window.ggbApp) {
            inicializarGeoGebra();
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        const graphContainer = document.getElementById('graphContainer');
        graphContainer.style.display = 'block';
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        window.ggbApp.evalCommand('DeleteAll()');
        window.ggbApp.evalCommand(`f(x)=${funcionTexto}`);
        window.ggbApp.setCoordSystem(-10, 10, -10, 10);
        
        await new Promise(resolve => setTimeout(resolve, 300));
        window.ggbApp.zoomToFit();
        
    } catch (error) {
        console.error('Error al graficar con GeoGebra:', error);
    }
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

// === FUNCIONES DE CONTROL DE GRÁFICA GEOGEBRA ===
function zoomInGeoGebra() {
    if (window.ggbApp) {
        window.ggbApp.zoom(0.8, 0, 0);
    }
}

function zoomOutGeoGebra() {
    if (window.ggbApp) {
        window.ggbApp.zoom(1.2, 0, 0);
    }
}

function resetZoomGeoGebra() {
    if (window.ggbApp) {
        window.ggbApp.setCoordSystem(-10, 10, -10, 10);
    }
}

function descargarGraficaGeoGebra() {
    if (window.ggbApp) {
        window.ggbApp.exportPNG("grafica_matymat", 2, true, 800, 600, 72);
    }
}

function cerrarGrafica() {
    const graphContainer = document.getElementById('graphContainer');
    graphContainer.style.display = 'none';
}

// === INICIALIZAR GEOGEBRA ===
function inicializarGeoGebra() {
    if (window.ggbApp) return;
    
    const parameters = {
        "id": "ggb-element",
        "width": "100%",
        "height": 400,
        "showToolBar": true,
        "showAlgebraInput": true,
        "showMenuBar": false,
        "showZoomButtons": false,
        "enableLabelDrags": false,
        "enableShiftDragZoom": true,
        "enableRightClick": false,
        "errorDialogsActive": false,
        "useBrowserForJS": false,
        "allowStyleBar": false,
        "preventFocus": false,
        "language": "es",
        "appName": "graphing"
    };
    
    window.ggbApp = new GGBApplet(parameters, true);
    window.ggbApp.inject('ggb-element');
}

// === DOBLE CLICK PARA SALIR - VERSIÓN MINIMALISTA ===
let clicks = 0;

document.addEventListener('click', (e) => {
    if (e.target.closest('button, textarea, input')) return;
    
    clicks++;
    
    if (clicks === 1) {
        setTimeout(() => clicks = 0, 1500);
        showExitHint();
    } else if (clicks === 2) {
        clicks = 0;
        confirmExit();
    }
});

function showExitHint() {
    const hint = document.createElement('div');
    hint.textContent = '👆 Toca otra vez para SALIR';
    hint.style.cssText = `
        position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
        background: #ff4757; color: white; padding: 10px 20px; border-radius: 20px;
        font-weight: bold; z-index: 9999; animation: fadeHint 2s;
    `;
    document.body.appendChild(hint);
    setTimeout(() => hint.remove(), 2000);
}

function confirmExit() {
    const modal = document.createElement('div');
    modal.innerHTML = `
        <div style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); display:flex; align-items:center; justify-content:center; z-index:10000;">
            <div style="background:white; padding:25px; border-radius:15px; text-align:center; max-width:300px;">
                <h3 style="margin:0 0 15px 0;">¿Salir de MatyMat?</h3>
                <button onclick="closeApp()" style="background:#ff4757; color:white; border:none; padding:10px 20px; border-radius:8px; margin:5px; cursor:pointer;">
                    ✅ Sí, salir
                </button>
                <button onclick="this.closest('div').remove()" style="background:#576574; color:white; border:none; padding:10px 20px; border-radius:8px; margin:5px; cursor:pointer;">
                    ❌ Cancelar
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function closeApp() {
    document.body.innerHTML = `
        <div style="height:100vh; background:linear-gradient(135deg, #667eea, #764ba2); display:flex; align-items:center; justify-content:center; color:white; font-family:Poppins;">
            <div style="text-align:center;">
                <h1 style="font-size:2.5rem; margin-bottom:20px;">👋 ¡Hasta pronto!</h1>
                <p>MatyMat-01</p>
            </div>
        </div>
    `;
    setTimeout(() => window.close() || (window.location.href = 'about:blank'), 1500);
}

// Estilos adicionales dinámicos
document.head.insertAdjacentHTML('beforeend', `
    <style>
        @keyframes fadeHint {
            0% { opacity:0; transform:translateX(-50%) translateY(-10px); }
            20% { opacity:1; transform:translateX(-50%) translateY(0); }
            80% { opacity:1; transform:translateX(-50%) translateY(0); }
            100% { opacity:0; transform:translateX(-50%) translateY(-10px); }
        }
    </style>
`);

// Llamar inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', inicializarGeoGebra);
