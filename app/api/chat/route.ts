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
  return `あなたは日本の法的リスク分析の専門家です。以下の質問に対して、簡潔で分かりやすい回答を提供してください。

【質問】
${query}

【利用可能な情報】
${context}

【回答の要件】
1. 回答は200文字以内を目安に、簡潔にまとめること
2. 最も重要なリスクを1〜2つに絞って説明すること
3. 具体的な対策を2〜3個に絞って箇条書きで示すこと
4. 長い説明や詳細な法令解説は避け、実用的なポイントのみを述べること

【回答の構成】
以下の構成で簡潔に回答してください：

**主要なリスク：**
（1〜2文で最も重要なリスクを説明）

**推奨される対策：**
- 対策1（1文）
- 対策2（1文）
- 対策3（1文、必要な場合のみ）

**関連法令：**
（該当する主要な法律名のみ、1行）

【重要】
- 冗長な説明は避けること
- 見出しや箇条書きを使ってコンパクトに整理すること
- 全体で200文字程度に収めること

【回答】`;
}

function generateLocalResponse(query: string, graphResults: any, webResults: any): string {
  const hasGraphData = graphResults?.graphResults?.length > 0;
  const hasWebData = webResults?.results?.length > 0;

  let response = `**【${query}】に関する法的リスク**\n\n`;

  response += '**主要なリスク：**\n';
  response += 'AI生成コンテンツが不正確または業務実態と乖離している場合、法的責任（民事・行政処分）や信頼性の問題が生じる可能性があります。\n\n';

  response += '**推奨される対策：**\n';
  response += '- 使用前に必ず人間による確認・検証を行う\n';
  response += '- 利用ガイドラインを策定し、禁止事項を明確化する\n';
  response += '- 重要な用途では法務専門家に事前相談する\n\n';

  if (hasGraphData) {
    response += '**参考情報：**\n';
    const firstResult = graphResults.graphResults[0];
    response += `${firstResult.content.substring(0, 100)}...\n\n`;
  }

  if (hasWebData) {
    response += '**最新情報：**\n';
    const firstWebResult = webResults.results[0];
    response += `${firstWebResult.snippet.substring(0, 100)}...\n\n`;
  }

  response += '**関連法令：** 著作権法、個人情報保護法、景品表示法など\n\n';

  response += '※ 具体的な案件は法務専門家にご相談ください。';

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