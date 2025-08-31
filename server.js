// server.js - MatyMat-01 (Versión depurada)
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Importar funciones personalizadas
const { crearPrompt, limpiarTexto, detectarTema } = require('./prompt.js');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// 🔑 API Gemini
const API_KEY = process.env.GEMINI_API_KEY; // Usa variable de entorno
if (!API_KEY) {
  console.error('❌ GEMINI_API_KEY no está definida');
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Almacenamiento en memoria del historial
const conversaciones = {};

function obtenerConversacion(usuarioId) {
  if (!conversaciones[usuarioId]) {
    conversaciones[usuarioId] = { historial: [], temaActual: null };
  }
  return conversaciones[usuarioId];
}

function generarIdUnico() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function limpiarTextoServidor(texto) {
  return texto
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/^- /gm, '')
    .replace(/^>+/gm, '')
    .replace(/➡️|→/g, ' sigue con ')
    .replace(/✅/g, ' correcto ')
    .replace(/📝/g, ' nota ')
    .replace(/💡/g, ' idea ')
    .replace(/🔥/g, ' importante ')
    .replace(/😊|👍|😢|🤔|💡|✅|❌|📝/g, (match) => match)
    .replace(/[^\p{L}\p{N}\p{P}\p{Z}\n😊👍😢🤔💡✅❌📝]/gu, "")
    .replace(/\s+/g, ' ')
    .trim();
}

// === RUTA PRINCIPAL ===
app.post('/analizar', async (req, res) => {
  const { text, image, mimeType = 'image/jpeg', usuarioId } = req.body;

  console.log('📩 /analizar recibido:', { text: !!text, image: !!image, usuarioId }); // LOG

  if (!text || typeof text !== 'string') {
    console.log('❌ Texto inválido:', text);
    return res.status(400).json({ error: 'Consulta inválida o vacía' });
  }

  const conversacion = obtenerConversacion(usuarioId || 'default');

  try {
    let result;
    const prompt = `
Eres MatyMat-01, un tutor de matemáticas en Bolivia con 15 años de experiencia.
Explica paso a paso, con lenguaje claro y motivador.
Tema actual: ${conversacion.temaActual || 'No determinado'}
Consulta del estudiante: ${text}
    `.trim();

    console.log('📝 Prompt enviado a Gemini:', prompt); // LOG

    if (image && typeof image === 'string') {
      const imgData = { inlineData: { data: image, mimeType } };
      result = await model.generateContent([prompt, imgData]);
    } else {
      result = await model.generateContent(prompt);
    }

    const response = await result.response;
    let respuesta = response.text();

    console.log('🟢 Respuesta de Gemini:', respuesta); // LOG

    // Limpiar respuesta
    respuesta = limpiarTextoServidor(respuesta);

    // Actualizar historial
    conversacion.historial.push({ rol: 'estudiante', mensaje: text });
    conversacion.historial.push({ rol: 'tutor', mensaje: respuesta });

    // Detectar tema
    conversacion.temaActual = detectarTema(text);

    // Dividir en pasos si es necesario
    const pasos = respuesta.includes('Paso') ? respuesta.split('Paso').filter(p => p.trim()).map(p => 'Paso' + p) : [respuesta];

    res.json({
      pasos,
      tema: conversacion.temaActual,
      conversationId: usuarioId || 'default'
    });

  } catch (error) {
    console.error('❌ Error con Gemini:', error.message || error); // LOG DEL ERROR REAL
    console.error('❌ Stack:', error.stack);
    return res.status(500).json({
      error: 'No pude procesar tu pregunta. Intenta de nuevo.'
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor listo en http://0.0.0.0:${PORT}`);
});



