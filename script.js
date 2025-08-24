// script.js
import { speakText } from './tts.js';

// Elementos del DOM
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const uploadBtn = document.getElementById('uploadBtn');
const fileInput = document.getElementById('fileInput');
const chatContainer = document.getElementById('chatContainer');
const menuToggle = document.getElementById('menuToggle');
const menuPanel = document.getElementById('menuPanel');
const closeMenu = document.getElementById('closeMenu');
const mathMenuToggle = document.getElementById('mathMenuToggle');
const mathPanel = document.getElementById('mathPanel');
const closeMath = document.getElementById('closeMath');
const graphBtn = document.getElementById('graphBtn');
const graphContainer = document.getElementById('graphContainer');
const graphCanvas = document.getElementById('graphCanvas');

// Estados
let isDarkMode = false;
let isVoiceEnabled = true;
let isSending = false;
let selectedImage = null;
let graphChart = null;

// Eventos
uploadBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleImageSelect);
sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Manejar selección de imagen
function handleImageSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
        selectedImage = reader.result;
        addMessage(`📸 Imagen seleccionada. Escribe y envía.`, 'user');
        if (userInput.value.trim()) sendMessage();
    };
    reader.readAsDataURL(file);
}

// Enviar mensaje
async function sendMessage() {
    if (isSending) return;
    isSending = true;

    const text = userInput.value.trim();
    if (!text && !selectedImage) {
        isSending = false;
        return;
    }

    if (text) addMessage(text, 'user');
    userInput.value = '';
    showTypingIndicator();

    const body = { text: text || 'Analiza esta imagen.' };
    if (selectedImage) {
        body.image = selectedImage.split(',')[1];
        body.mimeType = selectedImage.includes('png') ? 'image/png' : 'image/jpeg';
    }

    try {
        const response = await fetch('/analizar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await response.json();
        hideTypingIndicator();

        if (data.respuesta) {
            addMessage(data.respuesta, 'bot');
            if (isVoiceEnabled) speakText(data.respuesta);
        } else if (data.error) {
            addMessage("⚠️ " + data.error, 'bot');
        }
    } catch (err) {
        hideTypingIndicator();
        addMessage("🔴 No pude conectar con el servidor. Intenta recargar.", 'bot');
        console.error('Error de conexión:', err);
    } finally {
        selectedImage = null;
        isSending = false;
    }
}

// Añadir mensaje al chat
function addMessage(text, sender) {
    const div = document.createElement('div');
    div.className = `message ${sender}`;

    const avatar = document.createElement('div');
    avatar.className = `avatar ${sender}-avatar`;

    if (sender === 'bot') {
        const img = document.createElement('img');
        img.src = 'logo-tutor.png';
        img.alt = 'Tutor Avatar';
        img.onerror = () => img.src = 'https://via.placeholder.com/150?text=Tutor';
        avatar.appendChild(img);
    } else {
        avatar.innerHTML = '<i class="fas fa-user"></i>';
    }

    const content = document.createElement('div');
    content.className = 'message-content';
    content.textContent = text;

    div.appendChild(avatar);
    div.appendChild(content);
    chatContainer.appendChild(div);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    // Efecto de parpadeo del avatar del bot
    if (sender === 'bot') {
        requestAnimationFrame(() => {
            const img = avatar.querySelector('img');
            if (img) {
                img.classList.add('blinking');
                const textLength = text.length;
                const estimatedTime = Math.max(2000, textLength * 60);

                setTimeout(() => img.classList.remove('blinking'), estimatedTime);
                if (isVoiceEnabled) {
                    setTimeout(() => img.classList.remove('blinking'), estimatedTime + 1000);
                }
            }
        });
    }
}

// Indicador de "escribiendo..."
function showTypingIndicator() {
    const typing = document.createElement('div');
    typing.className = 'typing-indicator';
    typing.id = 'typing';
    typing.innerHTML = `
        <div class="avatar bot-avatar">
            <img src="logo-tutor.png" alt="Tutor">
        </div>
        <div class="message-content">Pensando...</div>
    `;
    chatContainer.appendChild(typing);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function hideTypingIndicator() {
    const typing = document.getElementById('typing');
    if (typing) typing.remove();
}

// Menú de Configuración (⋯)
menuToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    menuPanel.classList.add('active');
});

closeMenu.addEventListener('click', () => {
    menuPanel.classList.remove('active');
});

// Modo oscuro
document.getElementById('themeOption').addEventListener('click', () => {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode', isDarkMode);
    localStorage.setItem('darkMode', isDarkMode);

    const icon = document.querySelector('#themeOption i');
    const span = document.querySelector('#themeOption span');
    icon.className = isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
    span.textContent = isDarkMode ? 'Modo Claro' : 'Modo Oscuro';
});

