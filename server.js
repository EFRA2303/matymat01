import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dns from 'dns';

// Configurar DNS de Google
dns.setServers(['8.8.8.8', '8.8.4.4']);

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('.'));

// Respuestas de respaldo
const respuestasRespaldo = [
    "¡Hola! Soy MatyMat-01 🤗. Estamos mejorando el servicio. Intenta en 5 minutos.",
    "📚 El tutor está ocupado. Revisa tus apuntes y vuelve pronto.",
    "⚡ Optimizando las matemáticas para ti. Intenta en 2-3 minutos.",
    "🎯 ¡No te rindas! Vuelve a intentarlo en unos minutos."
];

async function openRouterChat(prompt) {
    try {
        console.log('🔧 Conectando con OpenRouter...');
        
        // USAR IP DIRECTA + HTTP
        const response = await fetch('http://104.18.22.207/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer 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',
                'Host': 'api.openrouter.ai',
                'HTTP-Referer': 'https://matymat01.onrender.com',
                'X-Title': 'MatyMat-01 Tutor Bolivia'
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
            timeout: 10000 // 10 segundos timeout
        });

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;

    } catch (error) {
        console.error('❌ Error de conexión:', error.message);
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
        
        if (!text) {
            return res.status(400).json({ error: 'Envía una pregunta' });
        }

        const respuesta = await openRouterChat(text);
        res.json({ respuesta: respuesta });

    } catch (error) {
        res.json({ 
            respuesta: respuestasRespaldo[0] 
        });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Servidor en puerto ${PORT}`);
});
