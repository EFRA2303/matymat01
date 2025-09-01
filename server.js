const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai'); // ✅ Correcto
require('dotenv').config();

const app = express();
app.use(express.static('.'));
app.use(express.json());

const PORT = process.env.PORT || 10000;

// Inicializar Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.API_KEY);

// Prompt especializado
const promptBase = `
You are MatyMat-01, a patient and supportive tutor for secondary school students learning mathematics.
Provide clear, step-by-step explanations. Avoid jargon. Do not use emojis or markdown.
`;

app.post('/analizar', async (req, res) => {
  try {
    const { consulta } = req.body;
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent(promptBase + "\n\nStudent query: " + consulta);
    const response = await result.response;
    const text = response.text();

    res.json({ respuesta: text });
  } catch (error) {
    console.error('Error with Gemini:', error);
    res.status(500).json({ 
      respuesta: "The system could not process your query. Please try again later." 
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server ready at http://localhost:${PORT}`);
});
