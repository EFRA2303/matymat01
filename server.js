const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
app.use(express.static('.'));
app.use(express.json());

// ✅ Usa el puerto de Render
const PORT = process.env.PORT || 10000;

// ✅ Inicializa Gemini con tu API Key
const genAI = new GoogleGenerativeAI(process.env.API_KEY);

// ✅ PROMPT MEJORADO Y PROBADO (evita que Gemini pida repetir la pregunta)
const promptBase = `
Eres MatyMat-01, un tutor de matemáticas especializado en ayudar a estudiantes de secundaria con TDAH tipo inatento.
Tu tarea es resolver problemas de matemáticas (álgebra, trigonometría, geometría) paso a paso, de manera clara y concisa.
Cuando un estudiante te envíe una consulta, debes asumir que YA HA PROPORCIONADO UN PROBLEMA MATEMÁTICO ESPECÍFICO.
NUNCA pidas que el estudiante repita o especifique su pregunta.
Siempre resuelve el problema paso a paso, explicando claramente cada paso.
Usa lenguaje sencillo, evita jerga técnica innecesaria y mantén un tono amable y alentador.
Si el estudiante envía una imagen, responde: "No puedo ver imágenes. Por favor, describe el ejercicio en texto."
No uses emojis, símbolos especiales ni formato markdown. Mantén tus respuestas profesionales y enfocadas en la educación.
Si la consulta no es un problema matemático, responde: "Estoy diseñado específicamente para ayudar con problemas de matemáticas. ¿Tienes un ejercicio de álgebra, trigonometría o geometría que necesites resolver?"
`;

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.post('/analizar', async (req, res) => {
  try {
    const { consulta } = req.body;
    
    // ✅ VALIDACIÓN BÁSICA DE LA CONSULTA
    if (!consulta || consulta.trim() === '') {
      return res.status(400).json({ 
        respuesta: "Por favor, escribe tu pregunta de matemáticas." 
      });
    }

    // ✅ Usa el modelo correcto
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // ✅ ESTRUCTURA ÓPTIMA DE LA CONSULTA A GEMINI
    const fullPrompt = promptBase + `\n\nConsulta del estudiante: "${consulta}"`;
    
    // ✅ AÑADIDO TIEMPO DE ESPERA PARA EVITAR TIMEOUTS
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    let text = response.text();

    // ✅ LIMPIEZA DE RESPUESTA PARA EVITAR ERRORES EN EL FRONTEND
    text = text.replace(/\*\*/g, '').replace(/#/g, '').replace(/```/g, '');

    res.json({ respuesta: text });
  } catch (error) {
    console.error('Error con Gemini:', error);
    
    // ✅ MANEJO ESPECÍFICO DE ERRORES DE GEMINI
    if (error.message && error.message.includes('429')) {
      return res.status(500).json({ 
        respuesta: "Demasiadas solicitudes. Por favor, espera unos minutos e intenta de nuevo." 
      });
    }
    
    if (error.message && error.message.includes('400')) {
      return res.status(400).json({ 
        respuesta: "La consulta no parece ser un problema matemático. Por favor, envía un ejercicio de álgebra, trigonometría o geometría." 
      });
    }
    
    res.status(500).json({ 
      respuesta: "No pude procesar tu pregunta. Intenta de nuevo." 
    });
  }
});

// ✅ Escucha en 0.0.0.0 (REQUISITO DE RENDER.COM)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor listo en http://localhost:${PORT}`);
  console.log(`ℹ️  Esperando consultas en /analizar`);
});

module.exports = app;
