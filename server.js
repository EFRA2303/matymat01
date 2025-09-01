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

// ✅ PROMPT MÍNIMO, CLARO Y OBLIGATORIO (funciona en producción)
const promptBase = `
Eres un tutor de matemáticas. Resuelve inmediatamente cualquier problema matemático que el estudiante te envíe.
Nunca preguntes "¿cuál es tu pregunta?" o pidas aclaraciones.
Siempre responde paso a paso:
Paso 1: [Explicación clara]
Paso 2: [Explicación clara]
...
Solución final: [Respuesta]

Si la consulta no es matemática, responde: "Solo ayudo con problemas de matemáticas."
`;

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.post('/analizar', async (req, res) => {
  try {
    const { consulta } = req.body;
    
    if (!consulta || consulta.trim() === '') {
      return res.status(400).json({ 
        respuesta: "Por favor, escribe tu pregunta de matemáticas." 
      });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // ✅ ESTRUCTURA CRÍTICA: PROMPT + CONSULTA
    const fullPrompt = promptBase + "\n\nConsulta del estudiante: " + consulta;
    
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    let text = response.text();

    // ✅ Limpieza mínima: elimina asteriscos, #, etc.
    text = text.replace(/\*\*/g, '').replace(/#/g, '').replace(/```/g, '');

    res.json({ respuesta: text });
  } catch (error) {
    console.error('Error con Gemini:', error);
    res.status(500).json({ 
      respuesta: "No pude procesar tu pregunta. Intenta de nuevo." 
    });
  }
});

// ✅ Escucha en 0.0.0.0 (REQUISITO DE RENDER.COM)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor listo en http://localhost:${PORT}`);
});

module.exports = app;
