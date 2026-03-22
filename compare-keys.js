const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: 'webapp/.env.local' });

function compareKeys() {
    const jsonPath = 'prossnum-04e04a1f19f4.json';
    const keyFile = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const jsonKey = keyFile.private_key;
    const envKeyRaw = process.env.GOOGLE_PRIVATE_KEY;

    if (!envKeyRaw) {
        console.error('GOOGLE_PRIVATE_KEY not found in .env.local');
        return;
    }

    const envKey = envKeyRaw.replace(/\\n/g, '\n');

    console.log('JSON Key Length:', jsonKey.length);
    console.log('Env Key Length:', envKey.length);

    if (jsonKey === envKey) {
        console.log('Keys are identical (after replacement)');
    } else {
        console.log('Keys are DIFFERENT');
        // Find first difference
        let minLen = Math.min(jsonKey.length, envKey.length);
        for (let i = 0; i < minLen; i++) {
            if (jsonKey[i] !== envKey[i]) {
                console.log(`First difference at index ${i}: JSON=${JSON.stringify(jsonKey[i])}, Env=${JSON.stringify(envKey[i])}`);
                break;
            }
        }
    }
}

compareKeys();
