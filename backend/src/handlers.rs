use axum::{
    Json,
    extract::{Multipart, Path, State},
    http::StatusCode,
};
use serde_json::{Value, json};

use crate::{
    auth::create_jwt,
    middleware::AuthUser,
    models::{
        Collection, CreateCollection, CreateDocument, CreateUser, Document, LoginRequest,
        LoginResponse, UpdateCollection, UpdateDocument, UpdateProfile, User, UserResponse,
    },
    state::{self, AppState},
};

pub async fn health_check() -> Json<Value> {
    Json(json!({
        "status": "healthy",
        "service": "ScholarVault API"
    }))
}

pub async fn register_user(
    State(state): State<AppState>,
    Json(payload): Json<CreateUser>,
) -> Result<(StatusCode, Json<Value>), (StatusCode, Json<Value>)> {
    // Hash password
    let password_hash = bcrypt::hash(&payload.password, bcrypt::DEFAULT_COST).map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": "Failed to hash password" })),
        )
    })?;

    // Insert user
    let result = sqlx::query!(
        r#"
        INSERT INTO users (email, password_hash, username)
        VALUES ($1, $2, $3)
        RETURNING id, email, username, profile_image_url, created_at
        "#,
        payload.email,
        password_hash,
        payload.username
    )
    .fetch_one(&state.db)
    .await;

    match result {
        Ok(user) => {
            let token =
                create_jwt(&user.id.to_string(), &user.email, &state.jwt_secret).map_err(|_| {
                    (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        Json(json!({"error": "Failed to generate token"})),
                    )
                })?;

            Ok((
                StatusCode::CREATED,
                Json(json!({
                    "token": token,
                    "user": {
                        "id": user.id,
                        "email": user.email,
                        "username": user.username,
                        "profile_image_url": user.profile_image_url,
                    }
                })),
            ))
        }
        Err(sqlx::Error::Database(db_err)) if db_err.constraint() == Some("users_email_key") => {
            Err((
                StatusCode::CONFLICT,
                Json(json!({ "error": "Email already exists" })),
            ))
        }
        Err(_) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": "Failed to create user" })),
        )),
    }
}

pub async fn login_user(
    State(state): State<AppState>,
    Json(payload): Json<LoginRequest>,
) -> Result<(StatusCode, Json<LoginResponse>), (StatusCode, Json<Value>)> {
    // Find user
    let user = sqlx::query!(
        r#"
        SELECT id, email, password_hash, username, profile_image_url, created_at, updated_at
        FROM users
        WHERE email = $1
        "#,
        payload.email
    )
    .fetch_optional(&state.db)
    .await
    .map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": "Database error"})),
        )
    })?;

    // Check if user exists
    let user = user.ok_or((
        StatusCode::UNAUTHORIZED,
        Json(json!({"error": "Invalid email or password"})),
    ))?;

    // Verify password
    let password_matches =
        bcrypt::verify(&payload.password, &user.password_hash).map_err(|_| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": "Failed to verify password"})),
            )
        })?;

    if !password_matches {
        return Err((
            StatusCode::UNAUTHORIZED,
            Json(json!({"error": "Invalid email or password"})),
        ));
    }
    // Generate token
    let token = create_jwt(&user.id.to_string(), &user.email, &state.jwt_secret).map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": "Failed to generate token"})),
        )
    })?;

    // Return token and user info
    Ok((
        StatusCode::OK,
        Json(LoginResponse {
            token,
            user: UserResponse {
                id: user.id,
                email: user.email,
                username: user.username,
                profile_image_url: user.profile_image_url,
            },
        }),
    ))
}

pub async fn get_current_user(
    AuthUser(claims): AuthUser,
    State(state): State<AppState>,
) -> Result<Json<UserResponse>, (StatusCode, Json<Value>)> {
    let user_id = uuid::Uuid::parse_str(&claims.sub).map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": "Invalid user ID"})),
        )
    })?;

    let user = sqlx::query_as!(
        User,
        r#"SELECT id, email, password_hash, username, profile_image_url, created_at, updated_at FROM users WHERE id = $1"#,
        user_id
    )
    .fetch_one(&state.db)
    .await
    .map_err(|_| {
        (
            StatusCode::NOT_FOUND,
            Json(json!({"error": "User not found"})),
        )
    })?;

    Ok(Json(UserResponse {
        id: user.id,
        email: user.email,
        username: user.username,
        profile_image_url: user.profile_image_url,
    }))
}

