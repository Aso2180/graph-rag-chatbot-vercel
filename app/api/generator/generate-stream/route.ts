import { NextRequest, NextResponse } from 'next/server';
import { getAnthropicClient } from '@/lib/anthropic/client';
import {
  DocumentGeneratorInput,
  GeneratedDocument,
  DocumentType,
  DOCUMENT_TYPE_LABELS,
} from '@/types/document';

type ProgressEvent = {
  type: 'start' | 'progress' | 'complete' | 'error' | 'done';
  documentType?: DocumentType;
  documentTitle?: string;
  completed?: number;
  total?: number;
  estimatedTimeRemaining?: number;
  document?: GeneratedDocument;
  error?: string;
};

function sendEvent(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  event: ProgressEvent
) {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  controller.enqueue(encoder.encode(data));
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  const bodyText = await request.text();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        let input: DocumentGeneratorInput;
        try {
          input = JSON.parse(bodyText);
        } catch (parseError) {
          sendEvent(controller, encoder, { type: 'error', error: 'リクエストの形式が不正です' });
          controller.close();
          return;
        }

        if (!input.documentTypes || input.documentTypes.length === 0) {
          sendEvent(controller, encoder, { type: 'error', error: '文書タイプを選択してください' });
          controller.close();
          return;
        }

        console.log('Generating documents for:', input.companyName);
        console.log('Document types:', input.documentTypes);

        const totalDocs = input.documentTypes.length;
        let completedDocs = 0;

        sendEvent(controller, encoder, {
          type: 'start',
          completed: 0,
          total: totalDocs,
          estimatedTimeRemaining: totalDocs * 60,
        });

        const startTime = Date.now();
        const batchSize = 2;

        for (let i = 0; i < input.documentTypes.length; i += batchSize) {
          const batch = input.documentTypes.slice(i, i + batchSize);

          const batchPromises = batch.map(async (docType) => {
            try {
              sendEvent(controller, encoder, {
                type: 'progress',
                documentType: docType,
                documentTitle: DOCUMENT_TYPE_LABELS[docType],
                completed: completedDocs,
                total: totalDocs,
              });

              const doc = await generateDocument(docType, input);
              completedDocs++;

              const elapsed = Date.now() - startTime;
              const avgTimePerDoc = elapsed / completedDocs;
              const remaining = Math.ceil((totalDocs - completedDocs) * avgTimePerDoc / 1000);

              sendEvent(controller, encoder, {
                type: 'complete',
                documentType: docType,
                documentTitle: DOCUMENT_TYPE_LABELS[docType],
                document: doc,
                completed: completedDocs,
                total: totalDocs,
                estimatedTimeRemaining: remaining,
              });

              return doc;
            } catch (error) {
              console.error(`Failed to generate ${docType}:`, error);
              const fallbackDoc = generateFallbackDocument(docType, input);
              completedDocs++;

              sendEvent(controller, encoder, {
                type: 'complete',
                documentType: docType,
                documentTitle: DOCUMENT_TYPE_LABELS[docType],
                document: fallbackDoc,
                completed: completedDocs,
                total: totalDocs,
                error: 'フォールバック文書を使用',
              });

              return fallbackDoc;
            }
          });

          await Promise.all(batchPromises);
        }

        sendEvent(controller, encoder, {
          type: 'done',
          completed: totalDocs,
          total: totalDocs,
        });

        controller.close();
      } catch (error) {
        console.error('Stream error:', error);
        sendEvent(controller, encoder, {
          type: 'error',
          error: error instanceof Error ? error.message : '生成に失敗しました',
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

async function generateDocument(
  docType: DocumentType,
  input: DocumentGeneratorInput
): Promise<GeneratedDocument> {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (apiKey && apiKey !== 'your_anthropic_api_key_here') {
      const anthropic = getAnthropicClient();
      const prompt = buildDocumentPrompt(docType, input);

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 8000,
        messages: [{ role: 'user', content: prompt }],
      });

      const content =
        response.content[0]?.type === 'text' ? response.content[0].text : '';

      return {
        type: docType,
        title: DOCUMENT_TYPE_LABELS[docType],
        content: cleanMarkdownContent(content),
        generatedAt: new Date().toISOString(),
      };
    } else {
      // フォールバック
      return generateFallbackDocument(docType, input);
    }
  } catch (error) {
    console.error(`Failed to generate ${docType}:`, error);
    return generateFallbackDocument(docType, input);
  }
}

