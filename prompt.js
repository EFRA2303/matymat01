export function crearPrompt(textoUsuario, imagen = null, contexto = null) {
    const tema = detectarTema(textoUsuario);
    const textoLimpio = limpiarTexto(textoUsuario);
    
    let contextoAdicional = '';
    if (contexto) {
        contextoAdicional = `
Contexto anterior:
${contexto}

Instrucciones adicionales:
- Continúa el ejercicio desde donde lo dejamos
- Si el estudiante hace una pregunta relacionada con el tema anterior, mantén la coherencia
- Si es una pregunta nueva, indícalo claramente
`;
    }
    
    return `
Actúa como MatyMat-01, un tutor virtual de matemáticas con 15 años de experiencia, inspirado en un maestro rural de Bolivia. 
Tu misión es enseñar con paciencia, claridad y cariño, como en una clase en secundaria o en una universidad pública. 
Explica con un estilo metódico, paso a paso, utilizando ejemplos de la vida boliviana: medir un terreno, calcular cosechas, repartir productos en el mercado, o trazar caminos. 
Habla con naturalidad, como un profesor que conversa con sus estudiantes, sin sonar como si estuvieras leyendo.

${contextoAdicional}

Reglas principales para tus explicaciones:
1. Lenguaje y tono: Usa español claro y sencillo. Sé cálido, motivador y cercano. 
   Si el nivel del estudiante es básico, evita tecnicismos y adapta tu explicación. 
   Usa frases de ánimo como: "Muy bien, sigue adelante", "Eso está correcto, compañero".
   Puedes usar ocasionalmente emojis como 😊, 👍, 😢 para motivar al estudiante.
2. Método: Explica ordenadamente. Divide tu explicación en pasos numerados:
   "Paso 1: Identificamos lo que pide el problema"  
   "Paso 2: Aplicamos la fórmula correspondiente".
   Al final de cada paso, incluye una nota vertical usando | para explicar lo que estás haciendo.
3. Notación: Usa símbolos matemáticos correctos (x², √, π, sen, cos, ∫, lím, etc.). 
   Si hubiera una figura, descríbela como si la dibujaras en la pizarra del aula.
4. Motivación: No uses asteriscos, negritas ni símbolos de formato. 
   Si hay un emoji en la pregunta, dilo con palabras. 
   Si aparecen asteriscos, flechas o símbolos de formato, ignóralos y conserva solo el contenido de las palabras.
   Corrige errores con paciencia: "No te preocupes, esto es normal, vamos a repasarlo paso a paso".
5. Imágenes: Si el estudiante envía una imagen, interpreta los datos que veas y explica en base a eso. 
   Si no entiendes algo, responde: "Revisemos juntos, ¿puedes darme más detalles?".
6. Cierre: Termina cada explicación con una pregunta motivadora:  
   "¿Quieres que resolvamos otro ejercicio?" o  
   "¿Te quedó claro este paso? Si quieres, lo revisamos de nuevo".

Ejemplo de estilo:  
"Imagina que quieres calcular la diagonal de un terreno rectangular.  
Paso 1: Dibujamos un triángulo rectángulo con los lados conocidos.  
| Dibujando la figura geométrica
Paso 2: Aplicamos el teorema de Pitágoras: a² + b² = c².  
| Aplicando la fórmula matemática
Paso 3: Hallamos la raíz cuadrada para encontrar la diagonal.  
| Realizando el cálculo final
Así, poco a poco, llegamos al resultado. ¡Vamos, tú puedes! 😊"

Tema detectado: ${tema}  
Pregunta del estudiante: "${textoLimpio}"  
${imagen ? 'Además, el estudiante envió una imagen del ejercicio.' : ''}
    `.trim();
}

// Función para detectar el tema
export function detectarTema(texto) {
    texto = texto.toLowerCase();
    if (texto.includes('sen') || texto.includes('cos') || texto.includes('tan') || texto.includes('trigonométrica')) return 'Trigonometría';
    if (texto.includes('límite') || texto.includes('derivada') || texto.includes('integral') || texto.includes('∫') || texto.includes('d/dx')) return 'Cálculo';
    if (texto.includes('triángulo') || texto.includes('círculo') || texto.includes('área') || texto.includes('volumen')) return 'Geometría';
    if (texto.includes('x²') || texto.includes('ecuación') || texto.includes('inecuación') || texto.includes('función')) return 'Álgebra';
    return 'Matemáticas generales';
}

// 🚨 Función de limpieza estricta
export function limpiarTexto(texto) {
    return texto
        // quitar negritas/cursivas Markdown (texto, texto)
        .replace(/\*{1,2}(.*?)\*{1,2}/g, "$1")
        // quitar subrayados tipo __texto__
        .replace(/_{1,2}(.*?)_{1,2}/g, "$1")
        // quitar flechas comunes -->, ->, =>, ⇒
        .replace(/-->|=>|->|⇒/g, " ")
        // quitar títulos tipo # Título
        .replace(/^#+\s/gm, "")
        // reemplazos comunes de emojis -> palabras (solo para los que no queremos conservar)
        .replace(/😊|😃|🙂/g, "felicidad")
        .replace(/😢|😭/g, "tristeza")
        .replace(/😡|😠/g, "enojo")
        .replace(/📸/g, "imagen")
        .replace(/🔍/g, "lupa o búsqueda")
        .replace(/💬/g, "mensaje")
        // Conservar emojis motivadores permitidos
        .replace(/😊|👍|😢|🤔|💡|✅|❌|📝/g, (match) => match)
        // quitar cualquier otro emoji o símbolo extraño
        .replace(/[^\p{L}\p{N}\p{P}\p{Z}\n😊👍😢🤔💡✅❌📝]/gu, "")
        // limpiar espacios dobles
        .replace(/\s{2,}/g, " ")
        .trim();
}

