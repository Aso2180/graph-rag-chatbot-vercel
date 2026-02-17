/**
 * リスク診断の包括的テストスクリプト
 *
 * 実行方法:
 * npm run dev (別ターミナル)
 * npx tsx scripts/test-diagnosis-patterns.ts
 */

import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const OUTPUT_DIR = path.join(__dirname, '../test-results');

interface TestCase {
  id: string;
  name: string;
  description: string;
  expectedRiskLevel: 'high' | 'medium' | 'low';
  input: {
    isInternalUse: boolean;
    isCorporate: boolean;
    hasRegistration: boolean;
    hasExternalAPI: boolean;
    contentTypes: {
      text: boolean;
      image: boolean;
      video: boolean;
      audio: boolean;
    };
    usagePurposes: {
      internalTraining: boolean;
      internalOperations: boolean;
      companyIntroduction: boolean;
      recruitment: boolean;
      marketing: boolean;
      customerService: boolean;
      productIntegration: boolean;
    };
  };
}

// 代表的なテストケース（高/中/低リスクのバランス）
const testCases: TestCase[] = [
  {
    id: 'HIGH-01',
    name: '高リスク: 外部API + 動画 + 顧客向けサービス',
    description: '本来高リスクになるべき典型的なケース',
    expectedRiskLevel: 'high',
    input: {
      isInternalUse: false,
      isCorporate: true,
      hasRegistration: true,
      hasExternalAPI: true,
      contentTypes: { text: false, image: false, video: true, audio: false },
      usagePurposes: {
        internalTraining: false,
        internalOperations: false,
        companyIntroduction: false,
        recruitment: false,
        marketing: false,
        customerService: true,
        productIntegration: false,
      },
    },
  },
  {
    id: 'HIGH-02',
    name: '高リスク: 画像 + マーケティング + 外部API',
    description: '画像生成でマーケティング利用（景品表示法リスク）',
    expectedRiskLevel: 'high',
    input: {
      isInternalUse: false,
      isCorporate: true,
      hasRegistration: false,
      hasExternalAPI: true,
      contentTypes: { text: false, image: true, video: false, audio: false },
      usagePurposes: {
        internalTraining: false,
        internalOperations: false,
        companyIntroduction: false,
        recruitment: false,
        marketing: true,
        customerService: false,
        productIntegration: false,
      },
    },
  },
  {
    id: 'HIGH-03',
    name: '高リスク: 全コンテンツ + 製品組込み + 会員登録',
    description: '複合的な高リスク要因',
    expectedRiskLevel: 'high',
    input: {
      isInternalUse: false,
      isCorporate: true,
      hasRegistration: true,
      hasExternalAPI: true,
      contentTypes: { text: true, image: true, video: true, audio: true },
      usagePurposes: {
        internalTraining: false,
        internalOperations: false,
        companyIntroduction: false,
        recruitment: false,
        marketing: false,
        customerService: false,
        productIntegration: true,
      },
    },
  },
  {
    id: 'MEDIUM-01',
    name: '中リスク: テキスト + 会社案内 + 外部API',
    description: '中程度のリスク（外部向けだが社内制御可能）',
    expectedRiskLevel: 'medium',
    input: {
      isInternalUse: false,
      isCorporate: true,
      hasRegistration: false,
      hasExternalAPI: true,
      contentTypes: { text: true, image: false, video: false, audio: false },
      usagePurposes: {
        internalTraining: false,
        internalOperations: false,
        companyIntroduction: true,
        recruitment: false,
        marketing: false,
        customerService: false,
        productIntegration: false,
      },
    },
  },
  {
    id: 'MEDIUM-02',
    name: '中リスク: 画像 + 採用 + 会員登録',
    description: '採用活動での画像利用（肖像権リスク）',
    expectedRiskLevel: 'medium',
    input: {
      isInternalUse: false,
      isCorporate: true,
      hasRegistration: true,
      hasExternalAPI: false,
      contentTypes: { text: true, image: true, video: false, audio: false },
      usagePurposes: {
        internalTraining: false,
        internalOperations: false,
        companyIntroduction: false,
        recruitment: true,
        marketing: false,
        customerService: false,
        productIntegration: false,
      },
    },
  },
  {
    id: 'LOW-01',
    name: '低リスク: 社内利用 + テキスト + ローカル処理',
    description: '最も安全なケース',
    expectedRiskLevel: 'low',
    input: {
      isInternalUse: true,
      isCorporate: false,
      hasRegistration: false,
      hasExternalAPI: false,
      contentTypes: { text: true, image: false, video: false, audio: false },
      usagePurposes: {
        internalTraining: false,
        internalOperations: true,
        companyIntroduction: false,
        recruitment: false,
        marketing: false,
        customerService: false,
        productIntegration: false,
      },
    },
  },
  {
    id: 'LOW-02',
    name: '低リスク: 社内研修 + テキスト',
    description: '社内教育目的のみ',
    expectedRiskLevel: 'low',
    input: {
      isInternalUse: true,
      isCorporate: false,
      hasRegistration: false,
      hasExternalAPI: false,
      contentTypes: { text: true, image: false, video: false, audio: false },
      usagePurposes: {
        internalTraining: true,
        internalOperations: false,
        companyIntroduction: false,
        recruitment: false,
        marketing: false,
        customerService: false,
        productIntegration: false,
      },
    },
  },
];

