// UI_UX_REDESIGN_VIBE.md に基づく型定義

export type AppStep = 1 | 2 | 3;

export interface UserContext {
  // 基本情報
  isInternalUse: boolean;  // 社内利用（社外には公開しない）
  isCorporate: boolean;
  hasRegistration: boolean;
  hasExternalAPI: boolean;

  // AI生成コンテンツの種類
  contentTypes: {
    text: boolean;
    image: boolean;
    video: boolean;
    audio: boolean;
  };

  // AI生成コンテンツの利用目的
  usagePurposes: {
    internalTraining: boolean;      // 社内利用（研修・教育）
    internalOperations: boolean;    // 社内利用（業務効率化）
    companyIntroduction: boolean;   // 会社案内・サービス紹介
    recruitment: boolean;           // 採用・リクルート
    marketing: boolean;             // マーケティング・広告
    customerService: boolean;       // 顧客向けサービス提供
    productIntegration: boolean;    // 商品・製品への組込み
  };

  // その他
  hasPDFUploaded: boolean;
}

export interface RiskAnalysisState {
  completed: boolean;
  result: import('@/types/diagnosis').DiagnosisResult | null;
}

export interface GeneratedTermsState {
  type: 'general' | 'risk-reflected';
  content: string | null;
}

export interface AppState {
  currentStep: AppStep;
  userContext: UserContext;
  riskAnalysis: RiskAnalysisState;
  generatedTerms: GeneratedTermsState;
}

// 初期状態
export const initialUserContext: UserContext = {
  isInternalUse: false,
  isCorporate: false,
  hasRegistration: false,
  hasExternalAPI: false,
  contentTypes: {
    text: false,
    image: false,
    video: false,
    audio: false,
  },
  usagePurposes: {
    internalTraining: false,
    internalOperations: false,
    companyIntroduction: false,
    recruitment: false,
    marketing: false,
    customerService: false,
    productIntegration: false,
  },
  hasPDFUploaded: false,
};

// STEP①→② への遷移条件
export const canProceedToStep2 = (ctx: UserContext): boolean => {
  const hasBasicInfo = ctx.isInternalUse || ctx.isCorporate ||
                       ctx.hasRegistration || ctx.hasExternalAPI;
  const hasContentType = Object.values(ctx.contentTypes).some(v => v);
  const hasUsagePurpose = Object.values(ctx.usagePurposes).some(v => v);

  // 基本情報 または コンテンツ種類 または 利用目的 のいずれかが選択されている
  return hasBasicInfo || hasContentType || hasUsagePurpose;
};

