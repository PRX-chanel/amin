
import React, { useState, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import { X, Image, Video, ImagePlus, Volume2 } from 'lucide-react';
import { generateImage, generateVideo, editImage, generateSpeech } from '../../services/geminiService';
import toast from 'react-hot-toast';

type CreateMode = 'image' | 'video' | 'edit-image' | 'speech' | null;

const CreateModal: React.FC = () => {
    const { settings, setActiveModal, currentChatId, addMessage, startNewChat } = useAppContext();
    const [mode, setMode] = useState<CreateMode>(null);
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [aspectRatio, setAspectRatio] = useState("1:1");
    const [imageSize, setImageSize] = useState("1K");
    const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16'>("16:9");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };
    
    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = error => reject(error);
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt && (mode !== 'video' && mode !== 'edit-image')) return;
        if (!imageFile && (mode === 'video' || mode === 'edit-image')) return;
        
        setIsLoading(true);
        try {
            let chatId = currentChatId;
            if(!chatId) {
                chatId = startNewChat();
            }

            if (mode === 'speech') {
                const audioUrl = await generateSpeech(settings, prompt);
                addMessage(chatId, { id: `msg-${Date.now()}`, role: 'assistant', type: 'audio', content: { text: prompt, url: audioUrl }, timestamp: Date.now() });
                const audio = new Audio(audioUrl);
                audio.play();
                toast.success('گفتار تولید و در گفتگو اضافه شد!');
            } else if (mode === 'image') {
                const { base64, text } = await generateImage(settings, prompt, aspectRatio, imageSize);
                const imageUrl = `data:image/png;base64,${base64}`;
                addMessage(chatId, { id: `msg-${Date.now()}`, role: 'assistant', type: 'image', content: { prompt: text || prompt, url: imageUrl }, timestamp: Date.now() });
                toast.success('تصویر با موفقیت ساخته شد!');
            } else if (mode === 'video' && imageFile) {
                const base64 = await fileToBase64(imageFile);
                const videoUrl = await generateVideo(settings, prompt, base64, imageFile.type, videoAspectRatio);
                addMessage(chatId, { id: `msg-${Date.now()}`, role: 'assistant', type: 'video', content: { prompt, url: videoUrl }, timestamp: Date.now() });
                toast.success('ویدیو با موفقیت ساخته شد!');
            } else if (mode === 'edit-image' && imageFile) {
                const base64 = await fileToBase64(imageFile);
                const result = await editImage(settings, prompt, base64, imageFile.type);
                const imageUrl = `data:image/png;base64,${result.base64}`;
                addMessage(chatId, { id: `msg-${Date.now()}`, role: 'assistant', type: 'image', content: { prompt: result.text || prompt, url: imageUrl }, timestamp: Date.now() });
                toast.success('تصویر با موفقیت ویرایش شد!');
            }
            setActiveModal(null);
        } catch (error: any) {
            toast.error(`Error: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const renderForm = () => {
        if (!mode) return null;
        return (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {(mode === 'video' || mode === 'edit-image') && (
                    <div>
                        <label className="block mb-2 font-semibold">انتخاب تصویر</label>
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full p-4 border-2 border-dashed border-[var(--border-color)] rounded-lg flex flex-col items-center justify-center hover:border-[var(--accent-color)]">
                           {imagePreview ? <img src={imagePreview} alt="Preview" className="max-h-32 rounded-md" /> : <ImagePlus size={32} className="text-[var(--text-secondary)]" />}
                           <span className="text-sm mt-2 text-[var(--text-secondary)]">{imageFile ? imageFile.name : 'برای انتخاب کلیک کنید'}</span>
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                    </div>
                )}
                
                <div>
                    <label htmlFor="create-prompt" className="block mb-2 font-semibold">{mode === 'speech' ? 'متن برای گفتار' : 'دستور (Prompt)'}</label>
                    <textarea id="create-prompt" value={prompt} onChange={e => setPrompt(e.target.value)} rows={4} className="w-full p-2 border border-[var(--border-color)] rounded-md bg-transparent" required />
                </div>
                
                {mode === 'image' && (
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block mb-2 font-semibold">نسبت تصویر</label>
                            <select value={aspectRatio} onChange={e => setAspectRatio(e.target.value)} className="w-full p-2 border border-[var(--border-color)] rounded-md bg-transparent">
                                <option>1:1</option><option>16:9</option><option>9:16</option><option>4:3</option><option>3:4</option>
                            </select>
                        </div>
                         <div>
                           <label className="block mb-2 font-semibold">اندازه تصویر</label>
                            <select value={imageSize} onChange={e => setImageSize(e.target.value)} className="w-full p-2 border border-[var(--border-color)] rounded-md bg-transparent">
                                <option>1K</option><option>2K</option><option>4K</option>
                            </select>
                        </div>
                    </div>
                )}
                 {mode === 'video' && (
                    <div>
                       <label className="block mb-2 font-semibold">نسبت تصویر ویدیو</label>
                        <select value={videoAspectRatio} onChange={e => setVideoAspectRatio(e.target.value as '16:9' | '9:16')} className="w-full p-2 border border-[var(--border-color)] rounded-md bg-transparent">
                            <option value="16:9">Landscape (16:9)</option>
                            <option value="9:16">Portrait (9:16)</option>
                        </select>
                    </div>
                )}

                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg">انصراف</button>
                    <button type="submit" disabled={isLoading} className="px-4 py-2 bg-[var(--accent-color)] text-white rounded-lg disabled:opacity-50">
                        {isLoading ? 'در حال ساخت...' : 'شروع کن!'}
                    </button>
                </div>
            </form>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--bg-secondary)] rounded-2xl shadow-xl p-6 w-full max-w-2xl mx-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">استودیو خلق</h3>
                    <button onClick={() => setActiveModal(null)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <X size={20} />
                    </button>
                </div>

                {!mode ? (
                    <>
                        <p className="text-[var(--text-secondary)] mb-6">ابزار مورد نظر خود را برای خلق کردن انتخاب کنید.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <CreateOption icon={Image} title="خلق تصویر" description="ایده‌های خود را به تصاویر هنری تبدیل کنید." onClick={() => setMode('image')} />
                            <CreateOption icon={Video} title="خلق ویدیو از تصویر" description="یک تصویر را به یک ویدیوی کوتاه تبدیل کنید." onClick={() => setMode('video')} />
                            <CreateOption icon={ImagePlus} title="ویرایش تصویر" description="یک تصویر موجود را با دستورات متنی تغییر دهید." onClick={() => setMode('edit-image')} />
                            <CreateOption icon={Volume2} title="تولید گفتار" description="متن را به صدای طبیعی و قابل پخش تبدیل کنید." onClick={() => setMode('speech')} />
                        </div>
                    </>
                ) : renderForm() }
            </div>
        </div>
    );
};

const CreateOption: React.FC<{ icon: React.ElementType, title: string, description: string, onClick: () => void }> = ({ icon: Icon, title, description, onClick }) => (
    <button onClick={onClick} className="text-right p-4 border border-[var(--border-color)] rounded-lg hover:border-[var(--accent-color)] hover:bg-gray-500/10 transition-all">
        <Icon size={32} className="mb-2 text-[var(--accent-color)]" />
        <h4 className="font-bold text-lg">{title}</h4>
        <p className="text-sm text-[var(--text-secondary)]">{description}</p>
    </button>
);

export default CreateModal;
