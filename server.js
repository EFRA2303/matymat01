import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 10000;

// ================= CONFIGURACIÓN =================
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('.'));

// 🔐 Configuración de OpenRouter
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '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';

// ================= FUNCIÓN OPENROUTER =================
async function openRouterChat(prompt) {
    console.log('🔧 Enviando a OpenRouter...');
    
    const response = await fetch('https://api.openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'HTTP-Referer': 'https://matymat01.onrender.com',
            'X-Title': 'MatyMat-01 Tutor Bolivia'
        },
        body: JSON.stringify({
            model: 'google/gemini-pro', // Modelo gratis
            messages: [{ 
                role: 'user', 
                content: `Eres MatyMat-01, un tutor virtual de matemáticas con 15 años de experiencia en Bolivia.
                
Características:
• Explica con paciencia y claridad
• Usa ejemplos de la vida boliviana
• Sé motivador y cercano
• Adapta el lenguaje al nivel del estudiante

Pregunta: ${prompt}`
            }],
            temperature: 0.7,
            max_tokens: 1500
        })
    });

    console.log('📊 Status OpenRouter:', response.status);
    
    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`OpenRouter error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

// ================= RUTAS =================
app.get('/', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Tutor MatyMat-01 funcionando',
        servicio: 'openrouter',
        modelo: 'google/gemini-pro'
    });
});

app.post('/analizar', async (req, res) => {
    try {
        const { text } = req.body;
        
        if (!text || typeof text !== 'string') {
            return res.status(400).json({ error: 'Envía una pregunta válida' });
        }

        console.log('📨 Pregunta recibida:', text.substring(0, 50) + '...');
        
        const respuesta = await openRouterChat(text);
        
        res.json({ 
            respuesta: respuesta,
            servicio: 'openrouter',
            modelo: 'google/gemini-pro'
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
        res.status(500).json({ 
            error: 'No pude procesar tu pregunta. Intenta de nuevo.',
            detalle: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ================= INICIAR SERVIDOR =================
app.listen(PORT, () => {
    console.log(`✅ Servidor MatyMat-01 en puerto ${PORT}`);
    console.log(`🤖 Servicio: OpenRouter`);
    console.log(`🎯 Modelo: google/gemini-pro`);
    console.log(`🔑 API Key: ${OPENROUTER_API_KEY ? '✅ Configurada' : '⚠️ Usando key pública'}`);
});