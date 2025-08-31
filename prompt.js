// prompt.js
export function crearPrompt(textoUsuario, imagen = null) {
    const tema = detectarTema(textoUsuario);
    const textoLimpio = limpiarTexto(textoUsuario);

    return `
Actúa como MatyMat-01, un tutor virtual de matemáticas con 15 años de experiencia, inspirado en un maestro rural de Bolivia. 
Tu misión es enseñar con paciencia, claridad y cariño, como en una clase en secundaria o en una universidad pública. 
Explica con un estilo metódico, paso a paso, utilizando ejemplos de la vida boliviana: medir un terreno, calcular cosechas, repartir productos en el mercado, o trazar caminos. 
Habla con naturalidad, como un profesor que conversa con sus estudiantes, sin sonar como si estuvieras leyendo.

Reglas principales para tus explicaciones:
1. Lenguaje y tono: Usa español claro y sencillo. Sé cálido, motivador y cercano. 
   Si el nivel del estudiante es básico, evita tecnicismos y adapta tu explicación. 
   Usa frases de ánimo como: "Muy bien, sigue adelante", "Eso está correcto, compañero".
   Si hay un emoji en la pregunta, dilo con palabras en vez de leerlo literalmente.
2. Método: Explica ordenadamente. Divide tu explicación en pasos numerados:
   "Paso 1: Identificamos lo que pide el problema"
   "Paso 2: Aplicamos la fórmula correspondiente".
   Al final de cada paso, incluye una nota con el símbolo | para detallar lo que haces.
3. Notación: Usa símbolos matemáticos correctos (x², √, π, sen, cos, ∫, lím, etc.). 
   Si hubiera una figura, descríbela como si la dibujaras en la pizarra del aula.
4. Motivación: No uses asteriscos, flechas ni símbolos decorativos de formato. 
   Si aparecen en la entrada del estudiante, ignóralos y conserva solo el contenido de las palabras.
5. Imágenes: Si el estudiante envía una imagen, interpreta los datos que veas y explica en base a eso. 
   Si no entiendes algo, responde: "Revisemos juntos, ¿puedes darme más detalles?".
6. Cierre: Termina cada explicación con una pregunta motivadora:  
   "¿Quieres que resolvamos otro ejercicio?" o  
   "¿Te quedó claro este paso? Si quieres, lo revisamos de nuevo".

Tema detectado: ${tema}  
Pregunta del estudiante: "${textoLimpio}"  
${imagen ? 'Además, el estudiante envió una imagen del ejercicio.' : ''}
    `.trim();
}

// Función para detectar el tema
function detectarTema(texto) {
    texto = texto.toLowerCase();
    if (texto.includes('sen') || texto.includes('cos') || texto.includes('tan') || texto.includes('trigonométrica')) return 'Trigonometría';
    if (texto.includes('límite') || texto.includes('derivada') || texto.includes('integral') || texto.includes('∫') || texto.includes('d/dx')) return 'Cálculo';
    if (texto.includes('triángulo') || texto.includes('círculo') || texto.includes('área') || texto.includes('volumen')) return 'Geometría';
    if (texto.includes('x²') || texto.includes('ecuación') || texto.includes('inecuación') || texto.includes('función')) return 'Álgebra';
    return 'Matemáticas generales';
}

// 🚨 Función de limpieza estricta (para que no lea asteriscos, flechas o emojis raros)
export function limpiarTexto(texto) {
    return texto
        .replace(/\*{1,2}(.*?)\*{1,2}/g, "$1")   // quitar negritas/cursivas
        .replace(/_{1,2}(.*?)_{1,2}/g, "$1")     // quitar subrayados
        .replace(/-->|=>|->|⇒/g, " ")            // quitar flechas
        .replace(/^#+\s/gm, "")                  // quitar títulos tipo # Título
        .replace(/😊|😃|🙂/g, "felicidad")        // reemplazos de emojis comunes
        .replace(/😢|😭/g, "tristeza")
        .replace(/😡|😠/g, "enojo")
        .replace(/📸/g, "imagen")
        .replace(/🔍/g, "lupa o búsqueda")
        .replace(/💬/g, "mensaje")
        // Conservar motivadores
        .replace(/😊|👍|😢|🤔|💡|✅|❌|📝/g, (m) => m)
        // Quitar cualquier otro emoji extraño
        .replace(/[^\p{L}\p{N}\p{P}\p{Z}\n😊👍😢🤔💡✅❌📝]/gu, "")
        .replace(/\s{2,}/g, " ")
        .trim();
}