// ユーザーコンテキストを診断入力形式に変換（既存のDiagnosisInput型に合わせる）
export const userContextToDiagnosisInput = (ctx: UserContext): import('@/types/diagnosis').DiagnosisInput => {
  // AI技術タイプを変換
  const aiTechnologies: string[] = [];
  if (ctx.contentTypes.text) aiTechnologies.push('llm');
  if (ctx.contentTypes.image) aiTechnologies.push('image_generation');
  if (ctx.contentTypes.video) aiTechnologies.push('video_generation');
  if (ctx.contentTypes.audio) aiTechnologies.push('audio_generation');
  if (aiTechnologies.length === 0) aiTechnologies.push('llm');

  // AIプロバイダー
  const aiProviders: string[] = [];
  if (ctx.hasExternalAPI) {
    aiProviders.push('OpenAI', 'その他外部API');
  } else {
    aiProviders.push('self_hosted');
  }

  // 入力データタイプ
  const inputDataTypes: string[] = ['text'];
  if (ctx.hasRegistration) {
    inputDataTypes.push('personal_info');
  }

  // ターゲットユーザー
  const targetUsers: string[] = [];
  if (ctx.usagePurposes.customerService || ctx.usagePurposes.productIntegration || ctx.usagePurposes.marketing) {
    targetUsers.push('general_public');
  }
  if (ctx.isCorporate) {
    targetUsers.push('business');
  }
  if (ctx.usagePurposes.internalTraining || ctx.usagePurposes.internalOperations) {
    targetUsers.push('internal');
  }
  if (targetUsers.length === 0) targetUsers.push('general_public');

  // 用途
  const useCases: string[] = [];
  if (ctx.usagePurposes.internalTraining) useCases.push('社内研修・教育');
  if (ctx.usagePurposes.internalOperations) useCases.push('業務効率化');
  if (ctx.usagePurposes.companyIntroduction) useCases.push('会社案内・サービス紹介');
  if (ctx.usagePurposes.recruitment) useCases.push('採用活動');
  if (ctx.usagePurposes.marketing) useCases.push('マーケティング・広告');
  if (ctx.usagePurposes.customerService) useCases.push('顧客向けサービス');
  if (ctx.usagePurposes.productIntegration) useCases.push('製品組込み');
  if (useCases.length === 0) useCases.push('一般的なAI利用');

  // 懸念リスク
  const concernedRisks: string[] = [];
  if (ctx.contentTypes.image || ctx.contentTypes.video) {
    concernedRisks.push('著作権侵害');
  }
  if (ctx.hasRegistration) {
    concernedRisks.push('個人情報保護');
  }
  if (ctx.usagePurposes.marketing) {
    concernedRisks.push('景品表示法');
  }
  if (ctx.usagePurposes.customerService || ctx.usagePurposes.productIntegration) {
    concernedRisks.push('利用規約・免責');
  }

  // コンテンツタイプ文字列
  const contentTypesStr: string[] = [];
  if (ctx.contentTypes.text) contentTypesStr.push('テキスト');
  if (ctx.contentTypes.image) contentTypesStr.push('画像');
  if (ctx.contentTypes.video) contentTypesStr.push('動画');
  if (ctx.contentTypes.audio) contentTypesStr.push('音声');

  // サービスタイプ文字列
  const serviceTypesStr: string[] = [];
  if (ctx.isInternalUse) serviceTypesStr.push('社内利用');
  if (ctx.isCorporate) serviceTypesStr.push('法人サービス');
  if (ctx.hasRegistration) serviceTypesStr.push('会員登録あり');

  // アプリ説明文を構築
  const appDescription = `
${serviceTypesStr.length > 0 ? `サービス形態: ${serviceTypesStr.join('、')}` : ''}
${contentTypesStr.length > 0 ? `AI生成コンテンツ: ${contentTypesStr.join('、')}` : 'AI生成コンテンツ: テキスト'}
利用目的: ${useCases.join('、')}
${ctx.hasExternalAPI ? '外部API（OpenAI等）を利用' : ''}
${ctx.hasRegistration ? 'ユーザー登録機能あり' : ''}
`.trim();

  return {
    appName: 'AI利用サービス',
    appDescription,
    aiTechnologies,
    aiProviders,
    inputDataTypes,
    dataTransmission: ctx.hasExternalAPI ? 'external_api' : 'local',
    dataStorage: ctx.hasRegistration ? ['ユーザー入力データ', 'アカウント情報'] : ['一時的な処理のみ'],
    targetUsers,
    pricingModel: 'unknown',
    useCases,
    concernedRisks,
    additionalNotes: ctx.hasPDFUploaded ? 'PDFによる追加情報あり' : undefined,
  };
};

// 利用目的別リスク分析ヒント
export const riskHintsByPurpose = {
  internalTraining: [
    '著作権法における「私的使用」の範囲',
    '社内利用での引用要件',
    '研修資料の二次利用制限'
  ],
  internalOperations: [
    '議事録・業務文書の正確性担保',
    '機密情報の取り扱い',
    'AI生成物の社内承認フロー'
  ],
  companyIntroduction: [
    '景品表示法（優良誤認・有利誤認）',
    '商標権・意匠権の侵害リスク',
    '企業イメージと生成物の品質管理'
  ],
  recruitment: [
    '職業安定法・労働基準法との整合性',
    '採用活動における表現の適正性',
    '応募者への説明義務'
  ],
  marketing: [
    '景品表示法',
    '著作権・肖像権',
    '広告規制（業界別ガイドライン）'
  ],
  customerService: [
    '利用規約での免責事項',
    '消費者契約法',
    'AI生成物の品質保証'
  ],
  productIntegration: [
    '製造物責任法（PL法）',
    '特許権・著作権のライセンス',
    '製品への組込みに関する表示義務'
  ]
};
