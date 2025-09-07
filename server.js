import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
`;

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

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

      pasos.push({
        numero: numeroPaso,
        explicacion: bloquePaso.replace(regexOpciones, '').trim(),
        opciones,
        opcionCorrecta,
        explicacionError
      });
    }
  }

  return pasos;
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

    const comandosGrafica = ['gráfica', 'grafica', 'graficar', 'gráficar', 'muéstrame la gráfica', 'mostrar gráfica', 'dibujar'];
    const esComandoGrafica = comandosGrafica.some(c => input.includes(c));

    if (esComandoGrafica) {
      return await manejarSolicitudGrafica(input, res);
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const fullPrompt = promptBase + "\n\nConsulta del estudiante: " + inputRaw;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    let textResponse = response.text();

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
        estrellas: 0
      });
    } else {
      textResponse = textResponse
        .replace(/\*\*/g, '')
        .replace(/\[CORRECTA\]/gi, '')
        .replace(/#{1,6}\s*/g, '')
        .replace(/\n{3,}/g, '\n\n');

      return res.json({
        respuesta: textResponse,
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
      respuesta += `**Explicación:** ${pasoActual.explicacionError}\n\n`;
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

setInterval(() => {
  const ahora = Date.now();
  for (const [sesionId, sesion] of sesionesActivas.entries()) {
    if (ahora - sesion.timestamp > 10 * 60 * 1000) {
      sesionesActivas.delete(sesionId);
    }
  }
}, 5 * 60 * 1000);

function generarDatosGrafica(funcion, xMin, xMax) {
  console.log(`🧮 Generando puntos para f(x) = ${funcion} en [${xMin}, ${xMax}]`);
  const puntos = [];
  const paso = 0.1;

  function evaluarFuncion(expr, x) {
    let exprProcesada = expr;
    exprProcesada = exprProcesada.replace(/\b(sin)\b/gi, 'Math.sin');
    exprProcesada = exprProcesada.replace(/\b(cos)\b/gi, 'Math.cos');
    exprProcesada = exprProcesada.replace(/\b(tan)\b/gi, 'Math.tan');
    exprProcesada = exprProcesada.replace(/\b(sqrt)\b/gi, 'Math.sqrt');
    exprProcesada = exprProcesada.replace(/\b(ln)\b/gi, 'Math.log');
    exprProcesada = exprProcesada.replace(/\b(log10|log)\b/gi, 'Math.log10');
    exprProcesada = exprProcesada.replace(/\bpi\b/gi, 'Math.PI');
    exprProcesada = exprProcesada.replace(/\bE\b/g, 'Math.E');
    exprProcesada = exprProcesada.replace(/\be\b/g, 'Math.E');
    exprProcesada = exprProcesada.replace(/\^/g, '**');
    exprProcesada = exprProcesada.replace(/\bx\b/g, `(${x})`);
    exprProcesada = exprProcesada.replace(/[^\d\w\.\+\-\*\/\^\(\)\sMathPIE,]/g, '');

    try {
      const fn = new Function('Math', `return ${exprProcesada}`);
      return fn(Math);
    } catch (error) {
      throw new Error(`Error al evaluar expresión: ${error.message}`);
    }
  }

  try {
    for (let xx = xMin; xx <= xMax + 1e-9; xx = Math.round((xx + paso) * 1000000) / 1000000) {
      try {
        const y = evaluarFuncion(funcion, xx);
        if (isFinite(y)) {
          puntos.push({ x: parseFloat(xx.toFixed(2)), y: parseFloat(y.toFixed(4)) });
        }
      } catch (e) {
        console.warn(`⚠️ Error en x=${xx}: ${e.message}`);
      }
    }
  } catch (e) {
    console.error("❌ Error al generar datos de gráfica:", e.message);
    throw new Error("Función matemática inválida o no evaluable");
  }

  console.log(`✅ Se generaron ${puntos.length} puntos válidos`);
  return puntos;
}

async function manejarSolicitudGrafica(input, res) {
  try {
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

    const datos = generarDatosGrafica(funcion, -10, 10);

    return res.json({
      respuesta: `✅ Listo! Generé la gráfica para **f(x) = ${funcion}**.`,
      necesitaGrafica: true,
      graficaData: {
        funcion: funcion,
        puntos: datos,
        xMin: -10,
        xMax: 10
      }
    });
  } catch (error) {
    console.error('Error en manejarSolicitudGrafica:', error);
    return res.json({
      respuesta: "⚠️ No pude generar la gráfica. Asegúrate de escribir una función matemática válida.",
      necesitaGrafica: false
    });
  }
}

app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/index.html');
});

app.post('/graficar', async (req, res) => {
  try {
    const { funcion, xMin = -10, xMax = 10 } = req.body;
    if (!funcion) {
      return res.status(400).json({ error: "Por favor, proporciona una función para graficar" });
    }
    const datos = generarDatosGrafica(funcion, parseFloat(xMin), parseFloat(xMax));
    res.json({ success: true, datos, funcion });
  } catch (error) {
    console.error('Error en /graficar:', error);
    res.status(500).json({ error: error.message || "No pude generar la gráfica. Verifica la función." });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor listo en http://localhost:${PORT}`);
});

export default app;





