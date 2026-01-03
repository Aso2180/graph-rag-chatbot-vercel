import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/neo4j/client';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const { searchResults, query, source = 'web-search' } = await request.json();

    if (!searchResults || !Array.isArray(searchResults)) {
      return NextResponse.json(
        { error: 'Search results array is required' },
        { status: 400 }
      );
    }

    // Web検索結果をNeo4jに保存
    const savedCount = await saveSearchResultsToGraph(searchResults, query, source);

    // 定期的な法的アップデート確認
    if (query.includes('法律') || query.includes('規制') || query.includes('AI')) {
      await checkLegalUpdates();
    }

    return NextResponse.json({
      success: true,
      savedCount,
      message: `${savedCount}件の検索結果を知識グラフに追加しました。`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Learn API error:', error);
    return NextResponse.json(
      { error: 'Failed to save search results' },
      { status: 500 }
    );
  }
}

async function saveSearchResultsToGraph(
  searchResults: any[],
  originalQuery: string,
  source: string
): Promise<number> {
  const session = await getSession();
  let savedCount = 0;

  try {
    for (const result of searchResults) {
      const cypherQuery = `
        // WebSourceノードを作成または更新
        MERGE (source:WebSource {url: $url})
        SET source.title = $title,
            source.lastUpdated = datetime(),
            source.snippet = $snippet,
            source.displayLink = $displayLink
        
        // Chunkノードを作成
        CREATE (chunk:Chunk {
          id: randomUUID(),
          content: $content,
          title: $title,
          source: $source,
          url: $url,
          createdAt: datetime(),
          queryOrigin: $query
        })
        
        // WebSourceとChunkを関連付け
        CREATE (source)-[:CONTAINS]->(chunk)
        
        // クエリに基づいてエンティティを抽出して関連付け
        WITH chunk
        UNWIND $entities as entityName
        MERGE (entity:Entity {name: entityName})
        CREATE (chunk)-[:MENTIONS]->(entity)
        
        // 法的アップデートタグを追加
        WITH chunk
        WHERE $isLegalUpdate = true
        CREATE (update:LegalUpdate {
          date: datetime(),
          topic: $query,
          importance: CASE 
            WHEN $content CONTAINS '改正' OR $content CONTAINS '新法' THEN 'high'
            WHEN $content CONTAINS '検討' OR $content CONTAINS '議論' THEN 'medium'
            ELSE 'low'
          END
        })
        CREATE (chunk)-[:IS_UPDATE]->(update)
      `;

      const params = {
        url: result.link || '',
        title: result.title || '',
        snippet: result.snippet || '',
        displayLink: result.displayLink || '',
        content: result.snippet || result.description || '',
        source: source,
        query: originalQuery,
        entities: extractEntities(result.title + ' ' + result.snippet),
        isLegalUpdate: isLegalUpdateContent(result)
      };

      await session.run(cypherQuery, params);
      savedCount++;
    }

    // 重複排除と関連性スコアリング
    await updateRelevanceScores(session, originalQuery);

  } catch (error) {
    console.error('Error saving to Neo4j:', error);
    throw error;
  } finally {
    await session.close();
  }

  return savedCount;
}

async function checkLegalUpdates() {
  const session = await getSession();
  
  try {
    // 最新の法的アップデートをチェック
    const cypherQuery = `
      MATCH (update:LegalUpdate)<-[:IS_UPDATE]-(chunk:Chunk)
      WHERE update.date > datetime() - duration('P7D') // 過去7日間
      AND update.importance IN ['high', 'medium']
      RETURN update.topic as topic, 
             collect(DISTINCT chunk.title) as titles,
             max(update.importance) as maxImportance,
             count(chunk) as updateCount
      ORDER BY updateCount DESC
      LIMIT 10
    `;

    const result = await session.run(cypherQuery);
    
    if (result.records.length > 0) {
      console.log('Recent legal updates detected:', 
        result.records.map(r => ({
          topic: r.get('topic'),
          count: r.get('updateCount'),
          importance: r.get('maxImportance')
        }))
      );
    }

  } catch (error) {
    console.error('Error checking legal updates:', error);
  } finally {
    await session.close();
  }
}

