document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const chatContainer = document.getElementById('chatContainer');
    const toggleKeyboardBtn = document.getElementById('toggleKeyboardBtn');
    const mathKeyboard = document.getElementById('mathKeyboard');
    const closeMathKeyboard = document.getElementById('closeMathKeyboard');
    const switchToTextKeyboard = document.getElementById('switchToTextKeyboard');
    const keyboardTabs = mathKeyboard.querySelector('.keyboard-tabs');
    const keyboardContent = document.getElementById('keyboardContent');
    const uploadBtn = document.getElementById('uploadBtn');
    const fileInput = document.getElementById('fileInput');
    const optionsContainer = document.getElementById('optionsContainer');
    const optionsGrid = document.getElementById('optionsGrid');
    const questionDisplay = document.getElementById('questionDisplay');
    
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
    window.isMathKeyboardActive = false;
    
    // Layout del teclado matemático
    const keyboardLayouts = {
        basic: [
            { keys: ['7', '8', '9', '+'], class: 'num' },
            { keys: ['4', '5', '6', '-'], class: 'num' },
            { keys: ['1', '2', '3', '×'], class: 'num' },
            { keys: ['0', '.', '(', ')'], class: 'num' },
            { keys: ['C', '⌫', '=', '÷'], class: 'special', types: ['clear', 'backspace', '=', '/'] }
        ],
        symbols: [
            { keys: ['x', 'y', 'z', 'π'], class: 'sym' },
            { keys: ['θ', '°', '%', '!'], class: 'sym' },
            { keys: ['√', '^', '∞', '≈'], class: 'sym' },
            { keys: ['≠', '≤', '≥', '±'], class: 'sym' }
        ],
        functions: [
            { keys: ['sin', 'cos', 'tan', 'cot'], class: 'func' },
            { keys: ['sec', 'csc', 'log', 'ln'], class: 'func' },
            { keys: ['exp', 'abs', 'sinh', 'cosh'], class: 'func' },
            { keys: ['tanh', '∑', '∏', '∫'], class: 'func' }
        ],
        calculus: [
            { keys: ['∂', 'Δ', '∇', 'lim'], class: 'calc' },
            { keys: ['dx', 'dy', 'dz', 'dt'], class: 'calc' },
            { keys: ['∫dx', '∫dy', '∫dz', '∫dt'], class: 'calc' },
            { keys: ['a/b', '|x|', '⌊x⌋', '⌈x⌉'], class: 'calc' }
        ]
    };
    
    // === INICIALIZAR TECLADO MATEMÁTICO ===
    function initMathKeyboard() {
        // Generar contenido inicial
        generateKeyboardContent('basic');
        
        // Configurar eventos de tabs
        const tabs = keyboardTabs.querySelectorAll('.keyboard-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const tabName = tab.dataset.tab;
                generateKeyboardContent(tabName);
            });
        });
        
        // Evento cerrar teclado
        closeMathKeyboard.addEventListener('click', closeMathKeyboardFunc);
        
        // Evento cambiar a teclado de texto
        switchToTextKeyboard.addEventListener('click', () => {
            closeMathKeyboardFunc();
            userInput.focus();
        });
    }
    
    // Generar contenido del teclado
    function generateKeyboardContent(tabName) {
        keyboardContent.innerHTML = '';
        const layout = keyboardLayouts[tabName];
        
        layout.forEach(row => {
            const keysRow = document.createElement('div');
            keysRow.className = 'keys-grid';
            
            row.keys.forEach((key, index) => {
                const button = document.createElement('button');
                button.className = `tool-btn ${row.class}`;
                button.textContent = key;
                
                // Configurar función según tipo de tecla
                if (row.types && row.types[index]) {
                    const type = row.types[index];
                    if (type === 'clear') {
                        button.classList.add('clear-btn');
                        button.addEventListener('click', () => clearAll());
                    } else if (type === 'backspace') {
                        button.classList.add('backspace-btn');
                        button.addEventListener('click', () => backspaceInput());
                    } else if (type === '=') {
                        button.addEventListener('click', () => insertAtCursor('='));
                    } else if (type === '/') {
                        button.addEventListener('click', () => insertAtCursor('/'));
                    }
                } else if (key === '×') {
                    button.addEventListener('click', () => insertAtCursor('*'));
                } else if (key === '÷') {
                    button.addEventListener('click', () => insertAtCursor('/'));
                } else if (key === 'a/b') {
                    button.addEventListener('click', () => insertFraction());
                } else if (['sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'arcsin', 'arccos', 'arctan', 'sinh', 'cosh', 'tanh', 'log', 'ln', 'lg', 'exp', 'abs', 'floor', 'ceil', 'round', 'rand', 'gcd', 'lcm', 'mod', 'lim', '∑', '∏'].includes(key)) {
                    button.addEventListener('click', () => insertFunction(key));
                } else if (key === '∫') {
                    button.addEventListener('click', () => insertIntegral());
                } else if (key.startsWith('∫')) {
                    button.addEventListener('click', () => insertAtCursor(key));
                } else {
                    button.addEventListener('click', () => insertAtCursor(key));
                }
                
                keysRow.appendChild(button);
            });
            
            keyboardContent.appendChild(keysRow);
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
        insertAtCursor('( )/( )');
        const start = userInput.selectionStart - 6;
        userInput.selectionStart = start + 1;
        userInput.selectionEnd = start + 2;
        userInput.focus();
    };
    
    window.insertFunction = function(funcName) {
        insertAtCursor(funcName + '()');
        userInput.selectionStart = userInput.selectionStart - 1;
        userInput.focus();
    };
    
    window.insertIntegral = function() {
        insertAtCursor('∫_^ dx');
        userInput.selectionStart = userInput.selectionStart - 4;
        userInput.focus();
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
    
    // === MOSTRAR OPCIONES (FULL SCREEN) ===
    window.mostrarOpcionesInteractivo = function(opciones, pregunta = '') {
        // Cerrar teclado matemático si está abierto
        if (window.isMathKeyboardActive) {
            closeMathKeyboardFunc();
        }
        
        // Mostrar pregunta
        if (pregunta) {
            questionDisplay.innerHTML = `<p>${pregunta}</p>`;
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
        
        // Mostrar contenedor de opciones (full screen)
        optionsContainer.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Evitar scroll del body
    };
    
    // Cerrar opciones
    window.closeOptions = function() {
        optionsContainer.style.display = 'none';
        document.body.style.overflow = ''; // Restaurar scroll
    };
    
    // === FUNCIÓN MEJORADA PARA ELEGIR OPCIÓN ===
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
                        window.hablarConCola(`Incorrecto. La opción correcta es la ${opcionCorrecta.letra}.`);
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
            
            // Cerrar opciones actuales
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
    
    // === ACTUALIZAR ESTRELLAS ===
    function actualizarEstrellas(cantidad) {
        window.estrellasTotales = cantidad;
        const contador = document.getElementById('contadorEstrellas');
        
        if (contador) {
            contador.textContent = cantidad;
            contador.classList.add('star-pulse');
            setTimeout(() => {
                contador.classList.remove('star-pulse');
            }, 1000);
        }
    }
    
    // === FUNCIONES PRINCIPALES ===
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
            .replace(/(Paso\s*\d+[:\.\-])/gi, '<strong style="color: #1565c0;">$1</strong>')
            .replace(/(Solución final[:\.\-])/gi, '<strong style="color: #2e7d32;">$1</strong>')
            .replace(/\n/g, '<br>');
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
    initMathKeyboard();
    
    // === FUNCIONES DE ENVÍO DE MENSAJES (simplificadas) ===
    async function sendMessage() {
        if (isSending) return;
        const text = userInput.value.trim();
        if (!text) return;
        isSending = true;
        addMessage(text, 'user');
        userInput.value = '';
        userInput.style.height = 'auto';
        
        // Simular respuesta del tutor
        const typing = createTypingMessage("Pensando...");
        
        setTimeout(() => {
            removeTypingMessage(typing);
            
            // Simular una pregunta con opciones (para demo)
            if (text.toLowerCase().includes('resuelve') || text.toLowerCase().includes('calcula')) {
                window.sesionActual = 'demo-' + Date.now();
                window.opcionesActuales = [
                    { letra: 'A', texto: "x = 5", correcta: true },
                    { letra: 'B', texto: "x = 10", correcta: false },
                    { letra: 'C', texto: "x = 15", correcta: false }
                ];
                
                const respuestaBot = `📝 Para resolver: ${text}<br><br>
                <strong>Paso 1:</strong> Aislar la variable x<br>
                <strong>Paso 2:</strong> Simplificar la ecuación<br>
                <strong>Paso 3:</strong> Encontrar el valor de x<br><br>
                ¿Cuál crees que es la solución correcta?`;
                
                addMessage(respuestaBot, 'bot');
                
                setTimeout(() => {
                    mostrarOpcionesInteractivo(window.opcionesActuales, "¿Cuál es el valor de x?");
                }, 1000);
            } else {
                // Respuesta normal
                const respuestas = [
                    "¡Excelente pregunta! Para resolver esto necesitamos aplicar los conceptos de álgebra básica.",
                    "Entiendo tu consulta. Vamos a resolverlo paso a paso para que comprendas el proceso.",
                    "Esta es una pregunta interesante. Te mostraré cómo abordarla sistemáticamente."
                ];
                addMessage(respuestas[Math.floor(Math.random() * respuestas.length)], 'bot');
            }
            
            isSending = false;
        }, 1500);
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
    
    // Simular análisis de imagen
    function simulateImageAnalysis(file) {
        setTimeout(() => {
            const opciones = [
                { letra: 'A', texto: "Resolver esta ecuación paso a paso", correcta: false },
                { letra: 'B', texto: "Explicar el concepto matemático involucrado", correcta: false },
                { letra: 'C', texto: "Mostrar ejemplos similares para practicar", correcta: true }
            ];
            
            mostrarOpcionesInteractivo(opciones, "¿Qué te gustaría hacer con este ejercicio?");
        }, 2000);
    }
    
    // Función de voz (simplificada)
    window.hablarConCola = function(texto) {
        if (!window.voiceEnabled || !texto) return;
        
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(texto);
            utterance.lang = 'es-ES';
            utterance.rate = 0.9;
            window.speechSynthesis.speak(utterance);
        }
    };
    
    function narrarPasoCompleto(respuestaCompleta, opciones, respuestaCorrecta) {
        if (!window.voiceEnabled) return;
        
        const texto = "Ahora elige una opción entre A, B o C.";
        window.hablarConCola(texto);
    }
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
        
        // addMessage(`✅ Gráfica generada para: f(x) = ${funcionTexto}`, 'bot');
        
    } catch (error) {
        console.error('Error al graficar con GeoGebra:', error);
        // addMessage("❌ Error al generar la gráfica. Verifica la función.", 'bot');
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

// Llamar inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', inicializarGeoGebra);
