async function testFetchCsv() {
  const url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS-x6wrhvu6tQUCeY4AHFlDPeHE2Jjkrrry5paIxNC4_McE8YYEFAOfAZowFurEsf-lyyVrkozKp4OE/pub?output=csv&gid=2070776408';
  try {
    console.log('Fetching CSV from:', url);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.text();
    console.log('CSV Data received. Length:', data.length);
    console.log('First 200 characters:', data.substring(0, 200));
  } catch (error) {
    console.error('Fetch error:', error.message);
  }
}

testFetchCsv();
