import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 10000;

// ================= CONFIGURACIÓN =================
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('.'));

// 🔐 Configuración de APIs
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const AI_SERVICE = process.env.AI_SERVICE || 'deepseek';

// ================= FUNCIONES DE IA =================

// 1. DeepSeek AI (GRATIS y FUNCIONAL)
async function deepSeekChat(prompt) {
    if (!DEEPSEEK_API_KEY) {
        throw new Error('❌ DeepSeek API Key no configurada. Ve a https://platform.deepseek.com/ para conseguir una gratis');
    }

    console.log('🔧 Enviando solicitud a DeepSeek...');
    
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [{ 
                role: 'user', 
                content: `Eres MatyMat-01, un tutor virtual de matemáticas para estudiantes bolivianos. 
                Explica con claridad y paciencia. Responde en español.
                
                Pregunta del estudiante: ${prompt}`
            }],
            temperature: 0.7,
            max_tokens: 2000
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`DeepSeek API error: ${errorData.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

// ================= RUTAS =================

app.get('/', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Tutor MatyMat-01 funcionando',
        ai_service: AI_SERVICE,
        has_deepseek_key: !!DEEPSEEK_API_KEY,
        tutorial: 'Visita /prueba-ia para probar el chatbot'
    });
});

app.get('/prueba-ia', async (req, res) => {
    try {
        const respuesta = await deepSeekChat('Hola, ¿puedes explicarme el teorema de Pitágoras?');
        res.json({ 
            status: '✅ CONEXIÓN EXITOSA',
            respuesta: respuesta,
            servicio: AI_SERVICE
        });
    } catch (error) {
        res.status(500).json({ 
            status: '❌ ERROR',
            error: error.message,
            solucion: 'Configura DEEPSEEK_API_KEY en Render con tu key de https://platform.deepseek.com/'
        });
    }
});

app.post('/analizar', async (req, res) => {
    const { text, image } = req.body;
    
    if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Consulta inválida o vacía' });
    }
    
    try {
        console.log('📨 Pregunta recibida:', text.substring(0, 50) + '...');
        
        let respuesta;
        
        switch (AI_SERVICE) {
            case 'deepseek':
            default:
                respuesta = await deepSeekChat(text);
        }
        
        // Limpiar y estructurar respuesta
        const pasos = respuesta.split(/\n\n/).filter(paso => paso.trim().length > 0);
        
        res.json({ 
            pasos: pasos.map(paso => paso.trim()),
            tema: 'Matemáticas',
            ai_service: AI_SERVICE
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        res.status(500).json({ 
            error: 'No pude procesar tu pregunta. Intenta de nuevo.',
            detalles: error.message
        });
    }
});

// ================= INICIAR SERVIDOR =================
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor MatyMat-01 en http://0.0.0.0:${PORT}`);
    console.log(`🤖 Usando servicio: ${AI_SERVICE}`);
    console.log(`🔑 DeepSeek API Key configurada: ${!!DEEPSEEK_API_KEY}`);
    
    if (!DEEPSEEK_API_KEY) {
        console.log('❌ IMPORTANTE: Configura DEEPSEEK_API_KEY en Render');
        console.log('👉 Ve a: https://platform.deepseek.com/ para conseguir API Key gratis');
    }
});