function buildDocumentPrompt(
  docType: DocumentType,
  input: DocumentGeneratorInput
): string {
  // 社内利用か社外利用かを判定
  const isInternalUse = determineIfInternalUse(input.diagnosisInput);
  const usageType = isInternalUse ? '社内利用' : '社外向けサービス';

  const baseContext = `
会社名: ${input.companyName}
サービスURL: ${input.serviceUrl || '未設定'}
連絡先: ${input.contactEmail}
準拠法: ${getGoverningLawName(input.governingLaw)}
利用形態: ${usageType}
`;

  let diagnosisContext = '';
  if (input.diagnosisResult) {
    diagnosisContext = `
【リスク診断結果に基づく考慮事項】
- 総合リスクレベル: ${input.diagnosisResult.overallRiskLevel}
- 特定されたリスク:
${input.diagnosisResult.risks
  .map((r) => `  - ${r.category}（${r.level}）: ${r.summary}`)
  .join('\n')}
- 推奨対策:
${input.diagnosisResult.priorityActions.map((a) => `  - ${a}`).join('\n')}
`;
  }

  if (input.diagnosisInput) {
    diagnosisContext += `
【AIアプリケーション情報】
- AI技術: ${input.diagnosisInput.aiTechnologies.join(', ')}
- AIプロバイダー: ${input.diagnosisInput.aiProviders.join(', ')}
- 入力データ: ${input.diagnosisInput.inputDataTypes.join(', ')}
- データ送信: ${input.diagnosisInput.dataTransmission}
- 想定ユーザー: ${input.diagnosisInput.targetUsers.join(', ')}
`;
  }

  // チャット履歴をコンテキストに追加
  let chatContext = '';
  if (input.chatHistory && input.chatHistory.length > 0) {
    console.log('Chat history being used in document generation:', input.chatHistory);
    chatContext = `
【ユーザーとの相談内容】
以下は、ユーザーが法的リスクについて相談した内容です。この内容を規約作成に反映してください：
${input.chatHistory
  .map((msg) => `${msg.role === 'user' ? 'ユーザー' : 'アシスタント'}: ${msg.content}`)
  .join('\n')}
`;
  }

  const additionalContext = input.additionalClauses
    ? `\n【追加で含めたい条項】\n${input.additionalClauses}`
    : '';

  const typeSpecificInstructions = getDocumentTypeInstructions(docType, isInternalUse);

  return `あなたは日本の法務専門家です。以下の情報に基づいて、${DOCUMENT_TYPE_LABELS[docType]}を作成してください。

${baseContext}
${diagnosisContext}
${chatContext}
${additionalContext}

${typeSpecificInstructions}

【重要な要件】
1. 日本語で作成すること
2. Markdown形式で出力すること
3. 法的に有効な文言を使用すること
4. 明確で理解しやすい文章にすること
5. 必要に応じて見出し、箇条書きを使用すること
6. 準拠法に基づいた内容にすること
${input.diagnosisResult ? '7. リスク診断結果で特定されたリスクに対応する条項を含めること' : ''}
${input.chatHistory && input.chatHistory.length > 0 ? '8. **重要**: ユーザーとの相談内容で指摘された懸念事項や質問に対応する条項を含めること' : ''}
${isInternalUse ? '9. **重要**: これは社内利用向けの規程です。従業員向けの文言（会社への報告義務、懲戒処分の可能性など）を使用してください。「当社は～」ではなく「利用者は～」という形式で記載してください。' : '9. これは社外向けサービスの規約です。サービス提供者と利用者の関係を明確にし、免責事項を含めてください。'}

文書を生成してください:`;
}

