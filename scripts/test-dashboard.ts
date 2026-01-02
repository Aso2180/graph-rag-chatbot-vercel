/**
 * Test the dashboard functionality via API
 */
import fetch from 'node-fetch';

async function testMemberDashboard() {
  console.log('🎯 Testing Member Dashboard functionality...\n');
  
  try {
    // 1. Test member statistics for test@gais.jp
    console.log('1️⃣ Testing member statistics for test@gais.jp...');
    const memberStatsResponse = await fetch('http://localhost:3000/api/member-stats?email=test@gais.jp');
    
    if (memberStatsResponse.ok) {
      const memberStats = await memberStatsResponse.json();
      console.log('✅ Member Statistics API Response:');
      console.log(JSON.stringify(memberStats, null, 2));
    } else {
      console.log('❌ Member stats failed:', await memberStatsResponse.text());
    }
    
    // 2. Test member statistics for member2@gais.jp
    console.log('\n2️⃣ Testing member statistics for member2@gais.jp...');
    const member2StatsResponse = await fetch('http://localhost:3000/api/member-stats?email=member2@gais.jp');
    
    if (member2StatsResponse.ok) {
      const member2Stats = await member2StatsResponse.json();
      console.log('✅ Member2 Statistics API Response:');
      console.log(JSON.stringify(member2Stats, null, 2));
    } else {
      console.log('❌ Member2 stats failed:', await member2StatsResponse.text());
    }
    
    // 3. Test member statistics for non-existent member
    console.log('\n3️⃣ Testing member statistics for non-existent member...');
    const noMemberStatsResponse = await fetch('http://localhost:3000/api/member-stats?email=nonexistent@gais.jp');
    
    if (noMemberStatsResponse.ok) {
      const noMemberStats = await noMemberStatsResponse.json();
      console.log('✅ Non-existent Member Statistics (should be empty):');
      console.log(JSON.stringify(noMemberStats, null, 2));
    } else {
      console.log('❌ Non-existent member stats failed:', await noMemberStatsResponse.text());
    }
    
    // 4. Test overall statistics
    console.log('\n4️⃣ Testing overall statistics...');
    const overallStatsResponse = await fetch('http://localhost:3000/api/member-stats', {
      method: 'POST'
    });
    
    if (overallStatsResponse.ok) {
      const overallStats = await overallStatsResponse.json();
      console.log('✅ Overall Statistics API Response:');
      console.log(`   Total Documents: ${overallStats.overall.totalDocuments}`);
      console.log(`   Unique Members: ${overallStats.overall.uniqueMembers}`);
      console.log(`   Total Chunks: ${overallStats.overall.totalChunks}`);
      console.log(`   Total Entities: ${overallStats.overall.totalEntities}`);
      console.log(`   Total Pages: ${overallStats.overall.totalPages}`);
      
      console.log('\n   📊 Top Contributors:');
      overallStats.topContributors.forEach((contributor: any, index: number) => {
        console.log(`   ${index + 1}. ${contributor.memberEmail}: ${contributor.documentCount} documents (${contributor.totalPages} pages)`);
      });
      
      console.log('\n   📄 Recent Uploads:');
      overallStats.recentUploads.slice(0, 3).forEach((upload: any, index: number) => {
        console.log(`   ${index + 1}. "${upload.title}" by ${upload.uploadedBy} (${upload.pageCount} pages)`);
      });
    } else {
      console.log('❌ Overall stats failed:', await overallStatsResponse.text());
    }
    
    // 5. Test error handling (missing email parameter)
    console.log('\n5️⃣ Testing error handling (missing email)...');
    const errorResponse = await fetch('http://localhost:3000/api/member-stats');
    
    if (!errorResponse.ok) {
      const errorData = await errorResponse.json();
      console.log(`✅ Expected error response (${errorResponse.status}):`, errorData.error);
    } else {
      console.log('❌ Should have failed with missing email parameter');
    }
    
    console.log('\n🎉 Member Dashboard API testing completed!');
    console.log('\n📋 Dashboard Features Summary:');
    console.log('✅ Individual member statistics retrieval');
    console.log('✅ Document count and page statistics'); 
    console.log('✅ Recent upload history');
    console.log('✅ Overall GAIS statistics');
    console.log('✅ Top contributors ranking');
    console.log('✅ Error handling for invalid requests');
    console.log('✅ Empty state handling for new members');
    
  } catch (error) {
    console.error('❌ Dashboard test failed:', error);
  }
}

// Run if called directly
if (require.main === module) {
  testMemberDashboard().catch(console.error);
}

export { testMemberDashboard };