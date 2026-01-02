const { getSession } = require('../lib/neo4j/query-api-client');

async function initializeDatabase() {
  console.log('Initializing Neo4j database...');
  
  const session = getSession();
  
  try {
    // インデックスの作成
    const indexes = [
      'CREATE INDEX IF NOT EXISTS FOR (d:Document) ON (d.title)',
      'CREATE INDEX IF NOT EXISTS FOR (d:Document) ON (d.source)',
      'CREATE INDEX IF NOT EXISTS FOR (c:Chunk) ON (c.content)',
      'CREATE INDEX IF NOT EXISTS FOR (w:WebSource) ON (w.url)',
      'CREATE INDEX IF NOT EXISTS FOR (w:WebSource) ON (w.domain)',
      'CREATE INDEX IF NOT EXISTS FOR (e:Entity) ON (e.name)',
      'CREATE INDEX IF NOT EXISTS FOR (e:Entity) ON (e.type)',
      'CREATE INDEX IF NOT EXISTS FOR (l:LegalUpdate) ON (l.importance)',
      'CREATE INDEX IF NOT EXISTS FOR (l:LegalUpdate) ON (l.timestamp)'
    ];
    
    for (const index of indexes) {
      try {
        await session.run(index);
        console.log('✓ Created index:', index.match(/FOR \((.*?)\)/)[1]);
      } catch (error) {
        console.log('⚠ Index might already exist:', index.match(/FOR \((.*?)\)/)[1]);
      }
    }
    
    // 制約の作成
    const constraints = [
      'CREATE CONSTRAINT IF NOT EXISTS FOR (d:Document) REQUIRE d.source IS UNIQUE',
      'CREATE CONSTRAINT IF NOT EXISTS FOR (w:WebSource) REQUIRE w.url IS UNIQUE',
      'CREATE CONSTRAINT IF NOT EXISTS FOR (e:Entity) REQUIRE (e.name, e.type) IS UNIQUE'
    ];
    
    for (const constraint of constraints) {
      try {
        await session.run(constraint);
        console.log('✓ Created constraint:', constraint.match(/FOR \((.*?)\)/)[1]);
      } catch (error) {
        console.log('⚠ Constraint might already exist:', constraint.match(/FOR \((.*?)\)/)[1]);
      }
    }
    
    // データベースの統計情報を取得
    const stats = await session.run(`
      MATCH (n)
      WITH labels(n)[0] as label, count(n) as count
      RETURN label, count
      ORDER BY count DESC
    `);
    
    console.log('\nDatabase statistics:');
    stats.records.forEach(record => {
      console.log(`- ${record.get('label') || 'Unknown'}: ${record.get('count')} nodes`);
    });
    
    if (stats.records.length === 0) {
      console.log('- Database is empty (no nodes found)');
    }
    
    console.log('\n✅ Database initialization complete!');
    
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
  } finally {
    await session.close();
  }
}

// 実行
initializeDatabase().catch(console.error);