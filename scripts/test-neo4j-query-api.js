const fetch = require('node-fetch');

async function testQueryAPI() {
  const queryApiUrl = 'https://bf116132.databases.neo4j.io/db/neo4j/query/v2';
  const username = 'neo4j';
  const password = 'WxYHqHNKFarbahtYX2BeE2RHXE7WOxC6gC7Nv9-Ms40';
  
  const basicAuth = Buffer.from(`${username}:${password}`).toString('base64');
  
  const query = {
    statement: 'RETURN "Hello from Neo4j Query API!" as message',
    parameters: {}
  };
  
  try {
    console.log('Testing Neo4j Query API...');
    console.log('URL:', queryApiUrl);
    
    const response = await fetch(queryApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(query)
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.raw());
    
    const data = await response.text();
    console.log('Response body:', data);
    
    if (response.ok) {
      const jsonData = JSON.parse(data);
      console.log('✅ Query API connection successful!');
      console.log('Result:', jsonData);
    } else {
      console.log('❌ Query API returned error');
    }
  } catch (error) {
    console.error('❌ Failed to connect to Query API');
    console.error('Error:', error.message);
  }
}

testQueryAPI();