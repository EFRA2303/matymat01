const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai'); // ✅ Correcto
require('dotenv').config();

const app = express();
app.use(express.static('.'));
app.use(express.json());

// ✅ Usa el puerto de Render
const PORT = process.env.PORT || 10000;

// ✅ Inicializa Gemini con tu API Key
const genAI = new GoogleGenerativeAI(process.env.API_KEY);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.post('/analizar', async (req, res) => {
  try {
    const { consulta } = req.body;
    
    // ✅ Usa el modelo correcto
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // ✅ Prompt simple y seguro
    const prompt = `
      Eres un tutor de matemáticas. Responde de forma clara y paso a paso.
      No uses emojis ni markdown.
      Pregunta: ${consulta}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ respuesta: text });
  } catch (error) {
    console.error('Error con Gemini:', error.message); // ✅ Muestra el error real
    res.status(500).json({ 
      respuesta: "No pude procesar tu pregunta. Intenta de nuevo." 
    });
  }
});

// ✅ Escucha en 0.0.0.0
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor listo en http://localhost:${PORT}`);
});
