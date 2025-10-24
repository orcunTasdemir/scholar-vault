use serde::{Deserialize, Serialize};
use std::env;

#[derive(Debug, Serialize)]
struct OpenAIRequest {
    model: String,
    messages: Vec<Message>,
    temperature: f32,
}

#[derive(Debug, Serialize)]
struct Message {
    role: String,
    content: String,
}

#[derive(Debug, Deserialize)]
struct OpenAIResponse {
    choices: Vec<Choice>,
}

#[derive(Debug, Deserialize)]
struct Choice {
    message: MessageContent,
}

#[derive(Debug, Deserialize)]
struct MessageContent {
    content: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct ExtractedMetadata {
    pub title: Option<String>,
    pub authors: Option<Vec<String>>,
    pub year: Option<i32>,
    pub journal: Option<String>,
    pub doi: Option<String>,
    pub abstract_text: Option<String>,
}

pub async fn extract_metadata_from_pdf(pdf_path: &str) -> Result<ExtractedMetadata, String> {
    // Step 1: Extract text from PDF
    let pdf_text = extract_text_from_pdf(pdf_path)?;

    // Step 2: Send to OpenAI for analysis
    let metadata = analyze_with_openai(&pdf_text).await?;

    Ok(metadata)
}

fn extract_text_from_pdf(pdf_path: &str) -> Result<String, String> {
    let bytes = std::fs::read(pdf_path).map_err(|e| format!("Failed to read PDF: {}", e))?;

    let text = pdf_extract::extract_text_from_mem(&bytes)
        .map_err(|e| format!("Failed to extract text from PDF: {}", e))?;

    // Take first 4000 characters to avoid token limits
    let truncated = if text.len() > 4000 {
        &text[..4000]
    } else {
        &text
    };

    Ok(truncated.to_string())
}

async fn analyze_with_openai(pdf_text: &str) -> Result<ExtractedMetadata, String> {
    let api_key = env::var("OPENAI_API_KEY").map_err(|_| "OPENAI_API_KEY not set".to_string())?;

    let prompt = format!(
        r#"Extract the following information from this academic paper text. Return ONLY valid JSON with no additional text or markdown formatting.

Paper text:
{}

Return JSON in this exact format:
{{
  "title": "paper title",
  "authors": ["Author One", "Author Two"],
  "year": 2024,
  "journal": "Journal Name",
  "doi": "10.xxxx/xxxxx",
  "abstract_text": "abstract text"
}}

If you cannot find a field, use null. Do not include any text before or after the JSON."#,
        pdf_text
    );

    let request = OpenAIRequest {
        model: "gpt-4o-mini".to_string(),
        messages: vec![Message {
            role: "user".to_string(),
            content: prompt,
        }],
        temperature: 0.0,
    };

    let client = reqwest::Client::new();
    let response = client
        .post("https://api.openai.com/v1/chat/completions")
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&request)
        .send()
        .await
        .map_err(|e| format!("OpenAI request failed: {}", e))?;

    let response_data: OpenAIResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse OpenAI response: {}", e))?;

    let content = response_data
        .choices
        .first()
        .ok_or("No response from OpenAI")?
        .message
        .content
        .clone();

    // Parse the JSON response
    let metadata: ExtractedMetadata = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse metadata JSON: {}. Content: {}", e, content))?;

    Ok(metadata)
}
