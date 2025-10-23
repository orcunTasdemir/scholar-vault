mod auth;
mod config;
mod handlers;
mod middleware;
mod models;
mod routes;
mod state;

use axum::{Router, routing::get};
use config::Config;
use routes::create_routes;
use state::AppState;
use tower_http::cors::{Any, CorsLayer};

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

    let app = create_routes(app_state).layer(cors);
    let listener = tokio::net::TcpListener::bind("127.0.0.1:3000")
        .await
        .unwrap();
    println!("Server running on http://127.0.0.1:3000");
    println!("Health check: http://127.0.0.1:3000/health");

    axum::serve(listener, app).await.unwrap();
}
