import { NextRequest, NextResponse } from 'next/server';
import { getAnthropicClient } from '@/lib/anthropic/client';
import axios from 'axios';

export async function GET() {
  return NextResponse.json({
    message: 'This is the chat API endpoint. Use POST method to send messages.',
    status: 'ready'
  });
}

export async function POST(request: NextRequest) {
  try {
    const { message, useGraphContext, useWebSearch = true } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    console.log(`Processing query: ${message}`);
    console.log(`Graph context: ${useGraphContext}, Web search: ${useWebSearch}`);
    console.log('Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      ANTHROPIC_KEY_SET: !!process.env.ANTHROPIC_API_KEY,
      ANTHROPIC_KEY_LENGTH: process.env.ANTHROPIC_API_KEY?.length || 0,
      SERPAPI_KEY_SET: !!process.env.SERPAPI_KEY,
      BASE_URL: getBaseUrl()
    });

    // 並列でGraph検索とWeb検索を実行
    const [graphResults, webResults] = await Promise.all([
      useGraphContext ? searchGraphData(message) : Promise.resolve(null),
      useWebSearch ? searchWebData(message) : Promise.resolve(null)
    ]);

    // Claude AIで統合回答を生成
    const response = await generateAIResponse(message, graphResults, webResults);

    return NextResponse.json({
      response: response,
      graphContextUsed: useGraphContext && !!graphResults,
      webSearchUsed: useWebSearch && !!webResults,
      sources: {
        graphSources: graphResults?.resultCount || graphResults?.graphResults?.length || 0,
        webSources: webResults?.results?.length || 0
      },
      model: "claude-sonnet-4-5-20250929",
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function searchGraphData(query: string): Promise<any> {
  try {
    const response = await axios.post(`${getBaseUrl()}/api/graph-search`, {
      query,
      context: 'legal-risk-analysis'
    });
    return response.data;
  } catch (error) {
    console.error('Graph search failed:', error);
    return null;
  }
}

async function searchWebData(query: string): Promise<any> {
  try {
    const response = await axios.post(`${getBaseUrl()}/api/web-search`, {
      query,
      context: 'legal-risk-analysis'
    });
    return response.data;
  } catch (error) {
    console.error('Web search failed:', error);
    return null;
  }
}

async function generateAIResponse(query: string, graphResults: any, webResults: any): Promise<string> {
  try {
    // APIキーが設定されている場合はClaude APIを使用
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    console.log('generateAIResponse - API Key check:', {
      hasKey: !!apiKey,
      keyLength: apiKey?.length || 0,
      isNotDefault: apiKey !== 'your_anthropic_api_key_here',
      willUseClaude: !!(apiKey && apiKey !== 'your_anthropic_api_key_here')
    });
    
    if (apiKey && apiKey !== 'your_anthropic_api_key_here') {
      const anthropic = getAnthropicClient();
      
      const context = buildContext(graphResults, webResults);
      const prompt = buildPrompt(query, context);
      
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }]
      });
      
      const responseText = response.content[0]?.type === 'text' ? response.content[0].text : 'エラーが発生しました。';
      console.log('Claude API response received, length:', responseText.length);
      return responseText;
    } else {
      // APIキーが未設定の場合はローカル処理
      console.log('Using local response generation (no valid API key)');
      return generateLocalResponse(query, graphResults, webResults);
    }
  } catch (error: any) {
    console.error('AI response generation failed:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    return generateLocalResponse(query, graphResults, webResults);
  }
}

function buildContext(graphResults: any, webResults: any): string {
  let context = '';
  
  if (graphResults?.graphResults?.length > 0) {
    context += '\n【保存済み文書からの関連情報】\n';
    graphResults.graphResults.forEach((result: any, index: number) => {
      context += `${index + 1}. ${result.documentTitle}\n`;
      context += `   内容: ${result.content}\n`;
      context += `   関連エンティティ: ${result.relatedEntities?.join(', ')}\n\n`;
    });
  }
  
  if (webResults?.results?.length > 0) {
    context += '\n【最新のWeb情報】\n';
    webResults.results.forEach((result: any, index: number) => {
      context += `${index + 1}. ${result.title}\n`;
      context += `   概要: ${result.snippet}\n`;
      context += `   ソース: ${result.displayLink}\n\n`;
    });
  }
  
  return context;
}

function buildPrompt(query: string, context: string): string {
  return `あなたは法的リスク分析の専門家です。以下の質問に対して、提供された情報を基に詳細で実用的な回答を提供してください。

【質問】
${query}

【利用可能な情報】
${context}

【回答要件】
1. 法的リスクを具体的に特定し、分類して説明
2. 実務的な対策と予防措置を提案
3. 情報源を適切に参照
4. 分かりやすい構造化された形式で回答
5. 必要に応じて最新の法的動向も考慮
6. 表形式を使用する場合は、必ず完全な表を作成すること
7. 回答は簡潔にまとめ、冗長な説明は避ける
8. 特に重要な点は箇条書きや表形式で明確に示す

【重要】回答は必ず完結させ、途中で切れないようにしてください。長い表は簡潔にまとめてください。

【回答】`;
}

function generateLocalResponse(query: string, graphResults: any, webResults: any): string {
  const hasGraphData = graphResults?.graphResults?.length > 0;
  const hasWebData = webResults?.results?.length > 0;
  
  let response = `【${query}】に関する法的リスク分析\n\n`;
  
  if (hasGraphData) {
    response += '**保存済み文書からの知見:**\n';
    graphResults.graphResults.slice(0, 2).forEach((result: any, index: number) => {
      response += `${index + 1}. ${result.content}\n`;
    });
    response += '\n';
  }
  
  if (hasWebData) {
    response += '**最新動向:**\n';
    webResults.results.slice(0, 2).forEach((result: any, index: number) => {
      response += `${index + 1}. ${result.title}\n   ${result.snippet}\n`;
    });
    response += '\n';
  }
  
  response += '**総合的な推奨事項:**\n';
  response += '1. 法務専門家との事前相談\n';
  response += '2. 関連法規制の定期的な確認\n';
  response += '3. リスク管理プロセスの策定\n';
  response += '4. 継続的なモニタリング体制の構築\n\n';
  
  if (!hasGraphData && !hasWebData) {
    response += '注: より詳細な分析のために、関連するPDF文書のアップロードをお勧めします。';
  }
  
  return response;
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