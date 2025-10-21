use axum::{Json, extract::State, http::StatusCode};
use serde_json::{Value, json};

use crate::{
    auth::create_jwt,
    middleware::AuthUser,
    models::{CreateUser, LoginRequest, LoginResponse, UserResponse},
    state::AppState,
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
