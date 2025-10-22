use axum::{
    Json,
    extract::{Path, State},
    http::StatusCode,
};
use serde_json::{Value, json};

use crate::{
    auth::create_jwt,
    middleware::AuthUser,
    models::{CreateDocument, CreateUser, Document, LoginRequest, LoginResponse, UserResponse},
    state::{self, AppState},
};

pub async fn health_check() -> Json<Value> {
    Json(json!({
        "status": "healthy",
        "service": "ScholarVault API"
    }))
}

pub async fn register_user(
    State(state): State<AppState>,
    Json(payload): Json<CreateUser>,
) -> Result<(StatusCode, Json<Value>), (StatusCode, Json<Value>)> {
    // Hash password
    let password_hash = bcrypt::hash(&payload.password, bcrypt::DEFAULT_COST).map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": "Failed to hash password" })),
        )
    })?;

    // Insert user
    let result = sqlx::query!(
        r#"
        INSERT INTO users (email, password_hash, full_name)
        VALUES ($1, $2, $3)
        RETURNING id, email, full_name, created_at
        "#,
        payload.email,
        password_hash,
        payload.full_name
    )
    .fetch_one(&state.db)
    .await;

    match result {
        Ok(user) => Ok((
            StatusCode::CREATED,
            Json(json!({
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name,
                "created_at": user.created_at
            })),
        )),
        Err(sqlx::Error::Database(db_err)) if db_err.constraint() == Some("users_email_key") => {
            Err((
                StatusCode::CONFLICT,
                Json(json!({ "error": "Email already exists" })),
            ))
        }
        Err(_) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": "Failed to create user" })),
        )),
    }
}

pub async fn login_user(
    State(state): State<AppState>,
    Json(payload): Json<LoginRequest>,
) -> Result<(StatusCode, Json<LoginResponse>), (StatusCode, Json<Value>)> {
    // Find user
    let user = sqlx::query!(
        r#"
        SELECT id, email, password_hash, full_name
        FROM users
        WHERE email = $1
        "#,
        payload.email
    )
    .fetch_optional(&state.db)
    .await
    .map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": "Database error"})),
        )
    })?;

    // Check if user exists
    let user = user.ok_or((
        StatusCode::UNAUTHORIZED,
        Json(json!({"error": "Invalid email or password"})),
    ))?;

    // Verify password
    let password_matches =
        bcrypt::verify(&payload.password, &user.password_hash).map_err(|_| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": "Failed to verify password"})),
            )
        })?;

    if !password_matches {
        return Err((
            StatusCode::UNAUTHORIZED,
            Json(json!({"error": "Invalid email or password"})),
        ));
    }
    // Generate token
    let token = create_jwt(&user.id.to_string(), &user.email, &state.jwt_secret).map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": "Failed to generate token"})),
        )
    })?;

    // Return token and user info
    Ok((
        StatusCode::OK,
        Json(LoginResponse {
            token,
            user: UserResponse {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
            },
        }),
    ))
}

pub async fn get_current_user(AuthUser(claims): AuthUser) -> Json<Value> {
    Json(json!({
        "message": "You are authenticated",
        "user_id": claims.sub,
        "email": claims.email,
    }))
}

pub async fn create_document(
    AuthUser(claims): AuthUser,
    State(state): State<AppState>,
    Json(payload): Json<CreateDocument>,
) -> Result<(StatusCode, Json<Document>), (StatusCode, Json<Value>)> {
    let user_id = uuid::Uuid::parse_str(&claims.sub).map_err(|_| {
        (
            StatusCode::BAD_REQUEST,
            Json(json!({"error":"Invalid user ID"})),
        )
    })?;

    let document = sqlx::query_as!(
        Document,
        r#"
        INSERT INTO documents (
            user_id, title, authors, year, publication_type, journal,
            volume, issue, pages, publisher, doi, url, abstract, keywords, pdf_url
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING id, user_id, title, authors, year, publication_type, journal,
                  volume, issue, pages, publisher, doi, url, abstract as abstract_text,
                  keywords, pdf_url, created_at, updated_at
        "#,
        user_id,
        payload.title,
        payload.authors.as_deref(),
        payload.year,
        payload.publication_type,
        payload.journal,
        payload.volume,
        payload.issue,
        payload.pages,
        payload.publisher,
        payload.doi,
        payload.url,
        payload.abstract_text,
        payload.keywords.as_deref(),
        payload.pdf_url
    )
    .fetch_one(&state.db)
    .await
    .map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": "Failed to create document"})),
        )
    })?;
    Ok((StatusCode::CREATED, Json(document)))
}

pub async fn get_user_documents(
    AuthUser(claims): AuthUser,
    State(state): State<AppState>,
) -> Result<Json<Vec<Document>>, (StatusCode, Json<Value>)> {
    let user_id = uuid::Uuid::parse_str(&claims.sub).map_err(|_| {
        (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "Invalid user ID"})),
        )
    })?;

    let documents = sqlx::query_as!(
        Document,
        r#"
            SELECT id, user_id, title, authors, year, publication_type, journal,
                volume, issue, pages, publisher, doi, url, abstract as abstract_text,
                keywords, pdf_url, created_at, updated_at
            FROM documents
            WHERE user_id = $1
            ORDER BY created_at DESC
            "#,
        user_id
    )
    .fetch_all(&state.db)
    .await
    .map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": "Failed to fetch documents"})),
        )
    })?;

    Ok(Json(documents))
}

pub async fn get_document(
    AuthUser(claims): AuthUser,
    State(state): State<AppState>,
    Path(document_id): Path<uuid::Uuid>,
) -> Result<Json<Document>, (StatusCode, Json<Value>)> {
    let user_id = uuid::Uuid::parse_str(&claims.sub).map_err(|_| {
        (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "Invalid user ID"})),
        )
    })?;

    let document = sqlx::query_as!(
        Document,
        r#"
        SELECT id, user_id, title, authors, year, publication_type, journal,
               volume, issue, pages, publisher, doi, url, abstract as abstract_text,
               keywords, pdf_url, created_at, updated_at
        FROM documents
        WHERE id = $1 AND user_id = $2
        "#,
        document_id,
        user_id
    )
    .fetch_optional(&state.db)
    .await
    .map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": "Database error"})),
        )
    })?;

    document
        .ok_or((
            StatusCode::NOT_FOUND,
            Json(json!({"error": "Document not found"})),
        ))
        .map(Json)
}

pub async fn delete_document(
    AuthUser(claims): AuthUser,
    State(state): State<AppState>,
    Path(document_id): Path<uuid::Uuid>,
) -> Result<StatusCode, (StatusCode, Json<Value>)> {
    let user_id = uuid::Uuid::parse_str(&claims.sub).map_err(|_| {
        (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "Invalid user ID"})),
        )
    })?;

    let result = sqlx::query!(
        r#"
        DELETE FROM documents
        WHERE id = $1 AND user_id = $2
        "#,
        document_id,
        user_id
    )
    .execute(&state.db)
    .await
    .map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": "Failed to delete document"})),
        )
    })?;

    if result.rows_affected() == 0 {
        return Err((
            StatusCode::NOT_FOUND,
            Json(json!({"error": "Document not found"})),
        ));
    }

    Ok(StatusCode::NO_CONTENT)
}
