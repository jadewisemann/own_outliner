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
                version: 8,
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
                        // Missing migration logic
                        // But we just need to ensure structure is fine
                    }

                    if (version < 4) {
                        if (!state.settings) {
                            state.settings = {
                                theme: 'light',
                                splitBehavior: 'auto',
                                linkClickBehavior: 'navigate',
                                keybindings: defaultKeybindings
                            };
                        } else if (!state.settings.linkClickBehavior) {
                            state.settings.linkClickBehavior = 'navigate';
                        }
                    }

                    if (version < 5) {
                        state.backlinks = {};
                    }

                    if (version < 7) {
                        // Rebuild backlinks index with updated regex support (both ((ID)) and [Label](UUID))
                        const backlinks: Record<string, string[]> = {};
                        if (state.nodes) {
                            Object.values(state.nodes).forEach(node => {
                                const ids: string[] = [];
                                // Legacy
                                for (const match of node.content.matchAll(/\(\(([a-zA-Z0-9-]+)\)\)/g)) ids.push(match[1]);
                                // New Standard
                                for (const match of node.content.matchAll(/\[[^\]]*\]\(([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\)/gi)) ids.push(match[1]);

                                [...new Set(ids)].forEach(targetId => {
                                    if (!backlinks[targetId]) backlinks[targetId] = [];
                                    if (!backlinks[targetId].includes(node.id)) {
                                        backlinks[targetId].push(node.id);
                                    }
                                });
                            });
                        }
                        state = { ...state, backlinks };
                    }

                    if (version < 8) {
                        // Rebuild backlinks index with RELAXED regex support (both ((ID)) and [Label](alphanumeric))
                        const backlinks: Record<string, string[]> = {};
                        if (state.nodes) {
                            Object.values(state.nodes).forEach(node => {
                                const ids: string[] = [];
                                // Legacy
                                for (const match of node.content.matchAll(/\(\(([a-zA-Z0-9-]+)\)\)/g)) ids.push(match[1]);
                                // New Standard (Short IDs + UUIDs)
                                for (const match of node.content.matchAll(/\[[^\]]*\]\(([a-zA-Z0-9-]+)\)/g)) ids.push(match[1]);

                                [...new Set(ids)].forEach(targetId => {
                                    if (!backlinks[targetId]) backlinks[targetId] = [];
                                    if (!backlinks[targetId].includes(node.id)) {
                                        backlinks[targetId].push(node.id);
                                    }
                                });
                            });
                        }
                        state = { ...state, backlinks };
                    }

                    return state;
                },
                partialize: (state) => {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { selectedIds, selectionAnchorId, focusedId, flashId, ...rest } = state;
                    return rest;
                },
                onRehydrateStorage: () => (state) => {
                    if (state) {
                        state.selectedIds = [];
                        state.selectionAnchorId = null;
                        state.flashId = null;
                        state.hoistedNodeId = state.hoistedNodeId || null;
                    }
                },
            }
        ),
        {
            limit: 100,
        }
    )
);
