use sqlx::{PgPool, postgres::PgPoolOptions};
use std::time::Duration;

#[derive(Clone)]
pub struct Config {
    pub database_url: String,
    pub jwt_secret: String,
}

impl Config {
    pub fn from_env() -> Self {
        dotenvy::dotenv().ok();
        let database_url =
            std::env::var("DATABASE_URL").expect("DATABASE_URL needs to be set in the .env file");

        let jwt_secret =
            std::env::var("JWT_SECRET").expect("JWT_SECRET needs to be set in the .env file");

        Self {
            database_url,
            jwt_secret,
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
