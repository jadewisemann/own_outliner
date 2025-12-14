import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface PromptModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    initialValue: string;
    onConfirm: (value: string) => void;
    onCancel: () => void;
}

export const PromptModal: React.FC<PromptModalProps> = ({
    isOpen, title, message, initialValue, onConfirm, onCancel
}) => {
    const [value, setValue] = useState(initialValue);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setValue(initialValue);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen, initialValue]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl w-full max-w-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50">
                    <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">{title}</h3>
                </div>

                <div className="p-4 space-y-4">
                    <p className="text-sm text-neutral-600 dark:text-neutral-300 whitespace-pre-line leading-relaxed">
                        {message}
                    </p>

                    <form onSubmit={(e) => { e.preventDefault(); onConfirm(value); }}>
                        <input
                            ref={inputRef}
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500"
                        />

                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                type="button"
                                onClick={onCancel}
                                className="px-3 py-1.5 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-md transition-colors"
                            >
                                취소
                            </button>
                            <button
                                type="submit"
                                className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors"
                            >
                                확인
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>,
        document.body
    );
};
