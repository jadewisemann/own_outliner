
import type { StateCreator } from 'zustand';
import type { OutlinerState, KeyAction, Keybinding, OutlinerSettings } from '@/types/outliner';
import { defaultKeybindings } from '@/utils/keybindings';

export interface SettingsSlice {
    settings: OutlinerSettings;
    setSetting: <K extends keyof OutlinerSettings>(key: K, value: OutlinerSettings[K]) => void;
    setKeybinding: (action: KeyAction, binding: Keybinding) => void;
    resetKeybindings: () => void;
}

const defaultSettings: OutlinerSettings = {
    theme: 'light',
    splitBehavior: 'auto',
    linkClickBehavior: 'edit',
    keybindings: defaultKeybindings as Record<KeyAction, Keybinding>,
    logicalOutdent: true,
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
