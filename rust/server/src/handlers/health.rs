use actix_web::{get, HttpResponse};
use crate::models::ApiResponse;

#[get("/health")]
pub async fn health_check() -> HttpResponse {
    let response = ApiResponse {
        success: true,
        data: Some("Server is running"),
        message: None,
    };
    
    HttpResponse::Ok().json(response)
} 