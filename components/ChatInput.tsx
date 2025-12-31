
import React, { useState, useRef, useEffect } from 'react';
import { Paperclip, Mic, ArrowUp, Sparkles, Square, Bot, Image, Volume2, RefreshCw } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { generateContent, generateContentStream, generateImage, generateSpeech } from '../services/geminiService';
import toast from 'react-hot-toast';
import { Part } from '@google/genai';

const slashCommands = [
    { command: 'imagine', icon: Image, description: 'خلق یک تصویر با هوش مصنوعی' },
    { command: 'speak', icon: Volume2, description: 'تبدیل متن به گفتار' },
    { command: 'regenerate', icon: RefreshCw, description: 'بازسازی آخرین پاسخ' },
];

const ChatInput: React.FC = () => {
    const { currentChatId, addMessage, updateMessage, settings, conversations, setActiveModal, startNewChat, regenerateLastResponse } = useAppContext();
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [showSlashCommands, setShowSlashCommands] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
        setShowSlashCommands(input.startsWith('/'));
    }, [input]);

    const handleSlashCommand = async (command: string, args: string) => {
        let chatId = currentChatId;
        if (!chatId) {
            chatId = startNewChat();
        }

        setIsSending(true);
        setInput('');

        try {
            switch(command) {
                case 'imagine':
                    if (!args) {
                        toast.error("لطفاً یک دستور برای تصویر وارد کنید.");
                        return;
                    }
                    toast.loading('در حال ساخت تصویر...');
                    const { base64, text } = await generateImage(settings, args, "1:1", "1K");
                    toast.dismiss();
                    const imageUrl = `data:image/png;base64,${base64}`;
                    addMessage(chatId, { id: `msg-${Date.now()}`, role: 'assistant', type: 'image', content: { prompt: text || args, url: imageUrl }, timestamp: Date.now() });
                    toast.success('تصویر با موفقیت ساخته شد!');
                    break;
                case 'speak':
                     if (!args) {
                        toast.error("لطفاً متنی برای تبدیل به گفتار وارد کنید.");
                        return;
                    }
                    toast.loading('در حال تولید گفتار...');
                    const audioUrl = await generateSpeech(settings, args);
                    toast.dismiss();
                    addMessage(chatId, { id: `msg-${Date.now()}`, role: 'assistant', type: 'audio', content: { text: args, url: audioUrl }, timestamp: Date.now() });
                    const audio = new Audio(audioUrl);
                    audio.play();
                    break;
                case 'regenerate':
                    await regenerateLastResponse();
                    break;
                default:
                    toast.error(`دستور ناشناخته: /${command}`);
            }
        } catch (error: any) {
            toast.dismiss();
            toast.error(`Error: ${error.message}`);
        } finally {
            setIsSending(false);
        }
    };

    const handleSend = async (userInput: string) => {
        if (userInput.startsWith('/')) {
            const [command, ...args] = userInput.slice(1).split(' ');
            handleSlashCommand(command, args.join(' '));
            return;
        }

        let chatId = currentChatId;
        if (!chatId) {
            chatId = startNewChat();
        }

        const trimmedInput = userInput.trim();
        if (!trimmedInput) return;

        setIsSending(true);
        setInput('');
        abortControllerRef.current = new AbortController();
        
        addMessage(chatId, { id: `msg-${Date.now()}`, role: 'user', type: 'text', content: trimmedInput, timestamp: Date.now() });

        try {
            const currentChat = conversations[chatId];
            const history = currentChat.history.slice(0, -1) .slice(-settings.historyLength) .map((msg): { role: 'user' | 'model'; parts: Part[] } => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: typeof msg.content === 'string' ? msg.content : msg.content.prompt || '' }],
            }));
            const historyWithCurrentUserMessage = [...history, { role: 'user' as const, parts: [{ text: trimmedInput }] }];

            if (settings.animations) {
                const aiMessageId = `msg-${Date.now() + 1}`;
                addMessage(chatId, { id: aiMessageId, role: 'assistant', type: 'text', content: '', timestamp: Date.now() });

                let fullResponse = "";
                const stream = generateContentStream(settings, historyWithCurrentUserMessage, abortControllerRef.current.signal);
                for await (const chunk of stream) {
                    fullResponse += chunk;
                    updateMessage(chatId, aiMessageId, fullResponse);
                }
            } else {
                const { text, groundingChunks } = await generateContent(settings, historyWithCurrentUserMessage, abortControllerRef.current.signal);
                const aiMessageId = `msg-${Date.now() + 1}`;
                addMessage(chatId, { id: aiMessageId, role: 'assistant', type: 'grounding', content: text, grounding: groundingChunks, timestamp: Date.now() });
            }
        } catch (error: any) {
            toast.error(`Error: ${error.message}`);
        } finally {
            setIsSending(false);
            abortControllerRef.current = null;
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend(input);
        }
    };
    
    const stopSending = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            setIsSending(false);
        }
    };

    return (
        <div className="relative">
             {showSlashCommands && (
                <div className="absolute bottom-full mb-2 w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg shadow-lg p-2">
                    {slashCommands.map(({ command, icon: Icon, description }) => (
                        <button key={command} onClick={() => setInput(`/${command} `)} className="w-full text-right flex items-center gap-3 p-2 rounded-md hover:bg-gray-300/50 dark:hover:bg-gray-600/50">
                            <Icon size={18} />
                            <div>
                                <span className="font-bold">{command}</span>
                                <span className="text-sm text-[var(--text-secondary)] ml-2">{description}</span>
                            </div>
                        </button>
                    ))}
                </div>
            )}
             {isSending && !input.startsWith('/') && (
                 <div className="flex items-center justify-center mx-auto mb-2">
                    <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                        <div className="w-5 h-5 border-2 border-dashed rounded-full animate-spin border-[var(--accent-color)]"></div>
                        <span>در حال پردازش...</span>
                        <button onClick={stopSending} className="bg-red-500 text-white p-2 rounded-full" title="توقف"><Square size={16} /></button>
                    </div>
                </div>
            )}
            <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }} className="flex items-end gap-2 bg-[var(--bg-secondary)] p-3 rounded-2xl shadow-lg border border-[var(--border-color)]">
                <button type="button" onClick={() => setActiveModal('live-chat')} className="p-2 self-center flex-shrink-0 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" title="مکالمه زنده">
                    <Mic size={20} />
                </button>
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="یک پیام بنویسید یا از / برای دستورات استفاده کنید..."
                    className="flex-1 bg-transparent focus-outline-none resize-none px-2 py-2 max-h-48"
                    rows={1}
                    disabled={isSending}
                />
                <button type="button" onClick={() => setActiveModal('create')} className="p-2 self-center flex-shrink-0 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" title="خلق کردن">
                    <Sparkles size={20} />
                </button>
                <button type="submit" disabled={isSending || !input.trim()} className="bg-[var(--accent-color)] text-white p-3 self-center flex-shrink-0 rounded-full transition-colors hover:bg-[var(--accent-color-dark)] disabled:opacity-50 disabled:cursor-not-allowed">
                    <ArrowUp size={20} />
                </button>
            </form>
        </div>
    );
};

export default ChatInput;
