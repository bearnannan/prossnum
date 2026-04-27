const fs = require('fs');

const envPath = '.env.local';
if (!fs.existsSync(envPath)) {
  console.error('.env.local not found');
  process.exit(1);
}

// Manually parse to see EXACTLY what's in there
const content = fs.readFileSync(envPath, 'utf8');
const match = content.match(/GOOGLE_PRIVATE_KEY="([^"]+)"/);
if (!match) {
  console.log('GOOGLE_PRIVATE_KEY not found or not quoted');
} else {
  const rawValue = match[1];
  console.log('Raw Value Length:', rawValue.length);
  console.log('Includes literal \\n:', rawValue.includes('\\n'));
  
  // Try to simulate what dotenv or the app does
  const processed = rawValue.replace(/\\n/g, '\n');
  console.log('Processed Length:', processed.length);
  console.log('Starts with:', processed.substring(0, 30));
  console.log('Ends with:', processed.substring(processed.length - 30));
  
  // Check if there are internal newlines (real newlines)
  console.log('Contains real newlines:', processed.includes('\n'));
}
