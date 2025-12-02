import { GoogleGenAI } from "@google/genai";
import { VEO_MODEL, GEMINI_MODEL } from "../constants";

// Helper to convert file/blob to base64
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g. "data:image/jpeg;base64,")
      const base64 = base64String.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export class GeminiService {
  private ai: GoogleGenAI;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateTitle(files: File[]): Promise<string> {
    try {
      // Limit to first 3 images to save tokens/bandwidth
      const limitedFiles = files.slice(0, 3);
      const parts = await Promise.all(
        limitedFiles.map(async (file) => ({
          inlineData: {
            mimeType: file.type,
            data: await fileToGenerativePart(file),
          },
        }))
      );

      const response = await this.ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: {
          parts: [
            ...parts,
            { text: "Based on these images, suggest a short, creative, and catchy title for a video compilation. Output ONLY the title." },
          ],
        },
      });

      return response.text?.trim() || "Untitled Project";
    } catch (error) {
      console.error("Error generating title:", error);
      return "My Awesome Video";
    }
  }

  async suggestFilters(file: File): Promise<string> {
    try {
      const base64 = await fileToGenerativePart(file);
      const response = await this.ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: file.type,
                data: base64,
              },
            },
            { text: "Analyze the mood of this image and suggest CSS filter values for brightness, contrast, and saturation to enhance it. Return JSON format like: {\"brightness\": 110, \"contrast\": 105, \"saturation\": 120}. ONLY JSON." },
          ],
        },
        config: {
            responseMimeType: "application/json"
        }
      });
      return response.text || "{}";
    } catch (error) {
      console.error("Error suggesting filters:", error);
      return "{}";
    }
  }

  async animateImage(file: File, prompt: string): Promise<string | null> {
    try {
      const base64 = await fileToGenerativePart(file);
      
      let operation = await this.ai.models.generateVideos({
        model: VEO_MODEL,
        prompt: prompt || "Cinematic camera movement, high quality",
        image: {
            imageBytes: base64,
            mimeType: file.type
        },
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: '16:9'
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await this.ai.operations.getVideosOperation({operation: operation});
      }

      const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (uri) {
          // Return the full fetch URL including key
          return `${uri}&key=${this.apiKey}`;
      }
      return null;

    } catch (error) {
      console.error("Error generating video:", error);
      throw error;
    }
  }

  async generateVideoFromText(prompt: string): Promise<string | null> {
    try {
      let operation = await this.ai.models.generateVideos({
        model: VEO_MODEL,
        prompt: prompt,
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: '16:9'
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await this.ai.operations.getVideosOperation({operation: operation});
      }

      const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (uri) {
          return `${uri}&key=${this.apiKey}`;
      }
      return null;

    } catch (error) {
      console.error("Error generating video from text:", error);
      throw error;
    }
  }
}