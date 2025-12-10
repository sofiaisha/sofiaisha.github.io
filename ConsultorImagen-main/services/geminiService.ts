import { GoogleGenAI } from "@google/genai";
import { UserProfile, ImageFile } from "../types";

const SYSTEM_INSTRUCTION = `
Eres un Experto Consultor de Imagen Ejecutiva, Estratega de Marca Personal y Estilista de Moda de Alto Nivel. 
Te especializas en transformar la imagen de profesionales para ayudarlos a alcanzar roles de liderazgo (C-Level), política o figuras públicas.
Tu tono es Profesional, directo, honesto pero motivador. Usas terminología de moda correcta (ej: "Lujo Silencioso", "Corte Midi", "Blazer estructurado").
Eres detallista.
`;

export const analyzeProfile = async (
  profile: UserProfile,
  images: ImageFile[]
): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Construct the prompt
  const textPrompt = `
  Analiza las fotografías proporcionadas junto con los siguientes datos del cliente:
  
  Nombre: ${profile.name}
  Género: ${profile.gender}
  Altura: ${profile.height}
  Peso/Tipo de cuerpo: ${profile.weight}, ${profile.bodyType}
  Arquetipo deseado (Objetivo): ${profile.role}
  Restricciones/Condiciones: ${profile.restrictions}

  TU OBJETIVO:
  Crear un plan de transformación de imagen completo.

  TU METODOLOGÍA:
  1. Semiótica Visual: ¿Qué dicen sus fotos actuales?
  2. Morfología y Visagismo: Cortes que favorecen su silueta.
  3. Adaptabilidad: Cruza el estilo deseado con las restricciones.
  4. Agrega ejercicios de postura, grooming y colorimetría.
  5. Curaduría de contenido: Selecciona recursos para su crecimiento mental y estético.

  ESTRUCTURA OBLIGATORIA DE TU RESPUESTA (Usa Markdown):

  ## 1. Diagnóstico de Imagen Actual
  - **Proyección Actual:** ...
  - **El "Gap":** ...

  ## 2. Estrategia de Estilismo (Wardrobe)
  - **Reglas de Oro para tu Silueta:** ...
  - **Paleta de Colores (Colorimetría):** ...
  - **Telas y Cortes:** ...
  - **3 Outfits Recomendados:** ...
  - **Solución a Restricciones:** ... (IMPORTANTE: Resuelve específicamente las restricciones indicadas: "${profile.restrictions}")

  ## 3. Grooming y Detalles
  - **Cabello y Maquillaje:** ...
  - **Accesorios:** ...

  ## 4. Lenguaje Corporal (Power Posing)
  - Describe 2 o 3 poses específicas.

  ## 5. Recursos Educativos y de Inspiración
  - **Libros:** Recomienda 2 o 3 libros específicos sobre liderazgo, imagen, etiqueta, psicología del color o mentalidad que ayuden a lograr el arquetipo de "${profile.role}".
  - **Videos/Canales:** Sugiere canales de YouTube, cuentas de Instagram o Charlas TED sobre estilo, oratoria o presencia ejecutiva relevantes para su perfil.
  `;

  const parts: any[] = [{ text: textPrompt }];

  // Append images
  images.forEach((img) => {
    // Remove header data:image/jpeg;base64, if present
    const cleanBase64 = img.base64.split(',')[1];
    parts.push({
      inlineData: {
        mimeType: img.file.type,
        data: cleanBase64,
      },
    });
  });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7, 
      },
    });

    if (!response.text) {
      throw new Error("No response generated.");
    }

    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};