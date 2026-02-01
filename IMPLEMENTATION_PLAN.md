# AIアプリ法的リスク診断 & 文書生成機能 実装計画

## 概要

既存のGraphRAG Chatbotに以下2つの機能を追加：
1. **AIアプリ法的リスク診断ウィザード** - 5ステップ形式でリスク分析レポート生成
2. **利用規約・免責事項ジェネレーター** - 診断結果に基づく法的文書自動生成

---

## 実装チェックリスト

### Phase 1: 型定義とユーティリティ
- [ ] `types/diagnosis.ts` - 診断関連の型定義
- [ ] `types/document.ts` - 文書生成関連の型定義

### Phase 2: UIコンポーネント（共通）
- [ ] `components/ui/Modal.tsx` - モーダルコンポーネント
- [ ] `components/ui/Checkbox.tsx` - チェックボックス
- [ ] `components/ui/RadioGroup.tsx` - ラジオボタングループ

### Phase 3: 診断ウィザード
- [ ] `components/diagnosis/WizardProgress.tsx` - 進捗バー
- [ ] `components/diagnosis/steps/StepBasicInfo.tsx` - ステップ1: 基本情報
- [ ] `components/diagnosis/steps/StepAIUsage.tsx` - ステップ2: AI利用形態
- [ ] `components/diagnosis/steps/StepDataHandling.tsx` - ステップ3: データ取扱
- [ ] `components/diagnosis/steps/StepTargetUsers.tsx` - ステップ4: 想定ユーザー
- [ ] `components/diagnosis/steps/StepConcerns.tsx` - ステップ5: 懸念事項
- [ ] `components/diagnosis/DiagnosisWizard.tsx` - ウィザードメイン
- [ ] `components/diagnosis/DiagnosisResult.tsx` - 結果表示

### Phase 4: 診断API
- [ ] `app/api/diagnosis/analyze/route.ts` - 診断APIエンドポイント

### Phase 5: 文書生成機能
- [ ] `components/generator/DocumentTypeSelector.tsx` - 文書タイプ選択
- [ ] `components/generator/DocumentPreview.tsx` - プレビュー・ダウンロード
- [ ] `components/generator/DocumentGenerator.tsx` - 文書生成メイン
- [ ] `app/api/generator/generate/route.ts` - 文書生成API

### Phase 6: 統合
- [ ] `components/ChatInterface.tsx` - 診断・生成ボタン追加、モーダル表示

---

## Phase 1: 型定義

### 1.1 types/diagnosis.ts

```typescript
// 診断入力データ
export interface DiagnosisInput {
  appName?: string;
  appDescription: string;
  aiTechnologies: string[];
  aiProviders: string[];
  inputDataTypes: string[];
  dataTransmission: 'external_api' | 'local' | 'both';
  dataStorage: string[];
  targetUsers: string[];
  pricingModel: string;
  useCases: string[];
  concernedRisks: string[];
  additionalNotes?: string;
}

// リスク項目
export interface RiskItem {
  category: string;
  level: 'high' | 'medium' | 'low';
  summary: string;
  details: string;
  legalBasis: string[];
  recommendations: string[];
  graphRagSources: string[];
}

// 診断結果
export interface DiagnosisResult {
  overallRiskLevel: 'high' | 'medium' | 'low';
  executiveSummary: string;
  risks: RiskItem[];
  priorityActions: string[];
  relatedCases: string[];
  disclaimer: string;
  diagnosedAt: string;
  appName?: string;
}

// ウィザードステップの型
export interface WizardStepProps {
  data: Partial<DiagnosisInput>;
  onChange: (data: Partial<DiagnosisInput>) => void;
  onNext: () => void;
  onBack: () => void;
}
```

### 1.2 types/document.ts

