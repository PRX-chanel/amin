
import React, { useState, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import { SlidersHorizontal, UserCog, Database, KeyRound, X, Sparkles, Trash2, Keyboard } from 'lucide-react';
import { CustomPrompt, CustomPersona } from '../../types';

type Tab = 'general' | 'personalization' | 'data' | 'api' | 'customization' | 'shortcuts';

const SettingsModal: React.FC = () => {
    const { settings, setSettings, setActiveModal, clearAllData, addCustomPrompt, deleteCustomPrompt, addCustomPersona, deleteCustomPersona, importAllData } = useAppContext();
    const [activeTab, setActiveTab] = useState<Tab>('general');
    const importFileRef = useRef<HTMLInputElement>(null);

    const handleSettingChange = (key: keyof typeof settings, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleExportAll = () => {
        const dataStr = JSON.stringify({ conversations: (window as any).__APP_STATE__?.conversations || {}, settings }, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const exportFileDefaultName = `ai_studio_export_${new Date().toISOString()}.json`;
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };
    
    const handleImportClick = () => {
        importFileRef.current?.click();
    };

    const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            importAllData(content);
        };
        reader.readAsText(file);
        event.target.value = ''; // Reset input
    };


    const tabs: { id: Tab, name: string, icon: React.ElementType }[] = [
        { id: 'general', name: 'عمومی', icon: SlidersHorizontal },
        { id: 'personalization', name: 'مدل هوش مصنوعی', icon: UserCog },
        { id: 'customization', name: 'شخصی‌سازی', icon: Sparkles },
        { id: 'data', name: 'مدیریت داده‌ها', icon: Database },
        { id: 'shortcuts', name: 'میانبرها', icon: Keyboard },
        { id: 'api', name: 'کلید API', icon: KeyRound },
    ];
    
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--bg-secondary)] rounded-2xl shadow-xl w-full max-w-5xl mx-auto flex h-[90vh] max-h-[800px]">
                <div className="w-1/4 min-w-[200px] border-l border-[var(--border-color)] p-4 flex flex-col">
                    <h2 className="text-xl font-bold mb-6 px-2">تنظیمات</h2>
                    <nav className="space-y-2">
                        {tabs.map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full text-right flex items-center gap-3 p-3 rounded-lg ${activeTab === tab.id ? 'bg-[var(--accent-color)] text-white font-semibold' : 'hover:bg-gray-300/50 dark:hover:bg-gray-600/50'}`}>
                                <tab.icon size={18} />
                                <span>{tab.name}</span>
                            </button>
                        ))}
                    </nav>
                    <div className="mt-auto">
                        <button onClick={() => setActiveModal(null)} className="w-full text-center p-2 bg-gray-200 dark:bg-gray-600 rounded-lg hover:opacity-90">بستن</button>
                    </div>
                </div>
                <div className="flex-1 p-8 overflow-y-auto">
                    {activeTab === 'general' && <GeneralTab settings={settings} onSettingChange={handleSettingChange} />}
                    {activeTab === 'personalization' && <PersonalizationTab settings={settings} onSettingChange={handleSettingChange} />}
                    {activeTab === 'customization' && <CustomizationTab settings={settings} onAddPersona={addCustomPersona} onDeletePersona={deleteCustomPersona} onAddPrompt={addCustomPrompt} onDeletePrompt={deleteCustomPrompt} />}
                    {activeTab === 'data' && <DataTab onExport={handleExportAll} onImport={handleImportClick} onClear={clearAllData} />}
                    {activeTab === 'shortcuts' && <ShortcutsTab />}
                    {activeTab === 'api' && <ApiTab settings={settings} onSettingChange={handleSettingChange} />}
                </div>
                 <input type="file" ref={importFileRef} className="hidden" accept=".json" onChange={handleFileImport} />
            </div>
        </div>
    );
};

// --- Child Components for Tabs ---

const Section: React.FC<{title: string, children: React.ReactNode}> = ({ title, children }) => (
    <div className="mb-8">
        <h3 className="text-xl font-bold mb-4 pb-2 border-b-2 border-[var(--accent-color)]">{title}</h3>
        <div className="space-y-6">{children}</div>
    </div>
);

const SettingRow: React.FC<{label: string, description: string, children: React.ReactNode}> = ({ label, description, children }) => (
    <div className="flex justify-between items-center">
        <div>
            <label className="block font-semibold">{label}</label>
            <p className="text-sm text-[var(--text-secondary)]">{description}</p>
        </div>
        {children}
    </div>
);

const GeneralTab: React.FC<{settings: any, onSettingChange: Function}> = ({ settings, onSettingChange }) => {
    const themes = [ { name: 'light', color: '#e5e7eb' }, { name: 'dark', color: '#1f2937' }, { name: 'ocean', color: '#00BCD4' }, { name: 'forest', color: '#4CAF50' }, { name: 'rose', color: '#E91E63' }];
    return (
        <Section title="تنظیمات عمومی">
            <SettingRow label="انتخاب تم" description="ظاهر برنامه را شخصی‌سازی کنید.">
                <div className="flex flex-wrap gap-2">
                     {themes.map(theme => ( <button key={theme.name} onClick={() => onSettingChange('theme', theme.name)} className={`w-8 h-8 rounded-full ring-2 ring-offset-2 ring-offset-[var(--bg-primary)] ${settings.theme === theme.name ? 'ring-[var(--accent-color)]' : 'ring-transparent'}`} style={{backgroundColor: theme.color}} title={theme.name}></button> ))}
                </div>
            </SettingRow>
             <SettingRow label="اندازه فونت" description="اندازه فونت کلی برنامه را تغییر دهید.">
                <div className="flex items-center gap-4">
                    <span>{settings.fontSize}px</span>
                    <input type="range" min="12" max="18" step="1" value={settings.fontSize} onChange={e => onSettingChange('fontSize', parseInt(e.target.value))} className="w-48" />
                </div>
            </SettingRow>
             <SettingRow label="تراکم چت" description="فاصله بین پیام‌ها در گفتگو.">
                 <div className="flex items-center rounded-lg p-1 bg-gray-200 dark:bg-gray-700">
                    <button onClick={() => onSettingChange('chatDensity', 'comfortable')} className={`px-3 py-1 text-sm rounded-md ${settings.chatDensity === 'comfortable' ? 'bg-white dark:bg-gray-500' : ''}`}>راحت</button>
                    <button onClick={() => onSettingChange('chatDensity', 'compact')} className={`px-3 py-1 text-sm rounded-md ${settings.chatDensity === 'compact' ? 'bg-white dark:bg-gray-500' : ''}`}>فشرده</button>
                </div>
            </SettingRow>
             <SettingRow label="انیمیشن تایپ" description="نمایش پاسخ به صورت تدریجی.">
                <input type="checkbox" className="w-5 h-5" checked={settings.animations} onChange={e => onSettingChange('animations', e.target.checked)} />
            </SettingRow>
        </Section>
    );
};

const PersonalizationTab: React.FC<{settings: any, onSettingChange: Function}> = ({ settings, onSettingChange }) => (
    <>
    <Section title="تنظیمات مدل">
        <SettingRow label="انتخاب مدل" description="مدل هوش مصنوعی را برای پاسخگویی انتخاب کنید.">
            <select value={settings.model} onChange={e => onSettingChange('model', e.target.value)} className="w-48 p-2 border border-[var(--border-color)] rounded-md bg-transparent">
                 <option value="gemini-3-pro-preview">Gemini 3 Pro</option>
                 <option value="gemini-3-flash-preview">Gemini 3 Flash</option>
            </select>
        </SettingRow>
        <div>
            <label className="block font-semibold mb-2">شخصیت هوش مصنوعی (System Prompt)</label>
            <p className="text-sm text-[var(--text-secondary)] mb-2">به هوش مصنوعی بگویید چه نقشی را ایفا کند.</p>
            <textarea value={settings.systemPrompt} onChange={e => onSettingChange('systemPrompt', e.target.value)} rows={4} className="w-full p-2 border border-[var(--border-color)] rounded-md bg-transparent" />
        </div>
         <SettingRow label="استفاده از جستجوی گوگل" description="برای پاسخ‌های به‌روز از جستجوی گوگل استفاده شود.">
             <input type="checkbox" className="w-5 h-5" checked={settings.useSearch} onChange={e => onSettingChange('useSearch', e.target.checked)} />
        </SettingRow>
    </Section>
    <Section title="پارامترهای پیشرفته">
         <SettingRow label="دما (Temperature)" description="مقادیر بالاتر خلاقانه‌تر، مقادیر پایین‌تر دقیق‌تر.">
             <div className="flex items-center gap-4">
                <span className="font-mono">{Number(settings.temperature).toFixed(1)}</span>
                <input type="range" min="0" max="1" step="0.1" value={settings.temperature} onChange={e => onSettingChange('temperature', parseFloat(e.target.value))} className="w-48" />
             </div>
        </SettingRow>
         <SettingRow label="Top-P" description="احتمال تجمعی برای نمونه‌برداری.">
              <div className="flex items-center gap-4">
                <span className="font-mono">{Number(settings.topP).toFixed(1)}</span>
                <input type="range" min="0" max="1" step="0.1" value={settings.topP} onChange={e => onSettingChange('topP', parseFloat(e.target.value))} className="w-48" />
             </div>
        </SettingRow>
         <SettingRow label="Top-K" description="تعداد توکن‌های برتر برای نمونه‌برداری.">
              <div className="flex items-center gap-4">
                <span className="font-mono">{settings.topK}</span>
                <input type="range" min="1" max="50" step="1" value={settings.topK} onChange={e => onSettingChange('topK', parseInt(e.target.value))} className="w-48" />
             </div>
        </SettingRow>
         <SettingRow label="طول تاریخچه" description="تعداد پیام‌های قبلی برای ارسال به مدل.">
            <input type="number" min="0" max="50" value={settings.historyLength} onChange={e => onSettingChange('historyLength', parseInt(e.target.value))} className="w-24 p-2 border border-[var(--border-color)] rounded-md bg-transparent text-center" />
        </SettingRow>
    </Section>
    </>
);

const CustomizationTab: React.FC<{settings: any, onAddPersona: Function, onDeletePersona: Function, onAddPrompt: Function, onDeletePrompt: Function}> = (props) => (
     <>
        <Section title="شخصیت‌های سفارشی">
             <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                {props.settings.customPersonas.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between p-2 pl-3 bg-[var(--bg-primary)] rounded-md">
                        <p>{p.name} - <span className="text-sm text-[var(--text-secondary)] truncate">"{p.prompt}"</span></p>
                        <button onClick={() => props.onDeletePersona(p.id)} className="p-1 text-red-500 hover:bg-red-100 rounded-full"><Trash2 size={16} /></button>
                    </div>
                ))}
            </div>
            <CustomForm type="persona" onAdd={(item) => props.onAddPersona(item as any)} />
        </Section>
        <Section title="کتابخانه دستورات">
             <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                 {props.settings.customPrompts.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between p-2 pl-3 bg-[var(--bg-primary)] rounded-md">
                         <p>{p.title} - <span className="text-sm text-[var(--text-secondary)] truncate">"{p.prompt}"</span></p>
                        <button onClick={() => props.onDeletePrompt(p.id)} className="p-1 text-red-500 hover:bg-red-100 rounded-full"><Trash2 size={16} /></button>
                    </div>
                ))}
            </div>
            <CustomForm type="prompt" onAdd={(item) => props.onAddPrompt(item as any)} />
        </Section>
     </>
);

const DataTab: React.FC<{ onExport: any, onImport: any, onClear: any }> = ({ onExport, onImport, onClear }) => (
    <Section title="مدیریت داده‌ها">
        <SettingRow label="ورود و خروج" description="از داده‌های خود پشتیبان بگیرید یا آن‌ها را بازیابی کنید.">
            <div className="flex gap-2">
                <button onClick={onImport} className="px-4 py-2 border border-[var(--border-color)] rounded-lg">وارد کردن</button>
                <button onClick={onExport} className="px-4 py-2 bg-[var(--accent-color)] text-white rounded-lg">خروجی گرفتن</button>
            </div>
        </SettingRow>
        <SettingRow label="حذف تمام داده‌ها" description="تمام گفتگوها و تنظیمات را برای همیشه حذف کنید.">
            <button onClick={onClear} className="px-4 py-2 bg-red-600 text-white rounded-lg">حذف همه</button>
        </SettingRow>
    </Section>
);

const ShortcutsTab: React.FC = () => (
    <Section title="میانبرهای صفحه کلید">
        <ul className="space-y-3">
            <li className="flex items-center justify-between"><span className="text-[var(--text-secondary)]">باز کردن پالت دستورات</span><kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">⌘/Ctrl + K</kbd></li>
            <li className="flex items-center justify-between"><span className="text-[var(--text-secondary)]">ارسال پیام</span><kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">Enter</kbd></li>
            <li className="flex items-center justify-between"><span className="text-[var(--text-secondary)]">رفتن به خط جدید</span><kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">Shift + Enter</kbd></li>
            <li className="flex items-center justify-between"><span className="text-[var(--text-secondary)]">نمایش دستورات اسلش</span><kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">/</kbd></li>
        </ul>
    </Section>
);


const ApiTab: React.FC<{settings: any, onSettingChange: Function}> = ({ settings, onSettingChange }) => (
    <Section title="کلید API">
        <div>
            <label className="block font-semibold mb-2">کلید API گوگل</label>
            <p className="text-sm text-[var(--text-secondary)] mb-2">کلید شما به صورت امن در مرورگر شما ذخیره می‌شود.</p>
            <input type="password" value={settings.apiKey} onChange={e => onSettingChange('apiKey', e.target.value)} placeholder="کلید خود را اینجا وارد کنید..." className="w-full p-2 text-sm border border-[var(--border-color)] rounded-md bg-transparent" />
             <p className="text-xs text-[var(--text-secondary)] mt-2">می‌توانید کلید خود را از <a href="https://ai.google.dev/gemini-api/docs/api-key" target="_blank" rel="noopener noreferrer" className="text-[var(--accent-color)]">اینجا</a> دریافت کنید.</p>
        </div>
    </Section>
);

const CustomForm: React.FC<{type: 'prompt' | 'persona', onAdd: (item: Omit<CustomPrompt, 'id'> | Omit<CustomPersona, 'id'>) => void}> = ({ type, onAdd }) => {
    const [title, setTitle] = useState('');
    const [prompt, setPrompt] = useState('');
    const isPersona = type === 'persona';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (title.trim() && prompt.trim()) {
            onAdd(isPersona ? { name: title, prompt } : { title, prompt });
            setTitle('');
            setPrompt('');
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="p-4 border border-dashed border-[var(--border-color)] rounded-lg mt-4">
            <h4 className="font-semibold mb-2">اضافه کردن {isPersona ? 'شخصیت' : 'دستور'} جدید</h4>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder={isPersona ? 'نام شخصیت...' : 'عنوان دستور...'} className="w-full p-2 mb-2 border border-[var(--border-color)] rounded-md bg-transparent" required />
            <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="دستور کامل را اینجا وارد کنید..." rows={3} className="w-full p-2 mb-2 border border-[var(--border-color)] rounded-md bg-transparent" required />
            <button type="submit" className="px-4 py-2 bg-[var(--accent-color)] text-white rounded-lg w-full">ذخیره</button>
        </form>
    )
};

export default SettingsModal;
