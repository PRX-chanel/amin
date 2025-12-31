
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Chat, Settings, Message, ModalType, CustomPrompt, CustomPersona } from '../types';
import toast from 'react-hot-toast';
import { generateContentStream } from '../services/geminiService';
import { Part } from '@google/genai';

interface AppContextType {
    conversations: Record<string, Chat>;
    setConversations: React.Dispatch<React.SetStateAction<Record<string, Chat>>>;
    currentChatId: string | null;
    setCurrentChatId: (id: string | null) => void;
    settings: Settings;
    setSettings: React.Dispatch<React.SetStateAction<Settings>>;
    activeModal: ModalType;
    setActiveModal: (modal: ModalType) => void;
    addMessage: (chatId: string, message: Message) => void;
    updateMessage: (chatId: string, messageId: string, content: string) => void;
    startNewChat: () => string;
    updateChatTitle: (chatId: string, newTitle: string) => void;
    clearAllData: () => void;
    regenerateLastResponse: () => Promise<void>;
    addCustomPrompt: (prompt: Omit<CustomPrompt, 'id'>) => void;
    deleteCustomPrompt: (id: string) => void;
    addCustomPersona: (persona: Omit<CustomPersona, 'id'>) => void;
    deleteCustomPersona: (id: string) => void;
    importAllData: (jsonData: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_SETTINGS: Settings = {
    apiKey: '',
    theme: 'light',
    systemPrompt: 'You are a helpful and friendly AI assistant.',
    model: 'gemini-3-pro-preview',
    historyLength: 10,
    animations: true,
    fontSize: 14,
    useSearch: false,
    useMaps: false,
    useThinking: false,
    customPrompts: [],
    customPersonas: [],
    temperature: 0.9,
    topP: 1,
    topK: 1,
    chatDensity: 'comfortable',
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [conversations, setConversations] = useState<Record<string, Chat>>({});
    const [currentChatId, _setCurrentChatId] = useState<string | null>(null);
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
    const [activeModal, setActiveModal] = useState<ModalType>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        try {
            const savedState = localStorage.getItem('ai-studio-state');
            if (savedState) {
                const parsed = JSON.parse(savedState);
                setConversations(parsed.conversations || {});
                _setCurrentChatId(parsed.currentChatId || null);
                setSettings(prev => ({ 
                    ...prev, 
                    ...parsed.settings,
                }));
            }
        } catch (error) {
            console.error("Failed to load state from localStorage", error);
        }
        setIsLoaded(true);
    }, []);

    useEffect(() => {
        if (isLoaded) {
            try {
                const stateToSave = {
                    conversations,
                    currentChatId,
                    settings,
                };
                localStorage.setItem('ai-studio-state', JSON.stringify(stateToSave));
            } catch (error) {
                console.error("Failed to save state to localStorage", error);
            }
        }
    }, [conversations, currentChatId, settings, isLoaded]);
    
    useEffect(() => {
        document.body.className = `theme-${settings.theme} overflow-hidden`;
        document.documentElement.classList.toggle('dark', settings.theme === 'dark');
        document.documentElement.style.fontSize = `${settings.fontSize}px`;
    }, [settings.theme, settings.fontSize]);
    
    const setCurrentChatId = (id: string | null) => {
        _setCurrentChatId(id);
    };

    const addMessage = (chatId: string, message: Message) => {
        setConversations(prev => {
            const newConversations = { ...prev };
            if (newConversations[chatId]) {
                newConversations[chatId].history = [...newConversations[chatId].history, message];
            }
            return newConversations;
        });
    };
    
    const updateMessage = (chatId: string, messageId: string, newContent: string) => {
         setConversations(prev => {
            const newConversations = { ...prev };
            const chat = newConversations[chatId];
            if (chat) {
                const messageIndex = chat.history.findIndex(m => m.id === messageId);
                if (messageIndex !== -1) {
                    chat.history[messageIndex].content = newContent;
                }
            }
            return newConversations;
        });
    };

    const startNewChat = () => {
        const newId = `chat-${Date.now()}`;
        const newChat: Chat = {
            id: newId,
            title: 'گفتگوی جدید',
            history: [],
            createdAt: Date.now(),
            isPinned: false
        };
        setConversations(prev => ({ ...prev, [newId]: newChat }));
        setCurrentChatId(newId);
        return newId;
    };
    
