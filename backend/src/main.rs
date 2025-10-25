mod auth;
mod config;
mod handlers;
mod metadata;
mod middleware;
mod models;
mod routes;
mod state;

use config::Config;
use routes::create_routes;
use state::AppState;

use tower_http::cors::{Any, CorsLayer};
use tower_http::limit::RequestBodyLimitLayer;
use tower_http::services::ServeDir;

#[tokio::main]
async fn main() {
    let config = Config::from_env();
    let pool = config
        .create_pool()
        .await
        .expect("Failed to create a database pool");
    println!("Connected the the database: OK");

    let app_state = AppState::new(pool, config.jwt_secret);

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = create_routes(app_state)
        .nest_service("/uploads", ServeDir::new("uploads"))
        .layer(RequestBodyLimitLayer::new(50 * 1024 * 1024))
        .layer(cors);
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    println!("Server running on http://0.0.0.0:3000");
    println!("Health check: http://0.0.0.0:3000/health");

    axum::serve(listener, app).await.unwrap();
}
