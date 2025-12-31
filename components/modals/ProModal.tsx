
import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { X } from 'lucide-react';

const ProModal: React.FC = () => {
    const { setActiveModal } = useAppContext();

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--bg-secondary)] rounded-2xl shadow-xl w-full max-w-4xl mx-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-2xl font-bold">به دنیای حرفه‌ای‌ها خوش آمدید!</h3>
                        <button onClick={() => setActiveModal(null)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                            <X size={20} />
                        </button>
                    </div>
                    <p className="text-[var(--text-secondary)] mt-2">با عضویت ویژه، قفل تمام قابلیت‌ها را باز کنید.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-[var(--bg-primary)] rounded-b-2xl">
                    {/* Pricing tiers */}
                    <div className="border border-[var(--border-color)] rounded-lg p-6 bg-[var(--bg-secondary)] text-center">
                        <h4 className="font-bold text-lg">پایه</h4>
                        <p className="text-3xl font-bold my-4">$10 <span className="text-sm font-normal">/ماهانه</span></p>
                        <button className="mt-6 w-full p-2 rounded-lg border border-[var(--accent-color)] text-[var(--accent-color)]">شروع کنید</button>
                    </div>
                    <div className="border-2 border-[var(--accent-color)] rounded-lg p-6 bg-[var(--bg-secondary)] text-center relative">
                         <div className="absolute -top-3 right-1/2 translate-x-1/2 bg-[var(--accent-color)] text-white px-3 py-1 rounded-full text-xs font-bold">محبوب‌ترین</div>
                        <h4 className="font-bold text-lg">حرفه‌ای</h4>
                        <p className="text-3xl font-bold my-4">$25 <span className="text-sm font-normal">/ماهانه</span></p>
                        <button className="mt-6 w-full p-2 rounded-lg bg-[var(--accent-color)] text-white">همین حالا بخرید</button>
                    </div>
                     <div className="border border-[var(--border-color)] rounded-lg p-6 bg-[var(--bg-secondary)] text-center">
                        <h4 className="font-bold text-lg">سازمانی</h4>
                        <p className="text-3xl font-bold my-4">تماس بگیرید</p>
                        <button className="mt-6 w-full p-2 rounded-lg border border-[var(--accent-color)] text-[var(--accent-color)]">تماس با ما</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProModal;
