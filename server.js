import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.static('.'));
app.use(express.json());
const PORT = process.env.PORT || 10000;

const sesionesActivas = new Map();

const promptBase = `
Eres MatyMat, un tutor virtual de matemáticas para estudiantes con TDAH.
Sigue ESTRICTAMENTE este formato:

1. DIVIDE cada problema en pasos lógicos
2. Para CADA paso:
   - Explica brevemente el concepto
   - Genera 3 opciones de respuesta (A, B, C)
   - Marca la correcta con [CORRECTA]
   - Proporciona explicación si falla

Formato OBLIGATORIO:
[PASO 1]: [Explicación del paso]
OPCIONES:
A) [Opción A] 
B) [Opción B] [CORRECTA]
C) [Opción C]
EXPLICACIÓN-ERROR: [Explicación si eligen mal]

[...] 

FINAL: [Solución final y felicitación]

Si no es matemática: "Solo ayudo con problemas de matemáticas :)"

IMPORTANTE: Para funciones gráficas, responde indicando que se puede graficar pero NO intentes generar datos de gráfica.
`;

// Configuración de Groq
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

console.log('✅ Groq configurado correctamente');

function parsearRespuestaConOpciones(texto) {
  const pasos = [];
  const regexPaso = /\[PASO\s*(\d+)\]:\s*([\s\S]*?)(?=(?:\[PASO\s*\d+\]:)|$)/gi;

  let matchPaso;
  while ((matchPaso = regexPaso.exec(texto)) !== null) {
    const numeroPaso = parseInt(matchPaso[1], 10);
    const bloquePaso = matchPaso[2].trim();

    const regexOpciones = /OPCIONES:\s*A\)\s*([\s\S]*?)\s*B\)\s*([\s\S]*?)\s*C\)\s*([\s\S]*?)\s*EXPLICACIÓN-ERROR:\s*([\s\S]*?)$/i;
    const matchOpciones = bloquePaso.match(regexOpciones);

    if (matchOpciones) {
      const opciones = [
        { letra: 'A', texto: matchOpciones[1].replace(/\[CORRECTA\]/gi, '').trim(), correcta: /\[CORRECTA\]/i.test(matchOpciones[1]) },
        { letra: 'B', texto: matchOpciones[2].replace(/\[CORRECTA\]/gi, '').trim(), correcta: /\[CORRECTA\]/i.test(matchOpciones[2]) },
        { letra: 'C', texto: matchOpciones[3].replace(/\[CORRECTA\]/gi, '').trim(), correcta: /\[CORRECTA\]/i.test(matchOpciones[3]) }
      ];

      const explicacionError = (matchOpciones[4] || '').trim();
      const opcionCorrecta = opciones.find(op => op.correcta)?.letra || 'A';

      const explicacionPaso = bloquePaso.replace(regexOpciones, '').trim();

      pasos.push({
        numero: numeroPaso,
        explicacion: explicacionPaso,
        opciones,
        opcionCorrecta,
        explicacionError
      });
    }
  }

  return pasos;
}

// Función para llamar a Groq
async function generarRespuestaGroq(prompt) {
  try {
    console.log('📤 Enviando consulta a Groq...');
    
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: promptBase
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.7,
      max_tokens: 1024,
      stream: false
    });

    console.log('✅ Respuesta recibida de Groq');
    return completion.choices[0]?.message?.content || "No pude generar una respuesta.";
  } catch (error) {
    console.error('❌ Error con Groq API:', error.message);
    throw new Error("Error al comunicarse con el servicio de IA");
  }
}

