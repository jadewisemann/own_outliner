
import type { StateCreator } from 'zustand';
import type { OutlinerState, KeyAction, Keybinding } from '@/types/outliner';
import { defaultKeybindings } from '@/utils/keybindings';

export interface SettingsSlice {
    settings: {
        splitBehavior: 'auto' | 'sibling' | 'child';
        linkClickBehavior: 'edit' | 'select';
        keybindings: Record<KeyAction, Keybinding>;
    };
    setSetting: <K extends keyof SettingsSlice['settings']>(key: K, value: SettingsSlice['settings'][K]) => void;
    setKeybinding: (action: KeyAction, binding: Keybinding) => void;
    resetKeybindings: () => void;
}

const defaultSettings = {
    splitBehavior: 'auto' as const,
    linkClickBehavior: 'edit' as const,
    keybindings: defaultKeybindings as Record<KeyAction, Keybinding>,
};

export const createSettingsSlice: StateCreator<OutlinerState, [], [], SettingsSlice> = (set) => ({
    settings: defaultSettings,

    setSetting: (key, value) => set((state) => ({
        settings: { ...state.settings, [key]: value }
    })),

    setKeybinding: (action, binding) => set((state) => ({
        settings: {
            ...state.settings,
            keybindings: {
                ...state.settings.keybindings,
                [action]: binding
            }
        }
    })),

    resetKeybindings: () => set((state) => ({
        settings: {
            ...state.settings,
            keybindings: defaultSettings.keybindings
        }
    })),
});
