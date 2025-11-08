use sqlx::{PgPool, postgres::PgPoolOptions};
use std::time::Duration;

#[derive(Clone)]
pub struct Config {
    pub database_url: String,
    pub jwt_secret: String,
    pub stripe_secret_key: String,
    pub stripe_webhook_secret: String,
    pub stripe_publishable_key: String,
    pub supabase_url: String,
    pub supabase_service_role_key: String,
}

impl Config {
    pub fn from_env() -> Self {
        dotenvy::dotenv().ok();
        let database_url =
            std::env::var("DATABASE_URL").expect("DATABASE_URL needs to be set in the .env file");
        let jwt_secret =
            std::env::var("JWT_SECRET").expect("JWT_SECRET needs to be set in the .env file");
        let stripe_secret_key =
            std::env::var("STRIPE_SECRET_KEY").expect("STRIPE_SECRET_KEY must be set");
        let stripe_webhook_secret =
            std::env::var("STRIPE_WEBHOOK_SECRET").expect("STRIPE_WEBHOOK_SECRET must be set");
        let stripe_publishable_key =
            std::env::var("STRIPE_PUBLISHABLE_KEY").expect("STRIPE_PUBLISHABLE_KEY must be set");
        let supabase_url =
            std::env::var("SUPABASE_URL").expect("SUPABASE_URL must be set");
        let supabase_service_role_key =
            std::env::var("SUPABASE_SERVICE_ROLE_KEY").expect("SUPABASE_SERVICE_ROLE_KEY must be set");

        Self {
            database_url,
            jwt_secret,
            stripe_secret_key,
            stripe_webhook_secret,
            stripe_publishable_key,
            supabase_url,
            supabase_service_role_key,
        }
    }
    pub async fn create_pool(&self) -> Result<PgPool, sqlx::Error> {
        PgPoolOptions::new()
            .max_connections(5)
            .acquire_timeout(Duration::from_secs(3))
            .connect(&self.database_url)
            .await
    }
}
