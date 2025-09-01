import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('.'));

// Respuestas de respaldo para cuando falla la conexión
const respuestasRespaldo = [
    "¡Hola! Soy MatyMat-01 🤗. Estamos mejorando nuestro servicio. Por favor, intenta nuevamente en 5 minutos.",
    "📚 Momentámente el tutor está ocupado. Revisa tus apuntes y vuelve a intentarlo pronto.",
    "⚡ Estamos optimizando las matemáticas para ti. Intenta en 2-3 minutos mientras tanto.",
    "🎯 ¡No te rindas! Nuestro tutor se está actualizando. Vuelve en unos minutos."
];

// Función mejorada con manejo de errores
async function openRouterChat(prompt) {
    try {
        console.log('🔧 Intentando conectar con OpenRouter...');
        
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        const response = await fetch('https://api.openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer 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',
                'HTTP-Referer': 'https://matymat01.onrender.com',
                'X-Title': 'MatyMat-01 Tutor'
            },
            body: JSON.stringify({
                model: 'google/gemini-pro',
                messages: [{ 
                    role: 'user', 
                    content: `Eres un tutor de matemáticas. Responde: ${prompt}`
                }],
                temperature: 0.7,
                max_tokens: 1000
            }),
            signal: controller.signal
        });

        clearTimeout(timeout);

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;

    } catch (error) {
        console.error('❌ Error de conexión:', error.message);
        // Respuesta de respaldo amigable
        return respuestasRespaldo[Math.floor(Math.random() * respuestasRespaldo.length)];
    }
}

// Rutas
app.get('/', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Tutor MatyMat-01 funcionando',
        servicio: 'openrouter'
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
            servicio: 'openrouter'
        });

    } catch (error) {
        console.error('❌ Error en /analizar:', error.message);
        res.json({ 
            respuesta: respuestasRespaldo[0],
            servicio: 'modo_respaldo'
        });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Servidor MatyMat-01 en puerto ${PORT}`);
    console.log(`🤖 Servicio: OpenRouter`);
    console.log(`🚀 Listo para recibir preguntas...`);
});
