import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { crearPrompt, limpiarTexto } from './prompt.js'; // Importamos funciones de prompt.js

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
 * - Reemplaza flechas y emojis no deseados por palabras amigables
 * - Conserva emojis motivadores específicos
 */
function limpiarTextoServidor(texto) {
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
        // Emojis comunes a palabras (excepto los permitidos)
        .replace(/✅/g, ' correcto ')
        .replace(/📝/g, ' nota ')
        .replace(/💡/g, ' idea ')
        .replace(/🔥/g, ' importante ')
        // Conservar emojis motivadores permitidos
        .replace(/😊|👍|😢|🤔|💡|✅|❌|📝/g, (match) => match)
        // Quitar cualquier otro emoji o símbolo extraño
        .replace(/[^\p{L}\p{N}\p{P}\p{Z}\n😊👍😢🤔💡✅❌📝]/gu, "")
        // Quitar espacios duplicados
        .replace(/\s+/g, ' ')
        .trim();
}

// === RUTA PRINCIPAL ===
app.post('/analizar', async (req, res) => {
    const { text, image, mimeType = 'image/jpeg' } = req.body;
    if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Consulta inválida o vacía' });
    }
    try {
        let result;
        const prompt = crearPrompt(text, !!image); // Usamos la función de prompt.js
        
        if (image && typeof image === 'string') {
            const imgData = { inlineData: { image, mimeType } };
            result = await model.generateContent([prompt, imgData]);
        } else {
            result = await model.generateContent(prompt);
        }
        
        const response = await result.response;
        let respuesta = response.text();
        
        // 🔹 Limpiar antes de enviar al tutor
        respuesta = limpiarTextoServidor(respuesta);
        
        // Estructurar la respuesta en pasos separados
        const pasos = respuesta.split(/\n(?=Paso \d+:|\[CONCLUSION\])/);
        
        res.json({ 
            pasos: pasos.map(paso => paso.trim()),
            tema: detectarTema(text)
        });
    } catch (error) {
        console.error('❌ Error con Gemini:', error.message || error);
        return res.status(500).json({ error: 'No pude procesar tu pregunta. Intenta de nuevo.' });
    }
});

// Función para detectar el tema (repetida aquí para evitar importaciones circulares)
function detectarTema(texto) {
    texto = texto.toLowerCase();
    if (texto.includes('sen') || texto.includes('cos') || texto.includes('tan') || texto.includes('trigonométrica')) return 'Trigonometría';
    if (texto.includes('límite') || texto.includes('derivada') || texto.includes('integral') || texto.includes('∫') || texto.includes('d/dx')) return 'Cálculo';
    if (texto.includes('triángulo') || texto.includes('círculo') || texto.includes('área') || texto.includes('volumen')) return 'Geometría';
    if (texto.includes('x²') || texto.includes('ecuación') || texto.includes('inecuación') || texto.includes('función')) return 'Álgebra';
    return 'Matemáticas generales';
}

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor en http://0.0.0.0:${PORT}`);
});


