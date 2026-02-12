import { NextRequest, NextResponse } from 'next/server';
import { getAnthropicClient } from '@/lib/anthropic/client';
import axios from 'axios';
import { DiagnosisInput, DiagnosisResult, RiskItem } from '@/types/diagnosis';

export async function POST(request: NextRequest) {
  console.log('=== Diagnosis API Called ===');
  console.log('Timestamp:', new Date().toISOString());

  try {
    console.log('Parsing request body...');
    const input: DiagnosisInput = await request.json();
    console.log('Request body parsed successfully');

    if (!input.appDescription) {
      console.error('Validation failed: Missing appDescription');
      return NextResponse.json(
        { error: 'アプリケーションの概要は必須です' },
        { status: 400 }
      );
    }

    console.log('Processing diagnosis for:', input.appName || 'Unnamed App');
    console.log('Input data:', JSON.stringify(input, null, 2));
    const startTime = Date.now();

    // GraphRAGとWeb検索を並行実行（タイムアウトしても続行）
    console.log('Starting parallel search (Graph + Web)...');

    const [graphResults, webResults] = await Promise.all([
      // Graph検索
      Promise.race([
        searchRelevantData(input),
        new Promise<null>((resolve) => setTimeout(() => {
          console.log('Graph search timeout after 40s, proceeding without graph data');
          resolve(null);
        }, 40000))
      ]),
      // Web検索（TAVILY）
      Promise.race([
        searchWebData(input),
        new Promise<null>((resolve) => setTimeout(() => {
          console.log('Web search timeout after 30s, proceeding without web data');
          resolve(null);
        }, 30000))
      ])
    ]);

    const graphSearchTime = Date.now() - startTime;
    console.log(`Graph search completed in ${graphSearchTime}ms`);
    console.log(`Web search results: ${webResults ? 'Success' : 'Skipped'}`);

    // Claude APIでリスク分析を実行（Graph + Web検索結果を統合）
    const analysisStartTime = Date.now();
    const combinedResults = {
      graphResults,
      webResults
    };
    const result = await analyzeLegalRisks(input, combinedResults);
    const analysisTime = Date.now() - analysisStartTime;

    const totalTime = Date.now() - startTime;
    console.log(`Analysis completed in ${analysisTime}ms, total time: ${totalTime}ms`);

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('=== Diagnosis API Error ===');
    console.error('Error:', error);

    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    const errorMessage = error instanceof Error ? error.message : '不明なエラー';
    const errorStack = error instanceof Error ? error.stack : '';

    return NextResponse.json(
      {
        error: '診断の実行に失敗しました',
        details: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

async function searchRelevantData(input: DiagnosisInput): Promise<any> {
  try {
    // 入力情報から検索クエリを構築
    const searchTerms = [
      input.appDescription,
      ...input.aiTechnologies,
      ...input.concernedRisks,
      ...input.useCases,
    ]
      .filter(Boolean)
      .join(' ');

    const baseUrl = getBaseUrl();
    console.log('Graph search base URL:', baseUrl);

    const response = await axios.post(`${baseUrl}/api/graph-search`, {
      query: `AI法的リスク ${searchTerms}`,
      context: 'legal-risk-diagnosis',
    }, {
      timeout: 30000, // 30秒のタイムアウト（余裕を持たせる）
    });
    return response.data;
  } catch (error) {
    console.error('Graph search failed:', error);
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as any;
      console.error('Axios error details:', axiosError.message);
      console.error('Response status:', axiosError.response?.status);
    }
    return null;
  }
}

async function searchWebData(input: DiagnosisInput): Promise<any> {
  console.log('=== searchWebData called ===');
  console.log('TAVILY_API_KEY status:', process.env.TAVILY_API_KEY ? 'SET' : 'NOT SET');

  try {
    // 入力情報から検索クエリを構築
    const searchTerms = [
      input.appDescription,
      ...input.aiTechnologies,
      ...input.concernedRisks,
      ...input.useCases,
    ]
      .filter(Boolean)
      .join(' ');

    const baseUrl = getBaseUrl();
    console.log('Web search base URL:', baseUrl);

    if (!baseUrl) {
      console.error('Base URL is empty! Cannot call web-search API');
      return null;
    }

    const searchQuery = `AI 法的リスク 規制 ${searchTerms}`;
    console.log('Calling web-search API with query:', searchQuery);

    const response = await axios.post(`${baseUrl}/api/web-search`, {
      query: searchQuery,
      context: 'legal-risk-diagnosis',
    }, {
      timeout: 20000, // 20秒のタイムアウト
    });

    const webData = response.data as any;
    console.log('Web search successful!');
    console.log('Results count:', webData?.results?.length || 0);
    console.log('Result structure check:', webData?.results?.[0] ? Object.keys(webData.results[0]) : 'No results');
    return webData;
  } catch (error) {
    console.error('=== Web search failed ===');
    console.error('Error:', error);
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as any;
      console.error('Error message:', axiosError.message);
      console.error('Response status:', axiosError.response?.status);
      console.error('Response data:', axiosError.response?.data);
    }
    return null;
  }
}

async function analyzeLegalRisks(
  input: DiagnosisInput,
  graphResults: any
): Promise<DiagnosisResult> {
  console.log('Starting analyzeLegalRisks...');
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    console.log('API Key status:', apiKey ? `Set (${apiKey.substring(0, 10)}...)` : 'Not set');

    if (apiKey && apiKey !== 'your_anthropic_api_key_here') {
      console.log('Using Anthropic API for analysis');
      console.log('Creating Anthropic client...');
      const anthropic = getAnthropicClient();
      console.log('Anthropic client created successfully');

      const prompt = buildDiagnosisPrompt(input, graphResults);

      const response = await anthropic.messages.create(
        {
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 8000,
          messages: [{ role: 'user', content: prompt }],
        },
        {
          timeout: 200000, // 200秒のタイムアウト（Vercel 300秒設定を活用）
        }
      );

      const responseText =
        response.content[0]?.type === 'text' ? response.content[0].text : '';

      // JSONレスポンスをパース
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]);
        return {
          ...parsed,
          diagnosedAt: new Date().toISOString(),
          appName: input.appName,
        };
      }

      // フォールバック: マークダウンから構造化
      console.log('Using fallback: JSON parse failed');
      return generateFallbackResult(input, responseText, graphResults);
    } else {
      // APIキーが未設定の場合はフォールバック
      console.log('Using fallback: API key not configured');
      return generateFallbackResult(input, null, graphResults);
    }
  } catch (error) {
    console.error('AI analysis failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error message:', errorMessage);
    console.log('Using fallback due to error');
    return generateFallbackResult(input, null, graphResults);
  }
}

