
import React, { useState, useEffect } from 'react';
import { AppProvider } from './context/AppContext';
import Sidebar from './components/Sidebar';
import ChatView from './components/ChatView';
import { Toaster } from 'react-hot-toast';
import CommandPaletteModal from './components/modals/CommandPaletteModal';
import { useAppContext } from './context/AppContext';

const AppContent: React.FC = () => {
    const { activeModal, setActiveModal } = useAppContext();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setActiveModal('command-palette');
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [setActiveModal]);
    
    return activeModal === 'command-palette' ? <CommandPaletteModal /> : null;
};


const App: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    useEffect(() => {
        if (window.innerWidth < 768) {
            setIsSidebarOpen(false);
        }
    }, []);

    const toggleSidebar = () => setIsSidebarOpen(prev => !prev);

    return (
        <AppProvider>
            <div className="relative flex h-screen w-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
                <Toaster position="bottom-center" />
                
                {isSidebarOpen && window.innerWidth < 768 && (
                    <div 
                        className="fixed inset-0 bg-black bg-opacity-50 z-30" 
                        onClick={toggleSidebar}
                    ></div>
                )}
                
                <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
                
                <main className="flex-1 flex flex-col min-w-0">
                    <ChatView toggleSidebar={toggleSidebar} />
                </main>
                 <AppContent />
            </div>
        </AppProvider>
    );
};

export default App;
