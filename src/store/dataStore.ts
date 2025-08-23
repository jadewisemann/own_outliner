import { createStore } from "zustand";

import type { OutlineData } from "../types";

type ID = OutlineData['id'];

type DataStore = {
  data: Record<ID, OutlineData>;
  dataOrder: ID[];
  getDataById: (id: ID) => OutlineData | undefined;
  addData: (data: OutlineData) => void;
  updateData: (id: ID, updates: Partial<OutlineData>) => void;
  removeData: (id: ID) => void;
  getDataByIds: (ids: ID[]) => OutlineData[];
  getChildNodes: (parentId: ID) => OutlineData[];
  getParentNode: (childId: ID) => OutlineData | undefined;
  getSiblingNodes: (nodeId: ID) => OutlineData[];
};


const useDataStore = createStore<DataStore>((set, get) => ({
  data: {},
  dataOrder: [],

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
    const allData = Object.values(get().data);
    return allData.find(node => 
      node.childrenIds?.includes(childId)
    );
  },

  getSiblingNodes: nodeId => {
    const parent = get().getParentNode(nodeId);
    if (!parent?.childrenIds) return [];
    
    return parent.childrenIds
      .filter(id => id !== nodeId)
      .map(id => get().data[id])
      .filter(Boolean);
  }
}));

export default useDataStore;
