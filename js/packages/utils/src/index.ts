import type { Operation, Shape, WsMessage } from "@moa/types";

// UUID 생성
export function generateId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// 타임스탬프 생성
export function generateTimestamp(): number {
  return Date.now();
}

// 색상 생성
export function generateColor(): string {
  const colors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
    "#DDA0DD",
    "#98D8C8",
    "#F7DC6F",
    "#BB8FCE",
    "#85C1E9",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Operation 생성 헬퍼
export function createOperation(
  type: Operation["type"],
  user_id: string,
  shape_id?: string,
  shape?: Shape,
  position?: { x: number; y: number }
): Operation {
  return {
    id: generateId(),
    type,
    shape_id,
    shape,
    position,
    timestamp: generateTimestamp(),
    user_id,
  };
}

// WebSocket 메시지 생성 헬퍼
export function createWsMessage(
  type: WsMessage["type"],
  document_id?: string,
  user_id?: string,
  operation?: any,
  position?: any
): WsMessage {
  return {
    type,
    document_id,
    user_id,
    operation,
    position,
  };
}

// 로컬 스토리지 헬퍼
export const storage = {
  get: (key: string): any => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },

  set: (key: string, value: any): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error("Failed to save to localStorage:", error);
    }
  },

  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error("Failed to remove from localStorage:", error);
    }
  },
};

// 디바운스 함수
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// 스로틀 함수
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
