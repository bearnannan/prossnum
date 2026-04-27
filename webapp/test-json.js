const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function testSheetsWithJson() {
  try {
    console.log('Testing Google Sheets connection using JSON file...');
    const jsonPath = path.join(__dirname, '..', 'prossnum-04e04a1f19f4.json');
    const keyFile = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: keyFile.client_email,
        private_key: keyFile.private_key,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = '1BRHeMT3G_U3AtJEGy39Cx4Qo72yM3T_igTzHqytyCkQ';

    console.log('Fetching spreadsheet metadata...');
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    console.log('Sheets found:', meta.data.sheets.map(s => s.properties.title));

    console.log('Data fetched successfully with JSON file!');
  } catch (error) {
    console.error('Error testing sheets with JSON:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testSheetsWithJson();
