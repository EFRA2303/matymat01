const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { crearPrompt } = require('./prompt.js'); // ✅ Importa el prompt
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
    
    // ✅ Usa el prompt especializado desde prompt.js
    const fullPrompt = crearPrompt(consulta);
    
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    let text = response.text();

    // Limpieza de formato para evitar problemas en el frontend
    text = text.replace(/\*\*/g, '').replace(/#/g, '').replace(/```/g, '');

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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor listo en http://localhost:${PORT}`);
});

module.exports = app;
