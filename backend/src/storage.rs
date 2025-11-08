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
    pub async fn create_signed_url(
        &self,
        bucket: &str,
        path: &str,
        expires_in: u64,
    ) -> Result<String, String> {
        let signed_url_endpoint = format!(
            "{}/storage/v1/object/sign/{}/{}",
            self.url, bucket, path
        );

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

        // Construct full URL
        let full_url = format!("{}{}", self.url, signed_response.signed_url);
        Ok(full_url)
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