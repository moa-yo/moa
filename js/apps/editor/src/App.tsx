import { Document } from "@moa/types";
import { WebSocketClient } from "@moa/websocket";
import { useEffect, useState } from "react";
import "./App.css";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

interface DocumentListResponse {
  documents: Document[];
  total: number;
}

function App() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null
  );
  const [newDocumentTitle, setNewDocumentTitle] = useState("");
  const [wsClient, setWsClient] = useState<WebSocketClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);

  // WebSocket 연결
  useEffect(() => {
    const client = new WebSocketClient({
      url: "/ws",
      onOpen: () => {
        console.log("WebSocket 연결됨");
        setIsConnected(true);
        addMessage("WebSocket 연결됨");
      },
      onMessage: (data) => {
        console.log("WebSocket 메시지 수신:", data);
        addMessage(`메시지 수신: ${JSON.stringify(data)}`);
      },
      onClose: () => {
        console.log("WebSocket 연결 종료");
        setIsConnected(false);
        addMessage("WebSocket 연결 종료");
      },
      onError: (error) => {
        console.error("WebSocket 에러:", error);
        addMessage(`WebSocket 에러: ${error}`);
      },
    });

    setWsClient(client);
    client.connect();

    return () => {
      client.disconnect();
    };
  }, []);

  const addMessage = (message: string) => {
    setMessages((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  // 문서 목록 가져오기
  const fetchDocuments = async () => {
    try {
      const response = await fetch("/api/documents");
      const result: ApiResponse<DocumentListResponse> = await response.json();

      if (result.success && result.data) {
        setDocuments(result.data.documents);
        addMessage(`문서 목록 로드됨 (${result.data.documents.length}개)`);
      }
    } catch (error) {
      console.error("문서 목록 가져오기 실패:", error);
      addMessage(`문서 목록 가져오기 실패: ${error}`);
    }
  };

  // 새 문서 생성
  const createDocument = async () => {
    if (!newDocumentTitle.trim()) return;

    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newDocumentTitle,
          content: {},
        }),
      });

      const result: ApiResponse<Document> = await response.json();

      if (result.success && result.data) {
        setDocuments((prev) => [result.data!, ...prev]);
        setNewDocumentTitle("");
        addMessage(`새 문서 생성됨: ${result.data.title}`);
      }
    } catch (error) {
      console.error("문서 생성 실패:", error);
      addMessage(`문서 생성 실패: ${error}`);
    }
  };

  // 문서 선택
  const selectDocument = (document: Document) => {
    setSelectedDocument(document);
    addMessage(`문서 선택됨: ${document.title}`);

    // WebSocket으로 문서 참여
    if (wsClient && wsClient.isConnected) {
      wsClient.send({
        type: "join",
        document_id: document.id,
        user_id: `user_${Math.random().toString(36).substr(2, 9)}`,
      });
    }
  };

  // 문서 편집 (간단한 JSON 편집)
  const updateDocumentContent = async (content: any) => {
    if (!selectedDocument) return;

    try {
      const response = await fetch(`/api/documents/${selectedDocument.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: selectedDocument.title,
          content: content,
        }),
      });

      if (response.ok) {
        const updatedDoc = { ...selectedDocument, content };
        setSelectedDocument(updatedDoc);
        setDocuments((prev) =>
          prev.map((doc) => (doc.id === selectedDocument.id ? updatedDoc : doc))
        );
        addMessage("문서 내용 업데이트됨");
      }
    } catch (error) {
      console.error("문서 업데이트 실패:", error);
      addMessage(`문서 업데이트 실패: ${error}`);
    }
  };

  // 컴포넌트 마운트 시 문서 목록 가져오기
  useEffect(() => {
    fetchDocuments();
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎨 Moa Editor</h1>
        <p>실시간 협업 문서 편집기</p>
        <div className="connection-status">
          WebSocket: {isConnected ? "🟢 연결됨" : "🔴 연결 안됨"}
        </div>
      </header>

      <div className="main-content">
        {/* 문서 목록 */}
        <div className="document-list">
          <h2>📄 문서 목록</h2>

          {/* 새 문서 생성 */}
          <div className="create-document">
            <input
              type="text"
              placeholder="새 문서 제목"
              value={newDocumentTitle}
              onChange={(e) => setNewDocumentTitle(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && createDocument()}
            />
            <button onClick={createDocument}>생성</button>
          </div>

          {/* 문서 목록 */}
          <div className="documents">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className={`document-item ${
                  selectedDocument?.id === doc.id ? "selected" : ""
                }`}
                onClick={() => selectDocument(doc)}
              >
                <h3>{doc.title}</h3>
                <p>생성: {new Date(doc.created_at).toLocaleDateString()}</p>
                <p>수정: {new Date(doc.updated_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 문서 편집기 */}
        <div className="document-editor">
          <h2>✏️ 문서 편집</h2>
          {selectedDocument ? (
            <div className="editor-content">
              <h3>{selectedDocument.title}</h3>
              <div className="json-editor">
                <textarea
                  value={JSON.stringify(selectedDocument.content, null, 2)}
                  onChange={(e) => {
                    try {
                      const content = JSON.parse(e.target.value);
                      updateDocumentContent(content);
                    } catch (error) {
                      // JSON 파싱 에러는 무시
                    }
                  }}
                  placeholder="JSON 내용을 편집하세요..."
                />
              </div>
            </div>
          ) : (
            <p>문서를 선택해주세요</p>
          )}
        </div>

        {/* WebSocket 메시지 로그 */}
        <div className="message-log">
          <h2>📡 WebSocket 로그</h2>
          <div className="log-content">
            {messages.slice(-10).map((msg, index) => (
              <div key={index} className="log-entry">
                {msg}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