pub async fn create_document(
    AuthUser(claims): AuthUser,
    State(state): State<AppState>,
    Json(payload): Json<CreateDocument>,
) -> Result<(StatusCode, Json<Document>), (StatusCode, Json<Value>)> {
    let user_id = uuid::Uuid::parse_str(&claims.sub).map_err(|_| {
        (
            StatusCode::BAD_REQUEST,
            Json(json!({"error":"Invalid user ID"})),
        )
    })?;

    let document = create_document_internal(&state, user_id, payload).await?;

    Ok((StatusCode::CREATED, Json(document)))
}

pub async fn get_user_documents(
    AuthUser(claims): AuthUser,
    State(state): State<AppState>,
) -> Result<Json<Vec<Document>>, (StatusCode, Json<Value>)> {
    let user_id = uuid::Uuid::parse_str(&claims.sub).map_err(|_| {
        (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "Invalid user ID"})),
        )
    })?;

    let documents = sqlx::query_as!(
        Document,
        r#"
            SELECT id, user_id, title, authors, year, publication_type, journal,
                volume, issue, pages, publisher, doi, url, abstract_text,
                keywords, pdf_url, created_at, updated_at
            FROM documents
            WHERE user_id = $1
            ORDER BY created_at DESC
            "#,
        user_id
    )
    .fetch_all(&state.db)
    .await
    .map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": "Failed to fetch documents"})),
        )
    })?;

    Ok(Json(documents))
}

pub async fn get_document(
    AuthUser(claims): AuthUser,
    State(state): State<AppState>,
    Path(document_id): Path<uuid::Uuid>,
) -> Result<Json<Document>, (StatusCode, Json<Value>)> {
    let user_id = uuid::Uuid::parse_str(&claims.sub).map_err(|_| {
        (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "Invalid user ID"})),
        )
    })?;

    let document = sqlx::query_as!(
        Document,
        r#"
        SELECT id, user_id, title, authors, year, publication_type, journal,
               volume, issue, pages, publisher, doi, url, abstract_text,
               keywords, pdf_url, created_at, updated_at
        FROM documents
        WHERE id = $1 AND user_id = $2
        "#,
        document_id,
        user_id
    )
    .fetch_optional(&state.db)
    .await
    .map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": "Database error"})),
        )
    })?;

    document
        .ok_or((
            StatusCode::NOT_FOUND,
            Json(json!({"error": "Document not found"})),
        ))
        .map(Json)
}

pub async fn delete_document(
    AuthUser(claims): AuthUser,
    State(state): State<AppState>,
    Path(document_id): Path<uuid::Uuid>,
) -> Result<StatusCode, (StatusCode, Json<Value>)> {
    let user_id = uuid::Uuid::parse_str(&claims.sub).map_err(|_| {
        (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "Invalid user ID"})),
        )
    })?;

    let result = sqlx::query!(
        r#"
        DELETE FROM documents
        WHERE id = $1 AND user_id = $2
        "#,
        document_id,
        user_id
    )
    .execute(&state.db)
    .await
    .map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": "Failed to delete document"})),
        )
    })?;

    if result.rows_affected() == 0 {
        return Err((
            StatusCode::NOT_FOUND,
            Json(json!({"error": "Document not found"})),
        ));
    }

    Ok(StatusCode::NO_CONTENT)
}

