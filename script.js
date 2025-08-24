import { speakText } from './tts.js';

const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const uploadBtn = document.getElementById('uploadBtn');
const fileInput = document.getElementById('fileInput');
const chatContainer = document.getElementById('chatContainer');
const settingsToggle = document.getElementById('settingsToggle');
const settingsMenu = document.getElementById('settingsMenu');
const themeOption = document.getElementById('themeOption');
const audioOption = document.getElementById('audioOption');

let isDarkMode = false;
let isVoiceEnabled = true;
let isSending = false;
let selectedImage = null;

// Eventos
uploadBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleImageSelect);
sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

function handleImageSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
        selectedImage = reader.result;
        addMessage(`📸 Imagen lista. Escribe y envía.`, 'user');
        if (userInput.value.trim()) sendMessage();
    };
    reader.readAsDataURL(file);
}

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

function addMessage(text, sender) {
    const div = document.createElement('div');
    div.className = `message ${sender}`;
    const avatar = document.createElement('div');
avatar.className = `avatar ${sender}-avatar`;
if (sender === 'bot') {
    const img = document.createElement('img');
    img.src = 'logo-tutor.png';
    img.alt = 'Tutor';
    avatar.appendChild(img);
}
    // Después de: chatContainer.appendChild(div);
// Añade esto si es un mensaje del bot
if (sender === 'bot') {
    avatar.classList.add('blinking'); // Activa el parpadeo

    // Detiene el parpadeo después de 3 segundos (ajusta según duración de la voz)
    setTimeout(() => {
        avatar.classList.remove('blinking');
    }, 3000);

    // O sincroniza con la duración del texto a voz
    if (isVoiceEnabled) {
        const words = text.split(' ').length;
        const time = Math.max(2000, words * 300); // Tiempo estimado de lectura
        setTimeout(() => {
            avatar.classList.remove('blinking');
        }, time);
    }
}

    if (sender === 'bot') {
        const img = document.createElement('img');
        img.src = 'logo-tutor.png';
        img.alt = 'Tutor';
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
}

function showTypingIndicator() {
    const typing = document.createElement('div');
    typing.className = 'typing-indicator';
    typing.id = 'typing';
    typing.innerHTML = `
        <div class="avatar bot-avatar">
            <img src="logo-tutor.png" alt="...">
        </div>
        <div class="message-content">Pensando...</div>
    `;
    chatContainer.appendChild(typing);
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

// Configuración
settingsToggle.addEventListener('click', () => {
    settingsMenu.classList.toggle('show');
});

document.addEventListener('click', e => {
    if (!settingsMenu.contains(e.target) && !settingsToggle.contains(e.target)) {
        settingsMenu.classList.remove('show');
    }
});

// Cargar modo oscuro al inicio
document.body.classList.toggle('dark-mode', localStorage.getItem('darkMode') === 'true');

isDarkMode = localStorage.getItem('darkMode') === 'true';

