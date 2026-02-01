import { NextRequest, NextResponse } from 'next/server';
import { getAnthropicClient } from '@/lib/anthropic/client';
import {
  DocumentGeneratorInput,
  GeneratedDocument,
  DocumentType,
  DOCUMENT_TYPE_LABELS,
} from '@/types/document';

export async function POST(request: NextRequest) {
  try {
    let input: DocumentGeneratorInput;

    try {
      input = await request.json();
    } catch (parseError) {
      console.error('Request JSON parse error:', parseError);
      return NextResponse.json(
        { error: 'リクエストの形式が不正です' },
        { status: 400 }
      );
    }

    if (!input.documentTypes || input.documentTypes.length === 0) {
      return NextResponse.json(
        { error: '文書タイプを選択してください' },
        { status: 400 }
      );
    }

    if (!input.companyName) {
      return NextResponse.json(
        { error: '会社名は必須です' },
        { status: 400 }
      );
    }

    console.log('Generating documents for:', input.companyName);
    console.log('Document types:', input.documentTypes);

    // 各文書タイプに対して生成を実行
    const documents: GeneratedDocument[] = [];

    for (const docType of input.documentTypes) {
      try {
        const doc = await generateDocument(docType, input);
        documents.push(doc);
      } catch (docError) {
        console.error(`Error generating ${docType}:`, docError);
        // フォールバック文書を追加
        const fallbackDoc = generateFallbackDocument(docType, input);
        documents.push(fallbackDoc);
      }
    }

    return NextResponse.json(documents);
  } catch (error) {
    console.error('Document generation error:', error);
    const errorMessage = error instanceof Error ? error.message : '文書生成に失敗しました';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
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
  const baseContext = `
会社名: ${input.companyName}
サービスURL: ${input.serviceUrl || '未設定'}
連絡先: ${input.contactEmail}
準拠法: ${getGoverningLawName(input.governingLaw)}
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

  const additionalContext = input.additionalClauses
    ? `\n【追加で含めたい条項】\n${input.additionalClauses}`
    : '';

  const typeSpecificInstructions = getDocumentTypeInstructions(docType);

  return `あなたは日本の法務専門家です。以下の情報に基づいて、${DOCUMENT_TYPE_LABELS[docType]}を作成してください。

${baseContext}
${diagnosisContext}
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

文書を生成してください:`;
}

function getDocumentTypeInstructions(docType: DocumentType): string {
  const instructions: Record<DocumentType, string> = {
    terms_of_service: `
【利用規約の構成】
1. 総則（適用範囲、用語の定義）
2. サービスの内容と利用条件
3. アカウントと認証
4. 禁止事項
5. 知的財産権
6. 免責事項と責任の制限
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
   - 想定される影響
   - 推奨対策
6. 優先度別の対応ロードマップ
7. 必要なリソースと体制
8. モニタリング計画
9. 次回レビュー予定

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

  return instructions[docType];
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
  const templates: Record<DocumentType, string> = {
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
2. 当社は、本サービスの利用により生じた損害について、当社の故意または重過失による場合を除き、責任を負いません。

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
当社は、AI機能の利用により生じたいかなる損害についても、法令で許容される最大限の範囲で責任を負いません。

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
    content: templates[docType],
    generatedAt: new Date().toISOString(),
  };
}