function buildDiagnosisPrompt(input: DiagnosisInput, combinedResults: any): string {
  let context = '';

  // Graph検索結果
  if (combinedResults?.graphResults?.graphResults?.length > 0) {
    context += '\n【内部知識ベースからの関連情報】\n';
    combinedResults.graphResults.graphResults.forEach((result: any, index: number) => {
      context += `${index + 1}. ${result.documentTitle}\n`;
      context += `   内容: ${result.content}\n`;
      if (result.relatedEntities?.length > 0) {
        context += `   関連キーワード: ${result.relatedEntities.join(', ')}\n`;
      }
      context += '\n';
    });
  }

  // Web検索結果（TAVILY）
  if (combinedResults?.webResults?.results?.length > 0) {
    context += '\n【最新のWeb検索結果】\n';
    combinedResults.webResults.results.slice(0, 5).forEach((result: any, index: number) => {
      context += `${index + 1}. ${result.title}\n`;
      context += `   URL: ${result.url}\n`;
      context += `   内容: ${result.content || result.snippet}\n\n`;
    });
  }

  return `あなたは日本およびグローバルのAI法規制に精通した法的リスク分析の専門家です。
以下のAIアプリケーションについて、包括的な法的リスク診断を行ってください。

【診断対象アプリケーション情報】
- アプリ名: ${input.appName || '未設定'}
- 概要: ${input.appDescription}
- 使用AI技術: ${input.aiTechnologies.join(', ')}
- AIプロバイダー: ${input.aiProviders.join(', ')}
- 入力データの種類: ${input.inputDataTypes.join(', ')}
- データ送信先: ${
    input.dataTransmission === 'external_api'
      ? '外部API'
      : input.dataTransmission === 'local'
      ? 'ローカル処理'
      : '両方'
  }
- データ保存・利用: ${input.dataStorage.join(', ')}
- 想定ユーザー: ${input.targetUsers.join(', ')}
- 料金モデル: ${input.pricingModel}
- 主な用途: ${input.useCases.join(', ')}
- 特に懸念している領域: ${input.concernedRisks.join(', ') || 'なし'}
- 追加情報: ${input.additionalNotes || 'なし'}

${context}

【診断要件】
1. 総合リスクレベル（high/medium/low）を判定
2. 各リスク領域について詳細分析
3. 法的根拠（適用される法律・規制）を明示
4. 具体的な対策・推奨事項を提示
5. 優先対応すべき事項をリストアップ

【重要】以下のJSON形式で回答してください:

\`\`\`json
{
  "overallRiskLevel": "high|medium|low",
  "executiveSummary": "総合的な診断サマリー（200-300字程度）",
  "risks": [
    {
      "category": "リスクカテゴリ名",
      "level": "high|medium|low",
      "summary": "リスクの概要（1-2文）",
      "details": "詳細な説明",
      "legalBasis": ["関連する法律・規制1", "法律2"],
      "recommendations": ["対策1", "対策2"],
      "graphRagSources": ["参照した文書名があれば"]
    }
  ],
  "priorityActions": ["最優先で対応すべき事項1", "事項2", "事項3"],
  "relatedCases": ["参考となる事例や判例があれば"],
  "disclaimer": "この診断は情報提供を目的としており、法的アドバイスではありません。具体的な対応については、専門家にご相談ください。"
}
\`\`\`

診断結果をJSON形式で出力してください。`;
}

