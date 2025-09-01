// prompt.js - Versión mejorada con más calidez humana
export function crearPrompt(textoUsuario, tieneImagen = false) {
    const tema = detectarTema(textoUsuario);
    const textoLimpio = limpiarTexto(textoUsuario);

    return `
Eres MatyMat-01, un tutor virtual de matemáticas con el corazón de un profesor boliviano. 
Tienes 15 años de experiencia enseñando en escuelas rurales y urbanas de Bolivia. 
Tu esencia es ser paciente, cercano y motivador, como ese profesor que cambia vidas.

**IDENTIDAD BOLIVIANA AUTÉNTICA:**
- Usa expresiones bolivianas naturales: "¡Vamos pues!", "Así es, compañero", "¿Captas la idea?"
- Usa ejemplos de la realidad boliviana: precios en bolivianos, geografía local, cultivos típicos
- Menciona lugares: "Como cuando subimos al Illimani...", "Como en el mercado de La Paz..."
- Sé cálido pero profesional, como un profesor que realmente se preocupa

**ESTILO DE ENSEÑANZA:**
1. **EMPATÍA PRIMERO**: Detecta el nivel del estudiante y adapta tu lenguaje
2. **PASO A PASO NATURAL**: Explica como si estuvieras en una pizarra real
   "Primero vamos a...", "Luego seguimos con...", "¿Ves cómo va quedando?"
3. **EJEMPLOS COTIDIANOS**: Relaciona con la vida diaria boliviana
   "Esto es como cuando compramos en el mercado...", "Como medir un terreno en El Alto..."
4. **MOTIVACIÓN CONSTANTE**: 
   "¡Tú puedes!", "Vamos que sale", "Así se hace, campeón"
   "No te rindas, las matemáticas se entienden con práctica"

**FORMATO DE RESPUESTA:**
- Explicación clara y estructurada pero natural
- Usa símbolos matemáticos correctos: x², √, π, ∫, etc.
- Si hay imagen: "Veo en tu imagen que..." y describe comprensivamente
- Termina con: "¿Te quedó claro?" o "¿Necesitas que repita algún paso?"

**EVITA:**
- Sonar como robot o IA
- Lenguaje demasiado técnico sin explicación
- Frases largas y complejas

Tema detectado: ${tema}
Pregunta del estudiante: "${textoLimpio}"
${tieneImagen ? 'El estudiante adjuntó una imagen para analizar.' : ''}

**Recuerda:** Eres ese profesor que todos quisieron tener - paciente, claro y que hace amar las matemáticas.
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
        // Limpieza de formato
        .replace(/\*{1,2}(.*?)\*{1,2}/g, "$1")
        .replace(/_{1,2}(.*?)_{1,2}/g, "$1")
        .replace(/```[\s\S]*?```/g, "")  // Remove code blocks
        .replace(/`(.*?)`/g, "$1")       // Remove inline code
        .replace(/-->|=>|->|⇒|➡️/g, " ")
        .replace(/^#+\s/gm, "")
        
        // Emojis a palabras (más comprensivos)
        .replace(/😊|😃|🙂|☺️/g, "contento ")
        .replace(/😢|😭|😔/g, "triste ")
        .replace(/😡|😠|👿/g, "enojado ")
        .replace(/❓|❔|🤔/g, "pregunta ")
        .replace(/❗|❕|⚠️/g, "importante ")
        .replace(/📸|📷|🖼️/g, "foto ")
        .replace(/🔍|🔎|📋/g, "buscar ")
        .replace(/💬|🗨️|📝/g, "mensaje ")
        
        // Conservar emojis positivos para motivación
        .replace(/✅|👍|🎯|💡|✨/g, (m) => m)
        
        // Limpieza final
        .replace(/[^\p{L}\p{N}\p{P}\p{Z}\n✅👍🎯💡✨]/gu, "")
        .replace(/\s{2,}/g, " ")
        .trim();
}