// DiagnosisInput形式に変換
function convertToDiagnosisInput(testCase: TestCase): any {
  const { input } = testCase;

  const aiTechnologies: string[] = [];
  if (input.contentTypes.text) aiTechnologies.push('llm');
  if (input.contentTypes.image) aiTechnologies.push('image_generation');
  if (input.contentTypes.video) aiTechnologies.push('video_generation');
  if (input.contentTypes.audio) aiTechnologies.push('audio_generation');
  if (aiTechnologies.length === 0) aiTechnologies.push('llm');

  const aiProviders: string[] = input.hasExternalAPI ? ['OpenAI', 'その他外部API'] : ['self_hosted'];

  const inputDataTypes: string[] = ['text'];
  if (input.hasRegistration) inputDataTypes.push('personal_info');

  const targetUsers: string[] = [];
  if (input.usagePurposes.customerService || input.usagePurposes.productIntegration || input.usagePurposes.marketing) {
    targetUsers.push('general_public');
  }
  if (input.isCorporate) targetUsers.push('business');
  if (input.usagePurposes.internalTraining || input.usagePurposes.internalOperations) {
    targetUsers.push('internal');
  }
  if (targetUsers.length === 0) targetUsers.push('general_public');

  const useCases: string[] = [];
  if (input.usagePurposes.internalTraining) useCases.push('社内研修・教育');
  if (input.usagePurposes.internalOperations) useCases.push('業務効率化');
  if (input.usagePurposes.companyIntroduction) useCases.push('会社案内・サービス紹介');
  if (input.usagePurposes.recruitment) useCases.push('採用活動');
  if (input.usagePurposes.marketing) useCases.push('マーケティング・広告');
  if (input.usagePurposes.customerService) useCases.push('顧客向けサービス');
  if (input.usagePurposes.productIntegration) useCases.push('製品組込み');
  if (useCases.length === 0) useCases.push('一般的なAI利用');

  const concernedRisks: string[] = [];
  if (input.contentTypes.image || input.contentTypes.video) concernedRisks.push('著作権侵害');
  if (input.hasRegistration) concernedRisks.push('個人情報保護');
  if (input.usagePurposes.marketing) concernedRisks.push('景品表示法');
  if (input.usagePurposes.customerService || input.usagePurposes.productIntegration) {
    concernedRisks.push('利用規約・免責');
  }

  const contentTypesStr: string[] = [];
  if (input.contentTypes.text) contentTypesStr.push('テキスト');
  if (input.contentTypes.image) contentTypesStr.push('画像');
  if (input.contentTypes.video) contentTypesStr.push('動画');
  if (input.contentTypes.audio) contentTypesStr.push('音声');

  const serviceTypesStr: string[] = [];
  if (input.isInternalUse) serviceTypesStr.push('社内利用');
  if (input.isCorporate) serviceTypesStr.push('法人サービス');
  if (input.hasRegistration) serviceTypesStr.push('会員登録あり');

  const appDescription = `
${serviceTypesStr.length > 0 ? `サービス形態: ${serviceTypesStr.join('、')}` : ''}
${contentTypesStr.length > 0 ? `AI生成コンテンツ: ${contentTypesStr.join('、')}` : 'AI生成コンテンツ: テキスト'}
利用目的: ${useCases.join('、')}
${input.hasExternalAPI ? '外部API（OpenAI等）を利用' : ''}
${input.hasRegistration ? 'ユーザー登録機能あり' : ''}
`.trim();

  return {
    appName: testCase.name,
    appDescription,
    aiTechnologies,
    aiProviders,
    inputDataTypes,
    dataTransmission: input.hasExternalAPI ? 'external_api' : 'local',
    dataStorage: input.hasRegistration ? ['ユーザー入力データ', 'アカウント情報'] : ['一時的な処理のみ'],
    targetUsers,
    pricingModel: 'unknown',
    useCases,
    concernedRisks,
  };
}