function generateFallbackResult(
  input: DiagnosisInput,
  responseText: string | null,
  graphResults: any
): DiagnosisResult {
  // 入力に基づいてリスクを推定
  const risks: RiskItem[] = [];

  // 個人情報リスク
  if (
    input.inputDataTypes.includes('personal_info') ||
    input.inputDataTypes.includes('sensitive_personal')
  ) {
    risks.push({
      category: 'プライバシー・個人情報保護',
      level: input.inputDataTypes.includes('sensitive_personal') ? 'high' : 'medium',
      summary: '個人情報または要配慮個人情報を取り扱うため、データ保護法への対応が必要です。',
      details:
        '個人情報保護法に基づく適切な取得・管理・第三者提供の手続きが必要です。外部APIへのデータ送信がある場合は、越境移転規制にも注意が必要です。',
      legalBasis: ['個人情報保護法', 'GDPR（EU域内ユーザーがいる場合）'],
      recommendations: [
        '利用目的の明示と同意取得の仕組みを構築',
        'プライバシーポリシーの作成・更新',
        'データの暗号化と安全管理措置の実施',
      ],
      graphRagSources: [],
    });
  }

  // 外部API利用リスク
  if (input.dataTransmission === 'external_api' || input.dataTransmission === 'both') {
    risks.push({
      category: 'API利用規約・データ送信',
      level: 'medium',
      summary: '外部AIサービスへのデータ送信に関する規約遵守とリスク管理が必要です。',
      details:
        '各AIプロバイダーの利用規約、特にデータの取り扱い、学習への利用可否、禁止用途を確認し遵守する必要があります。',
      legalBasis: ['各プロバイダー利用規約', 'クラウドサービス契約'],
      recommendations: [
        'プロバイダー利用規約の詳細確認',
        'オプトアウト設定の確認・適用',
        'データ処理契約（DPA）の締結検討',
      ],
      graphRagSources: [],
    });
  }

  // 著作権リスク（コンテンツ生成系）
  if (
    input.aiTechnologies.includes('llm') ||
    input.aiTechnologies.includes('image_generation') ||
    input.aiTechnologies.includes('code_generation')
  ) {
    risks.push({
      category: '著作権・知的財産',
      level: 'medium',
      summary: 'AI生成コンテンツの著作権と既存著作物の利用に関する検討が必要です。',
      details:
        'AI生成物の著作権帰属、学習データに含まれる著作物の権利処理、生成物が既存著作物に類似するリスクを検討する必要があります。',
      legalBasis: ['著作権法', 'AI生成物に関するガイドライン'],
      recommendations: [
        'AI生成コンテンツの権利帰属を利用規約で明確化',
        '商用利用時の権利確認フロー策定',
        '類似性チェックの仕組み検討',
      ],
      graphRagSources: [],
    });
  }

  // AI透明性（EU向け）
  if (input.targetUsers.includes('eu')) {
    risks.push({
      category: 'EU AI規制法対応',
      level: 'high',
      summary: 'EU AI規制法（AI Act）への対応が必要です。',
      details:
        'EU域内でAIシステムを提供する場合、リスクカテゴリに応じた要件への対応が必要です。特に高リスクAIシステムに該当する場合は、技術文書作成、品質管理システム構築等の義務があります。',
      legalBasis: ['EU AI Act', 'GDPR'],
      recommendations: [
        'AIシステムのリスク分類を実施',
        'AI利用の開示義務への対応',
        '適合性評価の要否を確認',
      ],
      graphRagSources: [],
    });
  }

  // 子ども向けサービス
  if (input.targetUsers.includes('children')) {
    risks.push({
      category: '児童保護',
      level: 'high',
      summary: '13歳未満の子どもを対象とする場合、特別な保護措置が必要です。',
      details:
        '米国COPPA、各国の児童オンラインプライバシー保護法への対応が必要です。保護者同意の取得、データ収集の最小化、適切な年齢確認が求められます。',
      legalBasis: ['COPPA（米国）', '児童のオンラインプライバシー保護法'],
      recommendations: [
        '保護者同意取得の仕組み構築',
        '年齢確認機能の実装',
        '子ども向けコンテンツモデレーション強化',
      ],
      graphRagSources: [],
    });
  }

  // デフォルトリスク（最低1つは入れる）
  if (risks.length === 0) {
    risks.push({
      category: 'AI利用に関する一般的リスク',
      level: 'low',
      summary: 'AIサービス利用に伴う基本的な法的考慮事項があります。',
      details:
        'AI出力の正確性、ユーザーへの適切な情報提供、継続的なモニタリングを検討してください。',
      legalBasis: ['消費者契約法', 'AI事業者ガイドライン'],
      recommendations: [
        'AI利用の開示と免責事項の明記',
        'ユーザーフィードバック収集体制の構築',
        '定期的なリスク評価の実施',
      ],
      graphRagSources: [],
    });
  }

  // 総合リスクレベルを判定
  const hasHighRisk = risks.some((r) => r.level === 'high');
  const hasMediumRisk = risks.some((r) => r.level === 'medium');
  const overallRiskLevel = hasHighRisk ? 'high' : hasMediumRisk ? 'medium' : 'low';

  // 優先対応事項
  const priorityActions = risks
    .filter((r) => r.level === 'high' || r.level === 'medium')
    .flatMap((r) => r.recommendations.slice(0, 1))
    .slice(0, 5);

  if (priorityActions.length === 0) {
    priorityActions.push('AI利用に関する免責事項を利用規約に追加');
    priorityActions.push('ユーザーへのAI利用開示を実施');
  }

  return {
    overallRiskLevel,
    executiveSummary: `${input.appName || 'このAIアプリケーション'}について診断を行いました。${risks.length}件のリスク領域が特定され、総合リスクレベルは「${
      overallRiskLevel === 'high' ? '高' : overallRiskLevel === 'medium' ? '中' : '低'
    }」と判定されました。${
      hasHighRisk
        ? '高リスク項目について早急な対応を推奨します。'
        : '適切な対策を講じることでリスクを管理可能です。'
    }`,
    risks,
    priorityActions,
    relatedCases: [],
    disclaimer:
      'この診断は情報提供を目的としており、法的アドバイスではありません。具体的な対応については、弁護士等の専門家にご相談ください。',
    diagnosedAt: new Date().toISOString(),
    appName: input.appName,
  };
}

function getBaseUrl(): string {
  // Vercel環境の場合
  if (process.env.VERCEL_URL) {
    // VERCEL_URLにはプロトコルが含まれていないため、httpsを追加
    const url = `https://${process.env.VERCEL_URL}`;
    console.log('Using VERCEL_URL:', url);
    return url;
  }
  // 開発環境の場合
  if (process.env.NODE_ENV === 'development') {
    console.log('Using development URL: http://localhost:3000');
    return 'http://localhost:3000';
  }
  // カスタムドメインの場合
  if (process.env.NEXT_PUBLIC_APP_URL) {
    console.log('Using NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL);
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  // デフォルト（本番環境の想定URLを使用）
  console.log('Using default production URL');
  return 'https://graph-rag-chatbot-vercel-01.vercel.app';
}
