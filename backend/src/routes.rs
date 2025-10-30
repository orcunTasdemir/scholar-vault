use crate::{handlers, handlers::upload_pdf, state::AppState};
use axum::{
    Router,
    routing::{delete, get, post, put},
};

pub fn create_routes(state: AppState) -> Router {
    Router::new()
        .route("/health", get(handlers::health_check))
        .route("/api/auth/register", post(handlers::register_user))
        .route("/api/auth/login", post(handlers::login_user))
        .route("/api/user/me", get(handlers::get_current_user))
        .route("/api/user/profile", put(handlers::update_profile))
        .route(
            "/api/user/profile-image",
            post(handlers::upload_profile_image),
        )
        .route(
            "/api/user/profile-image",
            delete(handlers::delete_profile_image),
        )
        .route("/api/collections", get(handlers::get_user_collections))
        .route("/api/collections", post(handlers::create_collection))
        .route("/api/collections/{id}", put(handlers::update_collection))
        .route("/api/collections/{id}", delete(handlers::delete_collection))
        .route(
            "/api/collections/{collection_id}/documents",
            get(handlers::get_collection_documents),
        )
        .route(
            "/api/collections/{collection_id}/documents/{document_id}",
            post(handlers::add_document_to_collection),
        )
        .route(
            "/api/collections/{collection_id}/documents/{document_id}",
            delete(handlers::remove_document_from_collection),
        )
        .route("/api/documents", post(handlers::create_document))
        .route("/api/documents", get(handlers::get_user_documents))
        .route("/api/documents/search", get(handlers::search_documents))
        .route("/api/documents/upload", post(upload_pdf))
        .route("/api/documents/{id}", get(handlers::get_document))
        .route("/api/documents/{id}", put(handlers::update_document))
        .route("/api/documents/{id}", delete(handlers::delete_document))
        .with_state(state)
}
