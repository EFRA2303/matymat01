const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { crearPrompt } = require('./prompt.js');
require('dotenv').config();

const app = express();
app.use(express.static('.'));
app.use(express.json());

const PORT = process.env.PORT || 10000;
const genAI = new GoogleGenerativeAI(process.env.API_KEY);

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
    const fullPrompt = crearPrompt(consulta);
    
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    let text = response.text();

    // Limpieza mínima
    text = text.replace(/\*\*/g, '').replace(/#/g, '');

    res.json({ respuesta: text });
  } catch (error) {
    console.error('Error con Gemini:', error);
    res.status(500).json({ 
      respuesta: "No pude procesar tu pregunta. Intenta de nuevo." 
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor listo en http://localhost:${PORT}`);
});

module.exports = app;

