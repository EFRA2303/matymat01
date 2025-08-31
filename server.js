// server.js
import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
const PORT = process.env.PORT || 5050;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// 🔑 Reemplaza con tu API Key de Gemini
const API_KEY = 'AIzaSyCuRbKPJ5xFrq3eDFgltITbZqqeHph8LFg'; // ← Pégala aquí
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Ruta para analizar texto o imagen
app.post('/analizar', async (req, res) => {
    const { text, image, mimeType = 'image/jpeg' } = req.body;

    if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Consulta inválida' });
    }

    try {
        let result;

        if (image && typeof image === 'string') {
            const imgData = {
                inlineData: { image, mimeType }
            };
            result = await model.generateContent([text, imgData]);
        } else {
            result = await model.generateContent(text);
        }

        const response = await result.response;
        const respuesta = response.text();
        res.json({ respuesta });

    } catch (error) {
        console.error('Error con Gemini:', error.message || error);

        if (error.message?.includes('API key')) {
            return res.status(500).json({ error: 'Error de autenticación' });
        }
        if (error.message?.includes('quota')) {
            return res.status(500).json({ error: 'Límite de uso alcanzado' });
        }
        if (error.message?.includes('safety') || error.message?.includes('content')) {
            return res.status(400).json({
                respuesta: 'No puedo responder eso, pero estoy aquí para ayudarte con matemáticas.'
            });
        }

        return res.status(500).json({ error: 'No pude procesar tu pregunta' });
    }
});

// ✅ Escucha en 0.0.0.0 para Render
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor listo en http://localhost:${PORT}`);
});

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err.message || err);
});
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err.message || err);
});