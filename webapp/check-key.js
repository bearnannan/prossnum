const fs = require('fs');
require('dotenv').config({ path: 'webapp/.env.local' });

function checkKey() {
  const raw = process.env.GOOGLE_PRIVATE_KEY;
  if (!raw) {
    console.error('GOOGLE_PRIVATE_KEY not found');
    return;
  }
  
  console.log('Raw key length:', raw.length);
  console.log('Starts with:', raw.substring(0, 30));
  console.log('Ends with:', raw.substring(raw.length - 30));
  
  const replaced = raw.replace(/\\n/g, '\n');
  console.log('Replaced key length:', replaced.length);
  console.log('Starts with:', replaced.substring(0, 30));
  console.log('Ends with:', replaced.substring(replaced.length - 30));
  
  // Count occurrences of actual \n
  const newlineCount = (replaced.match(/\n/g) || []).length;
  console.log('Actual newlines in replaced string:', newlineCount);
}

checkKey();