pub async fn update_document(
    AuthUser(claims): AuthUser,
    State(state): State<AppState>,
    Path(document_id): Path<uuid::Uuid>,
    Json(payload): Json<UpdateDocument>,
) -> Result<Json<Document>, (StatusCode, Json<Value>)> {
    let user_id = uuid::Uuid::parse_str(&claims.sub).map_err(|_| {
        (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "Invalid user ID"})),
        )
    })?;

    let existing = sqlx::query!(
        "SELECT id FROM documents WHERE id = $1 AND user_id = $2",
        document_id,
        user_id
    )
    .fetch_optional(&state.db)
    .await
    .map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": "Database error"})),
        )
    })?;

    if existing.is_none() {
        return Err((
            StatusCode::NOT_FOUND,
            Json(json!({"error": "Document not found"})),
        ));
    }

    let updated_document = sqlx::query_as!(
        Document,
        r#"
        UPDATE documents
        SET 
            title = COALESCE($1, title),
            authors = COALESCE($2, authors),
            year = COALESCE($3, year),
            publication_type = COALESCE($4, publication_type),
            journal = COALESCE($5, journal),
            volume = COALESCE($6, volume),
            issue = COALESCE($7, issue),
            pages = COALESCE($8, pages),
            publisher = COALESCE($9, publisher),
            doi = COALESCE($10, doi),
            url = COALESCE($11, url),
            abstract_text = COALESCE($12, abstract_text),
            keywords = COALESCE($13, keywords),
            pdf_url = COALESCE($14, pdf_url),
            updated_at = NOW()
        WHERE id = $15 AND user_id = $16
        RETURNING id, user_id, title, authors, year, publication_type, journal,
                  volume, issue, pages, publisher, doi, url, abstract_text,
                  keywords, pdf_url, created_at, updated_at
        "#,
        payload.title,
        payload.authors.as_deref(),
        payload.year,
        payload.publication_type,
        payload.journal,
        payload.volume,
        payload.issue,
        payload.pages,
        payload.publisher,
        payload.doi,
        payload.url,
        payload.abstract_text,
        payload.keywords.as_deref(),
        payload.pdf_url,
        document_id,
        user_id
    )
    .fetch_one(&state.db)
    .await
    .map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": "Failed to update document"})),
        )
    })?;

    Ok(Json(updated_document))
}

// Internal helper function for document creation
async fn create_document_internal(
    state: &AppState,
    user_id: uuid::Uuid,
    payload: CreateDocument,
) -> Result<Document, (StatusCode, Json<Value>)> {
    let document = sqlx::query_as!(
        Document,
        r#"
        INSERT INTO documents (
            user_id, title, authors, year, publication_type, journal,
            volume, issue, pages, publisher, doi, url, abstract_text, keywords, pdf_url
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING id, user_id, title, authors, year, publication_type, journal,
                  volume, issue, pages, publisher, doi, url, abstract_text,
                  keywords, pdf_url, created_at, updated_at
        "#,
        user_id,
        payload.title,
        payload.authors.as_deref(),
        payload.year,
        payload.publication_type,
        payload.journal,
        payload.volume,
        payload.issue,
        payload.pages,
        payload.publisher,
        payload.doi,
        payload.url,
        payload.abstract_text,
        payload.keywords.as_deref(),
        payload.pdf_url
    )
    .fetch_one(&state.db)
    .await
    .map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": "Failed to create document"})),
        )
    })?;

    Ok(document)
}

pub async fn upload_pdf(
    AuthUser(claims): AuthUser,
    State(state): State<AppState>,
    mut multipart: axum::extract::Multipart,
) -> Result<(StatusCode, Json<Value>), (StatusCode, Json<Value>)> {
    let user_id = uuid::Uuid::parse_str(&claims.sub).map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": "Invalid user ID"})),
        )
    })?;

    // Extract the file field from multipart
    let mut file_name: Option<String> = None;
    let mut file_path: Option<String> = None;

    while let Some(field) = multipart.next_field().await.map_err(|e| {
        (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": format!("Failed to read multipart field: {}", e)})),
        )
    })? {
        let name = field.name().unwrap_or("").to_string();

        if name == "file" {
            let original_filename = field.file_name().unwrap_or("unknown.pdf").to_string();

            // Validate file extension
            if !original_filename.to_lowercase().ends_with(".pdf") {
                return Err((
                    StatusCode::BAD_REQUEST,
                    Json(json!({"error": "Only PDF files are allowed"})),
                ));
            }

            // Generate unique filename
            let file_id = uuid::Uuid::new_v4();
            let stored_filename = format!("{}_{}", file_id, original_filename);
            let upload_path = format!("uploads/{}", stored_filename);

            // Read file bytes
            let data = field.bytes().await.map_err(|e| {
                (
                    StatusCode::BAD_REQUEST,
                    Json(json!({"error": format!("Failed to read file data: {}", e)})),
                )
            })?;

            // Write to disk
            tokio::fs::write(&upload_path, &data).await.map_err(|e| {
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({"error": format!("Failed to save file: {}", e)})),
                )
            })?;

            file_name = Some(original_filename);
            file_path = Some(upload_path);
            break;
        }
    }

    let file_path = file_path.ok_or_else(|| {
        (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "No file provided"})),
        )
    })?;

    let file_name = file_name.unwrap_or_else(|| "unknown.pdf".to_string());

    // TODO: AI metadata extraction

    let mut metadata = match crate::metadata::extract_metadata_from_pdf(&file_path).await {
        Ok(metadata) => {
            println!("Metadata extraction successful!");
            metadata
        }
        Err(e) => {
            eprintln!(
                "Metadata extraction failed: {}. Using filename as fallback.",
                e
            );
            CreateDocument {
                title: file_name.clone(),
                authors: None,
                year: None,
                publication_type: None,
                journal: None,
                volume: None,
                issue: None,
                pages: None,
                publisher: None,
                doi: None,
                url: None,
                abstract_text: None,
                keywords: None,
                pdf_url: None,
            }
        }
    };

    // Set the PDF path
    metadata.pdf_url = Some(file_path);

    let document = create_document_internal(&state, user_id, metadata).await?;

    Ok((StatusCode::CREATED, Json(json!(document))))
}

