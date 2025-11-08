use crate::config::Config;
use crate::storage::SupabaseStorage;
use sqlx::PgPool;

#[derive(Clone)]
pub struct AppState {
    pub db: PgPool,
    pub jwt_secret: String,
    pub config: Config,
    pub storage: SupabaseStorage,
}

impl AppState {
    pub fn new(db: PgPool, jwt_secret: String, config: Config) -> Self {
        let storage = SupabaseStorage::new(
            config.supabase_url.clone(),
            config.supabase_service_role_key.clone(),
        );

        Self {
            db,
            jwt_secret,
            config,
            storage,
        }
    }
}
