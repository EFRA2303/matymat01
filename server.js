import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// 🔐 API Key de DeepSeek
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

// 🎯 Función CORRECTA para DeepSeek
async function deepSeekChat(prompt) {
    if (!DEEPSEEK_API_KEY) {
        throw new Error('❌ Configura DEEPSEEK_API_KEY en Render');
    }

    console.log('🔧 Enviando a DeepSeek...');
    
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
                content: `Eres un tutor de matemáticas. Responde: ${prompt}`
            }],
            temperature: 0.7,
            max_tokens: 2000
        })
    });

    console.log('📊 Status:', response.status);
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`DeepSeek error: ${response.status} - ${errorData.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

// 🏠 Ruta principal
app.post('/analizar', async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ error: 'Envía una pregunta' });

        const respuesta = await deepSeekChat(text);
        res.json({ respuesta: respuesta });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Servidor en puerto ${PORT}`);
    console.log(`🔑 DeepSeek API: ${DEEPSEEK_API_KEY ? '✅ Configurada' : '❌ Faltante'}`);
});



