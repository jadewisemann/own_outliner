import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { temporal } from 'zundo';

import type { OutlinerState } from '@/types/outliner';
import { defaultKeybindings } from '@/utils/keybindings';
import { createNodeSlice } from '@/store/slices/nodeSlice';
import { createSelectionSlice } from '@/store/slices/selectionSlice';
import { createFocusSlice } from '@/store/slices/focusSlice';
import { createSettingsSlice } from '@/store/slices/settingsSlice';
import { createNavigationSlice } from '@/store/slices/navigationSlice';

const defaultSettings = {
    splitBehavior: 'auto' as const,
    linkClickBehavior: 'edit' as const,
    keybindings: defaultKeybindings,
};

export const useOutlinerStore = create<OutlinerState>()(
    temporal(
        persist(
            (...a) => ({
                ...createNodeSlice(...a),
                ...createSelectionSlice(...a),
                ...createFocusSlice(...a),
                ...createSettingsSlice(...a),
                ...createNavigationSlice(...a),
                flashId: null,
                backlinks: {},
            }),
            {
                name: 'outliner-storage',
                version: 6,
                migrate: (persistedState: unknown, version: number) => {
                    let state = persistedState as OutlinerState;
                    if (version === 0) {
                        state = {
                            ...state,
                            settings: {
                                ...defaultSettings,
                                ...state.settings,
                                keybindings: state.settings?.keybindings || defaultSettings.keybindings
                            }
                        };
                    }

                    if (version < 2) {
                        state = {
                            ...state,
                            settings: {
                                ...state.settings,
                                keybindings: {
                                    ...defaultKeybindings,
                                    ...(state.settings?.keybindings || {})
                                }
                            }
                        };
                    }

                    if (version < 3) {
                        state = {
                            ...state,
                            settings: {
                                ...state.settings,
                                keybindings: {
                                    ...defaultKeybindings,
                                    ...(state.settings?.keybindings || {})
                                }
                            }
                        };
                        if (!state.settings.keybindings.zoomIn) state.settings.keybindings.zoomIn = defaultKeybindings.zoomIn;
                        if (!state.settings.keybindings.zoomOut) state.settings.keybindings.zoomOut = defaultKeybindings.zoomOut;
                        const oldToggle = state.settings.keybindings.toggleCollapse;
                        if (oldToggle && oldToggle.key === '.' && !!oldToggle.meta) {
                            state.settings.keybindings.toggleCollapse = defaultKeybindings.toggleCollapse;
                        }
                    }

                    if (version < 4) {
                        state = {
                            ...state,
                            settings: {
                                ...state.settings,
                                keybindings: {
                                    ...defaultKeybindings,
                                    ...(state.settings?.keybindings || {})
                                }
                            }
                        };
                        if (!state.settings.keybindings.formatBold) state.settings.keybindings.formatBold = defaultKeybindings.formatBold;
                        if (!state.settings.keybindings.formatItalic) state.settings.keybindings.formatItalic = defaultKeybindings.formatItalic;
                        if (!state.settings.keybindings.formatStrike) state.settings.keybindings.formatStrike = defaultKeybindings.formatStrike;
                    }

                    if (version < 5) {
                        state = {
                            ...state,
                            settings: {
                                ...state.settings,
                                keybindings: {
                                    ...defaultKeybindings,
                                    ...(state.settings?.keybindings || {})
                                }
                            }
                        };
                        if (!state.settings.keybindings.undo) state.settings.keybindings.undo = defaultKeybindings.undo;
                        if (!state.settings.keybindings.redo) state.settings.keybindings.redo = defaultKeybindings.redo;
                    }

                    if (version < 6) {
                        // Rebuild backlinks index
                        const backlinks: Record<string, string[]> = {};
                        if (state.nodes) {
                            Object.values(state.nodes).forEach(node => {
                                const regex = /\(\(([a-zA-Z0-9-]+)\)\)/g;
                                const matches = [...node.content.matchAll(regex)].map(m => m[1]);
                                matches.forEach(targetId => {
                                    if (!backlinks[targetId]) backlinks[targetId] = [];
                                    if (!backlinks[targetId].includes(node.id)) {
                                        backlinks[targetId].push(node.id);
                                    }
                                });
                            });
                        }
                        state = {
                            ...state,
                            backlinks
                        };
                    }

                    return state;
                },
                partialize: (state) => {
                    const { selectedIds: _selectedIds, selectionAnchorId: _selectionAnchorId, focusedId: _focusedId, ...rest } = state;
                    return rest;
                },
                onRehydrateStorage: () => (state) => {
                    if (state) {
                        state.selectedIds = [];
                        state.selectionAnchorId = null;
                    }
                }
            }
        ),
        {
            partialize: (state) => {
                const { nodes, rootNodeId, focusedId, selectedIds, selectionAnchorId, hoistedNodeId } = state;
                return { nodes, rootNodeId, focusedId, selectedIds, selectionAnchorId, hoistedNodeId };
            },
            limit: 100,
        }
    )
);
