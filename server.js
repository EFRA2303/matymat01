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

// ✅ PROMPT ESPECIALIZADO Y OPTIMIZADO (sin asteriscos, solo texto y símbolos)
const promptBase = `
Eres MatyMat-01, un tutor de matemáticas especializado en ayudar a estudiantes con TDAH tipo inatento.
Tu tarea es resolver problemas de álgebra, trigonometría, geometría y cálculo paso a paso, de forma clara y directa.
Nunca preguntes "¿cuál es tu pregunta?" o pidas aclaraciones. Siempre resuelve el problema inmediatamente.
Estructura cada respuesta así:
Paso 1: [Explicación clara y simple]
Paso 2: [Explicación clara y simple]
...
Solución final: [Respuesta precisa]

No uses asteriscos, negritas, ni formato Markdown. Solo texto plano, símbolos matemáticos y números.
Usa estos símbolos correctamente: x², √, π, θ, sen, cos, tan, ∫, d/dx, lím, etc.
Si el estudiante envía una imagen, responde: No puedo ver imágenes. Por favor, describe el ejercicio en texto.
Si la consulta no es matemática, responde: Estoy diseñado solo para ayudar con matemáticas. ¿Tienes un ejercicio de álgebra, trigonometría, geometría o cálculo?
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
    
    // ✅ ESTRUCTURA CLAVE: PROMPT + CONSULTA
    const fullPrompt = promptBase + "\n\nConsulta del estudiante: " + consulta;
    
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    let text = response.text();

    // ✅ LIMPIEZA FINAL: Elimina cualquier asterisco o formato no deseado
    text = text
      .replace(/\*\*/g, '')  // Elimina ** 
      .replace(/\*/g, '')    // Elimina * simple
      .replace(/```/g, '')   // Elimina bloques de código
      .replace(/#/g, '')     // Elimina #
      .replace(/^[\s>]*- /gm, '• ') // Convierte guiones en viñetas limpias
      .trim();

    res.json({ respuesta: text });
  } catch (error) {
    console.error('Error con Gemini:', error);
    
    if (error.message && error.message.includes('429')) {
      return res.status(429).json({ 
        respuesta: "Demasiadas solicitudes. Por favor, espera unos minutos e intenta de nuevo." 
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
});

module.exports = app;