pub async fn upload_profile_image(
    AuthUser(claims): AuthUser,
    State(state): State<AppState>,
    mut multipart: Multipart,
) -> Result<Json<UserResponse>, (StatusCode, Json<Value>)> {
    // Parse user ID from JWT claims
    let user_id = uuid::Uuid::parse_str(&claims.sub).map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": "Invalid user ID"})),
        )
    })?;

    // Extract the file field from multipart
    let mut file_data: Option<Vec<u8>> = None;
    let mut file_extension: Option<String> = None;

    while let Some(field) = multipart.next_field().await.map_err(|e| {
        (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": format!("Failed to read multipart field: {}", e)})),
        )
    })? {
        let name = field.name().unwrap_or("").to_string();

        if name == "file" {
            let original_filename = field.file_name().unwrap_or("unknown").to_string();

            // Validate file extension (jpg, jpeg, png, webp)
            let ext = original_filename
                .split('.')
                .last()
                .unwrap_or("")
                .to_lowercase();

            if !["jpg", "jpeg", "png", "webp"].contains(&ext.as_str()) {
                return Err((
                    StatusCode::BAD_REQUEST,
                    Json(json!({"error": "Only JPG, PNG, and WebP images are allowed"})),
                ));
            }

            // Read file bytes
            let data = field.bytes().await.map_err(|e| {
                (
                    StatusCode::BAD_REQUEST,
                    Json(json!({"error": format!("Failed to read file data: {}", e)})),
                )
            })?;

            // Validate file size (5MB max)
            if data.len() > 5 * 1024 * 1024 {
                return Err((
                    StatusCode::BAD_REQUEST,
                    Json(json!({"error": "Image must be smaller than 5MB"})),
                ));
            }

            file_data = Some(data.to_vec());
            file_extension = Some(ext);
            break;
        }
    }

    let file_data = file_data.ok_or_else(|| {
        (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "No file provided"})),
        )
    })?;

    let file_extension = file_extension.unwrap();

    // Create uploads/profile_images directory if it doesn't exist
    tokio::fs::create_dir_all("uploads/profile_images")
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": format!("Failed to create upload directory: {}", e)})),
            )
        })?;

    // Delete old profile image if it exists
    let old_user = sqlx::query_as!(
        User,
        r#"SELECT id, email, password_hash, username, profile_image_url, created_at, updated_at FROM users WHERE id = $1"#,
        user_id
    )
    .fetch_one(&state.db)
    .await
    .map_err(|_| {
        (
            StatusCode::NOT_FOUND,
            Json(json!({"error": "User not found"})),
        )
    })?;

    if let Some(old_image_url) = old_user.profile_image_url {
        // Delete old file from disk (ignore errors if file doesn't exist)
        let _ = tokio::fs::remove_file(&old_image_url).await;
    }

    // Generate unique filename
    let file_id = uuid::Uuid::new_v4();
    let stored_filename = format!("{}_{}.{}", user_id, file_id, file_extension);
    let upload_path = format!("uploads/profile_images/{}", stored_filename);

    // Write to disk
    tokio::fs::write(&upload_path, &file_data)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": format!("Failed to save file: {}", e)})),
            )
        })?;

    // Update user's profile_image_url in database
    let updated_user = sqlx::query_as!(
        User,
        r#"UPDATE users SET profile_image_url = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, password_hash, username, profile_image_url, created_at, updated_at"#,
        upload_path,
        user_id
    )
    .fetch_one(&state.db)
    .await
    .map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": "Failed to update user profile"})),
        )
    })?;

    Ok(Json(UserResponse {
        id: updated_user.id,
        email: updated_user.email,
        username: updated_user.username,
        profile_image_url: updated_user.profile_image_url,
    }))
}

