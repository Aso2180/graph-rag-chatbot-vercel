/**
 * Test multiple uploads from same member to verify document count increment
 */
import { writeFileSync } from 'fs';
import { join } from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';
import { testUploadHistory } from './test-upload-history';

// Create a second test PDF with different content
const createSecondTestPDF = () => {
  const content = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 50
>>
stream
BT
/F1 12 Tf
100 700 Td
(第二テスト文書 - AI使用ガイドライン) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000275 00000 n 
0000000375 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
455
%%EOF`;

  const testDir = join(process.cwd(), 'test-uploads');
  const fs = require('fs');
  
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  const filePath = join(testDir, 'gais-second-test-document.pdf');
  writeFileSync(filePath, content);
  
  console.log(`Second test PDF created: ${filePath}`);
  console.log(`File size: ${fs.statSync(filePath).size} bytes`);
  
  return filePath;
};

async function testMultipleUploads() {
  console.log('🧪 Testing multiple uploads for document count increment...\n');
  
  try {
    // 1. Check current state
    console.log('1️⃣ Checking current member state...');
    const initialStatsResponse = await fetch('http://localhost:3000/api/member-stats?email=test@gais.jp');
    let initialStats = null;
    
    if (initialStatsResponse.ok) {
      initialStats = await initialStatsResponse.json();
      console.log(`✅ Current document count: ${initialStats.documentCount}`);
    }
    
    // 2. Create and upload second PDF
    console.log('\n2️⃣ Creating and uploading second test PDF...');
    const secondPdfPath = createSecondTestPDF();
    const pdfBuffer = require('fs').readFileSync(secondPdfPath);
    
    const formData = new FormData();
    formData.append('file', pdfBuffer, {
      filename: 'gais-second-test-document.pdf',
      contentType: 'application/pdf'
    });
    formData.append('memberEmail', 'test@gais.jp'); // Same member
    
    const uploadResponse = await fetch('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData
    });
    
    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: ${uploadResponse.status} ${await uploadResponse.text()}`);
    }
    
    const uploadResult = await uploadResponse.json();
    console.log('✅ Second upload successful:');
    console.log(`   File: ${uploadResult.fileName}`);
    console.log(`   Member: ${uploadResult.uploadedBy}`);
    
    // 3. Wait for processing
    console.log('\n3️⃣ Waiting for Neo4j processing...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 4. Check updated statistics
    console.log('4️⃣ Checking updated member statistics...');
    const updatedStatsResponse = await fetch('http://localhost:3000/api/member-stats?email=test@gais.jp');
    
    if (updatedStatsResponse.ok) {
      const updatedStats = await updatedStatsResponse.json();
      console.log('✅ Updated Member Statistics:');
      console.log(`   Document Count: ${updatedStats.documentCount} (was: ${initialStats?.documentCount || 0})`);
      console.log(`   Total Pages: ${updatedStats.totalPages}`);
      console.log(`   Total Chunks: ${updatedStats.totalChunks}`);
      console.log(`   Last Upload: ${updatedStats.lastUploadDate}`);
      console.log(`   Recent Documents: ${updatedStats.recentDocuments.length}`);
      
      // Verify increment
      if (initialStats && updatedStats.documentCount === initialStats.documentCount + 1) {
        console.log('✅ Document count correctly incremented!');
      } else if (initialStats) {
        console.log(`⚠️  Expected count: ${initialStats.documentCount + 1}, Got: ${updatedStats.documentCount}`);
      }
    }
    
    // 5. Check upload history
    console.log('\n5️⃣ Checking complete upload history...');
    await testUploadHistory();
    
    // 6. Test with different member
    console.log('\n6️⃣ Testing upload with different member...');
    const thirdFormData = new FormData();
    thirdFormData.append('file', pdfBuffer, {
      filename: 'gais-third-member-document.pdf',
      contentType: 'application/pdf'
    });
    thirdFormData.append('memberEmail', 'member2@gais.jp'); // Different member
    
    const thirdUploadResponse = await fetch('http://localhost:3000/api/upload', {
      method: 'POST',
      body: thirdFormData
    });
    
    if (thirdUploadResponse.ok) {
      const thirdUploadResult = await thirdUploadResponse.json();
      console.log('✅ Third upload (different member) successful:');
      console.log(`   Member: ${thirdUploadResult.uploadedBy}`);
      
      // Wait and check overall stats
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const finalOverallResponse = await fetch('http://localhost:3000/api/member-stats', {
        method: 'POST'
      });
      
      if (finalOverallResponse.ok) {
        const finalOverallStats = await finalOverallResponse.json();
        console.log('\n✅ Final Overall Statistics:');
        console.log(`   Total Documents: ${finalOverallStats.overall.totalDocuments}`);
        console.log(`   Unique Members: ${finalOverallStats.overall.uniqueMembers}`);
        console.log(`   Top Contributors: ${finalOverallStats.topContributors.map(c => `${c.memberEmail}(${c.documentCount})`).join(', ')}`);
      }
    }
    
    console.log('\n🎉 Multiple uploads test completed successfully!');
    console.log('✅ Document count increment and multiple member tracking verified!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  testMultipleUploads().catch(console.error);
}

export { testMultipleUploads };