
export interface Message {
    id: string;
    role: 'user' | 'assistant';
    type: 'text' | 'image' | 'video' | 'audio' | 'code' | 'file' | 'grounding';
    content: any;
    timestamp: number;
    grounding?: GroundingChunk[];
}

export interface Chat {
    id:string;
    title: string;
    history: Message[];
    createdAt: number;
    isPinned?: boolean;
}

export interface CustomPrompt {
    id: string;
    title: string;
    prompt: string;
}

export interface CustomPersona {
    id: string;
    name: string;
    prompt: string;
}

export interface Settings {
    apiKey: string;
    theme: string;
    systemPrompt: string;
    model: string;
    historyLength: number;
    animations: boolean;
    fontSize: number;
    useSearch: boolean;
    useMaps: boolean;
    useThinking: boolean;
    customPrompts: CustomPrompt[];
    customPersonas: CustomPersona[];
    temperature: number;
    topP: number;
    topK: number;
    chatDensity: 'compact' | 'comfortable';
}

export type ModalType = 'settings' | 'about' | 'create' | 'persona' | 'prompt-library' | 'pro' | 'live-chat' | 'speech' | 'command-palette' | null;

export interface GroundingChunk {
    web?: {
        uri: string;
        title: string;
    };
    maps?: {
        uri: string;
        title: string;
    };
}
