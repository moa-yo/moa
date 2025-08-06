use crate::models::{ApiResponse, CreateDocumentRequest, Document, DocumentListResponse};
use actix_web::{HttpResponse, get, post, put, web};
use serde::Deserialize;
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct UpdateDocumentRequest {
    pub title: String,
    pub content: serde_json::Value,
}

#[post("/documents")]
pub async fn create_document(
    pool: web::Data<PgPool>,
    req: web::Json<CreateDocumentRequest>,
) -> Result<HttpResponse, actix_web::Error> {
    let document_id = Uuid::new_v4();
    let now = chrono::Utc::now();
    let default_content = serde_json::json!({});
    let content = req.content.as_ref().unwrap_or(&default_content);

    let document = sqlx::query_as::<_, Document>(
        r#"
        INSERT INTO documents (id, title, content, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $4)
        RETURNING id, title, content, created_at, updated_at
        "#,
    )
    .bind(document_id)
    .bind(&req.title)
    .bind(content)
    .bind(now)
    .fetch_one(pool.get_ref())
    .await
    .map_err(|e| {
        tracing::error!("Database error: {}", e);
        actix_web::error::ErrorInternalServerError("Database error")
    })?;

    let response = ApiResponse {
        success: true,
        data: Some(document),
        message: None,
    };

    Ok(HttpResponse::Created().json(response))
}

#[get("/documents/{id}")]
pub async fn get_document(
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
) -> Result<HttpResponse, actix_web::Error> {
    let document_id = path.into_inner();

    let document = sqlx::query_as::<_, Document>(
        r#"
        SELECT id, title, content, created_at, updated_at
        FROM documents
        WHERE id = $1
        "#,
    )
    .bind(document_id)
    .fetch_optional(pool.get_ref())
    .await
    .map_err(|e| {
        tracing::error!("Database error: {}", e);
        actix_web::error::ErrorInternalServerError("Database error")
    })?
    .ok_or(actix_web::error::ErrorNotFound("Document not found"))?;

    let response = ApiResponse {
        success: true,
        data: Some(document),
        message: None,
    };

    Ok(HttpResponse::Ok().json(response))
}

#[get("/documents")]
pub async fn list_documents(pool: web::Data<PgPool>) -> Result<HttpResponse, actix_web::Error> {
    let documents = sqlx::query_as::<_, Document>(
        r#"
        SELECT id, title, content, created_at, updated_at
        FROM documents
        ORDER BY updated_at DESC
        LIMIT 50
        "#,
    )
    .fetch_all(pool.get_ref())
    .await
    .map_err(|e| {
        tracing::error!("Database error: {}", e);
        actix_web::error::ErrorInternalServerError("Database error")
    })?;

    let total = sqlx::query_scalar::<_, i64>(r#"SELECT COUNT(*) FROM documents"#)
        .fetch_one(pool.get_ref())
        .await
        .map_err(|e| {
            tracing::error!("Database error: {}", e);
            actix_web::error::ErrorInternalServerError("Database error")
        })?;

    let response = ApiResponse {
        success: true,
        data: Some(DocumentListResponse { documents, total }),
        message: None,
    };

    Ok(HttpResponse::Ok().json(response))
}

#[put("/documents/{id}")]
pub async fn update_document(
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
    req: web::Json<UpdateDocumentRequest>,
) -> Result<HttpResponse, actix_web::Error> {
    let document_id = path.into_inner();
    let now = chrono::Utc::now();

    let document = sqlx::query_as::<_, Document>(
        r#"
        UPDATE documents 
        SET title = $1, content = $2, updated_at = $3
        WHERE id = $4
        RETURNING id, title, content, created_at, updated_at
        "#,
    )
    .bind(&req.title)
    .bind(&req.content)
    .bind(now)
    .bind(document_id)
    .fetch_optional(pool.get_ref())
    .await
    .map_err(|e| {
        tracing::error!("Database error: {}", e);
        actix_web::error::ErrorInternalServerError("Database error")
    })?
    .ok_or(actix_web::error::ErrorNotFound("Document not found"))?;

    let response = ApiResponse {
        success: true,
        data: Some(document),
        message: None,
    };

    Ok(HttpResponse::Ok().json(response))
}
