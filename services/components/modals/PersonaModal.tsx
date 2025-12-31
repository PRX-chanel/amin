
import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { X, Bot, Feather, Code2, MapPin, Languages } from 'lucide-react';
import toast from 'react-hot-toast';

const personas = {
    'دستیار عمومی': { icon: Bot, prompt: 'You are a helpful and friendly AI assistant.' },
    'نویسنده خلاق': { icon: Feather, prompt: 'تو یک نویسنده خلاق و داستان‌سرا هستی. پاسخ‌هایت باید سرشار از تصویرسازی و احساسات باشد.' },
    'کارشناس فنی': { icon: Code2, prompt: 'تو یک مهندس نرم‌افزار ارشد هستی. پاسخ‌هایت باید دقیق، فنی و همراه با مثال‌های کد در صورت نیاز باشد.' },
    'راهنمای سفر': { icon: MapPin, prompt: 'تو یک راهنمای سفر جهانی هستی. مکان‌های دیدنی، فرهنگ‌ها و نکات سفر را با جزئیات جذاب معرفی کن.' },
    'مترجم حرفه‌ای': { icon: Languages, prompt: 'تو یک مترجم حرفه‌ای مسلط به چندین زبان هستی. ترجمه‌هایت باید دقیق، روان و طبیعی باشد.' },
};

const PersonaModal: React.FC = () => {
    const { setSettings, setActiveModal } = useAppContext();

    const selectPersona = (name: string, prompt: string) => {
        setSettings(prev => ({ ...prev, systemPrompt: prompt }));
        setActiveModal(null);
        toast.success(`شخصیت به "${name}" تغییر کرد.`);
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--bg-secondary)] rounded-2xl shadow-xl p-6 w-full max-w-4xl mx-auto flex flex-col h-[80vh]">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h3 className="text-2xl font-bold">انتخاب شخصیت</h3>
                    <button onClick={() => setActiveModal(null)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <X size={20} />
                    </button>
                </div>
                <div className="flex-grow overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(personas).map(([name, { icon: Icon, prompt }]) => (
                        <button key={name} onClick={() => selectPersona(name, prompt)} className="text-right p-4 border border-[var(--border-color)] rounded-lg hover:border-[var(--accent-color)] hover:bg-gray-500/10 transition-all">
                            <Icon size={32} className="mb-2 text-[var(--accent-color)]" />
                            <h4 className="font-bold text-lg">{name}</h4>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PersonaModal;