```typescript
import { DiagnosisResult, DiagnosisInput } from './diagnosis';

export type DocumentType =
  | 'terms_of_service'
  | 'privacy_policy'
  | 'ai_disclaimer'
  | 'internal_risk_report'
  | 'user_guidelines';

export interface DocumentTypeInfo {
  type: DocumentType;
  label: string;
  description: string;
}

export const DOCUMENT_TYPES: DocumentTypeInfo[] = [
  {
    type: 'terms_of_service',
    label: '利用規約（Terms of Service）',
    description: 'AIサービス特有の条項を含む利用規約'
  },
  {
    type: 'privacy_policy',
    label: 'プライバシーポリシー',
    description: 'AI利用に関するデータ取り扱いを明記'
  },
  {
    type: 'ai_disclaimer',
    label: 'AI利用に関する免責事項・注意事項',
    description: 'ハルシネーション、精度に関する免責'
  },
  {
    type: 'internal_risk_report',
    label: '社内稟議用リスク説明資料',
    description: '経営層・法務向けのリスク説明文書'
  },
  {
    type: 'user_guidelines',
    label: 'ユーザー向けAI利用ガイドライン',
    description: '適切な利用方法の案内文'
  }
];

export interface DocumentGeneratorInput {
  documentTypes: DocumentType[];
  companyName: string;
  serviceUrl?: string;
  contactEmail: string;
  governingLaw: string;
  additionalClauses?: string;
  diagnosisResult?: DiagnosisResult;
  diagnosisInput?: DiagnosisInput;
}

export interface GeneratedDocument {
  type: DocumentType;
  title: string;
  content: string;
  generatedAt: string;
}
```

---

## Phase 2: UIコンポーネント（共通）

### 2.1 components/ui/Modal.tsx

```typescript
'use client';

import { useEffect, useCallback } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export default function Modal({ isOpen, onClose, title, children, size = 'lg' }: ModalProps) {
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-6xl'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className={`relative bg-white rounded-lg shadow-xl ${sizeClasses[size]} w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col`}>
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </div>
  );
}
```

### 2.2 components/ui/Checkbox.tsx

```typescript
'use client';

interface CheckboxProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
}

export default function Checkbox({ id, label, checked, onChange, description }: CheckboxProps) {
  return (
    <label htmlFor={id} className="flex items-start gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
      />
      <div>
        <span className="text-sm font-medium text-gray-900">{label}</span>
        {description && (
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        )}
      </div>
    </label>
  );
}
```

### 2.3 components/ui/RadioGroup.tsx

```typescript
'use client';

interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
}

export default function RadioGroup({ name, options, value, onChange }: RadioGroupProps) {
  return (
    <div className="space-y-2">
      {options.map((option) => (
        <label
          key={option.value}
          className="flex items-start gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded"
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={(e) => onChange(e.target.value)}
            className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
          />
          <div>
            <span className="text-sm font-medium text-gray-900">{option.label}</span>
            {option.description && (
              <p className="text-xs text-gray-500 mt-0.5">{option.description}</p>
            )}
          </div>
        </label>
      ))}
    </div>
  );
}
```

---

## Phase 3: 診断ウィザード

### 3.1 ウィザードステップの選択肢定義

