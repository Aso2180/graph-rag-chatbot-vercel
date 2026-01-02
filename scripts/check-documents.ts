import { getSession } from '@/lib/neo4j/query-api-client';
import { config } from 'dotenv';

// 環境変数を読み込み
config();

interface DocumentInfo {
  title: string;
  fileName: string;
  uploadedBy: string;
  organization: string;
  uploadedAt: string;
  pageCount: number;
  chunkCount: number;
  documentId: string;
}

async function checkDocuments() {
  const session = getSession();
  
  try {
    console.log('📊 GAIS アップロード済み文書の確認\n');
    
    // 1. 全体のデータベース統計
    const statsResult = await session.run(`
      MATCH (d:Document)
      OPTIONAL MATCH (d)-[:CONTAINS]->(c:Chunk)
      OPTIONAL MATCH (d)-[:MENTIONS]->(e:Entity)
      RETURN 
        count(DISTINCT d) as documentCount,
        count(DISTINCT c) as totalChunks,
        count(DISTINCT e) as totalEntities
    `);
    
    const stats = statsResult.records[0];
    console.log('=== データベース統計 ===');
    console.log(`📄 総文書数: ${stats.get('documentCount')}`);
    console.log(`📝 総チャンク数: ${stats.get('totalChunks')}`);
    console.log(`🏷️ 総エンティティ数: ${stats.get('totalEntities')}\n`);
    
    // 2. GAIS会員によるアップロード文書詳細
    const docsResult = await session.run(`
      MATCH (d:Document)
      WHERE d.organization = 'GAIS'
      OPTIONAL MATCH (d)-[:CONTAINS]->(c:Chunk)
      RETURN 
        d.title as title,
        d.fileName as fileName,
        d.uploadedBy as uploadedBy,
        d.organization as organization,
        d.uploadedAt as uploadedAt,
        d.pageCount as pageCount,
        count(c) as chunkCount,
        elementId(d) as documentId
      ORDER BY d.uploadedAt DESC
    `);
    
    console.log('=== GAIS会員アップロード文書 ===');
    
    if (docsResult.records.length === 0) {
      console.log('❌ GAIS会員による文書アップロードは見つかりませんでした。');
      
      // 全ての文書を確認（過去のものも含む）
      const allDocsResult = await session.run(`
        MATCH (d:Document)
        OPTIONAL MATCH (d)-[:CONTAINS]->(c:Chunk)
        RETURN 
          d.title as title,
          d.fileName as fileName,
          d.uploadedBy as uploadedBy,
          d.organization as organization,
          d.uploadedAt as uploadedAt,
          d.pageCount as pageCount,
          count(c) as chunkCount,
          elementId(d) as documentId
        ORDER BY d.createdAt DESC
        LIMIT 10
      `);
      
      console.log('\n=== 全アップロード文書（最新10件） ===');
      allDocsResult.records.forEach((record, index) => {
        console.log(`${index + 1}. ${record.get('title') || 'タイトルなし'}`);
        console.log(`   ファイル名: ${record.get('fileName')}`);
        console.log(`   アップロード者: ${record.get('uploadedBy') || '未設定'}`);
        console.log(`   組織: ${record.get('organization') || '未設定'}`);
        console.log(`   ページ数: ${record.get('pageCount')}`);
        console.log(`   チャンク数: ${record.get('chunkCount')}`);
        console.log('');
      });
    } else {
      docsResult.records.forEach((record, index) => {
        const doc: DocumentInfo = {
          title: record.get('title'),
          fileName: record.get('fileName'),
          uploadedBy: record.get('uploadedBy'),
          organization: record.get('organization'),
          uploadedAt: record.get('uploadedAt'),
          pageCount: record.get('pageCount'),
          chunkCount: record.get('chunkCount'),
          documentId: record.get('documentId')
        };
        
        console.log(`${index + 1}. 📄 ${doc.title}`);
        console.log(`   ファイル名: ${doc.fileName}`);
        console.log(`   👤 アップロード者: ${doc.uploadedBy}`);
        console.log(`   🏢 組織: ${doc.organization}`);
        console.log(`   📅 アップロード日時: ${doc.uploadedAt}`);
        console.log(`   📖 ページ数: ${doc.pageCount}`);
        console.log(`   🧩 チャンク数: ${doc.chunkCount}`);
        console.log(`   🆔 Document ID: ${doc.documentId}`);
        console.log('');
      });
    }
    
    // 3. 会員別統計
    const memberStatsResult = await session.run(`
      MATCH (d:Document)
      WHERE d.uploadedBy IS NOT NULL
      RETURN 
        d.uploadedBy as memberEmail,
        d.organization as organization,
        count(d) as documentCount,
        sum(d.pageCount) as totalPages
      ORDER BY documentCount DESC
    `);
    
    console.log('=== 会員別アップロード統計 ===');
    if (memberStatsResult.records.length === 0) {
      console.log('❌ 会員情報付きの文書が見つかりませんでした。');
    } else {
      memberStatsResult.records.forEach((record, index) => {
        console.log(`${index + 1}. 👤 ${record.get('memberEmail')}`);
        console.log(`   🏢 組織: ${record.get('organization')}`);
        console.log(`   📄 文書数: ${record.get('documentCount')}`);
        console.log(`   📖 総ページ数: ${record.get('totalPages')}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('データベース確認エラー:', error);
  } finally {
    await session.close();
  }
}

checkDocuments().catch(console.error);