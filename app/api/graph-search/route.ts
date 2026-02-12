import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/neo4j/client';

export async function POST(request: NextRequest) {
  console.log('=== Graph Search API Called ===');
  console.log('Timestamp:', new Date().toISOString());

  try {
    const { query, context } = await request.json();
    console.log('Search query:', query);

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    // Neo4jからグラフデータを検索
    const graphResults = await searchGraphData(query, context);
    
    // 関連するドキュメントとエンティティを取得
    const relatedEntities = await findRelatedEntities(query);
    
    return NextResponse.json({
      query,
      graphResults,
      relatedEntities,
      resultCount: graphResults.length,
      searchTimestamp: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Graph search error:', error);
    return NextResponse.json(
      { error: 'Graph search failed' },
      { status: 500 }
    );
  }
}

async function searchGraphData(query: string, context?: string): Promise<any[]> {
  const session = await getSession();

  try {
    // クエリからキーワードを抽出
    const keywords = extractKeywords(query);

    // Neo4jクエリを構築（PDFドキュメントとWeb検索結果の両方を検索）
    // デフォルトドキュメント（isDefault = true）は全ユーザーに表示
    const cypherQuery = `
      // PDFドキュメントからの検索（デフォルトドキュメントを含む）
      MATCH (source)-[:CONTAINS]->(chunk:Chunk)
      WHERE (source:Document OR source:WebSource)
      AND ANY(keyword IN $keywords WHERE
        chunk.content CONTAINS keyword OR
        chunk.title CONTAINS keyword OR
        source.title CONTAINS keyword
      )
      OPTIONAL MATCH (chunk)-[:RELATES_TO|MENTIONS]->(entity:Entity)
      OPTIONAL MATCH (chunk)-[:IS_UPDATE]->(update:LegalUpdate)
      WITH source, chunk, collect(DISTINCT entity.name) as relatedEntities, update
      RETURN
        CASE
          WHEN source:Document THEN source.title
          ELSE source.title + ' (Web)'
        END as documentTitle,
        CASE
          WHEN source:Document THEN source.source
          ELSE source.url
        END as documentSource,
        chunk.content as content,
        chunk.title as chunkTitle,
        relatedEntities,
        CASE
          WHEN source:Document AND source.isDefault = true THEN 1.8
          WHEN chunk.relevanceScore IS NOT NULL THEN chunk.relevanceScore
          WHEN update IS NOT NULL AND update.importance = 'high' THEN 1.5
          WHEN update IS NOT NULL AND update.importance = 'medium' THEN 1.2
          WHEN chunk.createdAt > datetime() - duration('P7D') THEN 1.3
          WHEN chunk.createdAt > datetime() - duration('P30D') THEN 1.1
          ELSE 0.8
        END as score,
        chunk.createdAt as createdAt,
        update.importance as updateImportance,
        CASE WHEN source:Document THEN COALESCE(source.isDefault, false) ELSE false END as isDefault
      ORDER BY score DESC, createdAt DESC
      LIMIT 15
    `;

    const result = await session.run(cypherQuery, { keywords });

    return result.records.map(record => ({
      documentTitle: record.get('documentTitle'),
      documentSource: record.get('documentSource'),
      content: record.get('content'),
      chunkTitle: record.get('chunkTitle'),
      relatedEntities: record.get('relatedEntities'),
      score: record.get('score') || 0,
      createdAt: record.get('createdAt'),
      updateImportance: record.get('updateImportance'),
      isDefault: record.get('isDefault') || false
    }));

  } catch (error) {
    console.error('Neo4j query error:', error);
    // エラーの場合はダミーデータを返す（開発用）
    return generateDummyGraphResults(query);
  } finally {
    await session.close();
  }
}

async function findRelatedEntities(query: string): Promise<any[]> {
  const session = await getSession();
  
  try {
    const cypherQuery = `
      MATCH (entity:Entity)
      WHERE entity.name CONTAINS $query OR entity.type CONTAINS $query
      OPTIONAL MATCH (entity)-[r:RELATES_TO]-(relatedEntity:Entity)
      RETURN 
        entity.name as name,
        entity.type as type,
        entity.description as description,
        collect(DISTINCT relatedEntity.name) as relatedEntities
      LIMIT 5
    `;
    
    const result = await session.run(cypherQuery, { query });
    
    return result.records.map(record => ({
      name: record.get('name'),
      type: record.get('type'),
      description: record.get('description'),
      relatedEntities: record.get('relatedEntities')
    }));
    
  } catch (error) {
    console.error('Entity search error:', error);
    return [];
  } finally {
    await session.close();
  }
}

function extractKeywords(query: string): string[] {
  // 日本語と英語のキーワード抽出
  const stopWords = ['の', 'に', 'は', 'を', 'が', 'で', 'と', 'する', 'について', 'に関して'];
  
  return query
    .toLowerCase()
    .split(/[\s、。！？\.,!?]+/)
    .filter(word => word.length > 1 && !stopWords.includes(word))
    .slice(0, 10); // 最大10個のキーワード
}

function generateDummyGraphResults(query: string): any[] {
  // Neo4jが利用できない場合のダミーデータ
  return [
    {
      documentTitle: "AI生成コンテンツの法的リスク分析レポート",
      documentSource: "legal-analysis-2024.pdf",
      content: `${query}に関する法的リスクとして、主に著作権、肖像権、プライバシー権の侵害が懸念される。特にAI生成動画では、学習データに含まれる著作物の無断利用や、実在人物の肖像権侵害リスクが高い。`,
      chunkTitle: "AI生成コンテンツの主要リスク",
      relatedEntities: ["著作権法", "肖像権", "AI生成", "動画制作"],
      score: 0.95
    },
    {
      documentTitle: "企業向けAI活用ガイドライン",
      documentSource: "ai-guidelines-2024.pdf",
      content: "企業がAI技術を活用する際は、事前のリスク評価、適切なライセンス確認、バックアップ計画の策定が必要。特に商用利用時は法務部門との連携が重要。",
      chunkTitle: "企業AI活用の注意点",
      relatedEntities: ["リスク評価", "ライセンス", "商用利用", "法務"],
      score: 0.87
    }
  ];
}