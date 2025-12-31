
import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Search, Plus, Settings, Info, Palette, Mic } from 'lucide-react';

const CommandPaletteModal: React.FC = () => {
    const { setActiveModal, startNewChat, settings, setSettings } = useAppContext();
    const [searchTerm, setSearchTerm] = useState('');

    const commands = useMemo(() => [
        { name: 'گفتگوی جدید', action: () => { startNewChat(); setActiveModal(null); }, icon: Plus },
        { name: 'باز کردن تنظیمات', action: () => setActiveModal('settings'), icon: Settings },
        { name: 'باز کردن درباره ما', action: () => setActiveModal('about'), icon: Info },
        { name: 'شروع مکالمه زنده', action: () => setActiveModal('live-chat'), icon: Mic },
        { name: 'تغییر تم به روشن', action: () => { setSettings(s => ({ ...s, theme: 'light' })); setActiveModal(null); }, icon: Palette },
        { name: 'تغییر تم به تاریک', action: () => { setSettings(s => ({ ...s, theme: 'dark' })); setActiveModal(null); }, icon: Palette },
    ], [startNewChat, setActiveModal, setSettings]);

    const filteredCommands = useMemo(() =>
        commands.filter(cmd => cmd.name.toLowerCase().includes(searchTerm.toLowerCase()))
    , [searchTerm, commands]);
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setActiveModal(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [setActiveModal]);


    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setActiveModal(null)}>
            <div className="bg-[var(--bg-secondary)] rounded-2xl shadow-xl w-full max-w-2xl mx-auto flex flex-col h-auto max-h-[60vh]" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-[var(--border-color)] flex items-center gap-3">
                    <Search size={20} className="text-[var(--text-secondary)]"/>
                    <input
                        type="text"
                        placeholder="یک دستور را تایپ کنید..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-transparent outline-none"
                        autoFocus
                    />
                </div>
                <div className="overflow-y-auto p-2">
                    {filteredCommands.length > 0 ? (
                        filteredCommands.map(({ name, action, icon: Icon }) => (
                            <button key={name} onClick={action} className="w-full text-right flex items-center gap-3 p-3 rounded-md hover:bg-gray-300/50 dark:hover:bg-gray-600/50">
                                <Icon size={18} />
                                <span>{name}</span>
                            </button>
                        ))
                    ) : (
                        <p className="text-center p-4 text-[var(--text-secondary)]">دستوری یافت نشد.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CommandPaletteModal;
