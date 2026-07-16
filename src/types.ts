export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface GraphNode {
  id: string;
  label: string;
  tags: string[];
  x: number;
  y: number;
  vx: number;
  vy: number;
  isCustom?: boolean;
}

export interface GraphLink {
  source: string;
  target: string;
  type: "explicit" | "tag-match"; // Explicit markdown link [[Title]] vs Shared tag
}
