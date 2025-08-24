// server.js
import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();

// 🔹 Usa el puerto de Render (por defecto 10000)
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Sirve index.html, CSS, JS, etc.

// 🔑 Tu API Key de Gemini
const API_KEY = 'AIzaSyCuRbKPJ5xFrq3eDFgltITbZqqeHph8LFg';
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// === PROMPT ESPECIALIZADO PARA ESTUDIANTES CON DÉFICIT DE ATENCIÓN ===
function crearPrompt(texto, tieneImagen) {
    return `
Actúa como MatyMat-01, un tutor experto en matemáticas especializado en estudiantes con déficit de atención. Tu objetivo es enseñar con claridad, paciencia y técnicas pedagógicas efectivas.

**Instrucciones estrictas:**
1. Usa un tono amable, claro y motivador.
2. Divide las respuestas en pasos numerados (máximo 5).
3. Usa emojis para enfatizar ideas (✅, ➡️, 📝, 💡).
4. Si hay una imagen, analízala con precisión y explica el ejercicio paso a paso.
5. Evita párrafos largos. Usa frases cortas y directas.
6. Después de cada paso, haz una pregunta breve: "¿Sigues bien?", "¿Quieres que repita algo?"
7. Refuerza positivamente: "¡Muy bien!", "Vas excelente", "Perfecto, continuemos".
8. Si el problema es complejo, ofrece un ejemplo más simple primero.
9. Termina con una pregunta de cierre: "¿Tienes otra duda?" o "¿Quieres practicar uno similar?"

**Consulta del estudiante:**
${tieneImagen ? 'Analiza la imagen y el texto.' : ''} ${texto}

Responde como MatyMat-01, no como una IA genérica.
`.trim();
}

// Ruta para analizar texto o imagen
app.post('/analizar', async (req, res) => {
    const { text, image, mimeType = 'image/jpeg' } = req.body;

    if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Consulta inválida o vacía' });
    }

    try {
        let result;

        if (image && typeof image === 'string') {
            const imgData = {
                inlineData: { image, mimeType }
            };
            const prompt = crearPrompt(text, true);
            result = await model.generateContent([prompt, imgData]);
        } else {
            const prompt = crearPrompt(text, false);
            result = await model.generateContent(prompt);
        }

        const response = await result.response;
        const respuesta = response.text();
        res.json({ respuesta });

    } catch (error) {
        console.error('❌ Error con Gemini:', error.message || error);
        if (error.message?.includes('API key')) {
            return res.status(500).json({ error: 'Error de autenticación con Gemini' });
        }
        if (error.message?.includes('quota')) {
            return res.status(500).json({ error: 'Límite de uso alcanzado. Intenta más tarde.' });
        }
        if (error.message?.includes('safety') || error.message?.includes('content')) {
            return res.status(400).json({
                respuesta: 'No puedo responder eso, pero estoy aquí para ayudarte con matemáticas.'
            });
        }
        return res.status(500).json({ error: 'No pude procesar tu pregunta. Intenta de nuevo.' });
    }
});

// ✅ Escucha en 0.0.0.0 y en el puerto correcto
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor listo en http://0.0.0.0:${PORT}`);
    console.log(`🌐 Tu app está disponible en: https://matymat01.onrender.com`);
});

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err.message || err);
});
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err.message || err);
});
