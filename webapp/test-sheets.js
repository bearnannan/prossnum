const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

async function testSheets() {
  try {
    console.log('Testing Google Sheets connection from webapp directory...');
    console.log('Email:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
    console.log('Sheet ID:', process.env.GOOGLE_SHEET_ID);

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    console.log('Fetching spreadsheet metadata...');
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    console.log('Sheets found:', meta.data.sheets.map(s => s.properties.title));

    const sheetName = 'ClientSystem';
    console.log(`Fetching data from sheet: ${sheetName}...`);
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A2:W`,
    });

    console.log('Data fetched successfully!');
    console.log('Row count:', res.data.values ? res.data.values.length : 0);
  } catch (error) {
    console.error('Error testing sheets:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testSheets();
