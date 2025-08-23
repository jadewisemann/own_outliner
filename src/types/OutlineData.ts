interface OutlineData {
  id: string;
  title?: string;
  level?: number;
  order?: number;
  content?: string;
  childrenIds?: string[];
  parentId: string;
}


export type { OutlineData };