async function updateRelevanceScores(session: any, query: string) {
  try {
    // クエリに基づいてチャンクの関連性スコアを更新
    const cypherQuery = `
      MATCH (chunk:Chunk)
      WHERE chunk.queryOrigin = $query OR chunk.content CONTAINS $query
      SET chunk.relevanceScore = CASE
        WHEN chunk.createdAt > datetime() - duration('P30D') THEN 1.0
        WHEN chunk.createdAt > datetime() - duration('P90D') THEN 0.8
        WHEN chunk.createdAt > datetime() - duration('P180D') THEN 0.6
        ELSE 0.4
      END * CASE
        WHEN chunk.content CONTAINS 'Veo' OR chunk.content CONTAINS 'Canva' OR chunk.content CONTAINS 'Suno' THEN 1.2
        ELSE 1.0
      END
    `;

    await session.run(cypherQuery, { query });

  } catch (error) {
    console.error('Error updating relevance scores:', error);
  }
}

function extractEntities(text: string): string[] {
  // 簡単なエンティティ抽出
  const entities: string[] = [];
  
  // AI/技術関連の用語
  const techTerms = ['AI', 'Veo', 'Canva', 'Suno', 'ChatGPT', 'Stable Diffusion', 'DALL-E', 'Midjourney'];
  // 法的用語
  const legalTerms = ['著作権', '肖像権', 'プライバシー', 'GDPR', '個人情報保護法', '知的財産権'];
  
  [...techTerms, ...legalTerms].forEach(term => {
    if (text.includes(term)) {
      entities.push(term);
    }
  });

  return entities;
}

function isLegalUpdateContent(result: any): boolean {
  const content = (result.title + ' ' + result.snippet).toLowerCase();
  const updateKeywords = ['改正', '新法', '規制', '施行', 'ガイドライン', '発表', '更新', '変更'];
  
  return updateKeywords.some(keyword => content.includes(keyword));
}

// 定期的な自動学習用エンドポイント
export async function GET(request: NextRequest) {
  try {
    // 最新の法的動向を自動的に検索して学習
    const topics = ['AI 法的リスク 最新', 'Veo 著作権', 'Canva 商用利用', 'Suno 音楽 権利'];
    const SERPAPI_KEY = process.env.SERPAPI_KEY;
    
    if (!SERPAPI_KEY) {
      return NextResponse.json({ error: 'SerpAPI key not configured' }, { status: 500 });
    }

    let totalSaved = 0;

    for (const topic of topics) {
      const serpResponse = await axios.get('https://serpapi.com/search', {
        params: {
          api_key: SERPAPI_KEY,
          q: topic + ' site:www.meti.go.jp OR site:www.caa.go.jp OR site:www.nisc.go.jp',
          engine: 'google',
          num: 5,
          hl: 'ja',
          gl: 'jp',
          tbs: 'qdr:w' // 過去1週間
        }
      });

      if ((serpResponse.data as any).organic_results) {
        const results = (serpResponse.data as any).organic_results.map((result: any) => ({
          title: result.title,
          link: result.link,
          snippet: result.snippet || result.description || '',
          displayLink: result.displayed_link || new URL(result.link).hostname
        }));

        const saved = await saveSearchResultsToGraph(results, topic, 'auto-learn');
        totalSaved += saved;
      }
    }

    return NextResponse.json({
      success: true,
      message: `自動学習完了: ${totalSaved}件の最新情報を追加`,
      topics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Auto-learn error:', error);
    return NextResponse.json(
      { error: 'Auto-learn failed' },
      { status: 500 }
    );
  }
}