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
    // Subscription fields
    pub subscription_tier: String,
    pub subscription_status: String,
    pub stripe_customer_id: Option<String>,
    pub stripe_subscription_id: Option<String>,
    pub subscription_start_date: Option<DateTime<Utc>>,
    pub subscription_end_date: Option<DateTime<Utc>>,
    pub trial_end_date: Option<DateTime<Utc>>,
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

//Subscription Models
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "VARCHAR", rename_all = "lowercase")]
pub enum SubscriptionTier {
    Student,
    Researcher,
    Academic,
    Scholar,
}

impl SubscriptionTier {
    pub fn max_documents(&self) -> i32 {
        match self {
            SubscriptionTier::Student => 5,
            SubscriptionTier::Researcher => 100,
            SubscriptionTier::Academic => 500,
            SubscriptionTier::Scholar => i32::MAX,
        }
    }

    pub fn max_chat_messages(&self) -> i32 {
        match self {
            SubscriptionTier::Student => 3,
            SubscriptionTier::Researcher => 200,
            SubscriptionTier::Academic => 1000,
            SubscriptionTier::Scholar => i32::MAX,
        }
    }
    pub fn max_collections(&self) -> i32 {
        match self {
            SubscriptionTier::Student => 1,
            SubscriptionTier::Researcher => i32::MAX,
            SubscriptionTier::Academic => i32::MAX,
            SubscriptionTier::Scholar => i32::MAX,
        }
    }

    pub fn price_monthly_cents(&self) -> i64 {
        match self {
            SubscriptionTier::Student => 0,
            SubscriptionTier::Researcher => 1000, // $10
            SubscriptionTier::Academic => 2000,   // $20
            SubscriptionTier::Scholar => 0,       // Custom pricing
        }
    }

    pub fn price_yearly_cents(&self) -> i64 {
        match self {
            SubscriptionTier::Student => 0,
            SubscriptionTier::Researcher => 10000, // $100
            SubscriptionTier::Academic => 20000,   // $200
            SubscriptionTier::Scholar => 0,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "VARCHAR", rename_all = "lowercase")]
pub enum SubscriptionStatus {
    Active,
    Canceled,
    PastDue,
    Trialing,
    Incomplete,
}

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct ChatUsage {
    pub id: Uuid,
    pub user_id: Uuid,
    pub document_id: Uuid,
    pub tokens_used: i32,
    pub message_count: i32,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct SubscriptionEvent {
    pub id: Uuid,
    pub user_id: Uuid,
    pub event_type: String,
    pub stripe_event_id: Option<String>,
    pub old_tier: Option<String>,
    pub new_tier: Option<String>,
    pub metadata: Option<serde_json::Value>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct SubscriptionInfo {
    pub tier: SubscriptionTier,
    pub status: SubscriptionStatus,
    pub trial_end_date: Option<DateTime<Utc>>,
    pub subscription_end_date: Option<DateTime<Utc>>,
    pub is_trial_active: bool,
}

#[derive(Debug, Deserialize)]
pub struct CreateCheckoutSession {
    pub tier: SubscriptionTier,
    pub billing_period: BillingPeriod,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum BillingPeriod {
    Monthly,
    Yearly,
}
