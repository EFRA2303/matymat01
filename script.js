document.addEventListener('DOMContentLoaded', function() {
    // =============== ELEMENTOS DEL DOM ===============
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const chatContainer = document.getElementById('chatContainer');
    const toggleKeyboardBtn = document.getElementById('toggleKeyboardBtn');
    const mathToolbar = document.getElementById('mathToolbar');
    const closeMathKeyboard = document.getElementById('closeMathKeyboard');
    const switchToTextKeyboard = document.getElementById('switchToTextKeyboard');
    const keyboardTabs = document.querySelectorAll('.keyboard-tab');
    const keyboardExtras = document.getElementById('extraBasic');
    const uploadBtn = document.getElementById('uploadBtn');
    const fileInput = document.getElementById('fileInput');
    const optionsContainer = document.getElementById('optionsContainer');
    const optionsGrid = document.getElementById('optionsGrid');
    const questionDisplay = document.getElementById('questionDisplay');
    const contadorEstrellas = document.getElementById('contadorEstrellas');
    const menuToggle = document.getElementById('menuToggle');
    const menuPanel = document.getElementById('menuPanel');
    const closeMenu = document.getElementById('closeMenu');
    const themeOption = document.getElementById('themeOption');
    const audioOption = document.getElementById('audioOption');
    
    // =============== VARIABLES GLOBALES ===============
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
    
    // =============== CONFIGURACIÓN DEL TECLADO ===============
    const keyboardExtrasData = {
        basic: ['π', 'θ', '°', '%', '!', '|x|', '∞', '≈', '≠', '≤', '≥', '±'],
        algebra: ['x²', 'x³', 'x^y', '√(', '∛(', '∑', '∏', 'log', 'ln', '| |', 'a/b', '(a)/(b)'],
        trigonometry: ['sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'arcsin', 'arccos', 'arctan', 'sinh', 'cosh', 'tanh'],
        calculus: ['∫', '∂', 'dx', 'dy', 'dz', 'lim', 'Δ', '∇', '∫dx', '∫dy', 'd/dx', '∂/∂x'],
        special: ['⌊x⌋', '⌈x⌉', '→', '⇔', '∈', '∉', '⊂', '⊆', '∪', '∩', '∅', '∴']
    };
    
    // =============== INICIALIZAR TECLADO ===============
    function initMathKeyboard() {
        // Generar contenido inicial
        generateKeyboardExtras('basic');
        
        // Configurar eventos de tabs
        keyboardTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                keyboardTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const tabName = tab.dataset.tab;
                generateKeyboardExtras(tabName);
            });
        });
        
        // Evento cerrar teclado
        closeMathKeyboard.addEventListener('click', closeMathKeyboardFunc);
        
        // Evento cambiar a texto
        switchToTextKeyboard.addEventListener('click', () => {
            closeMathKeyboardFunc();
            userInput.focus();
        });
        
        // Evento toggle teclado
        toggleKeyboardBtn.addEventListener('click', toggleMathKeyboard);
        
        // Cerrar teclado al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (mathToolbar.style.display === 'block' && 
                !mathToolbar.contains(e.target) && 
                e.target !== toggleKeyboardBtn && 
                !toggleKeyboardBtn.contains(e.target) &&
                e.target !== userInput) {
                closeMathKeyboardFunc();
            }
        });
    }
    
    // =============== GENERAR CONTENIDO EXTRA DEL TECLADO ===============
    function generateKeyboardExtras(tabName) {
        if (!keyboardExtras) return;
        
        keyboardExtras.innerHTML = '';
        const items = keyboardExtrasData[tabName] || [];
        
        items.forEach(item => {
            const btn = document.createElement('button');
            btn.className = 'tool-btn func-btn';
            btn.textContent = item;
            
            // Asignar función según el elemento
            if (item === 'x²') {
                btn.addEventListener('click', () => insertPower('²'));
            } else if (item === 'x³') {
                btn.addEventListener('click', () => insertPower('³'));
            } else if (item === 'x^y') {
                btn.addEventListener('click', () => insertAtCursor('^'));
            } else if (item === 'a/b') {
                btn.addEventListener('click', () => insertFraction());
            } else if (item === '(a)/(b)') {
                btn.addEventListener('click', () => insertSimpleFraction());
            } else if (item === '√(') {
                btn.addEventListener('click', () => insertAtCursor('√('));
            } else if (item === '∛(') {
                btn.addEventListener('click', () => insertAtCursor('∛('));
            } else if (['sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'arcsin', 'arccos', 'arctan', 'sinh', 'cosh', 'tanh', 'log', 'ln', 'lim'].includes(item)) {
                btn.addEventListener('click', () => insertFunction(item));
            } else if (item === '∫') {
                btn.addEventListener('click', () => insertIntegral());
            } else if (item === 'd/dx') {
                btn.addEventListener('click', () => insertAtCursor('d/dx '));
            } else if (item === '∂/∂x') {
                btn.addEventListener('click', () => insertAtCursor('∂/∂x '));
            } else {
                btn.addEventListener('click', () => insertAtCursor(item));
            }
            
            keyboardExtras.appendChild(btn);
        });
    }
    
    // =============== FUNCIONES DEL TECLADO ===============
    
    // Insertar texto en cursor
    window.insertAtCursor = function(value) {
        if (!userInput) return;
        
        const start = userInput.selectionStart;
        const end = userInput.selectionEnd;
        userInput.value = userInput.value.substring(0, start) + value + userInput.value.substring(end);
        userInput.selectionStart = userInput.selectionEnd = start + value.length;
        userInput.focus();
        autoResizeTextarea();
        scrollToInput();
    };
    
    // Insertar potencia
    window.insertPower = function(power) {
        if (!userInput) return;
        
        const start = userInput.selectionStart;
        const end = userInput.selectionEnd;
        const selectedText = userInput.value.substring(start, end);
        
        if (selectedText) {
            userInput.value = userInput.value.substring(0, start) + selectedText + power + userInput.value.substring(end);
            userInput.selectionStart = userInput.selectionEnd = start + selectedText.length + power.length;
        } else {
            userInput.value = userInput.value.substring(0, start) + 'x' + power + userInput.value.substring(end);
            userInput.selectionStart = userInput.selectionEnd = start + 1 + power.length;
        }
        
        userInput.focus();
        autoResizeTextarea();
        scrollToInput();
    };
    
    // Insertar fracción
    window.insertFraction = function() {
        if (!userInput) return;
        
        const start = userInput.selectionStart;
        const end = userInput.selectionEnd;
        const selectedText = userInput.value.substring(start, end);
        
        if (selectedText) {
            userInput.value = userInput.value.substring(0, start) + '\\frac{' + selectedText + '}{ }' + userInput.value.substring(end);
            userInput.selectionStart = userInput.selectionEnd = start + 7 + selectedText.length;
        } else {
            userInput.value = userInput.value.substring(0, start) + '\\frac{ }{ }' + userInput.value.substring(end);
            userInput.selectionStart = userInput.selectionEnd = start + 7;
        }
        
        userInput.focus();
        autoResizeTextarea();
        scrollToInput();
    };
    
    // Insertar fracción simple
    window.insertSimpleFraction = function() {
        if (!userInput) return;
        
        const start = userInput.selectionStart;
        const end = userInput.selectionEnd;
        const selectedText = userInput.value.substring(start, end);
        
        if (selectedText) {
            userInput.value = userInput.value.substring(0, start) + '(' + selectedText + ')/( )' + userInput.value.substring(end);
            userInput.selectionStart = userInput.selectionEnd = start + selectedText.length + 4;
        } else {
            userInput.value = userInput.value.substring(0, start) + '( )/( )' + userInput.value.substring(end);
            userInput.selectionStart = userInput.selectionEnd = start + 2;
        }
        
        userInput.focus();
        autoResizeTextarea();
        scrollToInput();
    };
    
    // Insertar función
    window.insertFunction = function(funcName) {
        insertAtCursor(funcName + '()');
        if (userInput) {
            userInput.selectionStart = userInput.selectionEnd = userInput.selectionStart - 1;
            userInput.focus();
        }
    };
    
    // Insertar integral
    window.insertIntegral = function() {
        insertAtCursor('∫_ ^ dx');
        if (userInput) {
            userInput.selectionStart = userInput.selectionEnd = userInput.selectionStart - 5;
            userInput.focus();
        }
    };
    
    // Limpiar todo
    window.clearAll = function() {
        if (userInput) {
            userInput.value = '';
            userInput.focus();
            autoResizeTextarea();
        }
    };
    
    // Retroceso
    window.backspaceInput = function() {
        if (!userInput) return;
        
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
    
    // Auto-ajustar textarea
    function autoResizeTextarea() {
        if (userInput) {
            userInput.style.height = 'auto';
            const newHeight = Math.min(userInput.scrollHeight, 120);
            userInput.style.height = newHeight + 'px';
        }
    }
    
    // Scroll al input
    function scrollToInput() {
        setTimeout(() => {
            if (userInput) {
                userInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 50);
    }
    
    // =============== CONTROL DEL TECLADO ===============
    
    function toggleMathKeyboard() {
        const body = document.body;
        
        if (mathToolbar.style.display === 'block') {
            // Cerrar teclado
            closeMathKeyboardFunc();
        } else {
            // Abrir teclado
            mathToolbar.style.display = 'block';
            toggleKeyboardBtn.classList.add('active');
            window.isMathKeyboardActive = true;
            body.classList.add('keyboard-active');
            
            // Ajustar altura
            mathToolbar.style.height = '45vh';
            if (chatContainer) {
                chatContainer.style.paddingBottom = 'calc(45vh + 100px)';
            }
            
            // Scroll para ver input
            setTimeout(() => {
                scrollToInput();
            }, 100);
        }
    }
    
    function closeMathKeyboardFunc() {
        const body = document.body;
        
        mathToolbar.style.display = 'none';
        toggleKeyboardBtn.classList.remove('active');
        window.isMathKeyboardActive = false;
        body.classList.remove('keyboard-active');
        
        if (chatContainer) {
            chatContainer.style.paddingBottom = '140px';
        }
    }
    
    // =============== OPCIONES EMERGENTES (20-30%) ===============
    
    window.mostrarOpcionesInteractivo = function(opciones, pregunta = '', respuestaCompleta = '') {
        // Cerrar teclado si está abierto
        if (window.isMathKeyboardActive) {
            closeMathKeyboardFunc();
        }
        
        // Mostrar pregunta
        if (questionDisplay) {
            questionDisplay.innerHTML = `<p>${formatText(pregunta || 'Selecciona la opción correcta:')}</p>`;
            
            // Si hay respuesta completa, agregarla también
            if (respuestaCompleta) {
                const explicacion = document.createElement('div');
                explicacion.className = 'explicacion-paso';
                explicacion.innerHTML = `<p><strong>Explicación:</strong> ${formatText(respuestaCompleta)}</p>`;
                questionDisplay.appendChild(explicacion);
            }
        }
        
        // Limpiar y agregar opciones (máximo 3)
        if (optionsGrid) {
            optionsGrid.innerHTML = '';
            
            opciones.slice(0, 3).forEach((opcion, index) => {
                const letra = String.fromCharCode(65 + index);
                const btn = document.createElement('button');
                btn.className = 'option-btn';
                btn.dataset.opcion = letra;
                btn.dataset.correcta = opcion.correcta;
                btn.innerHTML = `
                    <span class="option-letter">${letra}</span>
                    <span class="option-text">${opcion.texto}</span>
                `;
                btn.onclick = () => enviarRespuestaOpcion(letra);
                optionsGrid.appendChild(btn);
            });
        }
        
        // Mostrar opciones emergentes
        if (optionsContainer) {
            optionsContainer.style.display = 'block';
            
            // Asegurar visibilidad del proceso
            setTimeout(() => {
                if (chatContainer) {
                    chatContainer.scrollTop = chatContainer.scrollHeight - 250;
                }
            }, 100);
        }
    };
    
    window.closeOptions = function() {
        if (optionsContainer) {
            optionsContainer.style.display = 'none';
        }
    };
    
    // =============== FUNCIONES PARA ENVIAR RESPUESTAS REALES AL SERVIDOR ===============
    
    async function enviarRespuestaOpcion(opcionElegida) {
        if (!window.sesionActual) {
            addMessage("⚠️ No hay sesión activa. Por favor, haz una nueva pregunta.", 'bot');
            closeOptions();
            return;
        }
        
        const botones = optionsGrid ? optionsGrid.querySelectorAll('.option-btn') : [];
        
        // Deshabilitar todos los botones
        botones.forEach(btn => btn.disabled = true);
        
        try {
            const response = await fetch('/responder', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sesionId: window.sesionActual,
                    opcionElegida: opcionElegida
                })
            });
            
            const data = await response.json();
            
            // Procesar la respuesta del servidor
            if (data.tipo === 'error' || data.sesionExpirada) {
                addMessage(data.respuesta, 'bot');
                if (data.sesionExpirada) {
                    window.sesionActual = null;
                }
                closeOptions();
                return;
            }
            
            // Marcar botón correcto/incorrecto
            const botonElegido = Array.from(botones).find(btn => btn.dataset.opcion === opcionElegida);
            if (botonElegido) {
                if (data.correcto) {
                    botonElegido.classList.add('correct');
                    botonElegido.innerHTML += ' <i class="fas fa-check"></i>';
                    window.respuestasCorrectas++;
                    window.estrellasTotales = data.estrellas || window.estrellasTotales;
                    actualizarEstrellas(window.estrellasTotales);
                    
                    // Reproducir voz si está activada
                    if (window.voiceEnabled) {
                        const textoVoz = `¡Correcto! Excelente trabajo. ${data.correcto ? 'Avanzando al siguiente paso.' : 'Aprendamos del error.'}`;
                        window.hablarConCola(textoVoz);
                    }
                } else {
                    botonElegido.classList.add('incorrect');
                    botonElegido.innerHTML += ' <i class="fas fa-times"></i>';
                    
                    // Reproducir explicación del error si hay voz
                    if (window.voiceEnabled && data.explicacionError) {
                        window.hablarConCola(data.explicacionError);
                    }
                }
            }
            
            // Mostrar mensaje del bot
            addMessage(data.respuesta, 'bot');
            
            // Actualizar estrellas
            if (data.estrellas !== undefined) {
                actualizarEstrellas(data.estrellas);
            }
            
            // Si la sesión está completada
            if (data.sesionCompletada) {
                window.sesionActual = null;
                setTimeout(() => {
                    closeOptions();
                    if (window.voiceEnabled) {
                        window.hablarConCola(`¡Felicidades! Completaste el problema. Ganaste ${data.estrellas} estrellas.`);
                    }
                }, 2000);
                return;
            }
            
            // Si hay más opciones, mostrarlas después de un tiempo
            if (data.tieneOpciones && data.opciones) {
                setTimeout(() => {
                    window.mostrarOpcionesInteractivo(data.opciones, data.respuesta, data.explicacionError);
                    window.sesionActual = data.sesionId;
                    window.opcionesActuales = data.opciones;
                }, 2000);
            } else {
                setTimeout(() => {
                    closeOptions();
                }, 2000);
            }
            
        } catch (error) {
            console.error('Error al enviar respuesta:', error);
            addMessage("❌ Error al procesar tu respuesta. Intenta de nuevo.", 'bot');
            botones.forEach(btn => btn.disabled = false);
        }
    }
    
    // =============== ACTUALIZAR ESTRELLAS ===============
    
    function actualizarEstrellas(cantidad) {
        window.estrellasTotales = cantidad;
        
        if (contadorEstrellas) {
            contadorEstrellas.textContent = cantidad;
            contadorEstrellas.classList.add('star-pulse');
            setTimeout(() => {
                contadorEstrellas.classList.remove('star-pulse');
            }, 1000);
            
            // Efecto confeti
            crearConfeti();
        }
    }
    
    // =============== CREAR EFECTO CONFETI ===============
    
    function crearConfeti() {
        const confettiContainer = document.createElement('div');
        confettiContainer.className = 'star-confetti';
        
        for (let i = 0; i < 20; i++) {
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
    
    // =============== FUNCIONES DE CHAT ===============
    
    function addMessage(text, sender) {
        if (!chatContainer) return;
        
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
        // Limpiar formato para voz pero mantener visual
        const textoLimpio = text
            .replace(/\*\*/g, '')  // Eliminar markdown bold
            .replace(/#{1,6}\s*/g, '')  // Eliminar headers
            .replace(/\[.*?\]/g, '')  // Eliminar corchetes
            .replace(/\n{3,}/g, '\n\n');  // Limpiar saltos múltiples
        
        // Para visual, mantener algunos formatos
        return textoLimpio
            .replace(/(Paso\s*\d+[:\.\-])/gi, '<strong style="color: #1565c0; font-size: 1.1em;">$1</strong>')
            .replace(/(Solución final[:\.\-])/gi, '<strong style="color: #2e7d32; font-size: 1.1em;">$1</strong>')
            .replace(/\n/g, '<br>');
    }
    
    // =============== SISTEMA DE VOZ MEJORADO ===============
    
    window.hablarConCola = function(texto) {
        if (!window.voiceEnabled || !texto) return;
        
        // Limpiar el texto para voz (sin formato)
        const textoLimpio = texto
            .replace(/<[^>]*>/g, '')  // Eliminar HTML
            .replace(/\*\*/g, '')      // Eliminar markdown
            .replace(/\[.*?\]/g, '')   // Eliminar corchetes
            .replace(/#/g, '')         // Eliminar #
            .replace(/\n/g, '. ')      // Convertir saltos a puntos
            .replace(/\s+/g, ' ')      // Eliminar espacios múltiples
            .trim();
        
        if (!textoLimpio) return;
        
        window.colaVoz.push(textoLimpio);
        procesarColaVoz();
    };
    
    function procesarColaVoz() {
        if (window.hablando || window.colaVoz.length === 0) return;
        
        window.hablando = true;
        const texto = window.colaVoz.shift();
        
        const utterance = new SpeechSynthesisUtterance(texto);
        utterance.lang = 'es-ES';
        utterance.rate = 0.85;  // Un poco más lento para explicaciones
        utterance.pitch = 0.9;   // Tono un poco más grave, como profesor
        utterance.volume = 1;
        
        // Buscar voces en español
        const voices = window.speechSynthesis.getVoices();
        let voice = voices.find(v => v.lang === 'es-ES' || v.lang.startsWith('es-'));
        
        if (!voice) {
            voice = voices.find(v => v.lang.includes('es'));
        }
        
        if (voice) {
            utterance.voice = voice;
        }
        
        utterance.onend = function() {
            window.hablando = false;
            setTimeout(procesarColaVoz, 500); // Pausa entre mensajes
        };
        
        utterance.onerror = function() {
            window.hablando = false;
            setTimeout(procesarColaVoz, 500);
        };
        
        window.speechSynthesis.speak(utterance);
    }
    
    // =============== MENSAJE INICIAL CON VOZ ===============
    
    function mejorarMensajeInicial() {
        if (window.voiceEnabled && !window.mensajeInicialReproducido) {
            window.mensajeInicialReproducido = true;
            
            const textoVoz = `¡Hola! Soy MatyMat cero uno, tu tutor virtual de matemáticas. Te ayudaré a entender y aprender álgebra, trigonometría y geometría. 
            
            Puedes escribir tu pregunta, tomar fotos de ejercicios, resolver paso a paso con opciones interactivas, ganar estrellas y visualizar gráficas. 
            
            ¿En qué tema matemático necesitas ayuda?`;
            
            setTimeout(() => {
                window.hablarConCola(textoVoz);
            }, 1500);
        }
    }
    
    // =============== ENVIAR MENSAJE AL SERVIDOR REAL ===============
    
    async function sendMessage() {
        if (isSending) return;
        const text = userInput.value.trim();
        if (!text) return;
        
        isSending = true;
        addMessage(text, 'user');
        userInput.value = '';
        autoResizeTextarea();
        
        // Mostrar indicador de "pensando"
        const typing = createTypingMessage("Pensando...");
        
        try {
            const response = await fetch('/analizar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: text,
                    consulta: text
                })
            });
            
            const data = await response.json();
            
            removeTypingMessage(typing);
            
            // Verificar si hay error
            if (data.tipo === 'error') {
                addMessage(data.respuesta, 'bot');
                isSending = false;
                return;
            }
            
            // Si es una gráfica
            if (data.necesitaGrafica) {
                addMessage(data.respuesta, 'bot');
                if (window.voiceEnabled) {
                    window.hablarConCola(data.respuesta);
                }
                
                // Mostrar gráfica
                setTimeout(() => {
                    if (data.graficaData && data.graficaData.funcion) {
                        graficarFuncionGeoGebra(data.graficaData.funcion);
                    }
                }, 1000);
                isSending = false;
                return;
            }
            
            // Si es respuesta normal
            addMessage(data.respuesta, 'bot');
            
            // Reproducir voz con la respuesta
            if (window.voiceEnabled) {
                // Extraer solo el texto explicativo para voz
                let textoParaVoz = data.respuesta;
                
                // Si tiene opciones, separar explicación de opciones
                if (data.tieneOpciones) {
                    const partes = textoParaVoz.split('**Opciones:**');
                    if (partes[0]) {
                        textoParaVoz = partes[0].trim();
                    }
                }
                
                window.hablarConCola(textoParaVoz);
            }
            
            // Si tiene opciones interactivas
            if (data.tieneOpciones && data.opciones) {
                window.sesionActual = data.sesionId;
                window.opcionesActuales = data.opciones;
                
                setTimeout(() => {
                    window.mostrarOpcionesInteractivo(data.opciones, data.respuesta);
                }, 1000);
            }
            
            // Actualizar estrellas si hay
            if (data.estrellas !== undefined) {
                actualizarEstrellas(data.estrellas);
            }
            
        } catch (error) {
            console.error('Error al enviar mensaje:', error);
            removeTypingMessage(typing);
            addMessage("❌ Error de conexión con el servidor. Intenta de nuevo.", 'bot');
        }
        
        isSending = false;
    }
    
    function createTypingMessage(text) {
        if (!chatContainer) return null;
        
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
    
    // =============== SIMULACIÓN DE ANÁLISIS DE IMAGEN ===============
    
    function simulateImageAnalysis(file) {
        setTimeout(() => {
            const opciones = [
                { letra: 'A', texto: "Resolver esta ecuación paso a paso", correcta: false },
                { letra: 'B', texto: "Explicar el concepto matemático involucrado", correcta: false },
                { letra: 'C', texto: "Mostrar ejemplos similares para practicar", correcta: true }
            ];
            
            window.mostrarOpcionesInteractivo(opciones, "¿Qué te gustaría hacer con este ejercicio?");
        }, 2000);
    }
    
    // =============== CONFIGURACIÓN DEL MENÚ ===============
    
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
                // Reproducir mensaje de confirmación
                window.hablarConCola("Voz activada. ¡Estoy listo para explicarte!");
            } else {
                audioText.textContent = 'Voz Desactivada';
                audioIcon.className = 'fas fa-volume-mute';
                window.speechSynthesis.cancel();
                window.colaVoz = [];
                window.hablando = false;
            }
            
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
    
    // =============== INICIALIZACIÓN ===============
    
    if ('speechSynthesis' in window) {
        // Cargar voces disponibles
        window.speechSynthesis.onvoiceschanged = function() {
            console.log('Voces cargadas:', window.speechSynthesis.getVoices().length);
        };
        window.speechSynthesis.getVoices();
    }
    
    // Inicializar teclado
    initMathKeyboard();
    
    // Configurar eventos
    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }
    
    if (userInput) {
        userInput.addEventListener('input', autoResizeTextarea);
        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        // Enfoque automático
        setTimeout(() => {
            userInput.focus();
        }, 500);
    }
    
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
        // ESC para cerrar teclado/opciones
        if (e.key === 'Escape') {
            if (mathToolbar.style.display === 'block') {
                closeMathKeyboardFunc();
            } else if (optionsContainer.style.display === 'block') {
                window.closeOptions();
            }
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
    });
    
    // Mensaje inicial con voz
    mejorarMensajeInicial();
    
    // Inicializar estrellas
    actualizarEstrellas(0);
});

