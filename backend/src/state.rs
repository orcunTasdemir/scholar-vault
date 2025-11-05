use crate::config::Config;
use sqlx::PgPool;

#[derive(Clone)]
pub struct AppState {
    pub db: PgPool,
    pub jwt_secret: String,
    pub config: Config,
}

impl AppState {
    pub fn new(db: PgPool, jwt_secret: String, config: Config) -> Self {
        // Add config param
        Self {
            db,
            jwt_secret,
            config,
        }
    }
}
