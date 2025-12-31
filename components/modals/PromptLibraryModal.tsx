
import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { X } from 'lucide-react';

// This would typically be fetched from a server or a more structured source
const promptLibrary = {
    'خلاقیت و تولید محتوا': [
        { title: 'طوفان فکری', prompt: 'برای [موضوع]، ۱۰ ایده خلاقانه ارائه بده.' },
        { title: 'نوشتن پست وبلاگ', prompt: 'یک پست وبلاگ جذاب درباره [موضوع] با لحنی [لحن، مثلا: دوستانه] بنویس.' },
    ],
    'برنامه‌نویسی': [
        { title: 'توضیح کد', prompt: 'این قطعه کد [زبان برنامه‌نویسی] را خط به خط توضیح بده:\n```\n\n```' },
        { title: 'نوشتن تابع', prompt: 'یک تابع به زبان [زبان برنامه‌نویسی] بنویس که [کاربرد تابع] را انجام دهد.' },
    ],
};


const PromptLibraryModal: React.FC = () => {
    const { setActiveModal } = useAppContext();
    
    // In a real app, you would pass the selected prompt back to the input
    const selectPrompt = (prompt: string) => {
        // For now, just log it. A better implementation would use a callback.
        console.log("Selected prompt:", prompt);
        setActiveModal(null);
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--bg-secondary)] rounded-2xl shadow-xl p-6 w-full max-w-4xl mx-auto flex flex-col h-[80vh]">
                 <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h3 className="text-2xl font-bold">کتابخانه دستورات</h3>
                     <button onClick={() => setActiveModal(null)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <X size={20} />
                    </button>
                </div>
                <div className="flex-grow overflow-y-auto space-y-4">
                    {Object.entries(promptLibrary).map(([category, prompts]) => (
                        <div key={category}>
                             <h4 className="font-bold mb-2">{category}</h4>
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {prompts.map(p => (
                                    <button key={p.title} onClick={() => selectPrompt(p.prompt)} className="p-3 text-sm text-right border border-[var(--border-color)] rounded-lg hover:border-[var(--accent-color)] hover:bg-gray-500/10 transition-all">
                                        {p.title}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PromptLibraryModal;
