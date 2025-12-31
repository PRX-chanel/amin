
import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { X } from 'lucide-react';

const AboutModal: React.FC = () => {
    const { setActiveModal } = useAppContext();

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--bg-secondary)] rounded-2xl shadow-xl p-6 w-full max-w-2xl mx-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold">درباره استودیو هوش مصنوعی</h3>
                    <button onClick={() => setActiveModal(null)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <X size={20} />
                    </button>
                </div>
                <div className="space-y-4 text-justify text-[var(--text-primary)]">
                    <p>این یک نسخه مدرن از استودیوی هوش مصنوعی است که با استفاده از React، TypeScript و Tailwind CSS بازنویسی شده است تا قابلیت‌های پیشرفته Gemini API را به نمایش بگذارد.</p>
                </div>
            </div>
        </div>
    );
};

export default AboutModal;