// 社内利用かどうかを判定する関数
function determineIfInternalUse(diagnosisInput: any): boolean {
  if (!diagnosisInput) return false;

  // targetUsersから判定
  const targetUsers = diagnosisInput.targetUsers || [];
  const hasInternalUser = targetUsers.includes('internal');
  const hasExternalUsers = targetUsers.includes('general_public') || targetUsers.includes('business');

  // useCasesからも判定（フォールバック）
  const useCases = diagnosisInput.useCases || [];
  const internalUseCases = ['社内研修・教育', '業務効率化'];
  const externalUseCases = ['会社案内・サービス紹介', '採用活動', 'マーケティング・広告', '顧客向けサービス', '製品組込み'];

  const hasInternalUseCase = useCases.some((uc: string) => internalUseCases.includes(uc));
  const hasExternalUseCase = useCases.some((uc: string) => externalUseCases.includes(uc));

  // 社内ユーザーのみ、または社内用途のみの場合はtrue
  // 社外向けが含まれる場合はfalse
  return (hasInternalUser || hasInternalUseCase) && !hasExternalUsers && !hasExternalUseCase;
}

function getDocumentTypeInstructions(docType: DocumentType, isInternalUse: boolean): string {
  if (isInternalUse) {
    // 社内利用向けの指示
    const internalInstructions: Record<DocumentType, string> = {
      terms_of_service: `
【社内AI利用規程の構成】
1. 目的と適用範囲（従業員への適用）
2. 用語の定義
3. 利用できるAIツール・サービス
4. 遵守事項
   - 情報セキュリティの遵守
   - 機密情報の取り扱い
   - 個人情報保護
5. 禁止事項
   - 会社の機密情報の無断入力
   - 著作権侵害
   - 不適切な利用
6. 利用者の責任
   - AI出力の確認・検証義務
   - 社内外への損害防止義務
   - 問題発生時の報告義務
7. 違反時の対応
   - 懲戒処分の可能性
   - 損害賠償責任
8. 教育・研修
9. 規程の改定
10. 問い合わせ先

**重要**: 従業員向けの文言を使用すること
- 「利用者は社内外に損害を与えないよう充分な注意を払い使用すること」
- 「万一損害が発生する可能性がある場合には速やかに会社に報告すること」
- 「本人の故意または過失により会社に重大な損害を与えた場合には懲戒処分の対象となる可能性があります」
- 「当社は～」という表現は避け、「利用者（従業員）は～」という表現を使用すること
`,
      privacy_policy: `
【社内データ取り扱い規程の構成】
社内向けなので、従業員がAIツールを使用する際のデータ保護ルールを記載します。
1. 個人情報・機密情報の定義
2. AIツールへのデータ入力時の注意事項
3. 外部サービスへのデータ送信の制限
4. 違反時の対応
`,
      ai_disclaimer: `
【社内AI利用における注意事項】
従業員向けに、AI利用時の責任と注意点を明記します。
- AI出力を盲信せず、必ず確認すること
- 重要な判断には専門家の意見を求めること
- 問題があれば直ちに報告すること
`,
      internal_risk_report: `
【社内リスクレポート】
経営層・管理職向けのリスク評価レポートを作成します。

**重要な制約事項**:
- 対応ロードマップでは、対応方法の種類と優先順位を記載すること
- 具体的な対応人員数（例: 「法務担当者2名」など）や対応コスト金額（例: 「年間500万円」など）は記載しないこと
- 訴訟リスクや違反時の損害額の提示は可能（例: 「個人情報保護法違反による最大1億円の罰金リスク」など）
`,
      user_guidelines: `
【従業員向けAI利用ガイドライン】
わかりやすい実務的なガイドラインを作成します。
- 推奨される使い方
- 避けるべき使い方
- トラブル時の対応
`,
    };
    return internalInstructions[docType] || '';
  } else {
    // 社外向けの指示
    const externalInstructions: Record<DocumentType, string> = {
      terms_of_service: `
【利用規約の構成】
1. 総則（適用範囲、用語の定義）
2. サービスの内容と利用条件
3. アカウントと認証
4. 禁止事項
5. 知的財産権
6. 免責事項と責任の制限
   - **「当社は、本サービスの利用に起因して利用者に生じた損害について、当社の故意または重過失による場合を除き、一切の責任を負いません。」という形式で記載**
7. サービスの変更・中断・終了
8. 利用料金（該当する場合）
9. 個人情報の取り扱い（プライバシーポリシーへの参照）
10. 規約の変更
11. 準拠法と管轄裁判所
12. 問い合わせ先

特にAIサービスに関連する以下の点を含めること:
- AI出力の正確性に関する免責
- AIの利用制限と禁止用途
- ユーザーコンテンツの取り扱い
`,
      privacy_policy: `
【プライバシーポリシーの構成】
1. はじめに（事業者情報）
2. 収集する個人情報の種類
3. 個人情報の収集方法
4. 利用目的
5. 第三者への提供
6. 外部サービスとの連携（AI APIへのデータ送信を含む）
7. 個人情報の管理と安全対策
8. 利用者の権利（開示、訂正、削除請求）
9. Cookie等の利用
10. 改定について
11. お問い合わせ窓口

個人情報保護法に準拠し、以下を明記:
- 個人情報取扱事業者の名称と連絡先
- 利用目的の特定
- 安全管理措置
- 第三者提供の有無と条件
`,
      ai_disclaimer: `
【AI免責事項の構成】
1. AI技術の利用について
2. AI出力の性質と限界
   - 生成AIの出力は自動生成であること
   - 出力の正確性、完全性、有用性の保証がないこと
   - ハルシネーション（誤った情報の生成）の可能性
3. 利用者の責任
   - 出力内容の検証責任
   - 判断は利用者自身が行うこと
4. 専門家への相談推奨
   - 法律、医療、金融等の専門分野における注意
5. 禁止される利用方法
6. 知的財産権に関する注意
7. データの取り扱い
8. 責任の制限
   - **「当社は責任を負いません」という形式で記載**
`,
      internal_risk_report: `
【社内リスクレポートの構成】
1. エグゼクティブサマリー
2. 対象サービス/プロジェクト概要
3. リスク評価の方法論
4. 特定されたリスク一覧
   - リスクカテゴリ
   - 深刻度
   - 発生可能性
   - 影響度
5. 各リスクの詳細分析
   - 法的根拠
   - 想定される影響（訴訟リスク金額や損害額の提示は可）
   - 推奨対策
6. 優先度別の対応ロードマップ
   - 対応方法と優先順位を記載
   - **重要**: 具体的な対応人員数や対応コスト金額は記載しないこと
   - 訴訟リスク金額や損害額の提示は可
7. モニタリング計画
8. 次回レビュー予定

**重要な制約事項**:
- 各社の事業規模により人員数やコストは異なるため、具体的な対応人員数（例: 「法務担当者2名」など）や対応コスト金額（例: 「年間500万円」など）は記載しないこと
- 対応方法の種類（例: 「法務担当者の配置」「外部弁護士への相談」など）と優先順位のみを記載すること
- 訴訟リスクや違反時の損害額の提示は可能（例: 「著作権侵害による損害賠償リスクは最大数千万円規模」など）

経営層への報告を想定した簡潔かつ網羅的な内容にすること。
`,
      user_guidelines: `
【ユーザーガイドラインの構成】
1. はじめに
   - サービスの目的
   - このガイドラインの目的
2. 推奨される利用方法
   - 効果的な使い方のヒント
   - ベストプラクティス
3. 注意事項
   - AI出力の確認方法
   - 信頼性の評価方法
4. 禁止事項と利用制限
   - してはいけないこと
   - 利用制限がある場面
5. トラブル時の対応
6. よくある質問（FAQ）
7. サポートへの問い合わせ方法

ユーザーフレンドリーで分かりやすい文章にすること。
`,
    };
    return externalInstructions[docType] || '';
  }
}

