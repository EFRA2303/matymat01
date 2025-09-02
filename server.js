const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();
const app = express();
app.use(express.static('.'));
app.use(express.json());
const PORT = process.env.PORT || 10000;

// === FUNCIÓN PARA GENERAR DATOS DE GRÁFICA ===
function generarDatosGrafica(funcion, xMin, xMax) {
    const puntos = [];
    const paso = 0.1;
    
    for (let x = xMin; x <= xMax; x += paso) {
        try {
            // Reemplazar expresiones matemáticas para evaluación segura
            let expr = funcion
                .replace(/sin\(/gi, 'Math.sin(')
                .replace(/cos\(/gi, 'Math.cos(')
                .replace(/tan\(/gi, 'Math.tan(')
                .replace(/sqrt\(/gi, 'Math.sqrt(')
                .replace(/log\(/gi, 'Math.log10(')
                .replace(/ln\(/gi, 'Math.log(')
                .replace(/π/gi, 'Math.PI')
                .replace(/e\^/gi, 'Math.exp(')
                .replace(/\^/g, '**');
            
            // Evaluar la función en el punto x
            const y = eval(expr.replace(/x/g, `(${x})`));
            
            if (isFinite(y)) {
                puntos.push({ x: parseFloat(x.toFixed(2)), y: parseFloat(y.toFixed(2)) });
            }
        } catch (e) {
            // Continuar con el siguiente punto si hay error
            continue;
        }
    }
    
    return puntos;
}

// ✅ PROMPT MÍNIMO, CLARO Y OBLIGATORIO
const promptBase = `
Eres un tutor de matemáticas especializado en estudiantes con TDAH tipo inatento.
Resuelve inmediatamente cualquier problema matemático que el estudiante te envíe.
Nunca preguntes "¿cuál es tu pregunta?" o pidas aclaraciones.
Siempre responde paso a paso:
Paso 1: [Explicación clara]
Paso 2: [Explicación clara]
...
Solución final: [Respuesta]
Si la consulta no es matemática, responde: Solo ayudo con problemas de matemáticas.
`;
const genAI = new GoogleGenerativeAI(process.env.API_KEY);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.post('/analizar', async (req, res) => {
  try {
    // ✅ Acepta ambos nombres: "text" (frontend) y "consulta" (backend)
    const { text, consulta } = req.body;
    const input = (text || consulta || '').trim();
    if (!input) {
      return res.status(400).json({ 
        respuesta: "Por favor, escribe tu pregunta de matemáticas." 
      });
    }
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const fullPrompt = promptBase + "\n\nConsulta del estudiante: " + input;
    
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    let textResponse = response.text();
    // ✅ Limpieza mínima
    textResponse = textResponse.replace(/\*\*/g, '').replace(/#/g, '');
    res.json({ respuesta: textResponse });
  } catch (error) {
    console.error('Error con Gemini:', error);
    res.status(500).json({ 
      respuesta: "No pude procesar tu pregunta. Intenta de nuevo." 
    });
  }
});

// === ENDPOINT PARA GRÁFICAS DE FUNCIONES ===
app.post('/graficar', async (req, res) => {
    try {
        const { funcion, xMin = -10, xMax = 10 } = req.body;
        if (!funcion) {
            return res.status(400).json({ 
                error: "Por favor, proporciona una función para graficar" 
            });
        }
        // Generar datos para la gráfica
        const datos = generarDatosGrafica(funcion, parseFloat(xMin), parseFloat(xMax));
        
        res.json({
            success: true,
            datos: datos,
            funcion: funcion
        });
    } catch (error) {
        console.error('Error al generar gráfica:', error);
        res.status(500).json({ 
            error: "No pude generar la gráfica. Verifica la función." 
        });
    }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor listo en http://localhost:${PORT}`);
});

module.exports = app;

