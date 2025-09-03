// server.js - Versión corregida para Render
import express from 'express';
import dotenv from 'dotenv';

// Configuración inicial de logging
console.log('🚀 Iniciando servidor Natymat...');
console.log('📦 Versión de Node.js:', process.version);

// Cargar variables de entorno
dotenv.config();

const PORT = process.env.PORT || 10000;

console.log('🔍 Variables de entorno:');
console.log('PORT:', PORT);
console.log('API_KEY presente:', !!process.env.API_KEY);

// Importaciones condicionales para evitar errores de inicialización
let genAI;
let math;

try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    genAI = new GoogleGenerativeAI(process.env.API_KEY || 'dummy-key');
    console.log('✅ GoogleGenerativeAI importado correctamente');
} catch (error) {
    console.error('❌ Error importando GoogleGenerativeAI:', error.message);
    // No salimos del proceso, continuamos sin Gemini
}

try {
    math = await import('mathjs');
    console.log('✅ mathjs importado correctamente');
} catch (error) {
    console.error('❌ Error importando mathjs:', error.message);
    // Continuamos sin mathjs
}

const app = express();

// Middleware básico
app.use(express.json({ limit: '10mb' }));
app.use(express.static('.'));

// Cache simple
const responseCache = new Map();
const CACHE_TIMEOUT = 300000;

// ✅ PROMPT OPTIMIZADO
const promptBase = `Eres un tutor matemático especializado en TDAH. Resuelve inmediatamente sin preguntas. Responde siempre paso a paso. Si no es matemáticas: "Solo ayudo con matemáticas."`;

// === GENERACIÓN RÁPIDA DE GRÁFICAS ===
function generarDatosGrafica(funcion, xMin = -10, xMax = 10, puntos = 80) {
    if (!math) {
        throw new Error("MathJS no está disponible");
    }
    
    const datos = [];
    const paso = (xMax - xMin) / puntos;
    
    try {
        const compiledFunc = math.default.compile(funcion);
        
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

// Middleware para CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    next();
});

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Natymat Tutor Matemático</title>
            <meta charset="UTF-8">
        </head>
        <body>
            <h1>Natymat Tutor Matemático</h1>
            <p>Servidor funcionando correctamente</p>
            <p>Visita el frontend para usar el tutor</p>
        </body>
        </html>
    `);
});

// === ENDPOINT PRINCIPAL ===
app.post('/analizar', async (req, res) => {
    try {
        if (!genAI) {
            return res.status(503).json({ 
                respuesta: "Servicio de IA no disponible. Verifica la configuración del API_KEY." 
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

// === ENDPOINT GRÁFICAS ===
app.post('/graficar', async (req, res) => {
    try {
        if (!math) {
            return res.status(503).json({ error: "MathJS no disponible" });
        }

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

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        message: 'Servidor funcionando correctamente',
        timestamp: new Date().toISOString(),
        geminiAvailable: !!genAI,
        mathjsAvailable: !!math
    });
});

// Info del sistema
app.get('/info', (req, res) => {
    res.status(200).json({
        name: 'Natymat Tutor Matemático',
        version: '1.0.0',
        status: 'operational',
        dependencies: {
            gemini: genAI ? 'disponible' : 'no disponible',
            mathjs: math ? 'disponible' : 'no disponible'
        }
    });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor Natymat iniciado exitosamente en puerto ${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log(`📊 Info del sistema: http://localhost:${PORT}/info`);
    
    if (!process.env.API_KEY) {
        console.warn('⚠️  ADVERTENCIA: API_KEY no configurada - Gemini AI no funcionará');
    }
});

// Manejo de errores
process.on('uncaughtException', (error) => {
    console.error('❌ Error no capturado:', error.message);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promise rechazada:', reason);
});

export default app;

