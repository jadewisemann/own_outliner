import { createStore } from "zustand";

import type { OutlineData } from "../types";

type ID = OutlineData['id'];

type DataStore = {
  data: Record<ID, OutlineData>;
  dataOrder: ID[];
  openNodes: Set<ID>;
  getDataById: (id: ID) => OutlineData | undefined;
  addData: (data: OutlineData) => void;
  updateData: (id: ID, updates: Partial<OutlineData>) => void;
  removeData: (id: ID) => void;
  getDataByIds: (ids: ID[]) => OutlineData[];
  getChildNodes: (parentId: ID) => OutlineData[];
  getParentNode: (childId: ID) => OutlineData | undefined;
  getSiblingNodes: (nodeId: ID) => OutlineData[];
  getRootNodes: () => OutlineData[];
  toggleNode: (nodeId: ID) => void;
  isNodeOpen: (nodeId: ID) => boolean;
  expandNode: (nodeId: ID) => void;
  collapseNode: (nodeId: ID) => void;
};


const useDataStore = createStore<DataStore>((set, get) => ({
  data: {},
  dataOrder: [],
  openNodes: new Set(),

  getDataById: id => get().data[id],

  addData: data => set(state => ({
    data: { ...state.data, [data.id]: data },
    dataOrder: [...state.dataOrder, data.id]
  })),

  updateData: (id, updates) => set(state => ({
    data: {
      ...state.data,
      [id]: { ...state.data[id], ...updates } 
    }
  })),

  removeData: id => set(state => {
    const { [id]: removed, ...remaining } = state.data;
    return {
      data: remaining,
      dataOrder: state.dataOrder.filter(dataId => dataId !== id)
    };
  }),

  getDataByIds: ids => {
    const state = get();
    return ids.map(id => state.data[id]).filter(Boolean);
  },

  getChildNodes: parentId => {
    const parent = get().data[parentId];
    return parent?.childrenIds ? 
      get().getDataByIds(parent.childrenIds) : [];
  },

  getParentNode: childId => {
    const child = get().data[childId];
    return child?.parentId ? get().data[child.parentId] : undefined;
  },

  getSiblingNodes: nodeId => {
    const node = get().data[nodeId];
    if (!node?.parentId) return [];
    
    const parent = get().data[node.parentId];
    if (!parent?.childrenIds) return [];
    
    return parent.childrenIds
      .filter(id => id !== nodeId)
      .map(id => get().data[id])
      .filter(Boolean);
  },

  getRootNodes: () => {
    const allNodes = Object.values(get().data);
    return allNodes.filter(node => !node.parentId || node.parentId === 'root');
  },

  toggleNode: nodeId => set(state => {
    const newOpenNodes = new Set(state.openNodes);
    if (newOpenNodes.has(nodeId)) {
      newOpenNodes.delete(nodeId);
    } else {
      newOpenNodes.add(nodeId);
    }
    return { openNodes: newOpenNodes };
  }),

  isNodeOpen: nodeId => get().openNodes.has(nodeId),

  expandNode: nodeId => set(state => ({
    openNodes: new Set(state.openNodes).add(nodeId)
  })),

  collapseNode: nodeId => set(state => {
    const newOpenNodes = new Set(state.openNodes);
    newOpenNodes.delete(nodeId);
    return { openNodes: newOpenNodes };
  })
}));

export default useDataStore;
