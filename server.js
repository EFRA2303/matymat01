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

// ✅ ALMACENAMIENTO DE SESIONES INTERACTIVAS
const sesionesActivas = new Map();

// ✅ PROMPT MEJORADO CON SISTEMA DE PASOS Y OPCIONES
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

[PASO 2]: [Siguiente paso]
OPCIONES:
A) [Opción A] [CORRECTA]
B) [Opción B]
C) [Opción C]
EXPLICACIÓN-ERROR: [Explicación]

[...]

FINAL: [Solución final y felicitación]

Si no es matemática: "Solo ayudo con problemas de matemáticas :)"
`;

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

// ✅ FUNCIÓN PARA EXTRAER PASOS Y OPCIONES
function parsearRespuestaConOpciones(texto) {
  const pasos = [];
  const regexPaso = /\[PASO (\d+)\]:\s*(.+?)(?=\[PASO \d+\]|$)/gs;
  const regexOpciones = /OPCIONES:\s*A\)\s*(.+?)\s*B\)\s*(.+?)\s*C\)\s*(.+?)\s*EXPLICACIÓN-ERROR:\s*(.+?)(?=\[PASO|FINAL|$)/gs;
  
  let matchPaso;
  while ((matchPaso = regexPaso.exec(texto)) !== null) {
    const numeroPaso = parseInt(matchPaso[1]);
    const explicacion = matchPaso[2].trim();
    
    // Buscar opciones para este paso
    const matchOpciones = regexOpciones.exec(texto);
    if (matchOpciones) {
      const opciones = [
        { letra: 'A', texto: matchOpciones[1].replace(/\[CORRECTA\]/, '').trim(), correcta: matchOpciones[1].includes('[CORRECTA]') },
        { letra: 'B', texto: matchOpciones[2].replace(/\[CORRECTA\]/, '').trim(), correcta: matchOpciones[2].includes('[CORRECTA]') },
        { letra: 'C', texto: matchOpciones[3].replace(/\[CORRECTA\]/, '').trim(), correcta: matchOpciones[3].includes('[CORRECTA]') }
      ];
      
      const explicacionError = matchOpciones[4].trim();
      const opcionCorrecta = opciones.find(op => op.correcta)?.letra || 'A';
      
      pasos.push({
        numero: numeroPaso,
        explicacion: explicacion,
        opciones: opciones,
        opcionCorrecta: opcionCorrecta,
        explicacionError: explicacionError
      });
    }
  }
  
  return pasos;
}

// ✅ ENDPOINT PRINCIPAL MEJORADO
app.post('/analizar', async (req, res) => {
  try {
    const { text, consulta } = req.body;
    const input = (text || consulta || '').trim().toLowerCase();
    
    if (!input) {
      return res.status(400).json({ 
        respuesta: "Por favor, escribe tu pregunta de matemáticas.",
        tipo: "error"
      });
    }

    // 🔍 Detección de gráficas
    const comandosGrafica = ['gráfica', 'grafica', 'graficar', 'gráficar', 'muéstrame la gráfica'];
    const esComandoGrafica = comandosGrafica.some(comando => input.includes(comando));
    
    if (esComandoGrafica) {
      return await manejarSolicitudGrafica(input, res);
    }

    // 🧠 Procesar con Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const fullPrompt = promptBase + "\n\nConsulta del estudiante: " + input;
    
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    let textResponse = response.text();
    
    // ✅ Parsear respuesta para sistema de pasos
    const pasos = parsearRespuestaConOpciones(textResponse);
    
    if (pasos.length > 0) {
      // Crear nueva sesión interactiva
      const sesionId = Date.now().toString();
      sesionesActivas.set(sesionId, {
        pasos: pasos,
        pasoActual: 0,
        estrellas: 0,
        timestamp: Date.now()
      });
      
      // Limpiar respuesta para mostrar
      const primerPaso = pasos[0];
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
        estrellas: 0
      });
    } else {
      // Respuesta normal (sin pasos interactivos)
      textResponse = textResponse
        .replace(/\*\*/g, '')
        .replace(/#/g, '')
        .replace(/\[CORRECTA\]/g, '')
        .replace(/\n{3,}/g, '\n\n');
      
      return res.json({
        respuesta: textResponse,
        tipo: "normal",
        tieneOpciones: false
      });
    }

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      respuesta: "No pude procesar tu pregunta. Intenta de nuevo.",
      tipo: "error"
    });
  }
});

// ✅ ENDPOINT PARA RESPUESTAS INTERACTIVAS
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
    
    if (opcionElegida === pasoActual.opcionCorrecta) {
      // ✅ RESPUESTA CORRECTA
      sesion.estrellas++;
      sesion.pasoActual++;
      
      let respuesta = `✅ **¡Correcto!** ⭐ +1\n\n`;
      respuesta += `**Explicación:** ${pasoActual.explicacion}\n\n`;
      
      if (sesion.pasoActual < sesion.pasos.length) {
        // Mostrar siguiente paso
        const siguientePaso = sesion.pasos[sesion.pasoActual];
        respuesta += `📝 **Paso ${siguientePaso.numero}:** ${siguientePaso.explicacion}\n\n`;
        respuesta += "**Opciones:**\n";
        siguientePaso.opciones.forEach(op => {
          respuesta += `${op.letra}) ${op.texto}\n`;
        });
        
        return res.json({
          respuesta: respuesta,
          tipo: "interactivo",
          correcto: true,
          sesionId: sesionId,
          tieneOpciones: true,
          estrellas: sesion.estrellas,
          pasoActual: sesion.pasoActual,
          totalPasos: sesion.pasos.length
        });
      } else {
        // ✅ TODOS LOS PASOS COMPLETADOS
        respuesta += `🎉 **¡Problema completado!** Ganaste ${sesion.estrellas} estrellas ⭐\n\n`;
        respuesta += "**Solución final completada correctamente.**";
        
        sesionesActivas.delete(sesionId);
        return res.json({
          respuesta: respuesta,
          tipo: "completado",
          correcto: true,
          estrellas: sesion.estrellas,
          sesionCompletada: true
        });
      }
    } else {
      // ❌ RESPUESTA INCORRECTA
      let respuesta = `❌ **Incorrecto.**\n\n`;
      respuesta += `**Explicación:** ${pasoActual.explicacionError}\n\n`;
      respuesta += `**La opción correcta era:** ${pasoActual.opcionCorrecta}\n\n`;
      respuesta += `**Paso ${pasoActual.numero}:** ${pasoActual.explicacion}\n\n`;
      respuesta += "**Opciones:**\n";
      pasoActual.opciones.forEach(op => {
        respuesta += `${op.letra}) ${op.texto}\n`;
      });
      
      return res.json({
        respuesta: respuesta,
        tipo: "interactivo",
        correcto: false,
        sesionId: sesionId,
        tieneOpciones: true,
        estrellas: sesion.estrellas,
        pasoActual: sesion.pasoActual,
        totalPasos: sesion.pasos.length
      });
    }

  } catch (error) {
    console.error('Error en respuesta:', error);
    res.status(500).json({ 
      respuesta: "Error al procesar tu respuesta.",
      tipo: "error"
    });
  }
});

// ✅ LIMPIAR SESIONES ANTIGUAS CADA 10 MINUTOS
setInterval(() => {
  const ahora = Date.now();
  for (const [sesionId, sesion] of sesionesActivas.entries()) {
    if (ahora - sesion.timestamp > 10 * 60 * 1000) {
      sesionesActivas.delete(sesionId);
    }
  }
}, 5 * 60 * 1000);

// === FUNCIÓN PARA GENERAR DATOS DE GRÁFICA ===
function generarDatosGrafica(funcion, xMin, xMax) {
    console.log(`🧮 Generando puntos para f(x) = ${funcion} en [${xMin}, ${xMax}]`);
    
    const puntos = [];
    const paso = 0.1;
    
    function evaluarFuncion(expr, x) {
        let exprProcesada = expr
            .replace(/sin/g, 'Math.sin')
            .replace(/cos/g, 'Math.cos')
            .replace(/tan/g, 'Math.tan')
            .replace(/sqrt/g, 'Math.sqrt')
            .replace(/log/g, 'Math.log10')
            .replace(/ln/g, 'Math.log')
            .replace(/pi/g, 'Math.PI')
            .replace(/e(?![a-zA-Z])/g, 'Math.E')
            .replace(/\^/g, '**')
            .replace(/x/g, `(${x})`);
        
        try {
            const fn = new Function('Math', `return ${exprProcesada}`);
            return fn(Math);
        } catch (error) {
            throw new Error(`Error al evaluar: ${error.message}`);
        }
    }
    
    try {
        for (let x = xMin; x <= xMax; x += paso) {
            try {
                const y = evaluarFuncion(funcion, x);
                
                if (isFinite(y)) {
                    puntos.push({ x: parseFloat(x.toFixed(2)), y: parseFloat(y.toFixed(2)) });
                }
            } catch (e) {
                console.warn(`⚠️ Error al evaluar en x=${x}:`, e.message);
            }
        }
    } catch (e) {
        console.error("❌ Error al procesar la función:", e.message);
        throw new Error("Función matemática inválida");
    }
    
    console.log(`✅ Se generaron ${puntos.length} puntos válidos`);
    return puntos;
}

// ✅ MANEJO DE SOLICITUDES DE GRÁFICA
async function manejarSolicitudGrafica(input, res) {
  try {
    const funcionMatch = input.match(/(?:de|la|el|para|graficar|gráficar)\s+([^\.\?\!]+)/i);
    let funcion = funcionMatch ? funcionMatch[1].trim() : '';
    
    funcion = funcion
      .replace(/funci[óo]n|gr[áa]fica|de|la|el|mu[ée]strame|quiero|ver|visualizar/gi, '')
      .replace(/[^\w\s\-\+\*\/\^\(\)\.]/g, '')
      .trim();
    
    if (!funcion || funcion.length < 2) {
      return res.json({ 
        respuesta: "¿Qué función matemática te gustaría graficar? Por ejemplo: 'x^2', 'sin(x)', o '2*x + 1'",
        necesitaGrafica: false
      });
    }

    const datos = generarDatosGrafica(funcion, -10, 10);
    
    res.json({
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
    res.json({
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
            return res.status(400).json({ 
                error: "Por favor, proporciona una función para graficar" 
            });
        }
        
        const datos = generarDatosGrafica(funcion, parseFloat(xMin), parseFloat(xMax));
        
        res.json({
            success: true,
            datos: datos,
            funcion: funcion
        });
    } catch (error) {
        res.status(500).json({ 
            error: error.message || "No pude generar la gráfica. Verifica la función." 
        });
    }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor listo en http://localhost:${PORT}`);
});

export default app;



