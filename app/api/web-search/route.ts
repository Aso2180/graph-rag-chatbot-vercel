import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: NextRequest) {
  console.log('=== Web Search API Called ===');
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

    // 法的リスク関連の検索キーワードを強化
    const enhancedQuery = enhanceSearchQuery(query, context);
    
    // 複数の検索結果を統合
    const searchResults = await performWebSearch(enhancedQuery);
    
    // 結果をフィルタリングして関連性の高い情報のみ抽出
    const relevantResults = filterRelevantResults(searchResults, query);

    // 検索結果をNeo4jに保存（非同期で実行）
    if (relevantResults.length > 0) {
      saveResultsToKnowledgeGraph(relevantResults, query).catch(error => {
        console.error('Failed to save search results to graph:', error);
      });
    }

    return NextResponse.json({
      originalQuery: query,
      enhancedQuery,
      results: relevantResults,
      resultCount: relevantResults.length,
      searchTimestamp: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Web search error:', error);
    return NextResponse.json(
      { error: 'Web search failed' },
      { status: 500 }
    );
  }
}

function enhanceSearchQuery(query: string, context?: string): string {
  // 法的リスク分析に特化したキーワード強化
  const legalTerms = ['法的リスク', 'コンプライアンス', '著作権', 'ライセンス', '規制'];
  const aiTerms = ['AI生成', '人工知能', 'デジタルコンテンツ'];
  
  let enhancedQuery = query;
  
  // AIや動画制作関連の場合、関連する法的用語を追加
  if (query.includes('AI') || query.includes('動画') || query.includes('生成')) {
    enhancedQuery += ' ' + legalTerms.slice(0, 2).join(' ');
  }
  
  // 日付制限を追加（最新1年以内）
  const currentYear = new Date().getFullYear();
  enhancedQuery += ` after:${currentYear - 1}`;
  
  return enhancedQuery;
}

async function performWebSearch(query: string): Promise<any[]> {
  try {
    // Tavily API を使用
    const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
    
    console.log('performWebSearch - Tavily API check:', {
      hasTavily: !!TAVILY_API_KEY,
      tavilyLength: TAVILY_API_KEY?.length || 0
    });
    
    if (TAVILY_API_KEY) {
      console.log('Calling TAVILY API with query:', query);
      const tavilyResponse = await axios.post('https://api.tavily.com/search', {
        api_key: TAVILY_API_KEY,
        query: query,
        search_depth: 'advanced',
        max_results: 5,
        include_answer: true,
        include_raw_content: false
      });
      console.log('TAVILY API call completed');
      
      console.log('Tavily API response:', {
        status: tavilyResponse.status,
        hasResults: !!(tavilyResponse.data as any).results,
        resultCount: (tavilyResponse.data as any).results?.length || 0
      });
      
      if ((tavilyResponse.data as any).results) {
        return (tavilyResponse.data as any).results.map((result: any) => ({
          title: result.title,
          url: result.url,
          content: result.content || result.snippet || '',
          snippet: result.content || result.snippet || '',
          displayLink: new URL(result.url).hostname
        }));
      }
    }
    
    // API キーがない場合はダミーデータを返す
    console.log('No search API keys found, using dummy data');
    return generateDummySearchResults(query);
  } catch (error: any) {
    console.error('Search API error:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    return generateDummySearchResults(query);
  }
}

function generateDummySearchResults(query: string): any[] {
  // 開発用ダミーデータ
  console.log('Using dummy search results (TAVILY_API_KEY not configured)');
  return [
    {
      title: `${query}に関する最新の法的ガイドライン - 法務省`,
      url: 'https://example.com/legal-guidelines',
      content: '最新の法的要件と規制に関する包括的なガイドライン。AI技術の利用における法的リスクについて詳細に解説。',
      snippet: '最新の法的要件と規制に関する包括的なガイドライン。AI技術の利用における法的リスクについて詳細に解説。',
      displayLink: 'example.com'
    },
    {
      title: `AI生成コンテンツの著作権問題 - 知的財産法の観点`,
      url: 'https://example.com/ai-copyright',
      content: 'AI によって生成されたコンテンツの著作権の帰属と商業利用時の注意点について専門家が解説。',
      snippet: 'AI によって生成されたコンテンツの著作権の帰属と商業利用時の注意点について専門家が解説。',
      displayLink: 'example.com'
    },
    {
      title: `企業のAI活用における コンプライアンス チェックリスト`,
      url: 'https://example.com/compliance-checklist',
      content: '企業がAI技術を導入する際の法的リスクを最小化するための実践的なチェックリスト。',
      snippet: '企業がAI技術を導入する際の法的リスクを最小化するための実践的なチェックリスト。',
      displayLink: 'example.com'
    }
  ];
}

function filterRelevantResults(results: any[], originalQuery: string): any[] {
  // 結果の関連性フィルタリング
  return results.filter(result => {
    const content = (result.title + ' ' + result.snippet).toLowerCase();
    const queryTerms = originalQuery.toLowerCase().split(' ');
    
    // クエリの主要用語が含まれているかチェック
    return queryTerms.some(term => content.includes(term));
  }).slice(0, 5); // 最大5件に制限
}

async function saveResultsToKnowledgeGraph(results: any[], query: string): Promise<void> {
  try {
    const response = await axios.post(`${getBaseUrl()}/api/learn`, {
      searchResults: results,
      query: query,
      source: 'web-search-auto'
    });
    
    if ((response.data as any).success) {
      console.log(`Saved ${(response.data as any).savedCount} search results to knowledge graph`);
    }
  } catch (error) {
    console.error('Error saving to knowledge graph:', error);
  }
}

function getBaseUrl(): string {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }
  return '';
}