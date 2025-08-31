import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
const PORT = process.env.PORT || 10000;

// ================= CONFIGURACIÓN =================
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('.'));

// 🔐 Validación de API Key
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY || API_KEY.includes('AIzaSyB0oqyQ_x9tcmeJV-kmnVXp0TQQvzXVY1E')) {
    console.error('❌ ERROR: API Key no configurada o es la ejemplo');
    console.error('❌ Configura GEMINI_API_KEY en Render con tu key real');
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// ================= MANEJO DE PROMPT.JS =================
let crearPrompt, limpiarTexto;

try {
    const promptModule = await import('./prompt.js');
    crearPrompt = promptModule.crearPrompt;
    limpiarTexto = promptModule.limpiarTexto;
    console.log('✅ prompt.js cargado correctamente');
} catch (error) {
    console.warn('⚠️ prompt.js no encontrado, usando funciones alternativas');
    
    // Funciones de respaldo
    crearPrompt = (texto, tieneImagen = false) => 
        `Eres un tutor de matemáticas. Responde: ${texto}${tieneImagen ? ' (incluye imagen)' : ''}`;
    
    limpiarTexto = (texto) => texto || '';
}

// ================= RUTAS =================

// 🏠 Health Check para Render
app.get('/', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Tutor MatyMat-01 funcionando',
        hasValidApiKey: !!API_KEY && !API_KEY.includes('AIzaSyB0oqyQ_x9tcmeJV-kmnVXp0TQQvzXVY1E'),
        timestamp: new Date().toISOString()
    });
});

// 🔍 Ruta para probar Gemini
app.get('/prueba-gemini', async (req, res) => {
    try {
        const result = await model.generateContent("Responde 'OK' si estás funcionando");
        const response = await result.response;
        res.json({
            status: 'OK',
            message: 'Conexión con Gemini exitosa',
            response: response.text()
        });
    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            message: 'Error con Gemini API',
            error: error.message,
            apiKeyConfigured: !!API_KEY
        });
    }
});

// 📨 Ruta principal del chatbot
app.post('/analizar', async (req, res) => {
    console.log('📨 Solicitud recibida en /analizar');
    
    const { text, image, mimeType = 'image/jpeg' } = req.body;
    
    // Validación básica
    if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Consulta inválida o vacía' });
    }
    
    try {
        console.log('🔧 Procesando pregunta:', text.substring(0, 50) + '...');
        
        const prompt = crearPrompt(text, !!image);
        let result;
        
        if (image && typeof image === 'string') {
            console.log('🖼️ Procesando con imagen...');
            const imgData = { inlineData: { image, mimeType } };
            result = await model.generateContent([prompt, imgData]);
        } else {
            console.log('📝 Procesando solo texto...');
            result = await model.generateContent(prompt);
        }
        
        const response = await result.response;
        let respuesta = response.text();
        
        console.log('✅ Respuesta recibida de Gemini');
        
        // Limpiar y estructurar respuesta
        respuesta = limpiarTexto(respuesta);
        const pasos = respuesta.split(/\n(?=Paso \d+:|\[CONCLUSION\])/);
        
        res.json({
            pasos: pasos.map(paso => paso.trim()),
            tema: detectarTema(text) // Función simplificada aquí mismo
        });
        
    } catch (error) {
        console.error('❌ Error con Gemini:', error.message);
        res.status(500).json({ 
            error: 'No pude procesar tu pregunta. Intenta de nuevo.'
        });
    }
});

// ================= FUNCIONES AUXILIARES =================

// 🎯 Función simplificada para detectar tema (evita duplicación)
function detectarTema(texto) {
    if (!texto) return 'Matemáticas generales';
    const textoLower = texto.toLowerCase();
    
    if (textoLower.includes('sen') || textoLower.includes('cos') || textoLower.includes('tan')) return 'Trigonometría';
    if (textoLower.includes('límite') || textoLower.includes('derivada') || textoLower.includes('integral')) return 'Cálculo';
    if (textoLower.includes('triángulo') || textoLower.includes('círculo') || textoLower.includes('área')) return 'Geometría';
    if (textoLower.includes('ecuación') || textoLower.includes('función') || textoLower.includes('variable')) return 'Álgebra';
    
    return 'Matemáticas generales';
}

// ================= INICIAR SERVIDOR =================
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor en http://0.0.0.0:${PORT}`);
    console.log(`🔧 Entorno: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔑 API Key configurada: ${!!API_KEY}`);
    console.log(`🔑 API Key válida: ${!!API_KEY && !API_KEY.includes('AIzaSyB0oqyQ_x9tcmeJV-kmnVXp0TQQvzXVY1E')}`);
});
