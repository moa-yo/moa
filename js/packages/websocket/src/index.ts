import type { CursorPosition, Operation, WsMessage } from "@moa/types";
import { createWsMessage } from "@moa/utils";

export interface WebSocketConfig {
  url: string;
  onMessage?: (message: WsMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;

  constructor(config: WebSocketConfig) {
    this.config = config;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnecting) {
        reject(new Error("Already connecting"));
        return;
      }

      this.isConnecting = true;

      try {
        this.ws = new WebSocket(this.config.url);

        this.ws.onopen = () => {
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.config.onOpen?.();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WsMessage = JSON.parse(event.data);
            this.config.onMessage?.(message);
          } catch (error) {
            console.error("Failed to parse WebSocket message:", error);
          }
        };

        this.ws.onclose = () => {
          this.isConnecting = false;
          this.config.onClose?.();
          this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
          this.isConnecting = false;
          this.config.onError?.(error);
          reject(error);
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max reconnection attempts reached");
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      console.log(
        `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
      );
      this.connect().catch(console.error);
    }, delay);
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(message: WsMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error("WebSocket is not connected");
    }
  }

  // 편의 메서드들
  joinDocument(documentId: string, userId: string): void {
    this.send(createWsMessage("join", documentId, userId));
  }

  leaveDocument(documentId: string, userId: string): void {
    this.send(createWsMessage("leave", documentId, userId));
  }

  sendOperation(documentId: string, operation: Operation): void {
    this.send(
      createWsMessage("operation", documentId, operation.user_id, operation)
    );
  }

  sendCursorMove(
    documentId: string,
    userId: string,
    position: CursorPosition
  ): void {
    this.send(
      createWsMessage("cursor_move", documentId, userId, undefined, position)
    );
  }

  get readyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
