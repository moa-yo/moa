// Document types
export interface Document {
  id: string;
  title: string;
  content: any;
  created_at: string;
  updated_at: string;
}

export interface CreateDocumentRequest {
  title: string;
  content?: any;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface DocumentListResponse {
  documents: Document[];
  total: number;
}

// WebSocket message types
export type WsMessageType =
  | "join"
  | "leave"
  | "operation"
  | "cursor_move"
  | "user_joined"
  | "user_left";

export interface WsMessage {
  type: WsMessageType;
  document_id?: string;
  user_id?: string;
  operation?: any;
  position?: any;
}

// Editor types
export interface Shape {
  id: string;
  type: "rectangle" | "circle" | "line" | "text";
  x: number;
  y: number;
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
}

export interface Operation {
  id: string;
  type: "create" | "update" | "delete" | "move";
  shape_id?: string;
  shape?: Shape;
  position?: { x: number; y: number };
  timestamp: number;
  user_id: string;
}

export interface CursorPosition {
  x: number;
  y: number;
  user_id: string;
  user_name?: string;
  color?: string;
}
