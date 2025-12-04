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
    const opcionesBotones = document.getElementById('opcionesBotones');
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
    const keyboardExtrasData = {
        basic: [
            'π', 'e', '°', '%', '!', '∞', 
            '≈', '≠', '±', '‰', '∠', '∥'
        ],
        algebra: [
            'x²', 'x³', 'xⁿ', '√', '∛', '∑',
            '∏', 'log', 'ln', '|x|', 'a/b', 'n√'
        ],
        trigonometry: [
            'sin', 'cos', 'tan', 'cot', 'sec', 'csc',
            'sin⁻¹', 'cos⁻¹', 'tan⁻¹', 'sinh', 'cosh', 'tanh'
        ],
        calculus: [
            '∫', '∂', 'dx', 'dy', 'dz', 'lim',
            'Δ', '∇', '∫dx', '∫dy', 'd/dx', '∂/∂x'
        ],
        special: [
            '⌊x⌋', '⌈x⌉', '→', '⇔', '∈', '∉',
            '⊂', '⊆', '∪', '∩', '∅', '∴'
        ]
    };
    
    function generateKeyboardExtras(tabName) {
        if (!keyboardExtras) return;
        
        keyboardExtras.innerHTML = '';
        const items = keyboardExtrasData[tabName] || [];
        
        items.forEach(item => {
            const btn = document.createElement('button');
            btn.className = 'tool-btn';
            
            if (tabName === 'basic') {
                btn.classList.add('basic-btn');
            } else if (tabName === 'algebra') {
                btn.classList.add('algebra-btn');
            } else if (tabName === 'trigonometry') {
                btn.classList.add('trig-btn');
            } else if (tabName === 'calculus') {
                btn.classList.add('calc-btn');
            } else if (tabName === 'special') {
                btn.classList.add('special-btn');
            }
            
            btn.textContent = item;
            
            if (item === 'x²') {
                btn.addEventListener('click', () => insertPower('²'));
            } else if (item === 'x³') {
                btn.addEventListener('click', () => insertPower('³'));
            } else if (item === 'xⁿ') {
                btn.addEventListener('click', () => insertAtCursor('^'));
            } else if (item === '√') {
                btn.addEventListener('click', () => insertAtCursor('√('));
            } else if (item === '∛') {
                btn.addEventListener('click', () => insertAtCursor('∛('));
            } else if (item === 'n√') {
                btn.addEventListener('click', () => insertAtCursor('√['));
            } else if (item === 'a/b') {
                btn.addEventListener('click', () => insertFraction());
            } else if (['sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'sin⁻¹', 'cos⁻¹', 'tan⁻¹', 'sinh', 'cosh', 'tanh', 'log', 'ln', 'lim'].includes(item)) {
                let funcion = item;
                if (item === 'sin⁻¹') funcion = 'arcsin';
                if (item === 'cos⁻¹') funcion = 'arccos';
                if (item === 'tan⁻¹') funcion = 'arctan';
                btn.addEventListener('click', () => insertFunction(funcion));
            } else if (item === '∫') {
                btn.addEventListener('click', () => insertIntegral());
            } else if (item === 'd/dx') {
                btn.addEventListener('click', () => insertAtCursor('d/dx '));
            } else if (item === '∂/∂x') {
                btn.addEventListener('click', () => insertAtCursor('∂/∂x '));
            } else if (item === '∑') {
                btn.addEventListener('click', () => insertAtCursor('∑_{i=1}^{n}'));
            } else if (item === '∏') {
                btn.addEventListener('click', () => insertAtCursor('∏_{i=1}^{n}'));
            } else if (item === '|x|') {
                btn.addEventListener('click', () => insertAtCursor('| |'));
            } else {
                btn.addEventListener('click', () => insertAtCursor(item));
            }
            
            keyboardExtras.appendChild(btn);
        });
    }
    
    // =============== FUNCIONES DEL TECLADO ===============
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
    
    window.insertFunction = function(funcName) {
        insertAtCursor(funcName + '()');
        if (userInput) {
            userInput.selectionStart = userInput.selectionEnd = userInput.selectionStart - 1;
            userInput.focus();
        }
    };
    
    window.insertIntegral = function() {
        insertAtCursor('∫_ ^ dx');
        if (userInput) {
            userInput.selectionStart = userInput.selectionEnd = userInput.selectionStart - 5;
            userInput.focus();
        }
    };
    
    window.clearAll = function() {
        if (userInput) {
            userInput.value = '';
            userInput.focus();
            autoResizeTextarea();
        }
    };
    
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
    
    function autoResizeTextarea() {
        if (userInput) {
            userInput.style.height = 'auto';
            const newHeight = Math.min(userInput.scrollHeight, 120);
            userInput.style.height = newHeight + 'px';
        }
    }
    
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
            closeMathKeyboardFunc();
        } else {
            mathToolbar.style.display = 'block';
            toggleKeyboardBtn.classList.add('active');
            window.isMathKeyboardActive = true;
            body.classList.add('keyboard-active');
            
            mathToolbar.style.height = '45vh';
            if (chatContainer) {
                chatContainer.style.paddingBottom = 'calc(45vh + 100px)';
            }
            
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
    
    // =============== OPCIONES EMERGENTES ===============
    window.mostrarOpcionesInteractivo = function(opciones, pregunta = '') {
        if (window.isMathKeyboardActive) {
            closeMathKeyboardFunc();
        }
        
        if (questionDisplay) {
            questionDisplay.innerHTML = `<p style="margin: 0; padding: 10px; text-align: center; color: white; font-weight: 500;">Selecciona la opción correcta:</p>`;
            questionDisplay.style.display = 'block';
        }
        
        if (opcionesBotones) {
            opcionesBotones.innerHTML = '';
            
            opciones.slice(0, 3).forEach((opcion, index) => {
                const letra = String.fromCharCode(65 + index);
                const btn = document.createElement('button');
                btn.className = 'opcion-btn';
                btn.dataset.opcion = letra;
                btn.dataset.correcta = opcion.correcta;
                btn.innerHTML = `
                    <span class="option-letter">${letra}</span>
                    <span class="option-text">${opcion.texto}</span>
                `;
                btn.onclick = () => window.elegirOpcion(letra, opcion.correcta);
                opcionesBotones.appendChild(btn);
            });
        }
        
        if (optionsContainer) {
            optionsContainer.classList.add('visible');
            
            setTimeout(() => {
                if (chatContainer) {
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                }
            }, 100);
        }
    };
    
    window.closeOptions = function() {
        if (optionsContainer) {
            optionsContainer.classList.remove('visible');
        }
    };
    
    // =============== FUNCIÓN CORREGIDA PARA ELEGIR OPCIÓN ===============
    window.elegirOpcion = async function(opcion, esCorrecta) {
        if (!window.sesionActual) return;
        
        const botones = opcionesBotones ? opcionesBotones.querySelectorAll('.opcion-btn') : [];
        
        botones.forEach(btn => btn.disabled = true);
        
        const botonElegido = Array.from(botones).find(btn => btn.dataset.opcion === opcion);
        
        try {
            const response = await fetch('/responder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sesionId: window.sesionActual,
                    opcionElegida: opcion
                })
            });
            
            if (!response.ok) throw new Error('Error en la respuesta del servidor');
            
            const data = await response.json();
            
            if (botonElegido) {
                if (data.correcto) {
                    botonElegido.classList.add('correcta');
                    botonElegido.innerHTML += ' <i class="fas fa-check"></i>';
                    window.respuestasCorrectas++;
                    
                    // ✅ CORRECCIÓN: GANAR ESTRELLAS REALES
                    const estrellasGanadas = 1;
                    window.estrellasTotales += estrellasGanadas;
                    actualizarEstrellas(window.estrellasTotales);
                    
                    addMessage(`Elegiste: Opción ${opcion} ✓ (¡Correcto! +${estrellasGanadas}⭐)`, 'user');
                    
                    // ✅ CORRECCIÓN: VOZ SIN "INCORRECTO"
                    if (window.voiceEnabled && data.respuesta) {
                        const textoVoz = `¡Correcto! ${data.respuesta
                            .replace(/<[^>]*>/g, ' ')
                            .replace(/\*\*/g, '')
                            .replace(/\*/g, ' por ')
                            .replace(/#/g, ' número ')
                            .replace(/_/g, ' sub ')
                            .replace(/\^/g, ' elevado a ')
                            .replace(/\+/g, ' más ')
                            .replace(/-/g, ' menos ')
                            .replace(/=/g, ' igual a ')
                            .replace(/</g, ' menor que ')
                            .replace(/>/g, ' mayor que ')
                            .replace(/π/g, ' pi ')
                            .replace(/√/g, ' raíz de ')
                            .replace(/∫/g, ' integral ')
                            .replace(/\s+/g, ' ')
                            .trim()}`;
                        window.hablarConCola(textoVoz);
                    }
                } else {
                    botonElegido.classList.add('incorrecta');
                    botonElegido.innerHTML += ' <i class="fas fa-times"></i>';
                    addMessage(`Elegiste: Opción ${opcion} ✗ (Incorrecto)`, 'user');
                    
                    // ✅ CORRECCIÓN: VOZ CON "INCORRECTO"
                    if (window.voiceEnabled && data.respuesta) {
                        const textoVoz = `Incorrecto. ${data.respuesta
                            .replace(/<[^>]*>/g, ' ')
                            .replace(/\*\*/g, '')
                            .replace(/\*/g, ' por ')
                            .replace(/#/g, ' número ')
                            .replace(/_/g, ' sub ')
                            .replace(/\^/g, ' elevado a ')
                            .replace(/\+/g, ' más ')
                            .replace(/-/g, ' menos ')
                            .replace(/=/g, ' igual a ')
                            .replace(/</g, ' menor que ')
                            .replace(/>/g, ' mayor que ')
                            .replace(/π/g, ' pi ')
                            .replace(/√/g, ' raíz de ')
                            .replace(/∫/g, ' integral ')
                            .replace(/\s+/g, ' ')
                            .trim()}`;
                        window.hablarConCola(textoVoz);
                    }
                }
            }
            
            setTimeout(() => {
                closeOptions();
                if (data.respuesta) {
                    addMessage(data.respuesta, 'bot');
                }
                
                if (data.estrellas !== undefined) {
                    actualizarEstrellas(data.estrellas);
                }
                
                if (data.tieneOpciones && !data.sesionCompletada) {
                    setTimeout(() => {
                        if (data.opciones) {
                            window.sesionActual = data.sesionId;
                            window.opcionesActuales = data.opciones;
                            window.mostrarOpcionesInteractivo(data.opciones, "");
                        }
                    }, 2000);
                } else if (data.sesionCompletada) {
                    const porcentaje = Math.round((window.respuestasCorrectas / window.totalPreguntas) * 100);
                    const mensajeFinal = `🎉 ¡Sesión completada! ${window.respuestasCorrectas}/${window.totalPreguntas} correctas (${porcentaje}%)`;
                    
                    setTimeout(() => {
                        addMessage(mensajeFinal, 'bot');
                    }, 1000);
                    
                    window.respuestasCorrectas = 0;
                    window.totalPreguntas = 0;
                }
            }, 2000);
            
        } catch (error) {
            console.error('Error:', error);
            addMessage("❌ Error al procesar tu respuesta. Intenta nuevamente.", 'bot');
            botones.forEach(btn => btn.disabled = false);
            closeOptions();
        }
    };
    
    // =============== ACTUALIZAR ESTRELLAS ===============
    function actualizarEstrellas(cantidad) {
        window.estrellasTotales = cantidad;
        
        if (contadorEstrellas) {
            contadorEstrellas.textContent = cantidad;
            contadorEstrellas.classList.add('star-pulse');
            try {
                const audio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ');
                audio.volume = 0.3;
                audio.play();
            } catch (e) { console.log('Sin audio'); }
        
            setTimeout(() => {
                contadorEstrellas.classList.remove('star-pulse');
            }, 1000);
        
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
    
    // =============== FUNCIONES DE TYPING ===============
    function createTypingMessage(text) {
        if (!chatContainer) return null;
        
        const typing = document.createElement('div');
        typing.className = 'message bot typing-message';
        typing.innerHTML = `
            <div class="avatar bot-avatar">
                <img src="tutor-avatar.png" alt="Tutor">
            </div>
            <div class="message-content">
                <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
                <span class="typing-text">${text}</span>
            </div>
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
    
    // =============== SISTEMA DE VOZ ===============
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
    
    // =============== ENVIAR MENSAJE ===============
    async function sendMessage() {
        if (isSending) return;
        const text = userInput.value.trim();
        if (!text) return;
        
        isSending = true;
        addMessage(text, 'user');
        userInput.value = '';
        autoResizeTextarea();
        
        try {
            const typing = createTypingMessage("Pensando...");
            
            const response = await fetch('/analizar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ consulta: text })
            });
            
            if (!response.ok) throw new Error('Error en la respuesta del servidor');
            
            const data = await response.json();
            removeTypingMessage(typing);
            
            if (data.tipo === "interactivo") {
                window.sesionActual = data.sesionId;
                window.opcionesActuales = data.opciones;
                window.respuestaCorrecta = data.respuestaCorrecta;
                
                addMessage(data.respuesta, 'bot');
                
                // ✅ CORRECCIÓN: VOZ SIN "INCORRECTO"
                if (window.voiceEnabled && data.respuesta) {
                    const textoVoz = data.respuesta
                        .replace(/<[^>]*>/g, ' ')
                        .replace(/\*\*/g, '')
                        .replace(/\*/g, ' por ')
                        .replace(/#/g, ' número ')
                        .replace(/_/g, ' sub ')
                        .replace(/\^/g, ' elevado a ')
                        .replace(/\+/g, ' más ')
                        .replace(/-/g, ' menos ')
                        .replace(/=/g, ' igual a ')
                        .replace(/</g, ' menor que ')
                        .replace(/>/g, ' mayor que ')
                        .replace(/π/g, ' pi ')
                        .replace(/√/g, ' raíz de ')
                        .replace(/∫/g, ' integral ')
                        .replace(/\s+/g, ' ')
                        .trim();
                    window.hablarConCola(textoVoz);
                }
                
                setTimeout(() => {
                    window.mostrarOpcionesInteractivo(data.opciones, "");
                }, 1000);
                
                if (data.estrellas !== undefined) {
                    actualizarEstrellas(data.estrellas);
                }
            } 
            else if (data.necesitaGrafica) {
                addMessage(data.respuesta, 'bot');
                
                // ✅ CORRECCIÓN: VOZ SIN "INCORRECTO"
                if (window.voiceEnabled && data.respuesta) {
                    const textoVoz = data.respuesta
                        .replace(/<[^>]*>/g, ' ')
                        .replace(/\*\*/g, '')
                        .replace(/\*/g, ' por ')
                        .replace(/#/g, ' número ')
                        .replace(/_/g, ' sub ')
                        .replace(/\^/g, ' elevado a ')
                        .replace(/\+/g, ' más ')
                        .replace(/-/g, ' menos ')
                        .replace(/=/g, ' igual a ')
                        .replace(/</g, ' menor que ')
                        .replace(/>/g, ' mayor que ')
                        .replace(/π/g, ' pi ')
                        .replace(/√/g, ' raíz de ')
                        .replace(/∫/g, ' integral ')
                        .replace(/\s+/g, ' ')
                        .trim();
                    window.hablarConCola(textoVoz);
                }
                
                if (data.graficaData && data.graficaData.funcion) {
                    setTimeout(() => graficarFuncionGeoGebra(data.graficaData.funcion), 1500);
                }
            }
            else {
                addMessage(data.respuesta, 'bot');
                
                // ✅ CORRECCIÓN: VOZ SIN "INCORRECTO"
                if (window.voiceEnabled && data.respuesta) {
                    const textoVoz = data.respuesta
                        .replace(/<[^>]*>/g, ' ')
                        .replace(/\*\*/g, '')
                        .replace(/\*/g, ' por ')
                        .replace(/#/g, ' número ')
                        .replace(/_/g, ' sub ')
                        .replace(/\^/g, ' elevado a ')
                        .replace(/\+/g, ' más ')
                        .replace(/-/g, ' menos ')
                        .replace(/=/g, ' igual a ')
                        .replace(/</g, ' menor que ')
                        .replace(/>/g, ' mayor que ')
                        .replace(/π/g, ' pi ')
                        .replace(/√/g, ' raíz de ')
                        .replace(/∫/g, ' integral ')
                        .replace(/\s+/g, ' ')
                        .trim();
                    window.hablarConCola(textoVoz);
                }
            }
            
        } catch (error) {
            console.error('Error:', error);
            
            if (document.querySelector('.typing-message')) {
                removeTypingMessage(document.querySelector('.typing-message'));
            }
            
            const respuestas = [
                "⚠️ Error de conexión. Por favor, intenta nuevamente.",
                "Lo siento, hay un problema con el servidor. Intenta en un momento.",
                "No puedo procesar tu solicitud en este momento. Verifica tu conexión."
            ];
            const mensajeError = respuestas[Math.floor(Math.random() * respuestas.length)];
            addMessage(mensajeError, 'bot');
        }
        
        isSending = false;
    }
    
    // =============== SIMULACIÓN DE ANÁLISIS DE IMAGEN ===============
    function simulateImageAnalysis(file) {
        setTimeout(() => {
            const opciones = [
                { texto: "Resolver esta ecuación paso a paso", correcta: false },
                { texto: "Explicar el concepto matemático involucrado", correcta: false },
                { texto: "Mostrar ejemplos similares para practicar", correcta: true }
            ];
            
            addMessage('📸 Analizando imagen... He detectado un ejercicio matemático.', 'bot');
            
            setTimeout(() => {
                window.mostrarOpcionesInteractivo(opciones, "");
            }, 1500);
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
    
    // =============== INICIALIZACIÓN ===============
    if ('speechSynthesis' in window) {
        window.speechSynthesis.getVoices();
    }
    
    initMathKeyboard();
    
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
        
        setTimeout(() => {
            userInput.focus();
        }, 500);
    }
    
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
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (mathToolbar.style.display === 'block') {
                closeMathKeyboardFunc();
            } else if (optionsContainer.style.display === 'block') {
                window.closeOptions();
            }
        }
        
        if (e.ctrlKey && e.key === 'm') {
            e.preventDefault();
            toggleMathKeyboard();
        }
        
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            sendMessage();
        }
    });
    
    mejorarMensajeInicial();
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

// =============== DOBLE CLICK PARA SALIR ===============
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

// =============== INICIALIZAR GEOGEBRA AL CARGAR ===============
document.addEventListener('DOMContentLoaded', inicializarGeoGebra);



