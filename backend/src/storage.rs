use reqwest::multipart;
use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Clone)]
pub struct SupabaseStorage {
    pub url: String,
    pub service_role_key: String,
    client: reqwest::Client,
}

#[derive(Serialize)]
struct SignedUrlRequest {
    #[serde(rename = "expiresIn")]
    expires_in: u64,
}

#[derive(Deserialize)]
struct SignedUrlResponse {
    #[serde(rename = "signedURL")]
    signed_url: String,
}

impl SupabaseStorage {
    pub fn new(url: String, service_role_key: String) -> Self {
        Self {
            url,
            service_role_key,
            client: reqwest::Client::new(),
        }
    }

    /// Upload a file to Supabase Storage
    /// Returns the file path in the bucket
    pub async fn upload_file(
        &self,
        bucket: &str,
        path: &str,
        file_data: Vec<u8>,
        content_type: &str,
    ) -> Result<String, String> {
        let upload_url = format!(
            "{}/storage/v1/object/{}/{}",
            self.url, bucket, path
        );

        let part = multipart::Part::bytes(file_data)
            .file_name(path.to_string())
            .mime_str(content_type)
            .map_err(|e| format!("Failed to create multipart: {}", e))?;

        let form = multipart::Form::new().part("file", part);

        let response = self
            .client
            .post(&upload_url)
            .header("Authorization", format!("Bearer {}", self.service_role_key))
            .multipart(form)
            .send()
            .await
            .map_err(|e| format!("Upload request failed: {}", e))?;

        if !response.status().is_success() {
            let error_text = response
                .text()
                .await
                .unwrap_or_else(|_| "Unknown error".to_string());
            return Err(format!("Upload failed: {}", error_text));
        }

        // Supabase returns the uploaded file path
        Ok(path.to_string())
    }

    /// Generate a signed URL for temporary access to a private file
    /// expires_in: Duration in seconds (default: 3600 = 1 hour)
    // pub async fn create_signed_url(
    //     &self,
    //     bucket: &str,
    //     path: &str,
    //     expires_in: u64,
    // ) -> Result<String, String> {
    //     eprintln!("Creating signed URL for bucket: {}, path: {}", bucket, path);
    //     let signed_url_endpoint = format!(
    //         "{}/storage/v1/object/sign/{}/{}",
    //         self.url, bucket, path
    //     );
    //     eprintln!("Signed URL endpoint: {}", signed_url_endpoint);

    //     let request_body = SignedUrlRequest { expires_in };

    //     let response = self
    //         .client
    //         .post(&signed_url_endpoint)
    //         .header("Authorization", format!("Bearer {}", self.service_role_key))
    //         .header("Content-Type", "application/json")
    //         .json(&request_body)
    //         .send()
    //         .await
    //         .map_err(|e| format!("Signed URL request failed: {}", e))?;

    //     if !response.status().is_success() {
    //         let error_text = response
    //             .text()
    //             .await
    //             .unwrap_or_else(|_| "Unknown error".to_string());
    //         return Err(format!("Failed to create signed URL: {}", error_text));
    //     }

    //     let signed_response: SignedUrlResponse = response
    //         .json()
    //         .await
    //         .map_err(|e| format!("Failed to parse signed URL response: {}", e))?;

    //     // Construct full URL
    //     let full_url = format!("{}{}", self.url, signed_response.signed_url);
    //     eprintln!("full_url is: {}", full_url);
    //     Ok(full_url)
    // }

    pub async fn create_signed_url(
    &self,
    bucket: &str,
    path: &str,
    expires_in: u64,
) -> Result<String, String> {
    eprintln!("Creating signed URL for bucket: {}, path: {}", bucket, path);

    // This is the endpoint to *request* a signed URL from Supabase
    let signed_url_endpoint = format!(
        "{}/storage/v1/object/sign/{}/{}",
        self.url, bucket, path
    );
    eprintln!("Signed URL endpoint: {}", signed_url_endpoint);

    let request_body = SignedUrlRequest { expires_in };

    let response = self
        .client
        .post(&signed_url_endpoint)
        .header("Authorization", format!("Bearer {}", self.service_role_key))
        .header("Content-Type", "application/json")
        .json(&request_body)
        .send()
        .await
        .map_err(|e| format!("Signed URL request failed: {}", e))?;

    if !response.status().is_success() {
        let error_text = response
            .text()
            .await
            .unwrap_or_else(|_| "Unknown error".to_string());
        return Err(format!("Failed to create signed URL: {}", error_text));
    }

    let signed_response: SignedUrlResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse signed URL response: {}", e))?;

    // Supabase sometimes returns `/object/sign/...` instead of `/storage/v1/object/sign/...`
    let signed_path = if signed_response.signed_url.starts_with("/object/sign/") {
        format!("/storage/v1{}", signed_response.signed_url)
    } else if signed_response.signed_url.starts_with("http") {
        // Already a full URL, no need to prepend anything
        signed_response.signed_url.clone()
    } else {
        // Assume relative path that already includes /storage/v1 or similar
        signed_response.signed_url.clone()
    };

    let full_url = if signed_path.starts_with("http") {
        signed_path
    } else {
        format!("{}{}", self.url, signed_path)
    };

    eprintln!("Final signed URL: {}", full_url);
    Ok(full_url)
}


    /// Download a file from Supabase Storage using a signed URL
    /// Returns the file bytes
    pub async fn download_file(&self, bucket: &str, path: &str) -> Result<Vec<u8>, String> {
        // Generate a signed URL with 1 hour expiration
        let signed_url = self.create_signed_url(bucket, path, 3600).await?;

        // Download the file using the signed URL
        let response = self
            .client
            .get(&signed_url)
            .send()
            .await
            .map_err(|e| format!("Download request failed: {}", e))?;

        if !response.status().is_success() {
            let error_text = response
                .text()
                .await
                .unwrap_or_else(|_| "Unknown error".to_string());
            return Err(format!("Download failed: {}", error_text));
        }

        let bytes = response
            .bytes()
            .await
            .map_err(|e| format!("Failed to read response bytes: {}", e))?;

        Ok(bytes.to_vec())
    }

    /// Delete a file from Supabase Storage
    pub async fn delete_file(&self, bucket: &str, path: &str) -> Result<(), String> {
        let delete_url = format!("{}/storage/v1/object/{}/{}", self.url, bucket, path);

        let response = self
            .client
            .delete(&delete_url)
            .header("Authorization", format!("Bearer {}", self.service_role_key))
            .send()
            .await
            .map_err(|e| format!("Delete request failed: {}", e))?;

        if !response.status().is_success() {
            let error_text = response
                .text()
                .await
                .unwrap_or_else(|_| "Unknown error".to_string());
            return Err(format!("Delete failed: {}", error_text));
        }

        Ok(())
    }

    /// Generate a unique filename with timestamp prefix
    pub fn generate_filename(original_name: &str) -> String {
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        // Sanitize filename - remove special characters except extension
        let sanitized = original_name
            .chars()
            .map(|c| if c.is_alphanumeric() || c == '.' || c == '-' { c } else { '_' })
            .collect::<String>();

        format!("{}_{}", timestamp, sanitized)
    }
}