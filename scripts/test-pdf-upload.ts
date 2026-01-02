import * as fs from 'fs';
import * as path from 'path';

const API_URL = 'http://localhost:3000/api/upload';

async function testPDFUpload() {
  // テスト用のPDFファイルを探す
  const testPdfPath = path.join(process.cwd(), 'test-sample.pdf');
  
  // テスト用の小さなPDFを作成（実際のPDFファイルがない場合）
  if (!fs.existsSync(testPdfPath)) {
    console.log('⚠️  Test PDF not found. Please provide a test PDF file named "test-sample.pdf" in the project root.');
    console.log('You can download a sample PDF from:');
    console.log('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');
    return;
  }
  
  try {
    const fileBuffer = fs.readFileSync(testPdfPath);
    const file = new File([fileBuffer], 'test-sample.pdf', { type: 'application/pdf' });
    
    const formData = new FormData();
    formData.append('file', file);
    
    console.log('📤 Uploading PDF file...');
    
    const response = await fetch(API_URL, {
      method: 'POST',
      body: formData,
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Upload successful!');
      console.log('Response:', JSON.stringify(result, null, 2));
      
      // Neo4jでデータを確認
      await checkNeo4jData();
    } else {
      console.error('❌ Upload failed:', result);
    }
  } catch (error) {
    console.error('❌ Error during upload:', error);
  }
}

async function checkNeo4jData() {
  try {
    const { getSession } = await import('../lib/neo4j/query-api-client');
    const session = getSession();
    
    console.log('\n📊 Checking Neo4j data...');
    
    const result = await session.run(`
      MATCH (d:Document)
      OPTIONAL MATCH (d)-[:CONTAINS]->(c:Chunk)
      RETURN d.title as title, d.pageCount as pages, count(c) as chunks
      ORDER BY d.uploadedAt DESC
      LIMIT 5
    `);
    
    console.log('\nRecent documents:');
    result.records.forEach(record => {
      console.log(`- ${record.get('title')}: ${record.get('pages')} pages, ${record.get('chunks')} chunks`);
    });
    
    await session.close();
  } catch (error) {
    console.error('Failed to check Neo4j data:', error);
  }
}

// 実行
if (require.main === module) {
  testPDFUpload();
}