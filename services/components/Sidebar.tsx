
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Icon, PlusSquare, Trash2, Pin, Import, Library, Zap, Settings, Info, UserCircle } from 'lucide-react';

interface SidebarProps {
    isOpen: boolean;
    toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
    const { conversations, currentChatId, setCurrentChatId, startNewChat, setConversations, setActiveModal } = useAppContext();
    const [searchTerm, setSearchTerm] = useState('');

    const sortedConversations = useMemo(() => {
        return Object.values(conversations)
            .filter(chat => chat.title.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => (b.isPinned ? 1 : -1) - (a.isPinned ? 1 : -1) || b.createdAt - a.createdAt);
    }, [conversations, searchTerm]);

    const deleteChat = (e: React.MouseEvent, chatId: string) => {
        e.stopPropagation();
        setConversations(prev => {
            const newConversations = { ...prev };
            delete newConversations[chatId];
            return newConversations;
        });
        if (currentChatId === chatId) {
            const remainingChats = Object.keys(conversations).filter(id => id !== chatId);
            setCurrentChatId(remainingChats.length > 0 ? remainingChats[0] : null);
        }
    };
    
    const togglePin = (e: React.MouseEvent, chatId: string) => {
        e.stopPropagation();
        setConversations(prev => ({
            ...prev,
            [chatId]: { ...prev[chatId], isPinned: !prev[chatId].isPinned }
        }));
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedChat = JSON.parse(e.target?.result as string);
                if (importedChat.id && importedChat.title && Array.isArray(importedChat.history)) {
                    setConversations(prev => ({...prev, [importedChat.id]: importedChat}));
                    setCurrentChatId(importedChat.id);
                } else {
                    alert('Invalid chat file format.');
                }
            } catch (err) {
                alert('Error parsing chat file.');
            }
        };
        reader.readAsText(file);
    };

    return (
        <aside
            className={`h-full w-72 bg-[var(--sidebar-bg)] flex flex-col z-40 border-l border-[var(--border-color)] shadow-lg transition-transform duration-300 ease-in-out flex-shrink-0
            ${isOpen ? 'translate-x-0' : 'translate-x-full'}
            md:relative md:translate-x-0 ${!isOpen && 'md:w-0 md:p-0 md:border-none'}`}
        >
            <div className={`p-4 flex justify-between items-center border-b border-[var(--border-color)] ${!isOpen && 'md:hidden'}`}>
                <h2 className="font-bold text-lg">تاریخچه</h2>
                <div className="flex items-center">
                    <label htmlFor="import-chat-input" className="p-2 rounded-md hover:bg-gray-300/50 dark:hover:bg-gray-600/50 cursor-pointer" title="ورود گفتگو">
                        <Import size={18} />
                    </label>
                    <input type="file" id="import-chat-input" className="hidden" accept=".json" onChange={handleImport} />
                    <button onClick={startNewChat} className="p-2 rounded-md hover:bg-gray-300/50 dark:hover:bg-gray-600/50" title="گفتگوی جدید">
                        <PlusSquare size={18} />
                    </button>
                </div>
            </div>

            <div className={`p-2 border-b border-[var(--border-color)] ${!isOpen && 'md:hidden'}`}>
                <input
                    type="search"
                    placeholder="جستجو در گفتگوها..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2 text-sm border border-[var(--border-color)] rounded-md bg-transparent focus:ring-2 focus:ring-[var(--accent-color)] outline-none"
                />
            </div>
            
            <nav className={`flex-1 overflow-y-auto p-2 space-y-1 ${!isOpen && 'md:hidden'}`}>
                {sortedConversations.map(chat => (
                    <div key={chat.id} className="flex items-center group">
                        <button
                            onClick={() => setCurrentChatId(chat.id)}
                            className={`flex-1 text-right p-2 rounded-md truncate ${currentChatId === chat.id ? 'bg-blue-100 dark:bg-gray-700' : 'hover:bg-gray-300/50 dark:hover:bg-gray-600/50'}`}
                        >
                            {chat.title}
                        </button>
                        <button onClick={(e) => togglePin(e, chat.id)} className="p-2 rounded-md text-gray-500 hover:bg-yellow-200 hover:text-yellow-600 opacity-0 group-hover:opacity-100 transition-opacity" title="پین کردن">
                            <Pin size={16} className={chat.isPinned ? 'fill-current text-yellow-500' : ''} />
                        </button>
                        <button onClick={(e) => deleteChat(e, chat.id)} className="p-2 rounded-md text-gray-500 hover:bg-red-200 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity" title="حذف">
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </nav>

            <div className={`p-3 border-t border-[var(--border-color)] space-y-2 ${!isOpen && 'md:hidden'}`}>
                <SidebarButton icon={UserCircle} text="انتخاب شخصیت" onClick={() => setActiveModal('persona')} />
                <SidebarButton icon={Library} text="کتابخانه دستورات" onClick={() => setActiveModal('prompt-library')} />
                <button
                    onClick={() => setActiveModal('pro')}
                    className="w-full text-white font-bold flex items-center justify-center gap-3 p-3 rounded-lg hover:opacity-90 transition-opacity" style={{ background: 'var(--pro-bg)' }}
                >
                    <Zap size={18} /><span>ارتقاء به پرو</span>
                </button>
                <SidebarButton icon={Settings} text="تنظیمات" onClick={() => setActiveModal('settings')} />
                <SidebarButton icon={Info} text="درباره ما" onClick={() => setActiveModal('about')} />
            </div>
        </aside>
    );
};

interface SidebarButtonProps {
    icon: Icon;
    text: string;
    onClick: () => void;
}

const SidebarButton: React.FC<SidebarButtonProps> = ({ icon: IconComponent, text, onClick }) => (
    <button onClick={onClick} className="w-full text-right flex items-center gap-3 p-2 rounded-md hover:bg-gray-300/50 dark:hover:bg-gray-600/50">
        <IconComponent size={18} />
        <span>{text}</span>
    </button>
);


export default Sidebar;
