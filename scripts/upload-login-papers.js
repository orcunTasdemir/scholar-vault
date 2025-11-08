#!/usr/bin/env node

/**
 * Upload login page paper images to Supabase Storage
 *
 * Usage:
 *   node scripts/upload-login-papers.js
 *
 * Requires:
 *   - SUPABASE_URL environment variable
 *   - SUPABASE_SERVICE_ROLE_KEY environment variable
 */

const fs = require('fs');
const path = require('path');

// Read env file manually
function loadEnv() {
  const envPath = path.join(__dirname, '..', 'backend', '.env');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const env = {};

  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      env[match[1].trim()] = match[2].trim();
    }
  });

  return env;
}

const env = loadEnv();
const SUPABASE_URL = env.SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET_NAME = 'uploads';
const PAPERS_DIR = path.join(__dirname, '..', 'frontend', 'public', 'papers');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  console.error('Make sure backend/.env file exists with these variables');
  process.exit(1);
}

async function uploadFile(filePath, fileName) {
  const fileBuffer = fs.readFileSync(filePath);
  const uploadPath = `static/login-papers/${fileName}`;

  const url = `${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${uploadPath}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'image/png',
    },
    body: fileBuffer,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Upload failed for ${fileName}: ${error}`);
  }

  return uploadPath;
}

async function main() {
  console.log('Starting upload of login page paper images to Supabase...\n');
  console.log(`Supabase URL: ${SUPABASE_URL}`);
  console.log(`Papers directory: ${PAPERS_DIR}`);
  console.log(`Bucket: ${BUCKET_NAME}\n`);

  const files = fs.readdirSync(PAPERS_DIR).filter(f => f.endsWith('.png'));
  console.log(`Found ${files.length} PNG files to upload\n`);

  let successCount = 0;
  let failCount = 0;

  for (const fileName of files) {
    try {
      const filePath = path.join(PAPERS_DIR, fileName);
      const uploadedPath = await uploadFile(filePath, fileName);
      console.log(`✓ Uploaded: ${fileName} -> ${uploadedPath}`);
      successCount++;
    } catch (error) {
      console.error(`✗ Failed: ${fileName} - ${error.message}`);
      failCount++;
    }
  }

  console.log(`\n========== Upload Summary ==========`);
  console.log(`Total files: ${files.length}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${failCount}`);
  console.log(`====================================\n`);

  if (successCount > 0) {
    console.log('Images uploaded to: uploads/static/login-papers/');
    console.log('Base URL: ${SUPABASE_URL}/storage/v1/object/public/uploads/static/login-papers/');
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
