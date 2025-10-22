use crate::{handlers, state::AppState};
use axum::{
    Router,
    routing::{delete, get, post},
};

pub fn create_routes(state: AppState) -> Router {
    Router::new()
        .route("/health", get(handlers::health_check))
        .route("/api/auth/register", post(handlers::register_user))
        .route("/api/auth/login", post(handlers::login_user))
        .route("/api/user/me", get(handlers::get_current_user))
        .route("/api/documents", post(handlers::create_document))
        .route("/api/documents", get(handlers::get_user_documents))
        .route("/api/documents/{id}", get(handlers::get_document))
        .route("/api/documents/{id}", delete(handlers::delete_document))
        .with_state(state)
}
