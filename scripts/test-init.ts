import * as dotenv from 'dotenv';
import * as path from 'path';

// .envファイルを明示的に読み込む
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { getSession } from '../lib/neo4j/query-api-client';

async function testInit() {
  console.log('Environment check:');
  console.log('NEO4J_URI:', process.env.NEO4J_URI);
  console.log('NEO4J_USER:', process.env.NEO4J_USER);
  console.log('NEO4J_PASSWORD:', process.env.NEO4J_PASSWORD ? '***' : 'NOT SET');
  
  const session = getSession();
  
  try {
    // 簡単なクエリでテスト
    const result = await session.run('RETURN 1 as test');
    console.log('✅ Connection successful!');
    console.log('Test result:', result.records[0].get('test'));
    
    // データベースの状態を確認
    const stats = await session.run(`
      MATCH (n)
      RETURN labels(n)[0] as label, count(n) as count
    `);
    
    console.log('\nDatabase contents:');
    if (stats.records.length === 0) {
      console.log('- Database is empty');
    } else {
      stats.records.forEach(record => {
        console.log(`- ${record.get('label')}: ${record.get('count')} nodes`);
      });
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await session.close();
  }
}

testInit();