// =============== FUNCIONES PARA GRÁFICAS CON GEOGEBRA ===============

async function graficarFuncionGeoGebra(funcionTexto) {
    try {
        if (!window.ggbApp) {
            inicializarGeoGebra();
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        const graphContainer = document.getElementById('graphContainer');
        if (graphContainer) {
            graphContainer.style.display = 'block';
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (window.ggbApp) {
            window.ggbApp.evalCommand('DeleteAll()');
            window.ggbApp.evalCommand(`f(x)=${funcionTexto}`);
            window.ggbApp.setCoordSystem(-10, 10, -10, 10);
            
            await new Promise(resolve => setTimeout(resolve, 300));
            window.ggbApp.zoomToFit();
        }
        
    } catch (error) {
        console.error('Error al graficar con GeoGebra:', error);
    }
}

function detectarYGraficarFuncion(texto) {
    const patronesExplicitos = [
        /graficar\s+(.+)/i,
        /gráfica\s+de\s+(.+)/i,
        /dibujar\s+(.+)/i
    ];
    
    for (const patron of patronesExplicitos) {
        const match = texto.match(patron);
        if (match && match[1]) {
            return match[1].trim();
        }
    }
    
    return null;
}

// =============== FUNCIONES DE CONTROL DE GRÁFICA GEOGEBRA ===============

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
    if (graphContainer) {
        graphContainer.style.display = 'none';
    }
}

// =============== INICIALIZAR GEOGEBRA ===============

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

// =============== INICIALIZAR GEOGEBRA AL CARGAR ===============

document.addEventListener('DOMContentLoaded', inicializarGeoGebra);

