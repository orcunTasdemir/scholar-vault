use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct User {
    pub id: Uuid,
    pub email: String,
    #[serde(skip_serializing)] //never send the has to the client
    pub password_hash: String,
    pub username: Option<String>,
    pub profile_image_url: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct CreateUser {
    pub email: String,
    pub password: String,
    pub username: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateProfile {
    pub username: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct LoginResponse {
    pub token: String,
    pub user: UserResponse,
}

#[derive(Debug, Serialize)]
pub struct UserResponse {
    pub id: Uuid,
    pub email: String,
    pub username: Option<String>,
    pub profile_image_url: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String, //subject (user id)
    pub email: String,
    pub exp: usize, //expiration time
}

// Document models
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct Document {
    pub id: Uuid,
    pub user_id: Uuid,
    pub title: String,
    pub authors: Option<Vec<String>>,
    pub year: Option<i32>,
    pub publication_type: Option<String>,
    pub journal: Option<String>,
    pub volume: Option<String>,
    pub issue: Option<String>,
    pub pages: Option<String>,
    pub publisher: Option<String>,
    pub doi: Option<String>,
    pub url: Option<String>,
    pub abstract_text: Option<String>, // 'abstract' is a Rust keyword, so we use abstract_text
    pub keywords: Option<Vec<String>>,
    pub pdf_url: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateDocument {
    pub title: String,
    pub authors: Option<Vec<String>>,
    pub year: Option<i32>,
    pub publication_type: Option<String>,
    pub journal: Option<String>,
    pub volume: Option<String>,
    pub issue: Option<String>,
    pub pages: Option<String>,
    pub publisher: Option<String>,
    pub doi: Option<String>,
    pub url: Option<String>,
    pub abstract_text: Option<String>,
    pub keywords: Option<Vec<String>>,
    pub pdf_url: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateDocument {
    pub title: Option<String>,
    pub authors: Option<Vec<String>>,
    pub year: Option<i32>,
    pub publication_type: Option<String>,
    pub journal: Option<String>,
    pub volume: Option<String>,
    pub issue: Option<String>,
    pub pages: Option<String>,
    pub publisher: Option<String>,
    pub doi: Option<String>,
    pub url: Option<String>,
    pub abstract_text: Option<String>,
    pub keywords: Option<Vec<String>>,
    pub pdf_url: Option<String>,
}

// Collection models
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct Collection {
    pub id: Uuid,
    pub user_id: Uuid,
    pub name: String,
    pub parent_id: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateCollection {
    pub name: String,
    pub parent_id: Option<Uuid>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateCollection {
    pub name: Option<String>,
    pub parent_id: Option<Uuid>,
}
