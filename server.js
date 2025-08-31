import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
const PORT = process.env.PORT || 10000;

// Configuración de CORS para producción
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://tu-app-name.onrender.com', 'http://localhost:3000'] 
        : '*',
    credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('.'));

// 🔑 API Gemini - usa variable de entorno
const API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyCuRbKPJ5xFrq3eDFgltITbZqqeHph8LFg';
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Ruta de health check para Render
app.get('/', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Servidor de Tutor MatyMat-01 funcionando',
        timestamp: new Date().toISOString()
    });
});

// Ruta de verificación de API
app.get('/api/status', async (req, res) => {
    try {
        // Intenta una consulta simple para verificar la API
        const result = await model.generateContent("Hola, responde 'OK' si estás funcionando");
        const response = await result.response;
        res.json({ 
            gemini_status: 'OK', 
            response: response.text() 
        });
    } catch (error) {
        res.status(500).json({ 
            gemini_status: 'ERROR', 
            error: error.message 
        });
    }
});

// === RUTA PRINCIPAL ===
app.post('/analizar', async (req, res) => {
    const { text, image, mimeType = 'image/jpeg' } = req.body;
    
    if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Consulta inválida o vacía' });
    }
    
    try {
        let result;
        // Usa la función de prompt.js si existe, sino crea un prompt básico
        const prompt = await crearPrompt(text, !!image).catch(() => 
            `Eres un tutor de matemáticas. Responde esta pregunta: ${text}`
        );
        
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
        return res.status(500).json({ 
            error: 'No pude procesar tu pregunta. Intenta de nuevo.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ... (el resto de las funciones limpiarTextoServidor y detectarTema se mantienen igual)

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor en http://0.0.0.0:${PORT}`);
    console.log(`🔧 Entorno: ${process.env.NODE_ENV || 'development'}`);
});
