// server.js
import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());
app.use(express.static('.')); 

// 🔑 API Gemini
const API_KEY = 'AIzaSyCuRbKPJ5xFrq3eDFgltITbZqqeHph8LFg';
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

/**
 * 🧹 Limpieza de texto para que el tutor no lea símbolos raros
 * - Elimina **negritas** de Markdown
 * - Elimina *cursivas*
 * - Elimina > citas
 * - Reemplaza flechas y emojis por palabras amigables
 */
function limpiarTexto(texto) {
    return texto
        // Quitar asteriscos de negrita/cursiva
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        // Quitar guiones de listas
        .replace(/^- /gm, '')
        // Quitar citas con ">"
        .replace(/^>+/gm, '')
        // Reemplazar flechas
        .replace(/➡️|→/g, ' sigue con ')
        // Emojis comunes a palabras
        .replace(/✅/g, ' correcto ')
        .replace(/📝/g, ' nota ')
        .replace(/💡/g, ' idea ')
        .replace(/🔥/g, ' importante ')
        // Quitar espacios duplicados
        .replace(/\s+/g, ' ')
        .trim();
}

// === PROMPT ===
function crearPrompt(texto, tieneImagen) {
    return `
Eres MatyMat-01, un tutor de matemáticas en Bolivia. 
Habla de forma natural, clara y amigable, como un profesor de secundaria. 
No leas símbolos de formato como asteriscos o flechas, solo explica de manera sencilla. 
Usa frases cortas y preguntas breves para mantener la atención.

Consulta del estudiante:
${tieneImagen ? 'Analiza la imagen y el texto.' : ''} ${texto}
`.trim();
}

// === RUTA PRINCIPAL ===
app.post('/analizar', async (req, res) => {
    const { text, image, mimeType = 'image/jpeg' } = req.body;

    if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Consulta inválida o vacía' });
    }

    try {
        let result;
        const prompt = crearPrompt(text, !!image);

        if (image && typeof image === 'string') {
            const imgData = { inlineData: { image, mimeType } };
            result = await model.generateContent([prompt, imgData]);
        } else {
            result = await model.generateContent(prompt);
        }

        const response = await result.response;
        let respuesta = response.text();

        // 🔹 Limpiar antes de enviar al tutor
        respuesta = limpiarTexto(respuesta);

        res.json({ respuesta });

    } catch (error) {
        console.error('❌ Error con Gemini:', error.message || error);
        return res.status(500).json({ error: 'No pude procesar tu pregunta. Intenta de nuevo.' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor en http://0.0.0.0:${PORT}`);
});

