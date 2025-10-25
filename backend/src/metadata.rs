use crate::models::CreateDocument;
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
    #[serde(rename = "type")]
    publication_type: Option<String>,
    #[serde(rename = "URL")]
    url: Option<String>,
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

pub async fn extract_metadata_from_pdf(pdf_path: &str) -> Result<CreateDocument, String> {
    // Extract text from PDF
    let pdf_text = extract_text_from_pdf(pdf_path)?;

    let mut final_metadata = CreateDocument {
        title: String::new(), // Will be filled, required field
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
        pdf_url: None, // Set later in handlers.rs
    };

    // Try finding doi
    if let Some(doi) = extract_doi_from_text(&pdf_text) {
        println!("Found DOI: {}", doi);
        // try lookup
        match lookup_doi_metadata(&doi).await {
            Ok(crossref_metadata) => {
                println!("CrossRef lookup successful");
                // use whatever is returned
                final_metadata = crossref_metadata;

                // Check what's missing
                let missing_fields = vec![
                    if final_metadata.title.is_empty() {
                        Some("title")
                    } else {
                        None
                    },
                    if final_metadata.authors.is_none() {
                        Some("authors")
                    } else {
                        None
                    },
                    if final_metadata.year.is_none() {
                        Some("year")
                    } else {
                        None
                    },
                    if final_metadata.journal.is_none() {
                        Some("journal")
                    } else {
                        None
                    },
                    if final_metadata.publication_type.is_none() {
                        Some("publication_type")
                    } else {
                        None
                    },
                    if final_metadata.volume.is_none() {
                        Some("volume")
                    } else {
                        None
                    },
                    if final_metadata.issue.is_none() {
                        Some("issue")
                    } else {
                        None
                    },
                    if final_metadata.pages.is_none() {
                        Some("pages")
                    } else {
                        None
                    },
                    if final_metadata.publisher.is_none() {
                        Some("publisher")
                    } else {
                        None
                    },
                    if final_metadata.url.is_none() {
                        Some("url")
                    } else {
                        None
                    },
                    if final_metadata.abstract_text.is_none() {
                        Some("abstract")
                    } else {
                        None
                    },
                    if final_metadata.keywords.is_none() {
                        Some("keywords")
                    } else {
                        None
                    },
                ]
                .into_iter()
                .flatten()
                .collect::<Vec<_>>();

                if !missing_fields.is_empty() {
                    println!(
                        "CrossRef missing fields: {:?}. Using AI to fill gaps...",
                        missing_fields
                    );

                    // Run AI to get missing fields
                    match analyze_with_openai(&pdf_text).await {
                        Ok(ai_metadata) => {
                            println!("AI extraction successful");
                            // Fill in missing fields from AI
                            if final_metadata.title.is_empty() {
                                final_metadata.title = ai_metadata.title;
                            }
                            if final_metadata.authors.is_none() {
                                final_metadata.authors = ai_metadata.authors;
                            }
                            if final_metadata.year.is_none() {
                                final_metadata.year = ai_metadata.year;
                            }
                            if final_metadata.journal.is_none() {
                                final_metadata.journal = ai_metadata.journal;
                            }
                            if final_metadata.publication_type.is_none() {
                                final_metadata.publication_type = ai_metadata.publication_type;
                            }
                            if final_metadata.volume.is_none() {
                                final_metadata.volume = ai_metadata.volume;
                            }
                            if final_metadata.issue.is_none() {
                                final_metadata.issue = ai_metadata.issue;
                            }
                            if final_metadata.pages.is_none() {
                                final_metadata.pages = ai_metadata.pages;
                            }
                            if final_metadata.publisher.is_none() {
                                final_metadata.publisher = ai_metadata.publisher;
                            }
                            if final_metadata.url.is_none() {
                                final_metadata.url = ai_metadata.url;
                            }
                            if final_metadata.abstract_text.is_none() {
                                final_metadata.abstract_text = ai_metadata.abstract_text;
                            }
                            if final_metadata.keywords.is_none() {
                                final_metadata.keywords = ai_metadata.keywords;
                            }
                            println!("Merged CrossRef + AI data for complete metadata");
                        }
                        Err(e) => {
                            eprintln!(
                                "AI extraction failed: {}. Using CrossRef data with gaps.",
                                e
                            );
                        }
                    }
                } else {
                    println!("CrossRef has complete metadata, no AI needed");
                }

                return Ok(final_metadata);
            }
            Err(e) => {
                println!(
                    "CrossRef lookup failed: {}. Falling back to full AI analysis.",
                    e
                );
            }
        }
    } else {
        println!("No DOI found in PDF. Using AI extraction.");
    }

    // Fallback to OpenAI for full analysis (when no DOI or CrossRef failed)
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

async fn lookup_doi_metadata(doi: &str) -> Result<CreateDocument, String> {
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

    Ok(CreateDocument {
        title: title.unwrap_or_default(),
        authors: authors,
        year: year,
        publication_type: msg.publication_type,
        journal: journal,
        volume: msg.volume,
        issue: msg.issue,
        pages: msg.page,
        publisher: msg.publisher,
        doi: Some(doi.to_string()),
        url: msg.url,
        abstract_text: msg.abstract_text,
        keywords: None, // CrossRef doesn't provide keywords
        pdf_url: None,
    })
}

async fn analyze_with_openai(pdf_text: &str) -> Result<CreateDocument, String> {
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
  "publication_type": "journal-article",
  "journal": "Journal Name",
  "volume": "12",
  "issue": "3",
  "pages": "45-67",
  "publisher": "Publisher Name",
  "doi": "10.xxxx/xxxxx",
  "url": "https://doi.org/10.xxxx/xxxxx",
  "abstract_text": "abstract text",
  "keywords": ["keyword1", "keyword2", "keyword3"]
}}

If you cannot find a field, use null. The title field is required (use empty string if unknown). Do not include any text before or after the JSON."#,
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
    let metadata: CreateDocument = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse metadata JSON: {}. Content: {}", e, content))?;

    Ok(metadata)
}
