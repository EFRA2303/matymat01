const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const math = require('mathjs');
require('dotenv').config();

const app = express();
app.use(express.static('.'));
app.use(express.json({ limit: '10mb' }));
const PORT = process.env.PORT || 10000;

// Cache simple
const responseCache = new Map();
const CACHE_TIMEOUT = 300000; // 5 minutos

// ✅ PROMPT OPTIMIZADO
const promptBase = `Eres un tutor matemático especializado en TDAH. Resuelve inmediatamente sin preguntas. Responde siempre paso a paso. Si no es matemáticas: "Solo ayudo con matemáticas."`;

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

// === GENERACIÓN RÁPIDA DE GRÁFICAS ===
function generarDatosGrafica(funcion, xMin = -10, xMax = 10, puntos = 80) {
    const datos = [];
    const paso = (xMax - xMin) / puntos;
    
    try {
        const compiledFunc = math.compile(funcion);
        
        for (let i = 0; i <= puntos; i++) {
            const x = xMin + (i * paso);
            try {
                const y = compiledFunc.evaluate({ x: x });
                if (isFinite(y)) {
                    datos.push({ 
                        x: Math.round(x * 100) / 100, 
                        y: Math.round(y * 100) / 100 
                    });
                }
            } catch (e) {
                continue;
            }
        }
    } catch (error) {
        throw new Error("Función no válida");
    }
    
    return datos;
}

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// === ENDPOINT PRINCIPAL OPTIMIZADO ===
app.post('/analizar', async (req, res) => {
    try {
        const { text, consulta } = req.body;
        const input = (text || consulta || '').trim().substring(0, 500);
        
        if (!input) {
            return res.status(400).json({ respuesta: "Escribe tu pregunta matemática." });
        }

        // Verificar cache
        const cacheKey = input.toLowerCase().replace(/\s+/g, '');
        if (responseCache.has(cacheKey)) {
            const cached = responseCache.get(cacheKey);
            if (Date.now() - cached.timestamp < CACHE_TIMEOUT) {
                return res.json(cached.response);
            }
            responseCache.delete(cacheKey);
        }

        const model = genAI.getGenerativeModel({ 
            model: 'gemini-1.5-flash',
            generationConfig: { maxOutputTokens: 1024, temperature: 0.7 }
        });
        
        const result = await model.generateContent(promptBase + "\n\nConsulta: " + input);
        const response = await result.response;
        let textResponse = response.text().replace(/\*\*/g, '').replace(/#/g, '');
        
        const respuesta = { respuesta: textResponse };
        
        // Almacenar en cache
        responseCache.set(cacheKey, {
            response: respuesta,
            timestamp: Date.now()
        });
        
        res.json(respuesta);
    } catch (error) {
        console.error('Error optimizado:', error.message);
        res.status(500).json({ respuesta: "Error procesando tu pregunta." });
    }
});

// === ENDPOINT GRÁFICAS OPTIMIZADO ===
app.post('/graficar', async (req, res) => {
    try {
        const { funcion, xMin = -10, xMax = 10 } = req.body;
        
        if (!funcion || funcion.length > 100) {
            return res.status(400).json({ error: "Función no válida" });
        }
        
        const datos = generarDatosGrafica(funcion, parseFloat(xMin), parseFloat(xMax), 80);
        
        res.json({
            success: true,
            datos: datos,
            funcion: funcion
        });
    } catch (error) {
        res.status(500).json({ error: "Error generando gráfica" });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor optimizado en puerto ${PORT}`);
});

module.exports = app;

