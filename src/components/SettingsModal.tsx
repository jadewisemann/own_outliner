import React, { useState, useEffect } from 'react';
import { useOutlinerStore } from '../store/useOutlinerStore';
import type { Keybinding, KeyAction } from '../types/outliner';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ACTION_LABELS: Record<KeyAction, string> = {
    splitNode: 'Split Node (New Line)',
    mergeNode: 'Merge Node (Backspace)',
    indentNode: 'Indent',
    outdentNode: 'Outdent',
    moveUp: 'Move Node Up',
    moveDown: 'Move Node Down',
    deleteNode: 'Delete Node',
    copyNode: 'Copy Node',
    cutNode: 'Cut Node',
    pasteNode: 'Paste Node',
    selectAll: 'Select All',
    toggleCollapse: 'Toggle Collapse',
};

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const settings = useOutlinerStore(state => state.settings);
    const setKeybinding = useOutlinerStore(state => state.setKeybinding);
    const resetKeybindings = useOutlinerStore(state => state.resetKeybindings);

    // Determine if we are recording a new key for a specific action
    const [recordingAction, setRecordingAction] = useState<KeyAction | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setRecordingAction(null);
        }
    }, [isOpen]);

    // Handle key recording
    useEffect(() => {
        if (!recordingAction) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            e.preventDefault();
            e.stopPropagation();

            // Ignore modifier-only presses
            if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return;

            const newBinding: Keybinding = {
                key: e.key,
                ctrl: e.ctrlKey,
                shift: e.shiftKey,
                alt: e.altKey,
                meta: e.metaKey,
            };

            setKeybinding(recordingAction, newBinding);
            setRecordingAction(null);
        };

        window.addEventListener('keydown', handleKeyDown, { capture: true });
        return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
    }, [recordingAction, setKeybinding]);

    if (!isOpen) return null;

    const formatBinding = (binding: Keybinding) => {
        const parts = [];
        if (binding.meta) parts.push('Cmd');
        if (binding.ctrl) parts.push('Ctrl');
        if (binding.alt) parts.push('Alt');
        if (binding.shift) parts.push('Shift');

        let keyLabel = binding.key;
        if (keyLabel === ' ') keyLabel = 'Space';
        // Capitalize single letters
        if (keyLabel.length === 1) keyLabel = keyLabel.toUpperCase();

        parts.push(keyLabel);
        return parts.join(' + ');
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                <header className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-800">Settings</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
                </header>

                <div className="flex-1 overflow-y-auto p-6">
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">Keybindings</h3>
                        <div className="grid grid-cols-1 gap-2">
                            {(Object.keys(ACTION_LABELS) as KeyAction[]).map((action) => (
                                <div key={action} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded border border-transparent hover:border-gray-100 transition-colors">
                                    <span className="text-gray-700 font-medium">{ACTION_LABELS[action]}</span>
                                    <button
                                        className={`px-4 py-2 rounded text-sm font-mono border min-w-[120px] text-center transition-all ${recordingAction === action
                                            ? 'bg-blue-500 text-white border-blue-600 shadow-inner'
                                            : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600'
                                            }`}
                                        onClick={() => setRecordingAction(action)}
                                    >
                                        {recordingAction === action ? 'Press keys...' : formatBinding(settings.keybindings[action])}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <footer className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
                    <button
                        onClick={() => {
                            if (confirm('Reset all keybindings to default?')) {
                                resetKeybindings();
                            }
                        }}
                        className="px-4 py-2 text-red-600 hover:bg-red-50 rounded text-sm font-medium transition-colors"
                    >
                        Reset Defaults
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors shadow-sm"
                    >
                        Done
                    </button>
                </footer>
            </div>
        </div>
    );
};
