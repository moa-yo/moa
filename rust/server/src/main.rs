use actix_cors::Cors;
use actix_web::{App, HttpServer, web};
use std::collections::HashMap;
use std::env;
use std::sync::{Arc, Mutex};
use uuid::Uuid;

mod database;
mod handlers;
mod models;
mod websocket;

type Sessions = Arc<Mutex<HashMap<Uuid, Vec<web::Data<actix::Addr<websocket::MyWebSocket>>>>>>;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Load environment variables
    dotenv::dotenv().ok();

    // Initialize logging
    tracing_subscriber::fmt::init();

    // Create database pool
    let pool = database::create_pool()
        .await
        .expect("Failed to create database pool");

    // Run migrations
    database::run_migrations(&pool)
        .await
        .expect("Failed to run database migrations");

    let host = env::var("HOST").unwrap_or_else(|_| "127.0.0.1".to_string());
    let port = env::var("PORT").unwrap_or_else(|_| "8080".to_string());
    let addr = format!("{}:{}", host, port);

    tracing::info!("Starting server at {}", addr);

    // Create sessions for WebSocket
    let sessions: Sessions = Arc::new(Mutex::new(HashMap::new()));

    HttpServer::new(move || {
        App::new()
            .wrap(Cors::permissive())
            .app_data(web::Data::new(pool.clone()))
            .app_data(web::Data::new(sessions.clone()))
            .service(
                web::scope("/api")
                    .service(handlers::health::health_check)
                    .service(handlers::documents::create_document)
                    .service(handlers::documents::get_document)
                    .service(handlers::documents::list_documents)
                    .service(handlers::documents::update_document),
            )
            .route("/ws", web::get().to(websocket::ws_route))
    })
    .bind(addr)?
    .run()
    .await
}
