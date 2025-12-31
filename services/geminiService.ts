
import { GoogleGenAI, GenerateContentResponse, Part, GroundingChunk as ApiGroundingChunk, LiveServerMessage, Modality, Blob as GenAiBlob } from '@google/genai';
import { Settings, GroundingChunk } from '../types';

// Ensure process.env.API_KEY is available
const getApiKey = (settings: Settings): string => {
    return settings.apiKey || process.env.API_KEY || '';
};

const getAiClient = (settings: Settings) => {
    const apiKey = getApiKey(settings);
    if (!apiKey) {
        throw new Error("API key is not configured. Please set it in the application settings.");
    }
    return new GoogleGenAI({ apiKey });
};

const buildConfig = (settings: Settings) => {
    const config: any = {
        temperature: settings.temperature,
        topP: settings.topP,
        topK: settings.topK,
    };

    const tools: any[] = [];
    if (settings.useSearch) {
        tools.push({ googleSearch: {} });
    }
    if (settings.useMaps) {
        tools.push({ googleMaps: {} });
    }
     if (tools.length > 0) {
        config.tools = tools;
    }

    if (settings.useThinking) {
        config.thinkingConfig = { thinkingBudget: 32768 };
    }

    return config;
}

export const generateContent = async (
    settings: Settings,
    history: { role: 'user' | 'model'; parts: Part[] }[],
    signal: AbortSignal
): Promise<{ text: string, groundingChunks: GroundingChunk[] }> => {
    const ai = getAiClient(settings);
    const modelName = settings.useSearch ? 'gemini-3-flash-preview' : settings.useMaps ? 'gemini-2.5-flash' : settings.model;
    
    const config = buildConfig(settings);
    
    const contents = [...history];
    if (settings.systemPrompt) {
         contents.unshift({ role: 'user', parts: [{ text: `System instruction: ${settings.systemPrompt}` }] }, { role: 'model', parts: [{ text: 'OK.' }] });
    }
    
    const response = await ai.models.generateContent({
        model: modelName,
        contents: contents,
        config: config,
    });
    
    const text = response.text || "I'm sorry, I couldn't generate a response.";
    const apiGroundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks as ApiGroundingChunk[] || [];
    
    const groundingChunks: GroundingChunk[] = apiGroundingChunks.map(chunk => ({
        web: chunk.web,
        maps: chunk.maps,
    }));

    return { text, groundingChunks };
};

export async function* generateContentStream(
    settings: Settings,
    history: { role: 'user' | 'model'; parts: Part[] }[],
    signal: AbortSignal
): AsyncGenerator<string, void, undefined> {
    const ai = getAiClient(settings);
    const modelName = settings.useSearch ? 'gemini-3-flash-preview' : settings.model;

    const config = buildConfig(settings);
    
    const contents = [...history];
    if (settings.systemPrompt) {
         contents.unshift({ role: 'user', parts: [{ text: `System instruction: ${settings.systemPrompt}` }] }, { role: 'model', parts: [{ text: 'OK.' }] });
    }

    const responseStream = await ai.models.generateContentStream({
        model: modelName,
        contents: contents,
        config: config,
    });

    for await (const chunk of responseStream) {
        if (signal.aborted) {
            console.log("Stream aborted by user.");
            return;
        }
        yield chunk.text || "";
    }
}

export const generateImage = async (settings: Settings, prompt: string, aspectRatio: string, imageSize: string): Promise<{ base64: string, text: string }> => {
    if (!window.aistudio) {
        throw new Error("AI Studio context is not available.");
    }

    let hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
        await window.aistudio.openSelectKey();
    }
    
    const ai = getAiClient(settings);
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: { parts: [{ text: prompt }] },
            config: {
                imageConfig: { aspectRatio, imageSize },
            },
        });

        let base64 = '';
        let text = '';
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                base64 = part.inlineData.data;
            } else if (part.text) {
                text += part.text;
            }
        }

        if (!base64) {
            throw new Error("Image generation failed or did not return an image.");
        }
        return { base64, text };
    } catch (error: any) {
        if (error.message?.includes("Requested entity was not found.")) {
             await window.aistudio.openSelectKey();
             throw new Error("API key selection was required. Please try again.");
        }
        throw error;
    }
};

export const editImage = async (settings: Settings, prompt: string, imageBase64: string, mimeType: string): Promise<{ base64: string, text: string }> => {
    const ai = getAiClient(settings);
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { inlineData: { data: imageBase64, mimeType } },
                { text: prompt }
            ]
        }
    });

    let base64 = '';
    let text = '';
    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            base64 = part.inlineData.data;
        } else if (part.text) {
            text += part.text;
        }
    }
     if (!base64) {
        throw new Error("Image editing failed or did not return an image.");
    }
    return { base64, text };
};

export const generateSpeech = async (settings: Settings, prompt: string): Promise<string> => {
    const ai = getAiClient(settings);
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
            },
        },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
        throw new Error("Speech generation failed or did not return audio data.");
    }
    
    const audioBytes = decode(base64Audio);
    const blob = new Blob([audioBytes], { type: 'audio/webm' }); // PCM data, but browser can often handle it in a webm container
    return URL.createObjectURL(blob);
};


export const generateVideo = async (settings: Settings, prompt: string, imageBase64?: string, mimeType?: string, aspectRatio: '16:9' | '9:16' = '16:9') => {
    if (!window.aistudio) {
        throw new Error("AI Studio context is not available.");
    }

    let hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
        await window.aistudio.openSelectKey();
    }
    
    const ai = getAiClient(settings);
    
    const requestPayload: any = {
        model: 'veo-3.1-fast-generate-preview',
        prompt,
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: aspectRatio
        }
    };

    if (imageBase64 && mimeType) {
        requestPayload.image = {
            imageBytes: imageBase64,
            mimeType: mimeType,
        };
    }

    let operation = await ai.models.generateVideos(requestPayload);
    
    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        try {
            operation = await ai.operations.getVideosOperation({ operation: operation });
        } catch (error: any) {
            if (error.message?.includes("Requested entity was not found.")) {
                 await window.aistudio.openSelectKey();
                 throw new Error("API Key selection was required. Please try again.");
            }
            throw error;
        }
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error("Video generation did not return a valid video URI.");
    }
    
    const videoResponse = await fetch(`${downloadLink}&key=${getApiKey(settings)}`);
    if (!videoResponse.ok) {
        throw new Error(`Failed to fetch video: ${videoResponse.statusText}`);
    }

    const videoBlob = await videoResponse.blob();
    return URL.createObjectURL(videoBlob);
};

export const connectLive = (settings: Settings, onMessage: (message: LiveServerMessage) => void, onError: (error: Event) => void) => {
    const ai = getAiClient(settings);
    return ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
            onopen: () => console.log('Live session opened.'),
            onmessage: onMessage,
            onerror: (e: ErrorEvent) => {
                console.error('Live session error:', e);
                onError(e);
            },
            onclose: (e: CloseEvent) => console.log('Live session closed.'),
        },
        config: {
            responseModalities: [Modality.AUDIO],
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
            },
            systemInstruction: settings.systemPrompt,
        },
    });
};

export function createPcmBlob(data: Float32Array): GenAiBlob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

// Helper functions for audio encoding/decoding
export function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function decode(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

export async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}
