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

#[derive(Debug, Deserialize)]
struct CrossRefResponse {
    message: CrossRefMessage,
}

#[derive(Debug, Deserialize)]
struct CrossRefMessage {
    title: Option<Vec<String>>,
    author: Option<Vec<CrossRefAuthor>>,
    published: Option<CrossRefDate>,
    #[serde(rename = "container-title")]
    container_title: Option<Vec<String>>,
    #[serde(rename = "DOI")]
    doi: Option<String>,
    #[serde(rename = "abstract")]
    abstract_text: Option<String>,
    volume: Option<String>,
    issue: Option<String>,
    page: Option<String>,
    publisher: Option<String>,
}

#[derive(Debug, Deserialize)]
struct CrossRefAuthor {
    given: Option<String>,
    family: Option<String>,
}

#[derive(Debug, Deserialize)]
struct CrossRefDate {
    #[serde(rename = "date-parts")]
    date_parts: Option<Vec<Vec<i32>>>,
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
    // Extract text from PDF
    let pdf_text = extract_text_from_pdf(pdf_path)?;

    // Try to find DOI in the PDF text
    if let Some(doi) = extract_doi_from_text(&pdf_text) {
        println!("Found DOI: {}", doi);
        // Try crossref lookup
        match lookup_doi_metadata(&doi).await {
            Ok(metadata) => {
                println!("CrossRef lookup successful");
                return Ok(metadata);
            }
            Err(e) => {
                println!(
                    "CrossRef lookup failed: {}. Falling back to metadata by AI-analysis.",
                    e
                );
            }
        }
    } else {
        print!("No DOI found in PDF. Using AI extraction.");
    }

    // Fallback to OpenAI for analysis
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

fn extract_doi_from_text(text: &str) -> Option<String> {
    // DOI regex pattern - matches common DOI formats
    let doi_pattern = regex::Regex::new(r"10\.\d{4,9}/[-._;()/:A-Za-z0-9]+").ok()?;

    // Find first DOI in text
    doi_pattern.find(text).map(|m| m.as_str().to_string())
}

async fn lookup_doi_metadata(doi: &str) -> Result<ExtractedMetadata, String> {
    let url = format!("https://api.crossref.org/works/{}", doi);

    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .header(
            "User-Agent",
            "ScholarVault/1.0 (mailto:tasdemir.or@gmail.com)",
        )
        .send()
        .await
        .map_err(|e| format!("CrossRef request failed: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("CrossRef returned status: {}", response.status()));
    }
    let data: CrossRefResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse CrossRef response: {}", e))?;

    let msg = data.message;

    // Extract authors
    let authors = msg.author.map(|author_list| {
        author_list
            .iter()
            .map(|a| {
                let given = a.given.as_deref().unwrap_or("");
                let family = a.family.as_deref().unwrap_or("");
                format!("{} {}", given, family).trim().to_string()
            })
            .collect()
    });

    // Extract year
    let year = msg
        .published
        .and_then(|p| p.date_parts)
        .and_then(|dp| dp.first().cloned())
        .and_then(|parts| parts.first().cloned());

    // Extract journal
    let journal = msg
        .container_title
        .and_then(|titles| titles.first().cloned());

    // Extract title
    let title = msg.title.and_then(|titles| titles.first().cloned());

    Ok(ExtractedMetadata {
        title: title,
        authors: authors,
        year: year,
        journal: journal,
        doi: Some(doi.to_string()),
        abstract_text: msg.abstract_text,
    })
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
