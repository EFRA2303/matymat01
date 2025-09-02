const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const math = require('mathjs');
require('dotenv').config();
const app = express();
app.use(express.static('.'));
app.use(express.json());
const PORT = process.env.PORT || 10000;

// === FUNCIÓN PARA GENERAR DATOS DE GRÁFICA (MEJORADA CON MATH.JS) ===
function generarDatosGrafica(funcion, xMin, xMax) {
    console.log(`🧮 Generando puntos para f(x) = ${funcion} en [${xMin}, ${xMax}]`);
    
    const puntos = [];
    const paso = 0.1;
    
    try {
        // Compilar la expresión con Math.js
        const expr = math.compile(funcion);
        
        for (let x = xMin; x <= xMax; x += paso) {
            try {
                // Evaluar la función en el punto x usando Math.js
                const y = expr.evaluate({x: x});
                
                if (isFinite(y)) {
                    puntos.push({ x: parseFloat(x.toFixed(2)), y: parseFloat(y.toFixed(2)) });
                }
            } catch (e) {
                console.warn(`⚠️ Error al evaluar en x=${x}:`, e.message);
                // Continuar con el siguiente punto
            }
        }
    } catch (e) {
        console.error("❌ Error al compilar la función:", e.message);
        throw new Error("Función matemática inválida");
    }
    
    console.log(`✅ Se generaron ${puntos.length} puntos válidos`);
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
        console.log("📥 Solicitud de gráfica recibida:", { funcion, xMin, xMax });
        
        if (!funcion) {
            return res.status(400).json({ 
                error: "Por favor, proporciona una función para graficar" 
            });
        }
        
        console.log("🔄 Generando datos de la gráfica...");
        const datos = generarDatosGrafica(funcion, parseFloat(xMin), parseFloat(xMax));
        
        console.log("✅ Datos generados:", datos.length, "puntos");
        
        res.json({
            success: true,
            datos: datos,
            funcion: funcion
        });
    } catch (error) {
        console.error('🔥 Error al generar gráfica:', error);
        res.status(500).json({ 
            error: error.message || "No pude generar la gráfica. Verifica la función." 
        });
    }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor listo en http://localhost:${PORT}`);
});

module.exports = app;

