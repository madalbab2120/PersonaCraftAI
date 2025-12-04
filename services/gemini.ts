
import { GoogleGenAI, Type } from "@google/genai";
import { Suggestions, Quality, SelectedOptions, SocialPost, Language, FBPostType } from "../types";

/**
 * Converts a File object to a Base64 string.
 */
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Analyzes the uploaded image to generate creative suggestions.
 */
export const analyzeImageAndGetSuggestions = async (base64Image: string): Promise<Suggestions> => {
  // Create client instance here to ensure we use the latest injected API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const model = 'gemini-2.5-flash';
  
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      originalDescription: {
        type: Type.STRING,
        description: "A concise 1-2 sentence description of the original image context, subject, and setting."
      },
      expressions: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "5 distinct facial expressions suitable for the subject (e.g., 'Heroic Smile', 'Mysterious', 'Laughing')."
      },
      clothing: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "5 creative clothing options matching the subject's gender/form (e.g., 'Cyberpunk Armor', 'Vintage Suit', 'Casual Hoodie')."
      },
      scenes: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "5 interesting background settings or situations (e.g., 'Neon City Street', 'Sunny Beach', 'Ancient Library')."
      },
      styles: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "5 art styles for the output image (e.g., 'Cinematic Realistic', 'Anime Style', 'Oil Painting', '3D Render', 'Pencil Sketch')."
      }
    },
    required: ["originalDescription", "expressions", "clothing", "scenes", "styles"]
  };

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg', // Assuming jpeg/png, API handles standard types
              data: base64Image
            }
          },
          {
            text: "Analyze this image. I want to generate variations of this subject. Provide a brief description of the original image, and then provide creative suggestions for facial expressions, clothing, background scenes, and art styles that would work well with this subject image."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from analysis model");
    
    return JSON.parse(text) as Suggestions;
  } catch (error) {
    console.error("Analysis Error:", error);
    // Fallback defaults if analysis fails
    return {
      originalDescription: "A portrait of a person.",
      expressions: ["Happy", "Serious", "Surprised", "Cool", "Neutral"],
      clothing: ["Casual", "Formal", "Fantasy", "Sci-Fi", "Sporty"],
      scenes: ["Park", "Office", "Space", "City", "Studio"],
      styles: ["Realistic", "Cartoon", "Sketch", "Painting", "Digital Art"]
    };
  }
};

/**
 * Generates a new image based on the reference and selected options.
 */
export const generateCreativeImage = async (
  base64Reference: string,
  options: SelectedOptions,
  customPrompt: string,
  quality: Quality
): Promise<string> => {
  // Create client instance here to ensure we use the latest injected API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const modelName = quality === Quality.HIGH ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
  let constructedPrompt = "";

  if (options.isManualMode) {
    // Manual Mode: Rely heavily on user prompt
    constructedPrompt = `Generate a high-quality image based on the provided reference image. `;
    constructedPrompt += `Instruction: ${customPrompt}. `;
    constructedPrompt += `Maintain the key facial features and identity of the subject in the reference image, but strictly follow the user's instruction for style, clothing, and background.`;
  } else {
    // Guided Mode: Construct prompt from pills
    constructedPrompt = `Generate a high-quality image of the person in the reference image. `;
    
    // Hijab handling
    if (options.hijab && options.hijab !== 'None' && options.hijab !== 'Tiada') {
      constructedPrompt += `The subject is wearing a '${options.hijab}' style hijab/headscarf. `;
    }
  
    // Clothing & Color
    const colorPart = options.clothingColor ? `${options.clothingColor} colored ` : '';
    constructedPrompt += `The subject is wearing ${colorPart}${options.clothing}. `;
    
    // Expression, Scene, Style
    constructedPrompt += `
      Facial Expression: ${options.expression}.
      Background/Scene: ${options.scene}.
      Art Style: ${options.style}.
    `;
  
    // Viral/Creative Mode
    if (options.isViral) {
      constructedPrompt += ` 
        MAKE THIS IMAGE EXTRAORDINARY AND VIRAL. 
        Use cinematic lighting, 8k resolution, highly detailed, trending on ArtStation, masterpiece quality, 
        rare and unique composition, dramatic atmosphere, stunning visuals.
      `;
    }
  
    // Custom user details appended to guided mode
    if (customPrompt) {
      constructedPrompt += ` Additional details: ${customPrompt}.`;
    }
  
    constructedPrompt += ` Maintain resemblance to the person's key facial features but change the context and style as requested.`;
  }

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Reference
            }
          },
          {
            text: constructedPrompt
          }
        ]
      },
      config: {
        imageConfig: quality === Quality.HIGH ? {
           imageSize: "2K",
           aspectRatio: "1:1"
        } : {
           aspectRatio: "1:1"
        }
      }
    });

    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts) throw new Error("No content generated");

    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
      }
    }

    throw new Error("No image data found in response");

  } catch (error) {
    console.error("Generation Error:", error);
    throw error;
  }
};

