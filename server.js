// server.js
import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { crearPrompt } from './prompt.js'; // ← Importamos el prompt experto

const app = express();
const PORT = process.env.PORT || 5050;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Sirve archivos estáticos

// 🔑 PEGA TU API KEY DE GEMINI AQUÍ
const API_KEY = 'AIzaSyCuRbKPJ5xFrq3eDFgltITbZqqeHph8LFg'; // ← Reemplaza con tu clave real
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Ruta principal: analiza texto o imagen
app.post('/analizar', async (req, res) => {
    const { text, image, mimeType = 'image/jpeg' } = req.body;

    // Validación
    if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Consulta inválida o vacía' });
    }

    try {
        let result;

        if (image && typeof image === 'string') {
            // Con imagen
            const imgData = {
                inlineData: { data: image, mimeType }
            };
            const prompt = crearPrompt(text, true);
            result = await model.generateContent([prompt, imgData]);
        } else {
            // Solo texto
            const prompt = crearPrompt(text);
            result = await model.generateContent(prompt);
        }

        // Obtener respuesta
        const response = await result.response;
        const respuesta = response.text();

        res.json({ respuesta });

    } catch (error) {
        console.error('Error con Gemini:', error.message || error);

        if (error.message?.includes('API key')) {
            return res.status(500).json({ error: 'Error de autenticación con Gemini' });
        }
        if (error.message?.includes('quota')) {
            return res.status(500).json({ error: 'Límite de uso alcanzado. Intenta en unos minutos.' });
        }
        if (error.message?.includes('safety') || error.message?.includes('content')) {
            return res.status(400).json({
                respuesta: 'No puedo responder eso, pero estoy aquí para ayudarte con matemáticas. ¿Quieres intentar con un ejercicio?'
            });
        }

        return res.status(500).json({
            error: 'No pude procesar tu pregunta. Intenta de nuevo.'
        });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`✅ Servidor listo en http://localhost:${PORT}`);
    console.log('Abre tu app en: http://localhost:5050');
});

// Evitar que el servidor se caiga
process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err.message || err);
});
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err.message || err);

});