    const updateChatTitle = (chatId: string, newTitle: string) => {
        setConversations(prev => {
            const newConversations = {...prev};
            if (newConversations[chatId]) {
                newConversations[chatId].title = newTitle;
            }
            return newConversations;
        });
        toast.success("عنوان گفتگو به‌روزرسانی شد.");
    };

    const clearAllData = () => {
        if(window.confirm("آیا مطمئن هستید که می‌خواهید تمام گفتگوها را حذف کنید؟ این عمل قابل بازگشت نیست.")) {
            setConversations({});
            setCurrentChatId(null);
            setSettings(DEFAULT_SETTINGS);
            localStorage.removeItem('ai-studio-state');
            toast.success("تمام داده‌ها پاک شدند.");
        }
    };
    
    const importAllData = (jsonData: string) => {
        try {
            const parsedData = JSON.parse(jsonData);
            if (parsedData.conversations && parsedData.settings) {
                setConversations(parsedData.conversations);
                setSettings({ ...DEFAULT_SETTINGS, ...parsedData.settings });
                toast.success("داده‌ها با موفقیت وارد شدند!");
            } else {
                toast.error("فایل JSON نامعتبر است.");
            }
        } catch (error) {
            toast.error("خطا در پردازش فایل JSON.");
        }
    };

    const regenerateLastResponse = async () => {
        if (!currentChatId) return;
        const chat = conversations[currentChatId];
        if (!chat || chat.history.length < 1) return;

        const lastAssistantMessageIndex = chat.history.map(m => m.role).lastIndexOf('assistant');
        const historyToResend = lastAssistantMessageIndex !== -1 ? chat.history.slice(0, lastAssistantMessageIndex) : [...chat.history];
        
        const lastUserMessage = historyToResend.slice().reverse().find(m => m.role === 'user');
        if (!lastUserMessage) {
            toast.error("No user message found to regenerate.");
            return;
        }

        setConversations(prev => ({ ...prev, [currentChatId]: {...chat, history: historyToResend } }));
        
        if (lastUserMessage.type === 'text') {
             try {
                const historyForApi = historyToResend.slice(-settings.historyLength) .map((msg): { role: 'user' | 'model'; parts: Part[] } => ({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [{ text: typeof msg.content === 'string' ? msg.content : msg.content.prompt || '' }],
                }));
                
                const aiMessageId = `msg-${Date.now() + 1}`;
                addMessage(currentChatId, { id: aiMessageId, role: 'assistant', type: 'text', content: '...', timestamp: Date.now() });

                let fullResponse = "";
                const stream = generateContentStream(settings, historyForApi, new AbortController().signal);
                for await (const chunk of stream) {
                    fullResponse += chunk;
                    updateMessage(currentChatId, aiMessageId, fullResponse);
                }
            } catch (error: any) {
                toast.error(`Error regenerating: ${error.message}`);
            }
        } else {
            toast.error("Regeneration for messages with files is not yet supported.");
        }
    };

    const addCustomPrompt = (prompt: Omit<CustomPrompt, 'id'>) => {
        setSettings(s => ({ ...s, customPrompts: [...s.customPrompts, { ...prompt, id: `prompt-${Date.now()}` }]}));
        toast.success("دستور سفارشی اضافه شد.");
    };
    const deleteCustomPrompt = (id: string) => {
        setSettings(s => ({ ...s, customPrompts: s.customPrompts.filter(p => p.id !== id) }));
        toast.success("دستور سفارشی حذف شد.");
    };
    const addCustomPersona = (persona: Omit<CustomPersona, 'id'>) => {
        setSettings(s => ({ ...s, customPersonas: [...s.customPersonas, { ...persona, id: `persona-${Date.now()}` }]}));
        toast.success("شخصیت سفارشی اضافه شد.");
    };
    const deleteCustomPersona = (id: string) => {
        setSettings(s => ({ ...s, customPersonas: s.customPersonas.filter(p => p.id !== id) }));
        toast.success("شخصیت سفارشی حذف شد.");
    };

    return (
        <AppContext.Provider value={{
            conversations, setConversations,
            currentChatId, setCurrentChatId,
            settings, setSettings,
            activeModal, setActiveModal,
            addMessage, updateMessage,
            startNewChat, updateChatTitle,
            clearAllData, regenerateLastResponse,
            addCustomPrompt, deleteCustomPrompt,
            addCustomPersona, deleteCustomPersona,
            importAllData,
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = (): AppContextType => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};
