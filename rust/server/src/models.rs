use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Document {
    pub id: Uuid,
    pub title: String,
    pub content: serde_json::Value,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateDocumentRequest {
    pub title: String,
    pub content: Option<serde_json::Value>,
}

#[derive(Debug, Serialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub message: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct DocumentListResponse {
    pub documents: Vec<Document>,
    pub total: i64,
}

// WebSocket message types
#[derive(Debug, Serialize, Deserialize)]
pub enum WsMessage {
    Join {
        document_id: Uuid,
        user_id: String,
    },
    Leave {
        document_id: Uuid,
        user_id: String,
    },
    Operation {
        document_id: Uuid,
        operation: serde_json::Value,
    },
    CursorMove {
        document_id: Uuid,
        user_id: String,
        position: serde_json::Value,
    },
}
