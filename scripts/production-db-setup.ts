/**
 * Neo4j Aura Production Environment Setup and Optimization
 */
import { getSession } from '../lib/neo4j/query-api-client';

/**
 * unknown 型の error から安全にメッセージを取り出す
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

async function setupProductionDatabase() {
  console.log('🗄️ Neo4j Aura Production Setup...\n');

  const session = getSession();

  try {
    console.log('1️⃣ Database Connection Check...');

    const dbInfo = await session.run(`
      CALL dbms.components() YIELD name, versions, edition
      RETURN name, versions[0] as version, edition
    `);

    console.log('✅ Database Information:');
    dbInfo.records.forEach(record => {
      console.log(
        `   ${record.get('name')}: ${record.get('version')} (${record.get('edition')})`
      );
    });

    console.log('\n2️⃣ Index Creation for Production Performance...');

    const indexes = [
      {
        name: 'member_email_index',
        query:
          'CREATE INDEX member_email_index IF NOT EXISTS FOR (m:Member) ON (m.email)',
      },
      {
        name: 'document_uploaded_by_index',
        query:
          'CREATE INDEX document_uploaded_by_index IF NOT EXISTS FOR (d:Document) ON (d.uploadedBy)',
      },
      {
        name: 'document_organization_index',
        query:
          'CREATE INDEX document_organization_index IF NOT EXISTS FOR (d:Document) ON (d.organization)',
      },
      {
        name: 'document_created_at_index',
        query:
          'CREATE INDEX document_created_at_index IF NOT EXISTS FOR (d:Document) ON (d.createdAt)',
      },
      {
        name: 'chunk_content_text_index',
        query:
          'CREATE FULLTEXT INDEX chunk_content_text_index IF NOT EXISTS FOR (c:Chunk) ON EACH [c.content]',
      },
      {
        name: 'entity_name_index',
        query:
          'CREATE INDEX entity_name_index IF NOT EXISTS FOR (e:Entity) ON (e.name)',
      },
    ];

    for (const index of indexes) {
      try {
        await session.run(index.query);
        console.log(`✅ Created/Verified: ${index.name}`);
      } catch (error) {
        const msg = getErrorMessage(error);
        if (
          msg.includes('already exists') ||
          msg.includes('An equivalent')
        ) {
          console.log(`ℹ️  Already exists: ${index.name}`);
        } else {
          console.log(`❌ Failed: ${index.name} - ${msg}`);
        }
      }
    }

    console.log('\n3️⃣ Database Constraints for Data Integrity...');

    const constraints = [
      {
        name: 'member_email_unique',
        query:
          'CREATE CONSTRAINT member_email_unique IF NOT EXISTS FOR (m:Member) REQUIRE m.email IS UNIQUE',
      },
      {
        name: 'document_id_unique',
        query:
          'CREATE CONSTRAINT document_id_unique IF NOT EXISTS FOR (d:Document) REQUIRE elementId(d) IS UNIQUE',
      },
    ];

    for (const constraint of constraints) {
      try {
        await session.run(constraint.query);
        console.log(`✅ Created/Verified constraint: ${constraint.name}`);
      } catch (error) {
        const msg = getErrorMessage(error);
        if (
          msg.includes('already exists') ||
          msg.includes('An equivalent')
        ) {
          console.log(`ℹ️  Already exists: ${constraint.name}`);
        } else {
          console.log(`❌ Failed constraint: ${constraint.name} - ${msg}`);
        }
      }
    }

    console.log('\n4️⃣ Current Database Statistics...');

    const stats = await session.run(`
      MATCH (n)
      RETURN labels(n)[0] as nodeType, count(n) as count
      ORDER BY count DESC
    `);

    console.log('📊 Node Count by Type:');
    stats.records.forEach(record => {
      const nodeType = record.get('nodeType') ?? 'Unknown';
      const count = record.get('count');
      console.log(`   ${nodeType}: ${count}`);
    });

    const relStats = await session.run(`
      MATCH ()-[r]->()
      RETURN type(r) as relationshipType, count(r) as count
      ORDER BY count DESC
    `);

    console.log('\n🔗 Relationship Count by Type:');
    relStats.records.forEach(record => {
      console.log(
        `   ${record.get('relationshipType')}: ${record.get('count')}`
      );
    });

    console.log('\n5️⃣ Production Readiness Check...');

    const prodCheck = await session.run(`
      MATCH (d:Document)
      WHERE d.organization = 'GAIS'
      WITH count(d) as docCount
      MATCH (m:Member)
      WITH docCount, count(m) as memberCount
      MATCH (c:Chunk)
      WITH docCount, memberCount, count(c) as chunkCount
      MATCH (e:Entity)
      RETURN
        docCount,
        memberCount,
        chunkCount,
        count(e) as entityCount,
        (docCount > 0 AND memberCount > 0) as isReady
    `);

    const readiness = prodCheck.records[0];
    console.log('✅ Production Readiness Status:');
    console.log(`   Documents: ${readiness.get('docCount')}`);
    console.log(`   Members: ${readiness.get('memberCount')}`);
    console.log(`   Chunks: ${readiness.get('chunkCount')}`);
    console.log(`   Entities: ${readiness.get('entityCount')}`);
    console.log(
      `   Ready for Production: ${
        readiness.get('isReady') ? '✅ YES' : '❌ NO'
      }`
    );

    console.log('\n6️⃣ Security and Access Settings...');

    try {
      const privileges = await session.run(`SHOW CURRENT USER`);
      if (privileges.records.length > 0) {
        console.log(
          `✅ Current Database User: ${privileges.records[0].get('user')}`
        );
      }
    } catch {
      console.log('ℹ️  User privilege check not available in this edition');
    }

    console.log('\n🎉 Neo4j Aura Production Setup Complete!');
  } catch (error) {
    console.error('❌ Production setup failed:', getErrorMessage(error));
    throw error;
  } finally {
    await session.close();
  }
}

export { setupProductionDatabase };

if (require.main === module) {
  setupProductionDatabase().catch(err =>
    console.error(getErrorMessage(err))
  );
}
