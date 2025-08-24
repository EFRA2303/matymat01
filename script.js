// script.js
import { speakText } from './tts.js';

// Elementos del DOM
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const uploadBtn = document.getElementById('uploadBtn');
const fileInput = document.getElementById('fileInput');
const chatContainer = document.getElementById('chatContainer');
const menuToggle = document.getElementById('menuToggle');
const menuDropdown = document.getElementById('menuDropdown');
const themeOption = document.getElementById('themeOption');
const audioOption = document.getElementById('audioOption');
const mathKeyboardToggle = document.getElementById('mathKeyboardToggle');
const mathKeyboard = document.getElementById('mathKeyboard');
const closeKeyboard = document.getElementById('closeKeyboard');
const graphBtn = document.getElementById('graphBtn');
const geogebraContainer = document.getElementById('geogebraContainer');
const closeGraph = document.getElementById('closeGraph');

// Instancia de GeoGebra
let ggbApp = null;

// Estados
let isDarkMode = false;
let isVoiceEnabled = true;
let isSending = false;
let selectedImage = null;

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

// Menú estilo Gemini
menuToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    document.querySelector('.menu-container').classList.toggle('active');
});

document.addEventListener('click', (e) => {
    const menuContainer = document.querySelector('.menu-container');
    if (!menuContainer.contains(e.target)) {
        menuContainer.classList.remove('active');
    }
});

// Modo oscuro
themeOption.addEventListener('click', () => {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode', isDarkMode);
    localStorage.setItem('darkMode', isDarkMode);

    const icon = themeOption.querySelector('i');
    const span = themeOption.querySelector('span');
    icon.className = isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
    span.textContent = isDarkMode ? 'Modo Claro' : 'Modo Oscuro';
});

// Voz
audioOption.addEventListener('click', () => {
    isVoiceEnabled = !isVoiceEnabled;

    const icon = audioOption.querySelector('i');
    const span = audioOption.querySelector('span');
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

mathKeyboardToggle.addEventListener('click', () => {
    mathKeyboard.classList.toggle('active');
});

closeKeyboard.addEventListener('click', () => {
    mathKeyboard.classList.remove('active');
});

document.addEventListener('click', (e) => {
    if (!mathKeyboard.contains(e.target) && !mathKeyboardToggle.contains(e.target) && mathKeyboard.classList.contains('active')) {
        mathKeyboard.classList.remove('active');
    }
});

// Graficar con GeoGebra
graphBtn.addEventListener('click', () => {
    const func = userInput.value.trim();
    if (!func) return;

    if (!ggbApp) {
        ggbApp = new GGBApplet({
            "appName": "classic",
            "width": 400,
            "height": 300,
            "showToolBar": false,
            "showAlgebraInput": false,
            "showMenuBar": false,
            "enableLabelDrags": false,
            "enableShiftDragZoom": true,
            "showZoomButtons": true,
            "capturingThreshold": 3,
            "showFullscreenButton": true,
            "scale": 1,
            "disableAutoScale": false,
            "enableRightClick": false,
            "language": "es",
            "material_id": "null"
        }, true);
        ggbApp.inject('ggbElement');
    }

    setTimeout(() => {
        ggbApp.evalCommand(func);
    }, 500);

    geogebraContainer.style.display = 'block';
});

closeGraph.addEventListener('click', () => {
    geogebraContainer.style.display = 'none';
});
