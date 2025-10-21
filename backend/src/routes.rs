use crate::{handlers, state::AppState};
use axum::{
    Router,
    routing::{get, post},
};

pub fn create_routes(state: AppState) -> Router {
    Router::new()
        .route("/health", get(handlers::health_check))
        .route("/api/auth/register", post(handlers::register_user))
        .route("/api/auth/login", post(handlers::login_user))
        .route("/api/user/me", get(handlers::get_current_user))
        .with_state(state)
}
