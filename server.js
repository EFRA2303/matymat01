import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import math from 'mathjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static('.'));
app.use(express.json({ limit: '10mb' }));
const PORT = process.env.PORT || 10000;

// Cache simple
const responseCache = new Map();
const CACHE_TIMEOUT = 300000; // 5 minutos

// ✅ PROMPT OPTIMIZADO
const promptBase = `Eres un tutor matemático especializado en TDAH. Resuelve inmediatamente sin preguntas. Responde siempre paso a paso. Si no es matemáticas: "Solo ayudo con matemáticas."`;

// Verificar que API_KEY esté presente
if (!process.env.API_KEY) {
    console.error('❌ ERROR: API_KEY no está definida en las variables de entorno');
    console.log('💡 En Render, ve a Dashboard -> Tu servicio -> Environment -> Add Environment Variable');
} else {
    console.log('✅ API_KEY cargada correctamente');
}

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

// Middleware para CORS (importante para Render)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    next();
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// === ENDPOINT PRINCIPAL OPTIMIZADO ===
app.post('/analizar', async (req, res) => {
    try {
        // Verificar API_KEY primero
        if (!process.env.API_KEY) {
            return res.status(500).json({ 
                respuesta: "Error de configuración del servidor. Contacta al administrador." 
            });
        }

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
            generationConfig: { 
                maxOutputTokens: 1024, 
                temperature: 0.7 
            }
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
        console.error('Error en /analizar:', error.message);
        res.status(500).json({ 
            respuesta: "Error procesando tu pregunta. Intenta nuevamente." 
        });
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
        console.error('Error en /graficar:', error.message);
        res.status(500).json({ error: "Error generando gráfica. Verifica la función." });
    }
});

// Health check para Render
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        message: 'Servidor funcionando correctamente',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        geminiVersion: '0.24.1'
    });
});

// Ruta de información del sistema
app.get('/info', (req, res) => {
    res.status(200).json({
        name: 'Natymat Tutor Matemático',
        version: '1.0.0',
        description: 'Tutor virtual especializado en TDAH',
        dependencies: {
            gemini: '0.24.1',
            express: '^4.18.2',
            mathjs: '^14.6.0'
        },
        environment: {
            port: PORT,
            nodeVersion: process.version,
            platform: process.platform
        }
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor Natymat iniciado en puerto ${PORT}`);
    console.log(`📚 Versión Gemini AI: 0.24.1`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log(`📊 Info del sistema: http://localhost:${PORT}/info`);
    
    if (!process.env.API_KEY) {
        console.warn('⚠️  ADVERTENCIA: API_KEY no configurada');
    } else {
        console.log('✅ API_KEY configurada correctamente');
    }
});

export default app;

