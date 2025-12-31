
import React, { useEffect, useRef, useState } from 'react';
import { PanelLeft, Download, Maximize, Minimize, Mic, Edit, Check, FileText, Image, BrainCircuit } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Message } from './Message';
import ChatInput from './ChatInput';
import SettingsModal from './modals/SettingsModal';
import AboutModal from './modals/AboutModal';
import CreateModal from './modals/CreateModal';
import PersonaModal from './modals/PersonaModal';
import PromptLibraryModal from './modals/PromptLibraryModal';
import ProModal from './modals/ProModal';
import LiveChatModal from './modals/LiveChatModal';

interface ChatViewProps {
    toggleSidebar: () => void;
}

const ChatView: React.FC<ChatViewProps> = ({ toggleSidebar }) => {
    const { currentChatId, conversations, activeModal, setActiveModal, updateChatTitle, regenerateLastResponse, settings } = useAppContext();
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [title, setTitle] = useState('');

    const currentChat = currentChatId ? conversations[currentChatId] : null;

    useEffect(() => {
        if (currentChat) {
            setTitle(currentChat.title);
        }
    }, [currentChat]);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [currentChat?.history]);

    const handleExport = () => {
        if (!currentChat) return;
        const dataStr = JSON.stringify(currentChat, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const exportFileDefaultName = `${currentChat.title.replace(/ /g, '_')}.json`;
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };
    
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullscreen(false);
            }
        }
    };
    
    const handleTitleSave = () => {
        if (currentChatId && title.trim()) {
            updateChatTitle(currentChatId, title.trim());
        }
        setIsEditingTitle(false);
    };

    useEffect(() => {
        const onFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', onFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
    }, []);

    const lastMessageIndex = currentChat ? currentChat.history.length - 1 : -1;

    return (
        <>
            <header className="flex items-center justify-between p-4 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/80 backdrop-blur-sm flex-shrink-0">
                <button onClick={toggleSidebar} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
                    <PanelLeft size={20} />
                </button>
                <div className="flex-1 text-center px-4 flex items-center justify-center gap-2">
                    {isEditingTitle && currentChat ? (
                        <input 
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onBlur={handleTitleSave}
                            onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
                            className="text-lg font-semibold bg-transparent border-b-2 border-[var(--accent-color)] outline-none text-center"
                            autoFocus
                        />
                    ) : (
                        <h1 className="text-lg font-semibold truncate">
                            {currentChat?.title || "استودیو هوش مصنوعی"}
                        </h1>
                    )}
                     {currentChat && (
                        <button onClick={() => { isEditingTitle ? handleTitleSave() : setIsEditingTitle(true) }} className="p-1 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                            {isEditingTitle ? <Check size={18} /> : <Edit size={18} />}
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setActiveModal('live-chat')} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700" title="مکالمه زنده">
                        <Mic size={20} />
                    </button>
                    {currentChat && (
                        <button onClick={handleExport} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700" title="خروجی گرفتن (JSON)">
                            <Download size={20} />
                        </button>
                    )}
                    <button onClick={toggleFullscreen} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700" title="تمام صفحه">
                        {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                    </button>
                </div>
            </header>

            <div ref={chatContainerRef} className={`flex-1 overflow-y-auto p-4 ${settings.chatDensity === 'compact' ? 'space-y-2' : 'space-y-6'}`}>
                {currentChat && currentChat.history.length > 0 ? (
                    currentChat.history.map((msg, index) => (
                        <Message 
                            key={msg.id || index} 
                            message={msg}
                            isLastMessage={index === lastMessageIndex && msg.role === 'assistant'}
                            onRegenerate={regenerateLastResponse}
                        />
                    ))
                ) : (
                    <WelcomeScreen />
                )}
            </div>

            <footer className="p-4 bg-transparent">
                <ChatInput />
            </footer>
            
            {activeModal === 'settings' && <SettingsModal />}
            {activeModal === 'about' && <AboutModal />}
            {activeModal === 'create' && <CreateModal />}
            {activeModal === 'persona' && <PersonaModal />}
            {activeModal === 'prompt-library' && <PromptLibraryModal />}
            {activeModal === 'pro' && <ProModal />}
            {activeModal === 'live-chat' && <LiveChatModal />}
        </>
    );
};

const WelcomeScreen = () => {
    const { setActiveModal } = useAppContext();
    return (
        <div className="text-center h-full flex flex-col justify-center items-center">
            <h2 className="text-4xl font-bold mb-2">استودیو هوش مصنوعی</h2>
            <p className="text-lg text-[var(--text-secondary)] mb-8">چطور می‌توانم امروز خلاقیت شما را شکوفا کنم؟</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                <WelcomeCard icon={FileText} title="نوشتن یک ایمیل" description="یک ایمیل حرفه‌ای برای درخواست همکاری پیش‌نویس کن." onClick={() => {}} />
                <WelcomeCard icon={Image} title="خلق یک تصویر" description="یک ربات را در حال اسکیت‌بورد سواری در فضا به تصویر بکش." onClick={() => setActiveModal('create')} />
                <WelcomeCard icon={BrainCircuit} title="طوفان فکری" description="برای یک اپلیکیشن موبایل جدید، چند ایده نام ارائه بده." onClick={() => {}} />
            </div>
        </div>
    );
};

const WelcomeCard: React.FC<{icon: React.ElementType, title: string, description: string, onClick: () => void}> = ({ icon: Icon, title, description, onClick }) => (
    <div onClick={onClick} className="p-4 text-right border border-[var(--border-color)] rounded-lg hover:border-[var(--accent-color)] hover:bg-gray-500/10 transition-all cursor-pointer">
        <Icon size={24} className="mb-2 text-[var(--accent-color)]" />
        <h4 className="font-bold">{title}</h4>
        <p className="text-sm text-[var(--text-secondary)]">{description}</p>
    </div>
);


export default ChatView;
