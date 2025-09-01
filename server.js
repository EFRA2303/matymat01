import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
const PORT = process.env.PORT || 10000;

// ================= CONFIGURACIÓN =================
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('.'));

// 🔐 API Key de Google Gemini
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Inicializar Gemini
let genAI, model;
if (GEMINI_API_KEY && !GEMINI_API_KEY.includes('AIzaSyCuRbKPJ5xFrq3eDFgltITbZqqeHph8LFg')) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: 'gemini-pro' });
}

// ================= FUNCIÓN GEMINI =================
async function geminiChat(prompt) {
    if (!model) {
        throw new Error('❌ Configura GEMINI_API_KEY en Render con tu key de https://aistudio.google.com/');
    }

    try {
        console.log('🔧 Enviando a Gemini...');
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
        
    } catch (error) {
        console.error('❌ Error Gemini:', error.message);
        throw new Error('Error procesando tu pregunta. Intenta de nuevo.');
    }
}

// ================= RUTAS =================
app.get('/', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Tutor MatyMat-01 funcionando',
        has_gemini_key: !!GEMINI_API_KEY && !GEMINI_API_KEY.includes('AIzaSyCuRbKPJ5xFrq3eDFgltITbZqqeHph8LFg'),
        tutorial: 'Consigue API key en https://aistudio.google.com/'
    });
});

app.post('/analizar', async (req, res) => {
    try {
        const { text } = req.body;
        
        if (!text || typeof text !== 'string') {
            return res.status(400).json({ error: 'Envía una pregunta válida' });
        }

        console.log('📨 Pregunta recibida:', text.substring(0, 50) + '...');
        
        const prompt = `Eres MatyMat-01, un tutor virtual de matemáticas con 15 años de experiencia en Bolivia.

Características:
• Explica con paciencia y claridad
• Usa ejemplos de la vida boliviana
• Sé motivador y cercano
• Adapta el lenguaje al nivel del estudiante

Responde esta pregunta: ${text}`;

        const respuesta = await geminiChat(prompt);
        
        res.json({ 
            respuesta: respuesta,
            servicio: 'google-gemini'
        });

    } catch (error) {
        res.status(500).json({ 
            error: error.message,
            solucion: 'Configura GEMINI_API_KEY en Render con tu key de https://aistudio.google.com/'
        });
    }
});

// ================= MANEJO DE ERRORES =================
app.use((err, req, res, next) => {
    console.error('❌ Error general:', err.message);
    res.status(500).json({ 
        error: 'Error interno del servidor',
        solucion: 'Revisa la configuración de API Key'
    });
});

// ================= INICIAR SERVIDOR =================
app.listen(PORT, () => {
    console.log(`✅ Servidor MatyMat-01 en puerto ${PORT}`);
    console.log(`🔑 Gemini API: ${GEMINI_API_KEY ? '✅ Configurada' : '❌ Faltante'}`);
    
    if (!GEMINI_API_KEY || GEMINI_API_KEY.includes('AIzaSyCuRbKPJ5xFrq3eDFgltITbZqqeHph8LFg')) {
        console.log('❌ IMPORTANTE: Configura GEMINI_API_KEY en Render');
        console.log('👉 Ve a: https://aistudio.google.com/ para conseguir API Key gratis');
    }
});