function getGoverningLawName(law: string): string {
  const lawNames: Record<string, string> = {
    japan: '日本法',
    us: '米国法',
    eu: 'EU法',
    uk: '英国法',
    singapore: 'シンガポール法',
  };
  return lawNames[law] || '日本法';
}

function cleanMarkdownContent(content: string): string {
  // 先頭と末尾の空白を削除
  let cleaned = content.trim();

  // マークダウンコードブロックを削除（```markdown ... ```）
  cleaned = cleaned.replace(/^```(?:markdown)?\s*\n?/i, '');
  cleaned = cleaned.replace(/\n?```\s*$/i, '');

  return cleaned.trim();
}

function generateFallbackDocument(
  docType: DocumentType,
  input: DocumentGeneratorInput
): GeneratedDocument {
  const isInternalUse = determineIfInternalUse(input.diagnosisInput);

  if (isInternalUse) {
    // 社内利用向けテンプレート
    const internalTemplates: Record<DocumentType, string> = {
      terms_of_service: `# AI利用規程（社内向け）

## 第1条（目的）
この規程は、${input.companyName}（以下「会社」）の従業員等が業務においてAIツールを利用する際の適切な運用を確保し、情報セキュリティ、法令遵守、および業務品質の維持を目的として定めるものです。

## 第2条（適用範囲）
本規程は、会社の従業員、契約社員、派遣社員等、会社の業務に従事するすべての者（以下「利用者」）に適用されます。

## 第3条（定義）
本規程において使用する用語の定義は、以下の通りとします。
1. 「AIツール」とは、生成AI、機械学習、自然言語処理等の人工知能技術を用いたツールおよびサービスをいいます。
2. 「機密情報」とは、会社の営業秘密、顧客情報、個人情報、開発中のプロジェクト情報等をいいます。

## 第4条（遵守事項）
利用者は、AIツールを利用する際、以下の事項を遵守しなければなりません。
1. 会社が指定または許可したAIツールのみを使用すること
2. 業務目的の範囲内でのみ利用すること
3. 情報セキュリティポリシーを遵守すること
4. AI出力の内容を必ず確認・検証すること
5. 重要な判断にはAI出力のみに依存せず、必要に応じて専門家の意見を求めること

## 第5条（禁止事項）
利用者は、以下の行為を行ってはなりません。
1. 機密情報、個人情報、営業秘密を無断でAIツールに入力すること
2. 第三者の知的財産権を侵害する行為
3. 法令または会社の規程に違反する行為
4. AIツールを利用して生成した情報を無断で社外に公開すること
5. 不正確な情報や誤解を招く情報を故意に生成・利用すること

## 第6条（利用者の責任）
1. 利用者は、AIツールの利用において、社内外に損害を与えないよう充分な注意を払い使用しなければなりません。
2. 利用者は、AIツールの利用により問題が発生する可能性がある場合、または実際に問題が発生した場合には、速やかに上司および情報システム部門に報告しなければなりません。
3. 利用者は、AI出力の正確性、適法性、妥当性について自ら確認・検証する責任を負います。

## 第7条（懲戒処分）
利用者が本規程に違反し、故意または過失により会社に重大な損害を与えた場合、または損害を与える恐れのある行為を行った場合には、就業規則に基づき懲戒処分の対象となることがあります。

## 第8条（教育・研修）
会社は、利用者に対して、AIツールの適切な利用方法、リスク、本規程の内容等に関する教育・研修を実施します。

## 第9条（規程の改定）
本規程は、法令の改正、技術の進展、社会情勢の変化等に応じて、適宜見直し・改定を行います。

## 第10条（お問い合わせ）
本規程に関するお問い合わせは、以下までお願いいたします。
${input.companyName}
メールアドレス: ${input.contactEmail}

制定日: ${new Date().toLocaleDateString('ja-JP')}
`,
      privacy_policy: `# 個人情報・機密情報の取り扱いに関する規程（社内向け）

${input.companyName}の従業員等がAIツールを利用する際の、個人情報および機密情報の取り扱いについて定めます。

## 1. 適用範囲
本規程は、会社の従業員等がAIツールに情報を入力する際に適用されます。

## 2. 禁止事項
以下の情報をAIツールに入力してはなりません。
- 顧客の個人情報（氏名、住所、電話番号、メールアドレス等）
- 社内の機密情報、営業秘密
- 開発中のプロジェクト情報
- 契約書や秘密保持契約の対象となる情報
- 未公開の財務情報

## 3. 許可される情報
以下の情報は、業務上必要な範囲で入力が許可されます。
- 公開情報
- 匿名化・仮名化された情報
- 一般的な知識や技術に関する質問

## 4. 違反時の対応
本規程に違反した場合、懲戒処分の対象となるほか、情報漏洩による損害について賠償責任を負う場合があります。

## 5. お問い合わせ
${input.companyName}
メールアドレス: ${input.contactEmail}

制定日: ${new Date().toLocaleDateString('ja-JP')}
`,
      ai_disclaimer: `# AI利用における注意事項（社内向け）

## 1. AI出力の性質
AIツールの出力は自動生成されたものであり、必ずしも正確ではありません。

## 2. 利用者の責任
- AI出力を盲信せず、必ず内容を確認・検証してください
- 重要な判断や意思決定には、AI出力のみに依存しないでください
- 法律、財務、医療等の専門的事項については、専門家に相談してください

## 3. 問題発生時の対応
AIツールの利用により問題が発生した場合、または発生する可能性がある場合は、速やかに上司および関係部門に報告してください。

## 4. リスク
- ハルシネーション（誤った情報の生成）
- 著作権侵害のリスク
- 情報漏洩のリスク

制定日: ${new Date().toLocaleDateString('ja-JP')}
`,
      internal_risk_report: `# 法的リスク評価レポート（社内向け）

## エグゼクティブサマリー
本レポートは、当社のAI利用に関する法的リスクの評価と対策を取りまとめたものです。

## 1. 評価対象
- 提供元: ${input.companyName}
- 評価日: ${new Date().toLocaleDateString('ja-JP')}

## 2. 主なリスク
- 情報漏洩リスク
- 著作権侵害リスク
- 個人情報保護法違反リスク
- AI出力の誤用によるリスク

## 3. 推奨対策
1. 社内規程の整備と周知徹底
2. 従業員教育の実施
3. 利用ログの監視体制構築
4. 定期的なリスク評価の実施

制定日: ${new Date().toLocaleDateString('ja-JP')}
`,
      user_guidelines: `# AI利用ガイドライン（従業員向け）

## はじめに
このガイドラインは、従業員がAIツールを安全かつ効果的に利用するための実務的な指針です。

## 推奨される使い方
- 業務効率化のための補助ツールとして活用
- アイデアの壁打ち相手として利用
- 文書の下書き作成に利用（ただし必ず確認・修正すること）

## 避けるべき使い方
- 機密情報の入力
- 最終成果物としてそのまま使用
- 専門的判断の代替として使用

## トラブル時の対応
問題が発生した場合は、直ちに上司に報告し、指示を仰いでください。

## お問い合わせ
${input.companyName}
メールアドレス: ${input.contactEmail}

制定日: ${new Date().toLocaleDateString('ja-JP')}
`,
    };

    return {
      type: docType,
      title: DOCUMENT_TYPE_LABELS[docType],
      content: internalTemplates[docType] || '（テンプレートがありません）',
      generatedAt: new Date().toISOString(),
    };
  } else {
    // 社外向けテンプレート
    const externalTemplates: Record<DocumentType, string> = {
      terms_of_service: `# 利用規約

## 第1条（適用）
この利用規約（以下「本規約」）は、${input.companyName}（以下「当社」）が提供するサービス（以下「本サービス」）の利用条件を定めるものです。

## 第2条（定義）
本規約において使用する用語の定義は、以下の通りとします。
1. 「利用者」とは、本規約に同意の上、本サービスを利用する者をいいます。
2. 「AI機能」とは、本サービスにおいて人工知能技術を用いて提供される機能をいいます。

## 第3条（AI機能に関する注意事項）
1. 本サービスのAI機能による出力は、自動生成されたものであり、その正確性、完全性、有用性について当社は保証しません。
2. 利用者は、AI機能の出力を参考情報として利用し、最終的な判断は自己の責任において行うものとします。
3. AI機能の出力を法律、医療、金融等の専門的判断の代替として使用することは推奨されません。

## 第4条（禁止事項）
利用者は、以下の行為を行ってはなりません。
1. 法令または公序良俗に違反する行為
2. 犯罪行為に関連する行為
3. 当社または第三者の知的財産権を侵害する行為
4. 本サービスの運営を妨害する行為
5. 虚偽の情報を入力する行為

## 第5条（免責事項）
1. 当社は、本サービスの内容について、その正確性、完全性、有用性等について何ら保証するものではありません。
2. 当社は、本サービスの利用に起因して利用者に生じた損害について、当社の故意または重過失による場合を除き、一切の責任を負いません。

## 第6条（準拠法・管轄裁判所）
本規約の解釈にあたっては、${getGoverningLawName(input.governingLaw)}を準拠法とします。

## 第7条（お問い合わせ）
本規約に関するお問い合わせは、以下までお願いいたします。
${input.companyName}
メールアドレス: ${input.contactEmail}
${input.serviceUrl ? `URL: ${input.serviceUrl}` : ''}

制定日: ${new Date().toLocaleDateString('ja-JP')}
`,
      privacy_policy: `# プライバシーポリシー

${input.companyName}（以下「当社」）は、本サービスにおける利用者の個人情報の取り扱いについて、以下のとおりプライバシーポリシーを定めます。

## 1. 収集する個人情報
当社は、以下の個人情報を収集する場合があります。
- メールアドレス
- 利用履歴
- 入力されたテキストデータ
- その他サービス利用に関する情報

## 2. 利用目的
収集した個人情報は、以下の目的で利用します。
1. 本サービスの提供・運営
2. 利用者からのお問い合わせへの対応
3. サービスの改善・新機能の開発
4. 利用規約違反への対応

## 3. 第三者への提供
当社は、以下の場合を除き、個人情報を第三者に提供しません。
1. 利用者の同意がある場合
2. 法令に基づく場合
3. AI機能提供のため外部APIサービスへ送信する場合（匿名化された形式で送信）

## 4. AI機能とデータの取り扱い
本サービスのAI機能では、利用者の入力データを外部のAIサービスプロバイダーに送信する場合があります。送信されるデータは、サービス提供に必要な範囲に限定されます。

## 5. 安全管理措置
当社は、個人情報の漏洩、滅失、毀損の防止のため、適切な安全管理措置を講じます。

## 6. 開示・訂正・削除の請求
利用者は、当社が保有する自己の個人情報について、開示、訂正、削除を請求することができます。

## 7. お問い合わせ
個人情報の取り扱いに関するお問い合わせは、以下までお願いいたします。
${input.companyName}
メールアドレス: ${input.contactEmail}

制定日: ${new Date().toLocaleDateString('ja-JP')}
`,
      ai_disclaimer: `# AI機能に関する免責事項

## 1. AI技術の利用について
本サービスでは、人工知能（AI）技術を活用した機能を提供しています。利用者は、本免責事項に同意の上、AI機能をご利用ください。

## 2. AI出力の性質と限界

### 2.1 自動生成
AI機能による出力は、機械学習モデルによって自動的に生成されたものです。

### 2.2 正確性の非保証
AI出力の正確性、完全性、最新性、有用性について、当社は一切の保証をいたしません。

### 2.3 ハルシネーション
AIは、事実に基づかない情報（ハルシネーション）を生成する可能性があります。

## 3. 利用者の責任
- AI出力は参考情報としてのみ利用してください
- 出力内容の正確性は、必ず利用者自身で検証してください
- 重要な判断にはAI出力のみに依存しないでください

## 4. 専門家への相談
法律、医療、金融、税務等の専門的な事項については、AI出力を利用する前に、必ず各分野の専門家にご相談ください。

## 5. 責任の制限
当社は、AI機能の利用により生じたいかなる損害についても、当社の故意または重過失による場合を除き、一切の責任を負いません。

${input.companyName}
連絡先: ${input.contactEmail}
制定日: ${new Date().toLocaleDateString('ja-JP')}
`,
      internal_risk_report: `# 法的リスク評価レポート

## エグゼクティブサマリー
${input.diagnosisResult?.executiveSummary || '本レポートは、当社AIサービスに関する法的リスクの評価と対策を取りまとめたものです。'}

## 1. 対象サービス概要
- 提供元: ${input.companyName}
- 評価日: ${new Date().toLocaleDateString('ja-JP')}

## 2. リスク評価結果
${
  input.diagnosisResult
    ? input.diagnosisResult.risks
        .map(
          (r) => `
### ${r.category}
- **リスクレベル**: ${r.level === 'high' ? '高' : r.level === 'medium' ? '中' : '低'}
- **概要**: ${r.summary}
- **詳細**: ${r.details}
- **法的根拠**: ${r.legalBasis.join(', ')}
- **推奨対策**:
${r.recommendations.map((rec) => `  - ${rec}`).join('\n')}
`
        )
        .join('\n')
    : '（診断結果がありません）'
}

## 3. 優先対応事項
${
  input.diagnosisResult
    ? input.diagnosisResult.priorityActions.map((a, i) => `${i + 1}. ${a}`).join('\n')
    : '（診断結果がありません）'
}

## 4. 推奨アクション
1. 法務部門との協議
2. 外部専門家へのレビュー依頼
3. 継続的なモニタリング体制の構築

## 5. 次回レビュー
定期的なリスク評価の実施を推奨します。

---
本レポートは情報提供を目的としており、法的アドバイスではありません。
`,
      user_guidelines: `# ユーザーガイドライン

## はじめに
このガイドラインは、${input.companyName}が提供するAIサービスを安全かつ効果的にご利用いただくための指針です。

## 推奨される利用方法

### 効果的な使い方
1. 明確で具体的な質問や指示を入力してください
2. 必要に応じて背景情報を追加してください
3. 出力結果は参考情報として活用してください

### ベストプラクティス
- 複雑な質問は段階的に分けて入力する
- 出力結果を必ず確認・検証する
- 専門的な判断が必要な場合は専門家に相談する

## 注意事項

### AI出力について
- AI出力は100%正確ではありません
- 重要な判断の前には、必ず情報の確認を行ってください
- 専門的な事項（法律、医療等）については専門家に相談してください

### プライバシー保護
- 個人情報や機密情報の入力は避けてください
- 必要最小限の情報のみを入力してください

## 禁止事項
以下の目的での利用は禁止されています：
- 違法行為に関する情報の取得
- 他者を害する目的での利用
- サービスへの攻撃や不正アクセス

## サポート
ご不明点やお問い合わせは、以下までご連絡ください。
メールアドレス: ${input.contactEmail}
${input.serviceUrl ? `サービスURL: ${input.serviceUrl}` : ''}

${input.companyName}
`,
    };

    return {
      type: docType,
      title: DOCUMENT_TYPE_LABELS[docType],
      content: externalTemplates[docType],
      generatedAt: new Date().toISOString(),
    };
  }
}
