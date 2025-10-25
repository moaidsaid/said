
import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";
import { GeminiError } from "../types";

// This file centralizes API calls to Gemini

/**
 * Edits an image using a text prompt.
 */
export const editImage = async (base64Image: string, mimeType: string, prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates?.[0]?.content.parts ?? []) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    throw new Error("No image was generated. The prompt may have been blocked.");
  } catch (e) {
    const error = e as GeminiError;
    console.error("Gemini API Error (Image Editing):", error);
    throw new Error(`Failed to edit image: ${error.message}`);
  }
};

/**
 * Analyzes video frames with a text prompt.
 */
export const analyzeVideo = async (frames: {inlineData: {data: string, mimeType: string}}[], prompt: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    try {
        const parts = [{text: prompt}, ...frames];
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: { parts: parts }
        });
        return response.text;
    } catch(e) {
        const error = e as GeminiError;
        console.error("Gemini API Error (Video Analysis):", error);
        throw new Error(`Failed to analyze video: ${error.message}`);
    }
};

/**
 * Generates a video using Veo from a text prompt.
 */
export const generateVideo = async (
    prompt: string, 
    aspectRatio: '16:9' | '9:16', 
    setLoadingMessage: (message: string) => void
): Promise<string> => {
  // A new instance is created to ensure the latest API key from the selection dialog is used.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  
  try {
    setLoadingMessage("Initiating video generation with Veo...");
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: aspectRatio,
      }
    });

    setLoadingMessage("Processing video... This can take a few minutes. Please wait.");
    let pollCount = 0;
    while (!operation.done) {
      pollCount++;
      const waitTime = 10000; // 10 seconds
      await new Promise(resolve => setTimeout(resolve, waitTime));
      setLoadingMessage(`Still processing... (Check ${pollCount})`);
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
      throw new Error("Video generation completed, but no download link was found.");
    }

    setLoadingMessage("Generation complete! Downloading video...");
    const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    if (!videoResponse.ok) {
        throw new Error(`Failed to download video file. Status: ${videoResponse.statusText}`);
    }
    const videoBlob = await videoResponse.blob();
    return URL.createObjectURL(videoBlob);
  } catch(e) {
      const error = e as GeminiError;
      console.error("Gemini API Error (Video Generation):", error);
      if (error.message.includes("Requested entity was not found")) {
        throw new Error("API key not found or invalid. Please select a valid API key and try again.");
      }
      throw new Error(`Failed to generate video: ${error.message}`);
  }
};