/**
 * Generates Facebook Pro content based on the created image context.
 */
export const generateFacebookContent = async (
  options: SelectedOptions, 
  customPrompt: string, 
  language: Language,
  postType: FBPostType
): Promise<SocialPost> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const model = 'gemini-2.5-flash';

  const contextDescription = options.isManualMode 
    ? customPrompt 
    : `A person wearing ${options.clothing} (${options.clothingColor || 'default color'}) with a ${options.expression} expression in a ${options.scene} setting. Style: ${options.style}. ${options.hijab ? `Wearing ${options.hijab} style hijab.` : ''}`;

  let specificInstruction = "";
  
  switch (postType) {
    case 'REACTION':
      specificInstruction = `
        STRATEGY: Big Text + Reaction Photo.
        Structure:
        - Headline: VERY Short, Explosive Hook (e.g., "TAK SANGKA!", "RAHSIA TERBONGKAR!").
        - Content: Short and snappy. Direct to the point. Focus on awareness or a quick call-out.
        - Tone: Shocked, Excited, or Urgent.
      `;
      break;
    case 'TUTORIAL':
      specificInstruction = `
        STRATEGY: Mini Tutorial Card.
        Structure:
        - Headline: "Cara Buat [X]" or "Tips [X]".
        - Content: Break down into 3 simple steps or 1 solid actionable insight. Educational value is priority.
        - Tone: Helpful, Teacher-like, Structured.
      `;
      break;
    case 'STORY':
      specificInstruction = `
        STRATEGY: Situational Story Photo.
        Structure:
        - Headline: Relatable POV (e.g., "Pernah tak rasa macam ni?", "POV: Bila client minta...").
        - Content: A short story relating the image to a common struggle/win in FB Pro journey.
        - Tone: Empathy, Storytelling, Relatable.
      `;
      break;
    case 'CORPORATE':
      specificInstruction = `
        STRATEGY: Clean Corporate Statement.
        Structure:
        - Headline: Professional Statement/Quote.
        - Content: High-level wisdom, monetization strategy, or trust-building advice. Minimalist text.
        - Tone: Professional, Authority, Serious but inspiring.
      `;
      break;
    case 'MEME':
      specificInstruction = `
        STRATEGY: Silent Meme Style.
        Structure:
        - Headline: The Punchline (1 sentence).
        - Content: Short context that makes the expression in the photo funny.
        - Tone: Humorous, Sarcastic, Light-hearted. High engagement focus.
      `;
      break;
  }

  const prompt = `
    Act as a 'FB Pro Content Monetization Expert' and 'Social Media Coach'.
    
    I have generated an AI image with this context: "${contextDescription}".
    
    Task: Write a Facebook post caption in **BAHASA MELAYU** strictly.
    Niche: FB Pro Content Monetization, AI Solutions, Tips & Tricks.
    
    ${specificInstruction}
    
    Mandatory Hashtags to include at the end: #wanysaEdutech #fbpro #tipsfbpro
    
    Return the response in JSON format.
  `;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      headline: { type: Type.STRING },
      content: { type: Type.STRING, description: "The main body of the post." },
      hashtags: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["headline", "content", "hashtags"]
  };

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from text generation model");
    
    return JSON.parse(text) as SocialPost;
  } catch (error) {
    console.error("FB Content Generation Error:", error);
    return {
      headline: "Jom Monetize FB! 🚀",
      content: "Gambar ini menunjukkan betapa mudahnya kita boleh hasilkan konten berkualiti dengan AI. Jom belajar cara buat duit dengan FB Pro sekarang!",
      hashtags: ["#wanysaEdutech", "#fbpro", "#tipsfbpro"]
    };
  }
};
