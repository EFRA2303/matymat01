// script.js
import { speakText } from './tts.js';

// Elementos del DOM
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const uploadBtn = document.getElementById('uploadBtn');
const fileInput = document.getElementById('fileInput');
const chatContainer = document.getElementById('chatContainer');
const settingsToggle = document.getElementById('settingsToggle');
const settingsMenu = document.getElementById('settingsMenu');
const themeOption = document.getElementById('themeOption');
const audioOption = document.getElementById('audioOption');

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
        img.onerror = () => {
            img.src = 'https://via.placeholder.com/150?text=Tutor';
        };
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

    // === EFECTO DE PARPADEO DEL AVATAR (SOLO PARA EL BOT) ===
    if (sender === 'bot') {
        requestAnimationFrame(() => {
            const img = avatar.querySelector('img');
            if (img) {
                img.classList.add('blinking');

                // Estima el tiempo de lectura según la longitud del texto
                const textLength = text.length;
                const estimatedTime = Math.max(2000, textLength * 60);

                // Detener parpadeo después del tiempo estimado
                setTimeout(() => {
                    img.classList.remove('blinking');
                }, estimatedTime);

                // Si la voz está activada, extiende un poco el tiempo
                if (isVoiceEnabled) {
                    setTimeout(() => {
                        img.classList.remove('blinking');
                    }, estimatedTime + 1000);
                }
            }
        });
    }
    // ========================================================
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

// Configuración (menú deslizante)
settingsToggle.addEventListener('click', () => {
    settingsMenu.classList.toggle('show');
});

document.addEventListener('click', (e) => {
    if (!settingsMenu.contains(e.target) && !settingsToggle.contains(e.target)) {
        settingsMenu.classList.remove('show');
    }
});

// Cargar configuración al iniciar
document.body.classList.toggle('dark-mode', localStorage.getItem('darkMode') === 'true');
isDarkMode = localStorage.getItem('darkMode') === 'true';

// Actualizar texto e icono del modo oscuro
const icon = themeOption.querySelector('i');
const span = themeOption.querySelector('span');
icon.className = isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
span.textContent = isDarkMode ? 'Modo Claro' : 'Modo Oscuro';

// === FUNCIONES DEL TECLADO MATEMÁTICO ===
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

document.getElementById('mathKeyboardToggle').addEventListener('click', () => {
    document.getElementById('mathKeyboard').classList.toggle('active');
});

document.getElementById('closeKeyboard').addEventListener('click', () => {
    document.getElementById('mathKeyboard').classList.remove('active');
});

document.addEventListener('click', (e) => {
    const keyboard = document.getElementById('mathKeyboard');
    const toggle = document.getElementById('mathKeyboardToggle');
    if (!keyboard.contains(e.target) && !toggle.contains(e.target) && keyboard.classList.contains('active')) {
        keyboard.classList.remove('active');
    }
});
