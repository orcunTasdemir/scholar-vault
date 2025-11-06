use crate::{
    auth::verify_jwt,
    models::{
        BillingPeriod, Claims, CreateCheckoutSession, SubscriptionInfo, SubscriptionStatus,
        SubscriptionTier, User,
    },
    state::AppState,
};
use axum::{
    Json,
    extract::State,
    http::{HeaderMap, StatusCode},
    response::IntoResponse,
};
use chrono::Utc;
use serde_json::json;
use stripe::{
    CheckoutSession, CheckoutSessionMode, CreateCheckoutSession as StripeCreateCheckoutSession,
    CreateCheckoutSessionLineItems, CreatePrice, CreatePriceRecurring,
    CreatePriceRecurringInterval, Currency, Customer, CustomerId, Expandable, Price, Subscription,
    SubscriptionId,
};
use uuid::Uuid;

// Helper to extract and validate JWT from headers
fn validate_jwt(headers: &HeaderMap, secret: &str) -> Result<Claims, StatusCode> {
    let auth_header = headers
        .get("authorization")
        .and_then(|h| h.to_str().ok())
        .ok_or(StatusCode::UNAUTHORIZED)?;

    let token = auth_header
        .strip_prefix("Bearer ")
        .ok_or(StatusCode::UNAUTHORIZED)?;

    verify_jwt(token, secret).map_err(|_| StatusCode::UNAUTHORIZED)
}