```typescript
// components/diagnosis/constants.ts

export const AI_TECHNOLOGIES = [
  { value: 'text_generation', label: 'テキスト生成（ChatGPT、Claude等）' },
  { value: 'image_generation', label: '画像生成（DALL-E、Midjourney、Stable Diffusion等）' },
  { value: 'voice', label: '音声認識/合成' },
  { value: 'video', label: '動画生成/編集' },
  { value: 'code', label: 'コード生成' },
  { value: 'data_analysis', label: 'データ分析/予測' },
  { value: 'chatbot', label: 'チャットボット/対話AI' },
];

export const AI_PROVIDERS = [
  { value: 'openai', label: 'OpenAI (GPT-4, DALL-E等)' },
  { value: 'anthropic', label: 'Anthropic (Claude)' },
  { value: 'google', label: 'Google (Gemini)' },
  { value: 'microsoft', label: 'Microsoft (Azure OpenAI)' },
  { value: 'meta', label: 'Meta (Llama)' },
  { value: 'stability', label: 'Stability AI' },
  { value: 'self_developed', label: '自社開発/ファインチューニング' },
  { value: 'opensource', label: 'オープンソースモデル' },
];

export const INPUT_DATA_TYPES = [
  { value: 'user_text', label: 'ユーザーが入力するテキスト' },
  { value: 'user_files', label: 'ユーザーがアップロードする画像/ファイル' },
  { value: 'personal_info', label: 'ユーザーの個人情報（氏名、メール等）' },
  { value: 'public_web', label: '公開されているWebデータ' },
  { value: 'company_data', label: '自社が保有するデータ' },
  { value: 'third_party', label: '第三者から提供されるデータ' },
];

export const DATA_STORAGE_OPTIONS = [
  { value: 'store_input', label: 'ユーザーの入力データを保存する' },
  { value: 'store_output', label: 'AIの出力結果を保存する' },
  { value: 'use_for_training', label: '学習・改善のためにデータを利用する' },
  { value: 'no_storage', label: 'データは保存しない' },
];

export const TARGET_USERS = [
  { value: 'btoc', label: '一般消費者（BtoC）' },
  { value: 'btob', label: '企業/ビジネスユーザー（BtoB）' },
  { value: 'internal', label: '社内利用のみ' },
  { value: 'education', label: '教育機関/学生' },
  { value: 'medical', label: '医療関係者' },
  { value: 'legal', label: '法律関係者' },
  { value: 'minors', label: '未成年を含む可能性がある' },
];

export const PRICING_MODELS = [
  { value: 'free', label: '無料' },
  { value: 'subscription', label: '有料（サブスクリプション）' },
  { value: 'pay_per_use', label: '有料（従量課金）' },
  { value: 'freemium', label: 'フリーミアム' },
  { value: 'undecided', label: '未定' },
];

export const USE_CASES = [
  { value: 'research', label: '情報収集/調査' },
  { value: 'content_creation', label: 'コンテンツ作成' },
  { value: 'business_efficiency', label: '業務効率化' },
  { value: 'customer_support', label: '顧客対応/サポート' },
  { value: 'decision_support', label: '意思決定支援' },
  { value: 'entertainment', label: 'エンターテイメント' },
  { value: 'education', label: '教育/学習' },
];

export const CONCERNED_RISKS = [
  { value: 'copyright', label: '著作権侵害' },
  { value: 'privacy', label: '個人情報/プライバシー' },
  { value: 'ai_output_rights', label: 'AI生成コンテンツの権利' },
  { value: 'hallucination', label: 'ハルシネーション（虚偽情報）' },
  { value: 'bias', label: '差別・偏見のある出力' },
  { value: 'tos_violation', label: '利用規約違反' },
  { value: 'reputation', label: '炎上リスク' },
  { value: 'competition', label: '競合との差別化' },
];
```

---

## Phase 4: 診断API プロンプト設計

### 診断実行プロンプト

```typescript
const buildDiagnosisPrompt = (input: DiagnosisInput, graphRagContext: string) => `
あなたはAI利用に関する法的リスク分析の専門家です。
以下のAIアプリ/サービスについて、法的リスクを分析してください。

【アプリ情報】
${JSON.stringify(input, null, 2)}

【GraphRAGから取得した関連情報】
${graphRagContext}

以下の観点から分析を行い、JSON形式で出力してください：

1. 著作権リスク
   - AI学習データの著作権
   - AI生成物の著作権
   - ユーザー入力の著作権

2. 個人情報保護リスク
   - 個人情報保護法との適合性
   - GDPR等海外規制への対応
   - プライバシーポリシーの要件

3. AI事業者ガイドライン適合性
   - 経産省AI事業者ガイドライン
   - 総務省AIネットワーク社会推進会議指針

4. AIサービス利用規約リスク
   - 使用するAIサービスの利用規約違反リスク
   - 出力の商用利用可否

5. 消費者保護リスク
   - 景品表示法
   - 消費者契約法

