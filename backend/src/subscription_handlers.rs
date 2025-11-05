use crate::{
    auth::Claims,
    middleware::validate_jwt,
    models::{
        BillingPeriod, CreateCheckoutSession, SubscriptionInfo, SubscriptionStatus,
        SubscriptionTier, User,
    },
    state::AppState,
};
use axum::{
    Json,
    extract::{Query, State},
    http::{HeaderMap, StatusCode},
    response::IntoResponse,
};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use serde_json::json;
use stripe::{
    CheckoutSession, CheckoutSessionMode, CreateCheckoutSession as StripeCreateCheckoutSession,
    CreateCheckoutSessionLineItems, CreatePrice, CreatePriceRecurring,
    CreatePriceRecurringInterval, Currency, Customer, EventObject, EventType, Price, Subscription,
    Webhook,
};
use uuid::Uuid;

// Helper to get or create Stripe customer
async fn get_or_create_customer(
    user: &User,
    stripe_client: &stripe::Client,
) -> Result<Customer, StatusCode> {
    // If user already has a Stripe customer ID, fetch it
    if let Some(customer_id) = &user.stripe_customer_id {
        match Customer::retrieve(stripe_client, &customer_id.parse().unwrap(), &[]).await {
            Ok(customer) => return Ok(customer),
            Err(_) => {
                // Customer not found, create new one
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

    // Enable trial period for new customers
    checkout_params.subscription_data = Some(stripe::CreateCheckoutSessionSubscriptionData {
        trial_period_days: Some(30),
        ..Default::default()
    });

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

    if let Some(subscription_id) = user.stripe_subscription_id {
        let stripe_client = stripe::Client::new(state.config.stripe_secret_key.clone());

        Subscription::cancel(
            &stripe_client,
            &subscription_id.parse().unwrap(),
            stripe::CancelSubscription::default(),
        )
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
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