pub async fn delete_profile_image(
    AuthUser(claims): AuthUser,
    State(state): State<AppState>,
) -> Result<Json<UserResponse>, (StatusCode, Json<Value>)> {
    // Parse user ID from JWT claims
    let user_id = uuid::Uuid::parse_str(&claims.sub).map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": "Invalid user ID"})),
        )
    })?;

    // Get current user to find their profile image
    let user = sqlx::query_as!(
        User,
        r#"SELECT id, email, password_hash, username, profile_image_url, created_at, updated_at FROM users WHERE id = $1"#,
        user_id
    )
    .fetch_one(&state.db)
    .await
    .map_err(|_| {
        (
            StatusCode::NOT_FOUND,
            Json(json!({"error": "User not found"})),
        )
    })?;

    // Delete file from disk if it exists
    if let Some(image_url) = user.profile_image_url {
        // Ignore error if file doesn't exist
        let _ = tokio::fs::remove_file(&image_url).await;
    }

    // Update database to set profile_image_url to NULL
    let updated_user = sqlx::query_as!(
        User,
        r#"UPDATE users SET profile_image_url = NULL, updated_at = NOW() WHERE id = $1 RETURNING id, email, password_hash, username, profile_image_url, created_at, updated_at"#,
        user_id
    )
    .fetch_one(&state.db)
    .await
    .map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": "Failed to update user profile"})),
        )
    })?;

    Ok(Json(UserResponse {
        id: updated_user.id,
        email: updated_user.email,
        username: updated_user.username,
        profile_image_url: updated_user.profile_image_url,
    }))
}

pub async fn update_profile(
    AuthUser(claims): AuthUser,
    State(state): State<AppState>,
    Json(payload): Json<UpdateProfile>,
) -> Result<Json<UserResponse>, (StatusCode, Json<Value>)> {
    // Parse user ID from JWT claims
    let user_id = uuid::Uuid::parse_str(&claims.sub).map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": "Invalid user ID"})),
        )
    })?;

    // Update username in database
    let updated_user = sqlx::query_as!(
        User,
        r#"UPDATE users SET username = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, password_hash, username, profile_image_url, created_at, updated_at"#,
        payload.username,
        user_id
    )
    .fetch_one(&state.db)
    .await
    .map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": "Failed to update profile"})),
        )
    })?;

    Ok(Json(UserResponse {
        id: updated_user.id,
        email: updated_user.email,
        username: updated_user.username,
        profile_image_url: updated_user.profile_image_url,
    }))
}

pub async fn get_user_collections(
    AuthUser(claims): AuthUser,
    State(state): State<AppState>,
) -> Result<Json<Vec<Collection>>, (StatusCode, Json<Value>)> {
    let user_id = uuid::Uuid::parse_str(&claims.sub).map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": "Invalid user ID"})),
        )
    })?;

    let collections = sqlx::query_as!(
        Collection,
        r#"
        SELECT id, user_id, name, parent_id, created_at, updated_at
        FROM collections
        WHERE user_id = $1
        ORDER BY name ASC
        "#,
        user_id
    )
    .fetch_all(&state.db)
    .await
    .map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": "Failed to fetch collections"})),
        )
    })?;

    Ok(Json(collections))
}

