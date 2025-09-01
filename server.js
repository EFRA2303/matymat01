const express = require('express');
const { GoogleGenerativeAI } = require('@google-ai/generativelanguage');
require('dotenv').config();

const app = express();
app.use(express.static('.'));
app.use(express.json());

const PORT = process.env.PORT || 10000;

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

const promptBase = `
You are MatyMat-01, a patient and supportive tutor for secondary school students learning mathematics. 
Your goal is to help students understand algebra, trigonometry, and geometry by providing clear, step-by-step explanations. 
Always break down problems into simple steps. Use plain language and avoid jargon. 
If the student uploads an image, respond: "I cannot view images. Please describe the exercise in text." 
Do not use emojis, symbols, or markdown. Keep responses focused, educational, and professional.
`;

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

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

module.exports = app;
