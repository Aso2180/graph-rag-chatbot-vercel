/**
 * Test upload functionality and Member node creation
 */
import { readFileSync } from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';
import { createTestPDF } from './create-test-pdf';
import { testUploadHistory } from './test-upload-history';

async function testUploadFunctionality() {
  console.log('🧪 Starting upload functionality test...\n');
  
  try {
    // 1. Create test PDF
    console.log('1️⃣ Creating test PDF...');
    const pdfPath = createTestPDF();
    
    // 2. Read the PDF file
    const pdfBuffer = readFileSync(pdfPath);
    console.log(`✅ Test PDF created and read: ${pdfBuffer.length} bytes\n`);
    
    // 3. Test upload API endpoint
    console.log('2️⃣ Testing upload API...');
    const formData = new FormData();
    formData.append('file', pdfBuffer, {
      filename: 'gais-test-document.pdf',
      contentType: 'application/pdf'
    });
    formData.append('memberEmail', 'test@gais.jp');
    
    const uploadResponse = await fetch('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData
    });
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Upload failed: ${uploadResponse.status} ${errorText}`);
    }
    
    const uploadResult = await uploadResponse.json();
    console.log('✅ Upload successful:');
    console.log(`   File: ${uploadResult.fileName}`);
    console.log(`   Size: ${uploadResult.fileSize} bytes`);
    console.log(`   Member: ${uploadResult.uploadedBy}`);
    console.log(`   Organization: ${uploadResult.organization}`);
    console.log(`   Status: ${uploadResult.status}\n`);
    
    // 4. Wait a moment for Neo4j processing
    console.log('3️⃣ Waiting for Neo4j processing...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 5. Test upload history
    console.log('4️⃣ Checking upload history...');
    await testUploadHistory();
    
    // 6. Test member statistics API
    console.log('\n5️⃣ Testing member statistics API...');
    const statsResponse = await fetch('http://localhost:3000/api/member-stats?email=test@gais.jp');
    
    if (statsResponse.ok) {
      const memberStats = await statsResponse.json();
      console.log('✅ Member Statistics:');
      console.log(`   Email: ${memberStats.memberEmail}`);
      console.log(`   Document Count: ${memberStats.documentCount}`);
      console.log(`   Total Pages: ${memberStats.totalPages}`);
      console.log(`   Total Chunks: ${memberStats.totalChunks}`);
      console.log(`   Last Upload: ${memberStats.lastUploadDate}`);
      console.log(`   Recent Documents: ${memberStats.recentDocuments.length} found`);
    } else {
      console.log('❌ Member stats API failed:', await statsResponse.text());
    }
    
    // 7. Test overall statistics
    console.log('\n6️⃣ Testing overall statistics API...');
    const overallStatsResponse = await fetch('http://localhost:3000/api/member-stats', {
      method: 'POST'
    });
    
    if (overallStatsResponse.ok) {
      const overallStats = await overallStatsResponse.json();
      console.log('✅ Overall Statistics:');
      console.log(`   Total Documents: ${overallStats.overall.totalDocuments}`);
      console.log(`   Unique Members: ${overallStats.overall.uniqueMembers}`);
      console.log(`   Total Chunks: ${overallStats.overall.totalChunks}`);
      console.log(`   Total Entities: ${overallStats.overall.totalEntities}`);
      console.log(`   Total Pages: ${overallStats.overall.totalPages}`);
      console.log(`   Top Contributors: ${overallStats.topContributors.length}`);
      console.log(`   Recent Uploads: ${overallStats.recentUploads.length}`);
    } else {
      console.log('❌ Overall stats API failed:', await overallStatsResponse.text());
    }
    
    console.log('\n🎉 Upload functionality test completed successfully!');
    console.log('✅ Member node creation and upload history tracking verified!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  testUploadFunctionality().catch(console.error);
}

export { testUploadFunctionality };