pub async fn create_collection(
    AuthUser(claims): AuthUser,
    State(state): State<AppState>,
    Json(payload): Json<CreateCollection>,
) -> Result<(StatusCode, Json<Collection>), (StatusCode, Json<Value>)> {
    let user_id = uuid::Uuid::parse_str(&claims.sub).map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": "Invalid user ID"})),
        )
    })?;

    // If parent_id is provided, verify it belongs to this user
    if let Some(parent_id) = payload.parent_id {
        let parent_exists = sqlx::query!(
            "SELECT id FROM collections WHERE id = $1 AND user_id = $2",
            parent_id,
            user_id
        )
        .fetch_optional(&state.db)
        .await
        .map_err(|_| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": "Database error"})),
            )
        })?;

        if parent_exists.is_none() {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(json!({"error": "Parent collection not found"})),
            ));
        }
    }

    let collection = sqlx::query_as!(
        Collection,
        r#"
        INSERT INTO collections (user_id, name, parent_id)
        VALUES ($1, $2, $3)
        RETURNING id, user_id, name, parent_id, created_at, updated_at
        "#,
        user_id,
        payload.name,
        payload.parent_id
    )
    .fetch_one(&state.db)
    .await
    .map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": "Failed to create collection"})),
        )
    })?;

    Ok((StatusCode::CREATED, Json(collection)))
}

pub async fn update_collection(
    AuthUser(claims): AuthUser,
    State(state): State<AppState>,
    Path(collection_id): Path<uuid::Uuid>,
    Json(payload): Json<UpdateCollection>,
) -> Result<Json<Collection>, (StatusCode, Json<Value>)> {
    let user_id = uuid::Uuid::parse_str(&claims.sub).map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": "Invalid user ID"})),
        )
    })?;

    // Verify collection belongs to user
    let existing = sqlx::query!(
        "SELECT id FROM collections WHERE id = $1 AND user_id = $2",
        collection_id,
        user_id
    )
    .fetch_optional(&state.db)
    .await
    .map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": "Database error"})),
        )
    })?;

    if existing.is_none() {
        return Err((
            StatusCode::NOT_FOUND,
            Json(json!({"error": "Collection not found"})),
        ));
    }

    // If new parent_id provided, verify it's not creating a cycle
    if let Some(new_parent_id) = payload.parent_id {
        // Can't set parent to itself
        if new_parent_id == collection_id {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(json!({"error": "Collection cannot be its own parent"})),
            ));
        }

        // Verify parent exists and belongs to user
        let parent_exists = sqlx::query!(
            "SELECT id FROM collections WHERE id = $1 AND user_id = $2",
            new_parent_id,
            user_id
        )
        .fetch_optional(&state.db)
        .await
        .map_err(|_| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": "Database error"})),
            )
        })?;

        if parent_exists.is_none() {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(json!({"error": "Parent collection not found"})),
            ));
        }
    }

    let updated_collection = sqlx::query_as!(
        Collection,
        r#"
        UPDATE collections
        SET name = COALESCE($1, name),
            parent_id = COALESCE($2, parent_id),
            updated_at = NOW()
        WHERE id = $3 AND user_id = $4
        RETURNING id, user_id, name, parent_id, created_at, updated_at
        "#,
        payload.name,
        payload.parent_id,
        collection_id,
        user_id
    )
    .fetch_one(&state.db)
    .await
    .map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": "Failed to update collection"})),
        )
    })?;

    Ok(Json(updated_collection))
}

pub async fn delete_collection(
    AuthUser(claims): AuthUser,
    State(state): State<AppState>,
    Path(collection_id): Path<uuid::Uuid>,
) -> Result<StatusCode, (StatusCode, Json<Value>)> {
    let user_id = uuid::Uuid::parse_str(&claims.sub).map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": "Invalid user ID"})),
        )
    })?;

    let result = sqlx::query!(
        "DELETE FROM collections WHERE id = $1 AND user_id = $2",
        collection_id,
        user_id
    )
    .execute(&state.db)
    .await
    .map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": "Failed to delete collection"})),
        )
    })?;

    if result.rows_affected() == 0 {
        return Err((
            StatusCode::NOT_FOUND,
            Json(json!({"error": "Collection not found"})),
        ));
    }

    Ok(StatusCode::NO_CONTENT)
}

