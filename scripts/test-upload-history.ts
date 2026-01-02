/**
 * Test script to verify upload history tracking
 */
import { getSession } from '../lib/neo4j/query-api-client';

async function testUploadHistory() {
  const session = getSession();
  
  try {
    console.log('Testing upload history tracking...\n');
    
    // Check Member nodes and their relationships
    const memberResult = await session.run(`
      MATCH (m:Member)
      OPTIONAL MATCH (m)-[r:UPLOADED]->(d:Document)
      RETURN 
        m.email as memberEmail,
        m.organization as organization,
        m.documentCount as documentCount,
        m.firstUploadAt as firstUploadAt,
        m.lastUploadAt as lastUploadAt,
        count(d) as actualDocumentCount,
        collect(d.fileName) as documentFiles
      ORDER BY m.email
    `);
    
    if (memberResult.records.length === 0) {
      console.log('No Member nodes found. Upload history tracking needs member uploads to test.');
    } else {
      console.log('Member Upload History:');
      console.log('==================');
      
      memberResult.records.forEach((record, index) => {
        console.log(`${index + 1}. Member: ${record.get('memberEmail')}`);
        console.log(`   Organization: ${record.get('organization')}`);
        console.log(`   Stored Doc Count: ${record.get('documentCount')}`);
        console.log(`   Actual Doc Count: ${record.get('actualDocumentCount')}`);
        console.log(`   First Upload: ${record.get('firstUploadAt')}`);
        console.log(`   Last Upload: ${record.get('lastUploadAt')}`);
        console.log(`   Documents: ${record.get('documentFiles').join(', ')}`);
        console.log('');
      });
    }
    
    // Check UPLOADED relationships
    const relationshipResult = await session.run(`
      MATCH (m:Member)-[r:UPLOADED]->(d:Document)
      RETURN 
        m.email as memberEmail,
        d.fileName as documentName,
        d.uploadedAt as uploadedAt,
        r.at as relationshipTime
      ORDER BY r.at DESC
      LIMIT 10
    `);
    
    console.log('\nRecent Upload Relationships:');
    console.log('==========================');
    
    if (relationshipResult.records.length === 0) {
      console.log('No UPLOADED relationships found.');
    } else {
      relationshipResult.records.forEach((record, index) => {
        console.log(`${index + 1}. ${record.get('memberEmail')} uploaded ${record.get('documentName')}`);
        console.log(`   Document time: ${record.get('uploadedAt')}`);
        console.log(`   Relationship time: ${record.get('relationshipTime')}`);
        console.log('');
      });
    }
    
    // Check overall stats
    const statsResult = await session.run(`
      MATCH (d:Document)
      WHERE d.organization = 'GAIS'
      OPTIONAL MATCH (m:Member)-[:UPLOADED]->(d)
      RETURN 
        count(DISTINCT d) as totalDocuments,
        count(DISTINCT m) as totalMembers,
        count(DISTINCT d.uploadedBy) as uniqueUploaders
    `);
    
    const stats = statsResult.records[0];
    console.log('\nOverall Statistics:');
    console.log('==================');
    console.log(`Total Documents: ${stats.get('totalDocuments')}`);
    console.log(`Total Members (with Member nodes): ${stats.get('totalMembers')}`);
    console.log(`Unique Uploaders (from Document.uploadedBy): ${stats.get('uniqueUploaders')}`);
    
    console.log('\n✅ Upload history tracking test completed!');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await session.close();
  }
}

// Run if called directly
if (require.main === module) {
  testUploadHistory().catch(console.error);
}

export { testUploadHistory };