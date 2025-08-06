use actix::{Actor, StreamHandler, AsyncContext};
use actix_web::{web, Error, HttpRequest, HttpResponse};
use actix_web_actors::ws;
use serde_json::json;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use uuid::Uuid;
use crate::models::WsMessage;

type Sessions = Arc<Mutex<HashMap<Uuid, Vec<web::Data<actix::Addr<MyWebSocket>>>>>>;

pub struct MyWebSocket {
    pub id: Uuid,
    pub sessions: Sessions,
    pub document_id: Option<Uuid>,
    pub user_id: Option<String>,
}

impl Actor for MyWebSocket {
    type Context = ws::WebsocketContext<Self>;

    fn started(&mut self, _ctx: &mut Self::Context) {
        tracing::info!("WebSocket connection started: {}", self.id);
    }

    fn stopped(&mut self, _: &mut Self::Context) {
        tracing::info!("WebSocket connection stopped: {}", self.id);
        
        if let (Some(doc_id), Some(_user_id)) = (self.document_id, &self.user_id) {
            if let Ok(mut sessions) = self.sessions.lock() {
                if let Some(session_list) = sessions.get_mut(&doc_id) {
                    session_list.retain(|session| {
                        // Remove this session from the list
                        true // For now, just keep all sessions
                    });
                }
            }
        }
    }
}

impl StreamHandler<Result<ws::Message, ws::ProtocolError>> for MyWebSocket {
    fn handle(
        &mut self,
        msg: Result<ws::Message, ws::ProtocolError>,
        ctx: &mut Self::Context,
    ) {
        match msg {
            Ok(ws::Message::Text(text)) => {
                match serde_json::from_str::<WsMessage>(&text) {
                    Ok(message) => {
                        match message {
                            WsMessage::Join { document_id, user_id } => {
                                self.document_id = Some(document_id);
                                self.user_id = Some(user_id.clone());
                                
                                // Add to sessions
                                if let Ok(mut sessions) = self.sessions.lock() {
                                    sessions.entry(document_id).or_insert_with(Vec::new)
                                        .push(web::Data::new(ctx.address()));
                                }
                                
                                // Notify others
                                self.broadcast_to_document(document_id, &json!({
                                    "type": "user_joined",
                                    "user_id": user_id
                                }));
                            }
                            WsMessage::Operation { document_id, operation } => {
                                // Broadcast operation to all users in the document
                                self.broadcast_to_document(document_id, &json!({
                                    "type": "operation",
                                    "operation": operation
                                }));
                            }
                            WsMessage::CursorMove { document_id, user_id, position } => {
                                // Broadcast cursor movement
                                self.broadcast_to_document(document_id, &json!({
                                    "type": "cursor_move",
                                    "user_id": user_id,
                                    "position": position
                                }));
                            }
                            _ => {}
                        }
                    }
                    Err(e) => {
                        tracing::error!("Failed to parse WebSocket message: {}", e);
                    }
                }
            }
            Ok(ws::Message::Ping(msg)) => ctx.pong(&msg),
            Ok(ws::Message::Close(reason)) => ctx.close(reason),
            _ => {}
        }
    }
}

impl MyWebSocket {
    fn broadcast_to_document(&self, document_id: Uuid, message: &serde_json::Value) {
        if let Ok(sessions) = self.sessions.lock() {
            if let Some(session_list) = sessions.get(&document_id) {
                for session in session_list {
                    // For now, just log the message instead of sending
                    tracing::info!("Broadcasting message to session: {}", message);
                }
            }
        }
    }
}

pub async fn ws_route(
    req: HttpRequest,
    stream: web::Payload,
    sessions: web::Data<Sessions>,
) -> Result<HttpResponse, Error> {
    let ws = MyWebSocket {
        id: Uuid::new_v4(),
        sessions: sessions.get_ref().clone(),
        document_id: None,
        user_id: None,
    };

    ws::start(ws, &req, stream)
} 