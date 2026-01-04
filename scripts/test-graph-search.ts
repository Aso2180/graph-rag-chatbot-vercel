import axios from 'axios';

async function testGraphSearch() {
  try {
    const queries = [
      "AI 法的リスク",
      "名刺読み取り",
      "会社紹介動画",
      "著作権"
    ];

    for (const query of queries) {
      console.log(`\n=== Testing query: "${query}" ===`);
      
      const response = await axios.post('http://localhost:3000/api/graph-search', {
        query,
        context: 'legal-risk-analysis'
      });

      console.log('Status:', response.status);
      console.log('Result count:', response.data.resultCount);
      console.log('Has graphResults:', !!response.data.graphResults);
      console.log('graphResults length:', response.data.graphResults?.length || 0);
      
      if (response.data.graphResults?.length > 0) {
        console.log('\nFirst result:');
        console.log('- Title:', response.data.graphResults[0].documentTitle);
        console.log('- Content preview:', response.data.graphResults[0].content.substring(0, 100) + '...');
      }
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testGraphSearch();