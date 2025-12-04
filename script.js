document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const chatContainer = document.getElementById('chatContainer');
    const toggleMathBtn = document.getElementById('toggleMathBtn');
    const mathToolbar = document.getElementById('mathToolbar');
    const keyboardTabs = document.getElementById('keyboardTabs');
    const keyboardContent = document.getElementById('keyboardContent');
    const closeKeyboardBtn = document.getElementById('closeKeyboardBtn');
    const keyboardGrip = document.getElementById('keyboardGrip');
    const uploadBtn = document.getElementById('uploadBtn');
    const fileInput = document.getElementById('fileInput');
    
    // Variables globales
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
    
    // Layout del teclado matemático
    const keyboardLayouts = {
        basic: [
            { keys: ['7', '8', '9', '+', 'C'], class: 'num' },
            { keys: ['4', '5', '6', '-', '⌫'], class: 'num' },
            { keys: ['1', '2', '3', '×', '÷'], class: 'num' },
            { keys: ['0', '.', '(', ')', '='], class: 'num', span: [1, 1, 1, 1, 1] },
            { type: 'group', title: 'Símbolos' },
            { keys: ['x', 'y', 'z', '^', '√'], class: 'sym' },
            { keys: ['π', 'θ', '°', '%', '!'], class: 'sym' },
            { keys: ['a/b', '∫', '∂', '∑', '∏'], class: 'sym' },
            { type: 'group', title: 'Funciones' },
            { keys: ['sin', 'cos', 'tan', 'cot', 'sec'], class: 'func' },
            { keys: ['csc', 'arcsin', 'arccos', 'arctan', 'log'], class: 'func' },
            { keys: ['ln', 'lg', 'exp', 'abs', 'lim'], class: 'func' },
            { keys: ['sinh', 'cosh', 'tanh', 'floor', 'ceil'], class: 'func' },
            { keys: ['round', 'rand', 'gcd', 'lcm', 'mod'], class: 'func' }
        ]
    };
    
    // === FUNCIONALIDAD PARA MINIMIZAR EL CHAT ===
    function toggleMinimizarChat() {
        const body = document.body;
        const boton = document.getElementById('minimizarChatBtn');
        const mensaje = document.getElementById('minimizadoMensaje');
        
        if (body.classList.contains('chat-minimizado')) {
            // Restaurar chat (maximizar)
            body.classList.remove('chat-minimizado');
            boton.innerHTML = '<i class="fas fa-chevron-down"></i>';
            boton.title = "Minimizar chat para ver mejor las opciones";
            
            // Restaurar scroll del chat
            const chatContainer = document.getElementById('chatContainer');
            if (chatContainer) {
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
        } else {
            // Minimizar chat
            body.classList.add('chat-minimizado');
            boton.innerHTML = '<i class="fas fa-chevron-up"></i>';
            boton.title = "Maximizar chat";
            
            // Mostrar mensaje temporal
            if (mensaje) {
                mensaje.style.display = 'block';
                setTimeout(() => {
                    mensaje.style.display = 'none';
                }, 3000);
            }
            
            // Hacer scroll a las opciones si están visibles
            const opcionesContainer = document.getElementById('opcionesContainer');
            if (opcionesContainer && opcionesContainer.style.display === 'block') {
                setTimeout(() => {
                    opcionesContainer.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center' 
                    });
                }, 500);
            }
        }
    }
    
    // FUNCIÓN MODIFICADA PARA MOSTRAR OPCIONES
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
        
        // MINIMIZAR AUTOMÁTICAMENTE EL CHAT PARA VER MEJOR LAS OPCIONES
        setTimeout(() => {
            if (!document.body.classList.contains('chat-minimizado')) {
                toggleMinimizarChat();
            }
            // Scroll a las opciones
            opcionesContainer.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
        }, 800);
    }
    
    // Inicializar teclado
    function initMathKeyboard() {
        // Generar contenido inicial (tab básico)
        generateKeyboardContent('basic');
        
        // Configurar eventos de tabs
        const tabs = keyboardTabs.querySelectorAll('.keyboard-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remover clase active de todos
                tabs.forEach(t => t.classList.remove('active'));
                // Agregar clase active al tab clickeado
                tab.classList.add('active');
                // Generar contenido del tab
                const tabName = tab.dataset.tab;
                generateKeyboardContent(tabName);
            });
        });
        
        // Evento cerrar teclado
        closeKeyboardBtn.addEventListener('click', closeMathKeyboard);
        
        // Evento grip para arrastrar (opcional)
        let isDragging = false;
        let startY, startHeight;
        
        keyboardGrip.addEventListener('mousedown', startDrag);
        keyboardGrip.addEventListener('touchstart', startDrag);
        
        function startDrag(e) {
            isDragging = true;
            startY = e.clientY || e.touches[0].clientY;
            startHeight = mathToolbar.offsetHeight;
            document.addEventListener('mousemove', doDrag);
            document.addEventListener('touchmove', doDrag);
            document.addEventListener('mouseup', stopDrag);
            document.addEventListener('touchend', stopDrag);
            e.preventDefault();
        }
        
        function doDrag(e) {
            if (!isDragging) return;
            const currentY = e.clientY || e.touches[0].clientY;
            const deltaY = startY - currentY;
            const newHeight = Math.min(Math.max(startHeight + deltaY, 200), window.innerHeight * 0.7);
            mathToolbar.style.height = newHeight + 'px';
        }
        
        function stopDrag() {
            isDragging = false;
            document.removeEventListener('mousemove', doDrag);
            document.removeEventListener('touchmove', doDrag);
            document.removeEventListener('mouseup', stopDrag);
            document.removeEventListener('touchend', stopDrag);
        }
        
        // Cerrar teclado al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (mathToolbar.style.display === 'block' && 
                !mathToolbar.contains(e.target) && 
                e.target !== toggleMathBtn && 
                !toggleMathBtn.contains(e.target)) {
                closeMathKeyboard();
            }
        });
    }
    
    // Generar contenido del teclado
    function generateKeyboardContent(tabName) {
        keyboardContent.innerHTML = '';
        const layout = keyboardLayouts[tabName];
        
        layout.forEach(item => {
            if (item.type === 'group') {
                const groupTitle = document.createElement('div');
                groupTitle.className = 'group-title';
                groupTitle.textContent = item.title;
                keyboardContent.appendChild(groupTitle);
            } else {
                const keysRow = document.createElement('div');
                keysRow.className = 'keys-grid';
                
                item.keys.forEach((key, index) => {
                    const button = document.createElement('button');
                    button.className = `tool-btn ${item.class}`;
                    button.textContent = key;
                    
                    // Asignar span si existe
                    if (item.span && item.span[index]) {
                        button.style.gridColumn = `span ${item.span[index]}`;
                    }
                    
                    // Configurar función según tipo de tecla
                    if (key === 'C') {
                        button.addEventListener('click', () => clearAll());
                    } else if (key === '⌫') {
                        button.addEventListener('click', () => backspaceInput());
                    } else if (key === '␣') {
                        button.addEventListener('click', () => insertAtCursor(' '));
                    } else if (key === '×') {
                        button.addEventListener('click', () => insertAtCursor('*'));
                    } else if (key === '÷') {
                        button.addEventListener('click', () => insertAtCursor('/'));
                    } else if (key === '^') {
                        button.addEventListener('click', () => insertAtCursor('^'));
                    } else if (key === 'a/b') {
                        button.addEventListener('click', () => insertFraction());
                    } else if (['sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'arcsin', 'arccos', 'arctan', 'sinh', 'cosh', 'tanh', 'log', 'ln', 'lg', 'exp', 'abs', 'floor', 'ceil', 'round', 'rand', 'gcd', 'lcm', 'mod', 'lim', '∑', '∏'].includes(key)) {
                        button.addEventListener('click', () => insertFunction(key));
                    } else if (key === '∫') {
                        button.addEventListener('click', () => insertIntegral());
                    } else if (key === '∂') {
                        button.addEventListener('click', () => insertAtCursor('∂'));
                    } else {
                        button.addEventListener('click', () => insertAtCursor(key));
                    }
                    
                    keysRow.appendChild(button);
                });
                
                keyboardContent.appendChild(keysRow);
            }
        });
    }
    
    // Funciones del teclado
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
    function toggleMathKeyboard() {
        if (mathToolbar.style.display === 'block') {
            closeMathKeyboard();
        } else {
            openMathKeyboard();
        }
    }
    
    function openMathKeyboard() {
        mathToolbar.style.display = 'block';
        toggleMathBtn.classList.add('active');
        
        // Ajustar tamaño inicial
        mathToolbar.style.height = 'auto';
        const initialHeight = Math.min(keyboardContent.scrollHeight + 120, window.innerHeight * 0.6);
        mathToolbar.style.height = initialHeight + 'px';
        
        // Ajustar chat para que no quede tapado
        chatContainer.style.paddingBottom = (initialHeight + 140) + 'px';
        setTimeout(() => {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }, 100);
    }
    
    function closeMathKeyboard() {
        mathToolbar.style.display = 'none';
        toggleMathBtn.classList.remove('active');
        chatContainer.style.paddingBottom = '120px';
    }
    
    function autoResizeTextarea() {
        userInput.style.height = 'auto';
        const newHeight = Math.min(userInput.scrollHeight, 150);
        userInput.style.height = newHeight + 'px';
        setTimeout(() => {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }, 10);
    }
    
    // Inicialización principal
    if (!userInput || !sendBtn || !chatContainer) {
        console.error('❌ No se encontraron elementos del DOM');
        return;
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
            "showMenuBar": true,
            "showZoomButtons": true,
            "enableLabelDrags": false,
            "enableShiftDragZoom": true,
            "enableRightClick": false,
            "errorDialogsActive": false,
            "useBrowserForJS": false,
            "allowStyleBar": true,
            "preventFocus": false,
            "language": "es",
            "appName": "graphing"
        };
        
        window.ggbApp = new GGBApplet(parameters, true);
        window.ggbApp.inject('ggb-element');
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

    // === ACTIVAR CÁMARA ===
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
    
    // === SISTEMA DE COLA PARA VOZ ===
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
                
                const estrellasGanadas = 1;
                window.estrellasTotales += estrellasGanadas;
                actualizarEstrellas(window.estrellasTotales);
                
                addMessage(`Elegiste: Opción ${opcion} ✓ (¡Correcto! +${estrellasGanadas}⭐)`, 'user');
                
                if (window.voiceEnabled) {
                    window.hablarConCola("¡Correcto! Excelente trabajo. Avanzando al siguiente paso.");
                }
            } else {
                botonElegido.classList.add('incorrecta');
                botonElegido.innerHTML += ' ✗';
                addMessage(`Elegiste: Opción ${opcion} ✗ (Incorrecto)`, 'user');
                
                const opcionCorrecta = window.opcionesActuales.find(op => op.correcta);
                if (opcionCorrecta) {
                    const botonCorrecto = Array.from(botones).find(btn => btn.dataset.opcion === opcionCorrecta.letra);
                    if (botonCorrecto) {
                        botonCorrecto.classList.add('correcta');
                        botonCorrecto.innerHTML += ' ✓';
                    }
                    
                    if (window.voiceEnabled) {
                        const explicacion = `Incorrecto. La opción correcta es la ${opcionCorrecta.letra}. `;
                        window.hablarConCola(explicacion);
                        
                        setTimeout(() => {
                            const textoOpciones = `Recuerda que: ${window.pasoActual?.explicacionError || 'revisa los conceptos básicos.'}`;
                            window.hablarConCola(textoOpciones);
                            
                            setTimeout(() => {
                                let textoRepetirOpciones = " Las opciones disponibles son: ";
                                window.opcionesActuales.forEach((opcion, index) => {
                                    const letra = String.fromCharCode(65 + index);
                                    textoRepetirOpciones += `Opción ${letra}. `;
                                });
                                textoRepetirOpciones += "Elige de nuevo.";
                                window.hablarConCola(textoRepetirOpciones);
                            }, 4000);
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
            addMessage(data.respuesta, 'bot');
            
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
                    mostrarOpcionesInteractivo(data.opciones);
                    if (window.voiceEnabled) {
                        narrarPasoCompleto(data.respuesta, data.opciones, data.respuestaCorrecta);
                    }
                }, 1500);
            } else {
                if (opcionesContainer) {
                    // Ocultar opciones después de completar la sesión
                    setTimeout(() => {
                        opcionesContainer.style.display = 'none';
                        // Restaurar estado normal (sin minimizar)
                        opcionesContainer.classList.remove('opciones-minimizadas');
                        minimizarOpcionesBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
                        minimizarOpcionesBtn.title = "Minimizar opciones";
                    }, 2000);
                }
                
                if (data.sesionCompletada) {
                    const porcentaje = Math.round((window.respuestasCorrectas / window.totalPreguntas) * 100);
                    const mensajeFinal = `🎉 ¡Sesión completada! ${window.respuestasCorrectas}/${window.totalPreguntas} correctas (${porcentaje}%)`;
                    addMessage(mensajeFinal, 'bot');
                    
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
        }
    }

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
    
    // === ACTUALIZAR ESTRELLAS ===
    function actualizarEstrellas(cantidad) {
        window.estrellasTotales = cantidad;
        const contador = document.getElementById('contadorEstrellas');
        
        if (contador) {
            let currentCount = parseInt(contador.textContent) || 0;
            const increment = cantidad > currentCount ? 1 : -1;
            
            const animateCount = () => {
                currentCount += increment;
                contador.textContent = currentCount;
                
                if (increment > 0) {
                    crearConfeti();
                }
                
                if ((increment > 0 && currentCount < cantidad) || 
                    (increment < 0 && currentCount > cantidad)) {
                    requestAnimationFrame(animateCount);
                }
            };
            
            animateCount();
            
            contador.classList.add('star-pulse');
            setTimeout(() => {
                contador.classList.remove('star-pulse');
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
    
    // === FUNCIÓN SIMPLIFICADA - MODO DESCRIPCIÓN ===
    async function simulateImageAnalysis(file) {
        // Mostrar opciones directamente sin OCR
        setTimeout(() => {
            addMessage('✅ Foto recibida. ¿Qué te gustaría hacer con esta actividad matemática?', 'bot');
            
            // Mostrar opciones para que el usuario describa
            const opcionesContainer = document.getElementById('opcionesContainer');
            const opcionesBotones = opcionesContainer.querySelector('.opciones-botones');
            
            opcionesBotones.innerHTML = '';
            opcionesContainer.style.display = 'block';
            
            // Asegurar que no esté minimizado al mostrar opciones de imagen
            opcionesContainer.classList.remove('opciones-minimizadas');
            minimizarOpcionesBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
            minimizarOpcionesBtn.title = "Minimizar opciones";
            
            const opciones = [
                { letra: 'A', texto: "📝 Describir el problema para resolverlo", accion: "describir" },
                { letra: 'B', texto: "📚 Pedir explicación de conceptos", accion: "explicar" },
                { letra: 'C', texto: "🔄 Tomar otra foto", accion: "otra" }
            ];
            
            opciones.forEach((opcion) => {
                const btn = document.createElement('button');
                btn.className = 'opcion-btn';
                btn.innerHTML = `<strong>${opcion.letra})</strong> ${opcion.texto}`;
                btn.onclick = () => {
                    opcionesContainer.style.display = 'none';
                    if (opcion.accion === "describir") {
                        addMessage("Por favor describe el problema matemático que ves en la foto:", 'bot');
                        userInput.focus();
                    } else if (opcion.accion === "explicar") {
                        addMessage("¿Sobre qué concepto matemático necesitas explicación?", 'bot');
                        userInput.focus();
                    } else if (opcion.accion === "otra") {
                        fileInput.click();
                    }
                };
                opcionesBotones.appendChild(btn);
            });
            
        }, 1000);
    }
    
    async function procesarOpcionConTexto(accion, textoDetectado) {
        document.getElementById('opcionesContainer').style.display = 'none';
        
        if (accion === "otra") {
            fileInput.click();
            return;
        }
        
        addMessage(`Elegí: ${accion === 'resolver' ? 'Resolver' : 'Explicar'} el problema`, 'user');
        
        let consulta = accion === "resolver" 
            ? `Resuelve paso a paso: ${textoDetectado}`
            : `Explica los conceptos de: ${textoDetectado}`;
        
        const typing = createTypingMessage("Procesando con Groq...");
        
        try {
            const response = await fetch('/analizar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: consulta })
            });
            
            const data = await response.json();
            removeTypingMessage(typing);
            
            if (data.respuesta) {
                await showStepsSequentially(data.respuesta);
            }
        } catch (error) {
            removeTypingMessage(typing);
            addMessage("❌ Error al procesar. Intenta de nuevo.", 'bot');
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
    
    // === EVENTOS ===
    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Configurar evento del botón toggle
    toggleMathBtn.addEventListener('click', toggleMathKeyboard);
    
    // Configurar auto-ajuste del textarea
    userInput.addEventListener('input', autoResizeTextarea);
    
    // Configurar evento del botón minimizar chat
    const minimizarChatBtn = document.getElementById('minimizarChatBtn');
    if (minimizarChatBtn) {
        minimizarChatBtn.addEventListener('click', toggleMinimizarChat);
    }
    
    // Atajos de teclado
    document.addEventListener('keydown', function(e) {
        // ESC para cerrar teclado
        if (e.key === 'Escape' && mathToolbar.style.display === 'block') {
            closeMathKeyboard();
        }
        
        // Ctrl+M para teclado matemático
        if (e.ctrlKey && e.key === 'm') {
            e.preventDefault();
            toggleMathKeyboard();
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
    inicializarGeoGebra();
    initMathKeyboard();
    mejorarMensajeInicial();
});

// === FUNCIONES PARA GRÁFICAS CON GEOGEBRA ===
async function graficarFuncionGeoGebra(funcionTexto) {
    try {
        if (!window.ggbApp) {
            console.error("GeoGebra no está inicializado");
            return;
        }
        
        const graphContainer = document.getElementById('graphContainer');
        graphContainer.style.display = 'block';
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        window.ggbApp.evalCommand('DeleteAll()');
        window.ggbApp.evalCommand(`f(x)=${funcionTexto}`);
        window.ggbApp.setCoordSystem(-10, 10, -10, 10);
        
        await new Promise(resolve => setTimeout(resolve, 500));
        window.ggbApp.zoomToFit();
        
        addMessage(`✅ Gráfica generada para: f(x) = ${funcionTexto}`, 'bot');
        
    } catch (error) {
        console.error('Error al graficar con GeoGebra:', error);
        addMessage("❌ Error al generar la gráfica. Verifica la función.", 'bot');
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