app.post('/analizar', async (req, res) => {
  try {
    const { text, consulta } = req.body;
    const inputRaw = (text || consulta || '').toString().trim();
    const input = inputRaw.toLowerCase();

    if (!input) {
      return res.status(400).json({
        respuesta: "Por favor, escribe tu pregunta de matemáticas.",
        tipo: "error"
      });
    }

    // Detectar si es comando de gráfica
    const comandosGrafica = ['gráfica', 'grafica', 'graficar', 'gráficar', 'muéstrame la gráfica', 'mostrar gráfica', 'dibujar'];
    const esComandoGrafica = comandosGrafica.some(c => input.includes(c));

    if (esComandoGrafica) {
      const funcionMatch = input.match(/(?:de|la|el|para|graficar|gráficar|grafica)\s+([^\.\?\!]+)/i);
      let funcion = funcionMatch ? funcionMatch[1].trim() : input;

      funcion = funcion
        .replace(/(funci[óo]n|gr[áa]fica|grafica|grafica:|de|la|el|mu[ée]strame|quiero|ver|visualizar)/gi, '')
        .replace(/[^\w\s\-\+\*\/\^\(\)\.\,]/g, '')
        .trim();

      if (!funcion || funcion.length < 1) {
        return res.json({
          respuesta: "¿Qué función matemática te gustaría graficar? Por ejemplo: 'x^2', 'sin(x)', o '2*x + 1'",
          necesitaGrafica: false
        });
      }

      return res.json({
        respuesta: `✅ ¡Perfecto! Puedo generar la gráfica para **f(x) = ${funcion}**. Usaré GeoGebra para mostrarte una representación visual interactiva.`,
        necesitaGrafica: true,
        graficaData: {
          funcion: funcion
        }
      });
    }

    const fullPrompt = "Consulta del estudiante: " + inputRaw;
    const textResponse = await generarRespuestaGroq(fullPrompt);

    const pasos = parsearRespuestaConOpciones(textResponse);

    if (pasos.length > 0) {
      const sesionId = Date.now().toString();
      const primerPaso = pasos[0];
      
      sesionesActivas.set(sesionId, {
        pasos,
        pasoActual: 0,
        estrellas: 0,
        timestamp: Date.now()
      });

      let respuestaTexto = `📝 **Paso ${primerPaso.numero}:** ${primerPaso.explicacion}\n\n`;
      respuestaTexto += "**Opciones:**\n";
      primerPaso.opciones.forEach(op => {
        respuestaTexto += `${op.letra}) ${op.texto}\n`;
      });

      return res.json({
        respuesta: respuestaTexto,
        tipo: "interactivo",
        sesionId: sesionId,
        tieneOpciones: true,
        opciones: primerPaso.opciones,
        respuestaCorrecta: primerPaso.opcionCorrecta,
        explicacionError: primerPaso.explicacionError,
        estrellas: 0
      });
    } else {
      const textResponseLimpio = textResponse
        .replace(/\*\*/g, '')
        .replace(/\[CORRECTA\]/gi, '')
        .replace(/#{1,6}\s*/g, '')
        .replace(/\n{3,}/g, '\n\n');

      return res.json({
        respuesta: textResponseLimpio,
        tipo: "normal",
        tieneOpciones: false
      });
    }
  } catch (error) {
    console.error('Error en /analizar:', error);
    res.status(500).json({
      respuesta: "No pude procesar tu pregunta. Intenta de nuevo.",
      tipo: "error"
    });
  }
});

app.post('/responder', async (req, res) => {
  try {
    const { sesionId, opcionElegida } = req.body;

    if (!sesionesActivas.has(sesionId)) {
      return res.json({
        respuesta: "⚠️ La sesión expiró. Por favor, envía tu pregunta de nuevo.",
        tipo: "error",
        sesionExpirada: true
      });
    }

    const sesion = sesionesActivas.get(sesionId);
    const pasoActual = sesion.pasos[sesion.pasoActual];

    if (!pasoActual) {
      sesionesActivas.delete(sesionId);
      return res.json({
        respuesta: "⚠️ Sesión inválida o ya completada.",
        tipo: "error",
        sesionExpirada: true
      });
    }

    const esCorrecta = opcionElegida === pasoActual.opcionCorrecta;

    if (esCorrecta) {
      sesion.estrellas++;
      sesion.pasoActual++;

      let respuesta = `✅ **¡Correcto!** ⭐ +1\n\n`;
      respuesta += `**Explicación:** ${pasoActual.explicacion}\n\n`;

      if (sesion.pasoActual < sesion.pasos.length) {
        const siguientePaso = sesion.pasos[sesion.pasoActual];
        respuesta += `📝 **Paso ${siguientePaso.numero}:** ${siguientePaso.explicacion}\n\n`;
        respuesta += "**Opciones:**\n";
        siguientePaso.opciones.forEach(op => {
          respuesta += `${op.letra}) ${op.texto}\n`;
        });

        sesionesActivas.set(sesionId, sesion);
        return res.json({
          respuesta,
          tipo: "interactivo",
          correcto: true,
          sesionId,
          tieneOpciones: true,
          opciones: siguientePaso.opciones,
          respuestaCorrecta: siguientePaso.opcionCorrecta,
          explicacionError: siguientePaso.explicacionError,
          estrellas: sesion.estrellas
        });
      } else {
        respuesta += `🎉 **¡Problema completado!** Ganaste ${sesion.estrellas} estrellas ⭐\n\n`;
        respuesta += "**Solución final completada correctamente.**";

        sesionesActivas.delete(sesionId);
        return res.json({
          respuesta,
          tipo: "completado",
          correcto: true,
          estrellas: sesion.estrellas,
          sesionCompletada: true
        });
      }
    } else {
      let respuesta = `❌ **Incorrecto.**\n\n`;
      respuesta += `**Explicación del error:** ${pasoActual.explicacionError}\n\n`;
      respuesta += `**La opción correcta era:** ${pasoActual.opcionCorrecta}\n\n`;
      respuesta += `**Paso ${pasoActual.numero}:** ${pasoActual.explicacion}\n\n`;
      respuesta += "**Opciones:**\n";
      pasoActual.opciones.forEach(op => {
        respuesta += `${op.letra}) ${op.texto}\n`;
      });

      sesionesActivas.set(sesionId, sesion);
      return res.json({
        respuesta,
        tipo: "interactivo",
        correcto: false,
        sesionId,
        tieneOpciones: true,
        opciones: pasoActual.opciones,
        respuestaCorrecta: pasoActual.opcionCorrecta,
        explicacionError: pasoActual.explicacionError,
        estrellas: sesion.estrellas
      });
    }
  } catch (error) {
    console.error('Error en /responder:', error);
    res.status(500).json({
      respuesta: "Error al procesar tu respuesta.",
      tipo: "error"
    });
  }
});

app.post('/graficar', async (req, res) => {
  try {
    const { funcion } = req.body;
    if (!funcion) {
      return res.status(400).json({ error: "Por favor, proporciona una función para graficar" });
    }
    
    const funcionValida = /^[a-zA-Z0-9\s\-\+\*\/\^\(\)\.\,]+$/.test(funcion);
    if (!funcionValida) {
      return res.status(400).json({ error: "Función matemática inválida" });
    }
    
    res.json({ 
      success: true, 
      funcion: funcion,
      mensaje: "Función lista para ser graficada con GeoGebra" 
    });
  } catch (error) {
    console.error('Error en /graficar:', error);
    res.status(500).json({ error: error.message || "No pude procesar la función para graficar." });
  }
});

// Limpieza de sesiones inactivas
setInterval(() => {
  const ahora = Date.now();
  for (const [sesionId, sesion] of sesionesActivas.entries()) {
    if (ahora - sesion.timestamp > 10 * 60 * 1000) {
      sesionesActivas.delete(sesionId);
    }
  }
}, 5 * 60 * 1000);

app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/index.html');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor listo en http://localhost:${PORT}`);
});

export default app;




