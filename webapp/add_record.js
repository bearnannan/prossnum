
const { google } = require('googleapis');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: 'webapp/.env.local' });

async function run() {
    console.log('Starting script...');
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    if (!privateKey) throw new Error('GOOGLE_PRIVATE_KEY not found');
    
    const cleanKey = privateKey
        .replace(/^"|"$/g, '') 
        .replace(/\\n/g, '\n')
        .replace(/\n\s+/g, '\n');

    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            private_key: cleanKey
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    const values = [[
        'ห้วยกระเจา', // A
        'หมู่ 6 ห้วยลึก', // B
        0, // C
        0, // D
        '', // E
        100, // F
        '60 m', // G
        100, // H
        '2.32', // I
        '1.50', // J
        100, // K
        'CC00116997-1-176', // L
        '', // M
        '20 m', // N
        100, // O
        0, // P
        '', // Q
        '', // R
        '', // S
        'ขาติดตั้ง = B, องศา = 350°, ค่า Test Feeder = ยังไม่ได้เก็บ, ยื่นขอมิเตอร์ = ยังไม่ได้ยื่น', // T
        '2026-03-20', // U (StartDate)
        '2026-03-22'  // V (EndDate)
    ]];

    const res = await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: 'ระบบลูกข่าย!A:V',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values }
    });

    console.log('Successfully added:', res.data.updates.updatedRange);
}

run().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