// Voz
document.getElementById('audioOption').addEventListener('click', () => {
    isVoiceEnabled = !isVoiceEnabled;

    const icon = document.querySelector('#audioOption i');
    const span = document.querySelector('#audioOption span');
    icon.className = isVoiceEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute';
    span.textContent = isVoiceEnabled ? 'Voz Activada' : 'Voz Desactivada';
});

// Cargar configuración al iniciar
document.body.classList.toggle('dark-mode', localStorage.getItem('darkMode') === 'true');
isDarkMode = localStorage.getItem('darkMode') === 'true';

// Actualizar menú al cargar
document.querySelector('#themeOption i').className = isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
document.querySelector('#themeOption span').textContent = isDarkMode ? 'Modo Claro' : 'Modo Oscuro';
document.querySelector('#audioOption i').className = isVoiceEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute';
document.querySelector('#audioOption span').textContent = isVoiceEnabled ? 'Voz Activada' : 'Voz Desactivada';

// Panel de Teclado (☰)
mathMenuToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    mathPanel.classList.add('active');
});

closeMath.addEventListener('click', () => {
    mathPanel.classList.remove('active');
    graphContainer.style.display = 'none';
});

// Teclado Matemático
function insertMath(text) {
    const input = document.getElementById('userInput');
    input.setRangeText(text, input.selectionStart, input.selectionEnd, 'end');
    input.focus();
}

function backspace() {
    const input = document.getElementById('userInput');
    const value = input.value;
    const start = input.selectionStart;
    const end = input.selectionEnd;

    if (start === end) {
        input.setRangeText('', start - 1, end);
        input.selectionStart = input.selectionEnd = start - 1;
    } else {
        input.setRangeText('', start, end);
        input.selectionStart = input.selectionEnd = start;
    }
    input.focus();
}

function clearInput() {
    document.getElementById('userInput').value = '';
    document.getElementById('userInput').focus();
}

// Graficar con Chart.js
graphBtn.addEventListener('click', () => {
    const func = userInput.value.trim();
    if (!func) return;

    graphContainer.style.display = 'block';

    // Extrae valores para graficar (ej: x^2)
    const x = Array.from({ length: 100 }, (_, i) => i / 10 - 5);
    const y = x.map(val => {
        try {
            return eval(func.replace(/x/g, `(${val})`));
        } catch {
            return NaN;
        }
    });

    if (graphChart) graphChart.destroy();

    graphChart = new Chart(graphCanvas, {
        type: 'line',
        data: {
            labels: x,
            datasets: [{
                label: func,
                data: y,
                borderColor: '#4361ee',
                backgroundColor: 'rgba(67, 97, 238, 0.1)',
                borderWidth: 2,
                pointRadius: 0,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: { display: true, grid: { color: 'rgba(255,255,255,0.1)' } },
                y: { display: true, grid: { color: 'rgba(255,255,255,0.1)' } }
            }
        }
    });
});

// Cerrar al hacer clic fuera
document.addEventListener('click', (e) => {
    if (!menuPanel.contains(e.target) && !menuToggle.contains(e.target)) {
        menuPanel.classList.remove('active');
    }
    if (!mathPanel.contains(e.target) && !mathMenuToggle.contains(e.target)) {
        mathPanel.classList.remove('active');
        graphContainer.style.display = 'none';
    }
});
// Insertar texto en la posición del cursor
function insertAtCursor(text) {
    const input = document.getElementById('userInput');
    const start = input.selectionStart;
    const end = input.selectionEnd;
    input.value = input.value.substring(0, start) + text + input.value.substring(end);
    input.focus();
    input.setSelectionRange(start + text.length, start + text.length);
    // Dispara el evento de cambio para que otros scripts lo detecten
    input.dispatchEvent(new Event('input'));
}

// Limpiar el input
function clearInput() {
    document.getElementById('userInput').value = '';
    document.getElementById('userInput').focus();
}

// Alternar el teclado matemático
document.getElementById('toggleMathBtn').addEventListener('click', () => {
    const toolbar = document.getElementById('mathToolbar');
    toolbar.style.display = toolbar.style.display === 'none' ? 'flex' : 'none';
});

// Cerrar el teclado al enviar
document.getElementById('sendBtn').addEventListener('click', () => {
    document.getElementById('mathToolbar').style.display = 'none';
});

// Cerrar el teclado al hacer clic fuera (opcional)
document.addEventListener('click', (e) => {
    const toolbar = document.getElementById('mathToolbar');
    const container = document.querySelector('.math-input-container');
    const btn = document.getElementById('toggleMathBtn');
    if (!container.contains(e.target) && !btn.contains(e.target)) {
        toolbar.style.display = 'none';
    }
});