// テスト実行
async function runTest(testCase: TestCase, index: number) {
  console.log('\n' + '='.repeat(100));
  console.log(`テスト ${index + 1}/${testCases.length}: ${testCase.id} - ${testCase.name}`);
  console.log(`期待リスクレベル: ${testCase.expectedRiskLevel}`);
  console.log('='.repeat(100));

  const diagnosisInput = convertToDiagnosisInput(testCase);

  try {
    const startTime = Date.now();

    const response = await axios.post(`${BASE_URL}/api/diagnosis/analyze`, diagnosisInput, {
      timeout: 250000, // 4分10秒 - Graph(40s) + Web(30s) + Claude(200s) に余裕を持たせる
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    const actualRiskLevel = response.data.overallRiskLevel;
    const isCorrect = actualRiskLevel === testCase.expectedRiskLevel;

    console.log(`\n結果: ${isCorrect ? '✅ 正解' : '❌ 不正解'}`);
    console.log(`  期待: ${testCase.expectedRiskLevel}`);
    console.log(`  実際: ${actualRiskLevel}`);
    console.log(`  処理時間: ${(duration / 1000).toFixed(1)}秒`);
    console.log(`  リスク項目数: ${response.data.risks?.length || 0}`);

    if (response.data.risks) {
      console.log('\n  検出されたリスク:');
      response.data.risks.forEach((risk: any, i: number) => {
        console.log(`    ${i + 1}. [${risk.level}] ${risk.category}`);
      });
    }

    return {
      testId: testCase.id,
      name: testCase.name,
      expectedRiskLevel: testCase.expectedRiskLevel,
      actualRiskLevel,
      isCorrect,
      duration,
      riskCount: response.data.risks?.length || 0,
      risks: response.data.risks || [],
      executiveSummary: response.data.executiveSummary,
      fullResponse: response.data,
    };
  } catch (error: any) {
    console.log('\n❌ エラー発生');
    console.error('  エラー:', error.response?.data?.error || error.message);

    return {
      testId: testCase.id,
      name: testCase.name,
      expectedRiskLevel: testCase.expectedRiskLevel,
      actualRiskLevel: null,
      isCorrect: false,
      duration: 0,
      riskCount: 0,
      risks: [],
      error: error.response?.data || error.message,
    };
  }
}

// すべてのテストを実行
async function runAllTests() {
  console.log('🚀 リスク診断テスト開始');
  console.log(`BASE_URL: ${BASE_URL}`);
  console.log(`テストケース数: ${testCases.length}\n`);

  // 出力ディレクトリ作成
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const results = [];
  const startTime = Date.now();

  for (let i = 0; i < testCases.length; i++) {
    const result = await runTest(testCases[i], i);
    results.push(result);

    // 次のテストまで2秒待機（サーバー負荷軽減）
    if (i < testCases.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  const totalTime = Date.now() - startTime;

  // サマリーを表示
  console.log('\n' + '='.repeat(100));
  console.log('📊 テスト結果サマリー');
  console.log('='.repeat(100));

  const correctCount = results.filter(r => r.isCorrect).length;
  const accuracy = (correctCount / results.length) * 100;

  console.log(`\n総合結果: ${correctCount}/${results.length} 正解 (正解率: ${accuracy.toFixed(1)}%)`);
  console.log(`総実行時間: ${(totalTime / 1000).toFixed(1)}秒`);

  // リスクレベル別の結果
  console.log('\n【リスクレベル別の正解率】');
  ['high', 'medium', 'low'].forEach(level => {
    const testsForLevel = results.filter(r => r.expectedRiskLevel === level);
    const correctForLevel = testsForLevel.filter(r => r.isCorrect).length;
    const accuracyForLevel = testsForLevel.length > 0
      ? (correctForLevel / testsForLevel.length) * 100
      : 0;
    console.log(`  ${level.toUpperCase()}: ${correctForLevel}/${testsForLevel.length} (${accuracyForLevel.toFixed(1)}%)`);
  });

  // 詳細結果
  console.log('\n【各テストケースの詳細】');
  results.forEach((result, i) => {
    const status = result.isCorrect ? '✅' : '❌';
    console.log(`${status} ${result.testId}: ${result.name}`);
    console.log(`   期待=${result.expectedRiskLevel}, 実際=${result.actualRiskLevel || 'ERROR'}, 時間=${(result.duration / 1000).toFixed(1)}s`);
  });

  // 誤判定の分析
  const incorrect = results.filter(r => !r.isCorrect && r.actualRiskLevel);
  if (incorrect.length > 0) {
    console.log('\n【誤判定の分析】');
    incorrect.forEach(result => {
      console.log(`\n❌ ${result.testId}: ${result.name}`);
      console.log(`   期待: ${result.expectedRiskLevel} → 実際: ${result.actualRiskLevel}`);
      console.log(`   主なリスク:`);
      result.risks.slice(0, 3).forEach((risk: any) => {
        console.log(`     - [${risk.level}] ${risk.category}`);
      });
    });
  }

  // JSONファイルに結果を保存
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputFile = path.join(OUTPUT_DIR, `test-results-${timestamp}.json`);
  fs.writeFileSync(outputFile, JSON.stringify({
    summary: {
      totalTests: results.length,
      correctCount,
      accuracy,
      totalTime,
    },
    results
  }, null, 2));

  console.log(`\n📄 詳細結果を保存: ${outputFile}`);
  console.log('\n✅ テスト完了');

  return { results, accuracy, correctCount, totalTests: results.length };
}

// 実行
runAllTests().catch(error => {
  console.error('テスト実行エラー:', error);
  process.exit(1);
});