6. その他のリスク
   - 名誉毀損・信用毀損
   - 差別・偏見
   - 業界固有の規制

【出力形式】
以下のJSON形式で出力してください：
{
  "overallRiskLevel": "high" | "medium" | "low",
  "executiveSummary": "全体サマリー（2-3文）",
  "risks": [
    {
      "category": "リスクカテゴリ名",
      "level": "high" | "medium" | "low",
      "summary": "リスク概要",
      "details": "詳細説明",
      "legalBasis": ["関連法規1", "関連法規2"],
      "recommendations": ["推奨対策1", "推奨対策2"]
    }
  ],
  "priorityActions": ["優先対応事項1", "優先対応事項2", "優先対応事項3"],
  "disclaimer": "免責事項"
}

JSONのみを出力してください。説明文は不要です。
`;
```

---

## Phase 5: 文書生成 プロンプト設計

### 利用規約生成プロンプト

```typescript
const buildTermsOfServicePrompt = (input: DocumentGeneratorInput) => `
あなたは日本のIT法務に精通した法務専門家です。
以下の情報に基づいて、AIサービスの利用規約を生成してください。

【サービス情報】
会社名/サービス提供者: ${input.companyName}
サービスURL: ${input.serviceUrl || '（未設定）'}
問い合わせ先: ${input.contactEmail}
準拠法: ${input.governingLaw}

【リスク診断結果】
${input.diagnosisResult ? JSON.stringify(input.diagnosisResult, null, 2) : '診断未実施'}

【生成要件】
1. 日本法に準拠した内容であること
2. AIサービス特有のリスクに対応した条項を含めること
3. 一般的な利用者にも理解しやすい平易な日本語を使用すること

【必須条項】
- 第1条（目的）
- 第2条（定義）
- 第3条（利用登録）
- 第4条（アカウント管理）
- 第5条（サービス内容）
- 第6条（AI機能の利用について）★AI特有
- 第7条（禁止事項）
- 第8条（知的財産権）★AI特有
- 第9条（データの取り扱い）★AI特有
- 第10条（免責事項）★AI特有
- 第11条（損害賠償）
- 第12条（利用規約の変更）
- 第13条（準拠法・管轄裁判所）

Markdown形式で出力してください。
`;
```

---

## スタイリング方針

既存パターンを踏襲:
- コンテナ: `max-w-4xl mx-auto p-4`
- カード: `bg-white rounded-lg shadow p-4`
- ボタン(Primary): `bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-2`
- ボタン(Secondary): `bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg px-4 py-2`
- リスクレベル色:
  - 高: `bg-red-100 text-red-800 border-red-500`
  - 中: `bg-yellow-100 text-yellow-800 border-yellow-500`
  - 低: `bg-green-100 text-green-800 border-green-500`

---

## 検証方法

### ローカルテスト
```bash
npm run dev
# http://localhost:3000 でアクセス
```

### テストシナリオ

1. **診断ウィザード**
   - 「🔍 リスク診断を開始」クリック → モーダル表示
   - 5ステップ入力 → 「診断を実行」クリック
   - 診断結果が表示される
   - リスクレベルが色分けされている

2. **文書生成**
   - 診断結果から「📄 利用規約を生成」クリック
   - 文書タイプを選択 → 追加情報入力
   - Markdown形式で文書プレビュー表示
   - ダウンロードボタン動作確認

3. **チャット連携**
   - 診断結果から「💬 チャットで詳細を相談」クリック
   - チャット画面に診断サマリーがプリセットされる

### Vercelデプロイ確認
```bash
git push origin main
# Vercel自動デプロイ後、本番URLで動作確認
```

---

## 注意事項

- 既存のチャット機能は一切変更しない
- GraphRAG連携は既存の `/api/graph-search` を再利用
- Claude API呼び出しは既存パターン (`getAnthropicClient()`) を使用
- エラー時はフォールバックメッセージを表示
- レート制限は既存の仕組みを活用
