// prompt.js - Versión mejorada y optimizada para evitar que Gemini pida repetir la pregunta
export function crearPrompt(textoUsuario, tieneImagen = false) {
    const tema = detectarTema(textoUsuario);
    const textoLimpio = limpiarTexto(textoUsuario);

    return `
INSTRUCCIONES ESENCIALES PARA SER MATYMAT-01:

1. ERES UN TUTOR DE MATEMÁTICAS ESPECIALIZADO EN ESTUDIANTES CON TDAH TIPO INATENTO.
2. EL ESTUDIANTE SIEMPRE TE ENVÍA UN PROBLEMA MATEMÁTICO ESPECÍFICO. NUNCA PREGUNTES "¿CUÁL ES TU PREGUNTA?".
3. SIEMPRE RESUELVE EL PROBLEMA PASO A PASO, EXPLICANDO CLARAMENTE CADA PASO.
4. SI LA CONSULTA ES UN PROBLEMA MATEMÁTICO, RESUÉLVELO INMEDIATAMENTE SIN COMENTARIOS ADICIONALES.
5. ESTRUCTURA TODAS TUS RESPUESTAS ASÍ:
   - Paso 1: [Explicación clara]
   - Paso 2: [Explicación clara]
   - ...
   - Solución final: [Respuesta clara]
6. NUNCA USES EMOJIS, SÍMBOLOS ESPECIALES NI FORMATO MARKDOWN.
7. USA LENGUAJE SENCILLO, EVITA JERGA TÉCNICA INNECESARIA.
8. MANTÉN UN TONO AMABLE Y ALENTADOR CON EXPRESIONES BOLIVIANAS:
   "¡Vamos pues!", "Así es, compañero", "¿Captas la idea?"
9. SI EL ESTUDIANTE ENVÍA UNA IMAGEN, RESPONDE: "No puedo ver imágenes. Por favor, describe el ejercicio en texto."
10. RELACIONA CON EJEMPLOS DE LA REALIDAD BOLIVIANA:
    "Esto es como cuando compramos en el mercado...", "Como medir un terreno en El Alto..."

EJEMPLO DE RESPUESTA CORRECTA:
"Paso 1: Para resolver 2x + 3 = 7, primero restamos 3 de ambos lados.
Paso 2: Esto nos da 2x = 4.
Paso 3: Dividimos ambos lados por 2.
Solución final: x = 2"

EJEMPLO DE RESPUESTA INCORRECTA:
"¡Hola! Veo que quieres resolver un problema matemático. ¿Podrías decirme exactamente qué problema necesitas resolver?"

AHORA, RESUELVE SIEMPRE EL PROBLEMA MATEMÁTICO QUE EL ESTUDIANTE TE ENVÍE:

Tema detectado: ${tema}
Pregunta del estudiante: "${textoLimpio}"
${tieneImagen ? 'El estudiante adjuntó una imagen para analizar.' : ''}
    `.trim();
}

// Función para detectar el tema con más precisión
function detectarTema(texto) {
    if (!texto) return 'Matemáticas generales';
    const textoLower = texto.toLowerCase();
    
    if (textoLower.includes('sen') || textoLower.includes('cos') || textoLower.includes('tan') || 
        textoLower.includes('trigonometría') || textoLower.includes('ángulo')) 
        return 'Trigonometría';
    
    if (textoLower.includes('límite') || textoLower.includes('derivada') || textoLower.includes('integral') || 
        textoLower.includes('calculo') || textoLower.includes('cálculo') || textoLower.includes('∫'))
        return 'Cálculo';
    
    if (textoLower.includes('triángulo') || textoLower.includes('círculo') || textoLower.includes('área') || 
        textoLower.includes('volumen') || textoLower.includes('geometría') || textoLower.includes('perímetro'))
        return 'Geometría';
    
    if (textoLower.includes('ecuación') || textoLower.includes('álgebra') || textoLower.includes('variable') || 
        textoLower.includes('polinomio') || textoLower.includes('factoriz') || textoLower.includes('x²') || textoLower.includes('inecuación'))
        return 'Álgebra';
    
    if (textoLower.includes('estadística') || textoLower.includes('probabilidad') || textoLower.includes('promedio') || 
        textoLower.includes('media') || textoLower.includes('grafic'))
        return 'Estadística';
    
    if (textoLower.includes('fracción') || textoLower.includes('decimal') || textoLower.includes('porcentaje') || 
        textoLower.includes('multiplicación') || textoLower.includes('división'))
        return 'Aritmética';
    
    return 'Matemáticas generales';
}

// Función de limpieza mejorada
export function limpiarTexto(texto) {
    if (!texto) return '';
    
    return texto
        .replace(/\*{1,2}(.*?)\*{1,2}/g, "$1")
        .replace(/_{1,2}(.*?)_{1,2}/g, "$1")
        .replace(/-->|=>|->|⇒|➡️/g, " ")
        .replace(/^#+\s/gm, "")
        .replace(/\s{2,}/g, " ")
        .trim();
}