pub async fn add_document_to_collection(
    AuthUser(claims): AuthUser,
    State(state): State<AppState>,
    Path((collection_id, document_id)): Path<(uuid::Uuid, uuid::Uuid)>,
) -> Result<StatusCode, (StatusCode, Json<Value>)> {
    let user_id = uuid::Uuid::parse_str(&claims.sub).map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": "Invalid user ID"})),
        )
    })?;

    // Verify both collection and document belong to user
    let collection_check = sqlx::query!(
        "SELECT id FROM collections WHERE id = $1 AND user_id = $2",
        collection_id,
        user_id
    )
    .fetch_optional(&state.db)
    .await
    .map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": "Database error"})),
        )
    })?;

    if collection_check.is_none() {
        return Err((
            StatusCode::NOT_FOUND,
            Json(json!({"error": "Collection not found"})),
        ));
    }

    let document_check = sqlx::query!(
        "SELECT id FROM documents WHERE id = $1 AND user_id = $2",
        document_id,
        user_id
    )
    .fetch_optional(&state.db)
    .await
    .map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": "Database error"})),
        )
    })?;

    if document_check.is_none() {
        return Err((
            StatusCode::NOT_FOUND,
            Json(json!({"error": "Document not found"})),
        ));
    }

    // Insert into junction table (ignore if already exists)
    sqlx::query!(
        r#"
        INSERT INTO document_collections (document_id, collection_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
        "#,
        document_id,
        collection_id
    )
    .execute(&state.db)
    .await
    .map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": "Failed to add document to collection"})),
        )
    })?;

    Ok(StatusCode::CREATED)
}

pub async fn remove_document_from_collection(
    AuthUser(claims): AuthUser,
    State(state): State<AppState>,
    Path((collection_id, document_id)): Path<(uuid::Uuid, uuid::Uuid)>,
) -> Result<StatusCode, (StatusCode, Json<Value>)> {
    let user_id = uuid::Uuid::parse_str(&claims.sub).map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": "Invalid user ID"})),
        )
    })?;

    // Verify collection belongs to user
    let collection_check = sqlx::query!(
        "SELECT id FROM collections WHERE id = $1 AND user_id = $2",
        collection_id,
        user_id
    )
    .fetch_optional(&state.db)
    .await
    .map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": "Database error"})),
        )
    })?;

    if collection_check.is_none() {
        return Err((
            StatusCode::NOT_FOUND,
            Json(json!({"error": "Collection not found"})),
        ));
    }

    let result = sqlx::query!(
        "DELETE FROM document_collections WHERE document_id = $1 AND collection_id = $2",
        document_id,
        collection_id
    )
    .execute(&state.db)
    .await
    .map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": "Failed to remove document from collection"})),
        )
    })?;

    if result.rows_affected() == 0 {
        return Err((
            StatusCode::NOT_FOUND,
            Json(json!({"error": "Document not in collection"})),
        ));
    }

    Ok(StatusCode::NO_CONTENT)
}

pub async fn get_collection_documents(
    AuthUser(claims): AuthUser,
    State(state): State<AppState>,
    Path(collection_id): Path<uuid::Uuid>,
) -> Result<Json<Vec<Document>>, (StatusCode, Json<Value>)> {
    let user_id = uuid::Uuid::parse_str(&claims.sub).map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": "Invalid user ID"})),
        )
    })?;

    // Verify collection belongs to user
    let collection_check = sqlx::query!(
        "SELECT id FROM collections WHERE id = $1 AND user_id = $2",
        collection_id,
        user_id
    )
    .fetch_optional(&state.db)
    .await
    .map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": "Database error"})),
        )
    })?;

    if collection_check.is_none() {
        return Err((
            StatusCode::NOT_FOUND,
            Json(json!({"error": "Collection not found"})),
        ));
    }

    let documents = sqlx::query_as!(
        Document,
        r#"
        SELECT d.id, d.user_id, d.title, d.authors, d.year, d.publication_type, 
               d.journal, d.volume, d.issue, d.pages, d.publisher, d.doi, d.url,
               d.abstract_text, d.keywords, d.pdf_url, d.created_at, d.updated_at
        FROM documents d
        INNER JOIN document_collections dc ON d.id = dc.document_id
        WHERE dc.collection_id = $1 AND d.user_id = $2
        ORDER BY d.created_at DESC
        "#,
        collection_id,
        user_id
    )
    .fetch_all(&state.db)
    .await
    .map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": "Failed to fetch documents"})),
        )
    })?;

    Ok(Json(documents))
}