// Helper to get or create Stripe customer
async fn get_or_create_customer(
    user: &User,
    stripe_client: &stripe::Client,
) -> Result<Customer, StatusCode> {
    // If user already has a Stripe customer ID, fetch it
    if let Some(customer_id_str) = &user.stripe_customer_id {
        if let Ok(customer_id) = customer_id_str.parse::<CustomerId>() {
            if let Ok(customer) = Customer::retrieve(stripe_client, &customer_id, &[]).await {
                return Ok(customer);
            }
        }
    }

    // Create new customer
    let mut params = stripe::CreateCustomer::new();
    params.email = Some(&user.email);
    if let Some(username) = &user.username {
        params.name = Some(username);
    }

    Customer::create(stripe_client, params)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

// Create Stripe checkout session
pub async fn create_checkout_session(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<CreateCheckoutSession>,
) -> Result<impl IntoResponse, StatusCode> {
    // Don't allow checkout for Student tier (it's free) or Scholar (contact sales)
    if matches!(
        payload.tier,
        SubscriptionTier::Student | SubscriptionTier::Scholar
    ) {
        return Err(StatusCode::BAD_REQUEST);
    }
    // Validate JWT and get user
    let claims: Claims = validate_jwt(&headers, &state.jwt_secret)?;
    let user_id = Uuid::parse_str(&claims.sub).map_err(|_| StatusCode::UNAUTHORIZED)?;

    // Fetch user from database
    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = $1")
        .bind(user_id)
        .fetch_one(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Initialize Stripe client
    let stripe_client = stripe::Client::new(state.config.stripe_secret_key.clone());

    // Get or create customer
    let customer = get_or_create_customer(&user, &stripe_client).await?;

    // Save customer ID to database if new
    if user.stripe_customer_id.is_none() {
        sqlx::query("UPDATE users SET stripe_customer_id = $1 WHERE id = $2")
            .bind(customer.id.to_string())
            .bind(user_id)
            .execute(&state.db)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    }

    // Create price based on tier and billing period
    let amount = match payload.billing_period {
        BillingPeriod::Monthly => payload.tier.price_monthly_cents(),
        BillingPeriod::Yearly => payload.tier.price_yearly_cents(),
    };

    let interval = match payload.billing_period {
        BillingPeriod::Monthly => CreatePriceRecurringInterval::Month,
        BillingPeriod::Yearly => CreatePriceRecurringInterval::Year,
    };

    let mut price_params = CreatePrice::new(Currency::USD);
    price_params.unit_amount = Some(amount);
    price_params.recurring = Some(CreatePriceRecurring {
        interval,
        ..Default::default()
    });
    price_params.product_data = Some(stripe::CreatePriceProductData {
        name: format!(
            "ScholarVault {} - {:?}",
            match payload.tier {
                SubscriptionTier::Student => "Student",
                SubscriptionTier::Researcher => "Researcher",
                SubscriptionTier::Academic => "Academic",
                SubscriptionTier::Scholar => "Scholar",
            },
            payload.billing_period
        ),
        ..Default::default()
    });

    let price = Price::create(&stripe_client, price_params)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Create checkout session
    let mut checkout_params = StripeCreateCheckoutSession::new();
    checkout_params.customer = Some(customer.id);
    checkout_params.mode = Some(CheckoutSessionMode::Subscription);
    checkout_params.line_items = Some(vec![CreateCheckoutSessionLineItems {
        price: Some(price.id.to_string()),
        quantity: Some(1),
        ..Default::default()
    }]);
    checkout_params.success_url = Some("http://localhost:3001/dashboard?success=true");
    checkout_params.cancel_url = Some("http://localhost:3001/dashboard?canceled=true");

    // Enable trial period only for Researcher tier
    if payload.tier == SubscriptionTier::Researcher {
        checkout_params.subscription_data = Some(stripe::CreateCheckoutSessionSubscriptionData {
            trial_period_days: Some(30),
            ..Default::default()
        });
    }

    let session = CheckoutSession::create(&stripe_client, checkout_params)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(json!({
        "checkout_url": session.url,
        "session_id": session.id,
    })))
}

// Get current user's subscription info
pub async fn get_subscription_info(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<impl IntoResponse, StatusCode> {
    let claims: Claims = validate_jwt(&headers, &state.jwt_secret)?;
    let user_id = Uuid::parse_str(&claims.sub).map_err(|_| StatusCode::UNAUTHORIZED)?;

    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = $1")
        .bind(user_id)
        .fetch_one(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Parse tier and status
    let tier: SubscriptionTier = serde_json::from_str(&format!("\"{}\"", user.subscription_tier))
        .unwrap_or(SubscriptionTier::Student);
    let status: SubscriptionStatus =
        serde_json::from_str(&format!("\"{}\"", user.subscription_status))
            .unwrap_or(SubscriptionStatus::Active);

    // Check if trial is active
    let is_trial_active = if let Some(trial_end) = user.trial_end_date {
        trial_end > Utc::now()
    } else {
        false
    };

    let info = SubscriptionInfo {
        tier,
        status,
        trial_end_date: user.trial_end_date,
        subscription_end_date: user.subscription_end_date,
        is_trial_active,
    };

    Ok(Json(info))
}

// Cancel subscription
pub async fn cancel_subscription(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<impl IntoResponse, StatusCode> {
    let claims: Claims = validate_jwt(&headers, &state.jwt_secret)?;
    let user_id = Uuid::parse_str(&claims.sub).map_err(|_| StatusCode::UNAUTHORIZED)?;

    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = $1")
        .bind(user_id)
        .fetch_one(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if let Some(subscription_id_str) = user.stripe_subscription_id {
        if let Ok(subscription_id) = subscription_id_str.parse::<SubscriptionId>() {
            let stripe_client = stripe::Client::new(state.config.stripe_secret_key.clone());

            Subscription::cancel(
                &stripe_client,
                &subscription_id,
                stripe::CancelSubscription::default(),
            )
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        }
    }

    // Update user in database
    sqlx::query(
        "UPDATE users SET subscription_status = $1, subscription_end_date = NOW() WHERE id = $2",
    )
    .bind("canceled")
    .bind(user_id)
    .execute(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(json!({ "success": true })))
}

// Stripe webhook handler
// Note: Without webhook-events feature, we parse events manually
pub async fn handle_stripe_webhook(
    State(state): State<AppState>,
    headers: HeaderMap,
    body: String,
) -> Result<impl IntoResponse, StatusCode> {
    // Parse the event body as JSON
    let event: serde_json::Value =
        serde_json::from_str(&body).map_err(|_| StatusCode::BAD_REQUEST)?;

    // Extract event type
    let event_type = event
        .get("type")
        .and_then(|v| v.as_str())
        .ok_or(StatusCode::BAD_REQUEST)?;

    // Handle different event types
    match event_type {
        "customer.subscription.created" | "customer.subscription.updated" => {
            // Extract subscription data
            if let Some(subscription_data) = event.get("data").and_then(|d| d.get("object")) {
                if let Ok(subscription) =
                    serde_json::from_value::<Subscription>(subscription_data.clone())
                {
                    handle_subscription_update(&state, subscription).await?;
                }
            }
        }
        "customer.subscription.deleted" => {
            if let Some(subscription_data) = event.get("data").and_then(|d| d.get("object")) {
                if let Ok(subscription) =
                    serde_json::from_value::<Subscription>(subscription_data.clone())
                {
                    handle_subscription_canceled(&state, subscription).await?;
                }
            }
        }
        "invoice.payment_succeeded" => {
            if let Some(subscription_id_str) = event
                .get("data")
                .and_then(|d| d.get("object"))
                .and_then(|o| o.get("subscription"))
                .and_then(|v| v.as_str())
            {
                sqlx::query(
                    "UPDATE users SET subscription_status = $1 WHERE stripe_subscription_id = $2",
                )
                .bind("active")
                .bind(subscription_id_str)
                .execute(&state.db)
                .await
                .ok();
            }
        }
        "invoice.payment_failed" => {
            if let Some(subscription_id_str) = event
                .get("data")
                .and_then(|d| d.get("object"))
                .and_then(|o| o.get("subscription"))
                .and_then(|v| v.as_str())
            {
                sqlx::query(
                    "UPDATE users SET subscription_status = $1 WHERE stripe_subscription_id = $2",
                )
                .bind("past_due")
                .bind(subscription_id_str)
                .execute(&state.db)
                .await
                .ok();
            }
        }
        _ => {
            // Ignore other event types
        }
    }

    Ok(Json(json!({ "received": true })))
}

// Helper: Update subscription in database
async fn handle_subscription_update(
    state: &AppState,
    subscription: Subscription,
) -> Result<(), StatusCode> {
    // Get customer ID from Expandable<Customer>
    let customer_id = match &subscription.customer {
        Expandable::Id(id) => id.to_string(),
        Expandable::Object(customer) => customer.id.to_string(),
    };

    let subscription_id = subscription.id.to_string();

    // Convert StripeSubscriptionStatus to string
    let status = format!("{:?}", subscription.status).to_lowercase();

    // Convert Timestamp to chrono DateTime
    let start_date = chrono::DateTime::from_timestamp(subscription.created as i64, 0);
    let end_date = chrono::DateTime::from_timestamp(subscription.current_period_end as i64, 0);

    sqlx::query(
        "UPDATE users
         SET stripe_subscription_id = $1,
             subscription_status = $2,
             subscription_start_date = $3,
             subscription_end_date = $4
         WHERE stripe_customer_id = $5",
    )
    .bind(subscription_id)
    .bind(status)
    .bind(start_date)
    .bind(end_date)
    .bind(customer_id)
    .execute(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(())
}

// Helper: Handle subscription cancellation
async fn handle_subscription_canceled(
    state: &AppState,
    subscription: Subscription,
) -> Result<(), StatusCode> {
    // Get customer ID from Expandable<Customer>
    let customer_id = match &subscription.customer {
        Expandable::Id(id) => id.to_string(),
        Expandable::Object(customer) => customer.id.to_string(),
    };

    sqlx::query(
        "UPDATE users
         SET subscription_status = $1,
             subscription_end_date = NOW()
         WHERE stripe_customer_id = $2",
    )
    .bind("canceled")
    .bind(customer_id)
    .execute(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(())
}
