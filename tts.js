// tts.js - Síntesis de Voz (Text-to-Speech)
export function speakText(text) {
  // Cancelar cualquier habla anterior
  window.speechSynthesis.cancel();

  // Esperar a que las voces estén disponibles
  if (window.speechSynthesis.getVoices().length === 0) {
    console.log('🔊 Voces no disponibles aún, esperando...');
    window.speechSynthesis.onvoiceschanged = () => {
      console.log('🔊 Voces cargadas. Reproduciendo...');
      speakWithVoices(text);
    };
    // Forzar la carga de voces en algunos navegadores
    setTimeout(() => {
      if (window.speechSynthesis.getVoices().length === 0) {
        console.warn('🔊 Advertencia: No se detectaron voces.');
        speakWithVoices(text); // Intentar igual
      }
    }, 500);
  } else {
    speakWithVoices(text);
  }
}

// Función auxiliar para hablar con voces disponibles
function speakWithVoices(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'es-ES';
  utterance.rate = 0.9;
  utterance.pitch = 1;

  const voices = window.speechSynthesis.getVoices();
  const voice = voices.find(v => v.lang === 'es-ES') || voices.find(v => v.lang.startsWith('es')) || voices[0];

  if (voice) {
    utterance.voice = voice;
    console.log('🔊 Usando voz:', voice.name, '(', voice.lang, ')');
  } else {
    console.warn('🔊 No se encontró una voz en español');
  }

  utterance.onerror = (event) => {
    console.error('❌ Error en la síntesis de voz:', event.error);
  };

  utterance.onend = () => {
    console.log('✅ Síntesis de voz finalizada');
  };

  window.speechSynthesis.speak(utterance);
}

// Escuchar cambios de voces
window.speechSynthesis.onvoiceschanged = () => {
  console.log('🔊 Evento: Voces cambiaron');
};
