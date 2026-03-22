async function verifyApi() {
  const ports = [3000, 3001, 3002];
  let success = false;
  
  for (const port of ports) {
    const url = `http://localhost:${port}/api/sheet-data?sheet=station`;
    try {
      console.log(`Checking API at: ${url}`);
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        console.log(`Success on port ${port}!`);
        console.log('Data count:', data.data ? data.data.length : 0);
        if (data.data && data.data.length > 0) {
          console.log('First item sample:', JSON.stringify(data.data[0], null, 2));
        }
        success = true;
        break;
      } else {
        console.log(`Port ${port} returned status: ${response.status}`);
      }
    } catch (error) {
      console.log(`Could not connect to port ${port}: ${error.message}`);
    }
  }
  
  if (!success) {
    console.error('Failed to verify API on any common port.');
  }
}

verifyApi();
