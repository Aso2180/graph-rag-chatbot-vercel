/**
 * 包括的リスク診断テスト - 4x4x7 = 112パターン（探索的テスト）
 *
 * contentTypes (4) × 基本フラグ (4) × usagePurposes (7) = 112パターン
 * 期待値なしで実行し、Claude APIの判定傾向を分析
 */

import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// コンテンツタイプ（4パターン）
const CONTENT_TYPES = ['text', 'image', 'video', 'audio'] as const;

// 基本フラグ（4パターン）
const BASIC_FLAGS = ['isInternalUse', 'isCorporate', 'hasRegistration', 'hasExternalAPI'] as const;

// 利用目的（7パターン）
const USAGE_PURPOSES = [
  'internalTraining',
  'internalOperations',
  'companyIntroduction',
  'recruitment',
  'marketing',
  'customerService',
  'productIntegration'
] as const;

type ContentType = typeof CONTENT_TYPES[number];
type BasicFlag = typeof BASIC_FLAGS[number];
type UsagePurpose = typeof USAGE_PURPOSES[number];
type RiskLevel = 'high' | 'medium' | 'low';

interface TestPattern {
  id: string;
  name: string;
  contentType: ContentType;
  basicFlag: BasicFlag;
  usagePurpose: UsagePurpose;
}

interface UserContext {
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
  hasPDFUploaded: boolean;
}

interface DiagnosisInput {
  appName: string;
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

interface TestResult {
  id: string;
  name: string;
  contentType: ContentType;
  basicFlag: BasicFlag;
  usagePurpose: UsagePurpose;
  riskLevel: RiskLevel | 'ERROR';
  duration: number;
  riskCount: number;
  risks?: any[];
  error?: string;
}

/**
 * テストパターン生成（112パターン）
 */
function generateTestPatterns(): TestPattern[] {
  const patterns: TestPattern[] = [];
  let id = 1;

  for (const contentType of CONTENT_TYPES) {
    for (const basicFlag of BASIC_FLAGS) {
      for (const usagePurpose of USAGE_PURPOSES) {
        const contentTypeLabel: Record<ContentType, string> = {
          text: 'テキスト',
          image: '画像',
          video: '動画',
          audio: '音声'
        };

        const basicFlagLabel: Record<BasicFlag, string> = {
          isInternalUse: '社内利用',
          isCorporate: '法人向け',
          hasRegistration: '会員登録',
          hasExternalAPI: '外部API'
        };

        const usagePurposeLabel: Record<UsagePurpose, string> = {
          internalTraining: '社内研修',
          internalOperations: '業務効率化',
          companyIntroduction: '会社案内',
          recruitment: '採用活動',
          marketing: 'マーケティング',
          customerService: '顧客サービス',
          productIntegration: '製品組込み'
        };

        patterns.push({
          id: `TEST-${id.toString().padStart(3, '0')}`,
          name: `${contentTypeLabel[contentType]} + ${basicFlagLabel[basicFlag]} + ${usagePurposeLabel[usagePurpose]}`,
          contentType,
          basicFlag,
          usagePurpose
        });

        id++;
      }
    }
  }

  return patterns;
}

/**
 * UserContextに変換
 */
function createUserContext(pattern: TestPattern): UserContext {
  const context: UserContext = {
    isInternalUse: pattern.basicFlag === 'isInternalUse',
    isCorporate: pattern.basicFlag === 'isCorporate',
    hasRegistration: pattern.basicFlag === 'hasRegistration',
    hasExternalAPI: pattern.basicFlag === 'hasExternalAPI',
    contentTypes: {
      text: pattern.contentType === 'text',
      image: pattern.contentType === 'image',
      video: pattern.contentType === 'video',
      audio: pattern.contentType === 'audio'
    },
    usagePurposes: {
      internalTraining: pattern.usagePurpose === 'internalTraining',
      internalOperations: pattern.usagePurpose === 'internalOperations',
      companyIntroduction: pattern.usagePurpose === 'companyIntroduction',
      recruitment: pattern.usagePurpose === 'recruitment',
      marketing: pattern.usagePurpose === 'marketing',
      customerService: pattern.usagePurpose === 'customerService',
      productIntegration: pattern.usagePurpose === 'productIntegration'
    },
    hasPDFUploaded: false
  };

  return context;
}

/**
 * DiagnosisInputに変換
 */
function convertToDiagnosisInput(ctx: UserContext): DiagnosisInput {
  // AI技術タイプ
  const aiTechnologies: string[] = [];
  if (ctx.contentTypes.text) aiTechnologies.push('llm');
  if (ctx.contentTypes.image) aiTechnologies.push('image_generation');
  if (ctx.contentTypes.video) aiTechnologies.push('video_generation');
  if (ctx.contentTypes.audio) aiTechnologies.push('audio_generation');

  // AIプロバイダー
  const aiProviders: string[] = ctx.hasExternalAPI
    ? ['OpenAI', 'その他外部API']
    : ['self_hosted'];

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

  // アプリ説明文
  const appDescription = `
${serviceTypesStr.length > 0 ? `サービス形態: ${serviceTypesStr.join('、')}` : ''}
AI生成コンテンツ: ${contentTypesStr.join('、')}
利用目的: ${useCases.join('、')}
${ctx.hasExternalAPI ? '外部API（OpenAI等）を利用' : 'ローカル処理'}
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
  };
}

/**
 * 単一テストの実行
 */
async function runSingleTest(pattern: TestPattern, index: number, total: number): Promise<TestResult> {
  console.log('\n' + '='.repeat(100));
  console.log(`テスト ${index + 1}/${total}: ${pattern.id} - ${pattern.name}`);
  console.log('='.repeat(100));

  const userContext = createUserContext(pattern);
  const diagnosisInput = convertToDiagnosisInput(userContext);

  try {
    const startTime = Date.now();

    const response = await axios.post(`${BASE_URL}/api/diagnosis/analyze`, diagnosisInput, {
      timeout: 250000, // 4分10秒
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    const riskLevel = response.data.overallRiskLevel;
    const risks = response.data.risks || [];

    console.log(`\n✅ 診断完了`);
    console.log(`  リスクレベル: ${riskLevel}`);
    console.log(`  処理時間: ${(duration / 1000).toFixed(1)}秒`);
    console.log(`  リスク項目数: ${risks.length}`);

    return {
      id: pattern.id,
      name: pattern.name,
      contentType: pattern.contentType,
      basicFlag: pattern.basicFlag,
      usagePurpose: pattern.usagePurpose,
      riskLevel,
      duration,
      riskCount: risks.length,
      risks
    };
  } catch (error: any) {
    console.log('\n❌ エラー発生');
    console.log(`  エラー: ${error.message}`);

    return {
      id: pattern.id,
      name: pattern.name,
      contentType: pattern.contentType,
      basicFlag: pattern.basicFlag,
      usagePurpose: pattern.usagePurpose,
      riskLevel: 'ERROR',
      duration: 0,
      riskCount: 0,
      error: error.message,
    };
  }
}

/**
 * パターン分析: 各要素とリスクレベルの相関
 */
function analyzePatterns(results: TestResult[]) {
  const successResults = results.filter(r => r.riskLevel !== 'ERROR');

  console.log('\n' + '='.repeat(100));
  console.log('📊 パターン分析');
  console.log('='.repeat(100));

  // コンテンツタイプ別
  console.log('\n【コンテンツタイプ別のリスク分布】');
  for (const contentType of CONTENT_TYPES) {
    const filtered = successResults.filter(r => r.contentType === contentType);
    const distribution = getRiskDistribution(filtered);
    console.log(`  ${contentType}: HIGH=${distribution.high} / MEDIUM=${distribution.medium} / LOW=${distribution.low}`);
  }

  // 基本フラグ別
  console.log('\n【基本フラグ別のリスク分布】');
  for (const basicFlag of BASIC_FLAGS) {
    const filtered = successResults.filter(r => r.basicFlag === basicFlag);
    const distribution = getRiskDistribution(filtered);
    console.log(`  ${basicFlag}: HIGH=${distribution.high} / MEDIUM=${distribution.medium} / LOW=${distribution.low}`);
  }

  // 利用目的別
  console.log('\n【利用目的別のリスク分布】');
  for (const usagePurpose of USAGE_PURPOSES) {
    const filtered = successResults.filter(r => r.usagePurpose === usagePurpose);
    const distribution = getRiskDistribution(filtered);
    console.log(`  ${usagePurpose}: HIGH=${distribution.high} / MEDIUM=${distribution.medium} / LOW=${distribution.low}`);
  }

  // 高リスクパターンの抽出
  console.log('\n【高リスク(HIGH)パターンの特徴】');
  const highRiskResults = successResults.filter(r => r.riskLevel === 'high');
  console.log(`総数: ${highRiskResults.length}件`);

  const highRiskPatterns = {
    contentTypes: getFrequency(highRiskResults, 'contentType'),
    basicFlags: getFrequency(highRiskResults, 'basicFlag'),
    usagePurposes: getFrequency(highRiskResults, 'usagePurpose')
  };

  console.log('  頻出コンテンツタイプ:', formatFrequency(highRiskPatterns.contentTypes));
  console.log('  頻出基本フラグ:', formatFrequency(highRiskPatterns.basicFlags));
  console.log('  頻出利用目的:', formatFrequency(highRiskPatterns.usagePurposes));

  // 低リスクパターンの抽出
  console.log('\n【低リスク(LOW)パターンの特徴】');
  const lowRiskResults = successResults.filter(r => r.riskLevel === 'low');
  console.log(`総数: ${lowRiskResults.length}件`);

  const lowRiskPatterns = {
    contentTypes: getFrequency(lowRiskResults, 'contentType'),
    basicFlags: getFrequency(lowRiskResults, 'basicFlag'),
    usagePurposes: getFrequency(lowRiskResults, 'usagePurpose')
  };

  console.log('  頻出コンテンツタイプ:', formatFrequency(lowRiskPatterns.contentTypes));
  console.log('  頻出基本フラグ:', formatFrequency(lowRiskPatterns.basicFlags));
  console.log('  頻出利用目的:', formatFrequency(lowRiskPatterns.usagePurposes));
}

function getRiskDistribution(results: TestResult[]) {
  return {
    high: results.filter(r => r.riskLevel === 'high').length,
    medium: results.filter(r => r.riskLevel === 'medium').length,
    low: results.filter(r => r.riskLevel === 'low').length
  };
}

function getFrequency<T extends TestResult, K extends keyof T>(results: T[], key: K): Record<string, number> {
  return results.reduce((acc, r) => {
    const value = String(r[key]);
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

function formatFrequency(freq: Record<string, number>): string {
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => `${key}(${count})`)
    .join(', ');
}

/**
 * メイン実行
 */
async function main() {
  console.log('🚀 包括的リスク診断テスト開始 (4x4x7 = 112パターン)');
  console.log('📋 探索的テスト: Claude APIの判定傾向を分析');
  console.log(`BASE_URL: ${BASE_URL}`);

  const patterns = generateTestPatterns();
  console.log(`\nテストパターン数: ${patterns.length}`);

  const results: TestResult[] = [];
  const startTime = Date.now();

  // 各テストを順次実行
  for (let i = 0; i < patterns.length; i++) {
    const result = await runSingleTest(patterns[i], i, patterns.length);
    results.push(result);

    // 進捗状況を表示（10件ごと）
    if ((i + 1) % 10 === 0 || i === patterns.length - 1) {
      const successCount = results.filter(r => r.riskLevel !== 'ERROR').length;
      const distribution = getRiskDistribution(results.filter(r => r.riskLevel !== 'ERROR'));
      console.log(`\n進捗: ${i + 1}/${patterns.length} 完了`);
      console.log(`  成功: ${successCount}, エラー: ${results.length - successCount}`);
      console.log(`  現在の分布: HIGH=${distribution.high}, MEDIUM=${distribution.medium}, LOW=${distribution.low}`);
    }
  }

  const totalTime = Date.now() - startTime;

  // 結果サマリー
  console.log('\n' + '='.repeat(100));
  console.log('📊 テスト結果サマリー');
  console.log('='.repeat(100));

  const successResults = results.filter(r => r.riskLevel !== 'ERROR');
  const errorResults = results.filter(r => r.riskLevel === 'ERROR');
  const distribution = getRiskDistribution(successResults);

  console.log(`\n総テスト数: ${patterns.length}`);
  console.log(`成功: ${successResults.length}件`);
  console.log(`エラー: ${errorResults.length}件`);
  console.log(`総実行時間: ${(totalTime / 1000).toFixed(1)}秒 (${(totalTime / 60000).toFixed(1)}分)`);
  console.log(`平均処理時間: ${successResults.length > 0 ? (successResults.reduce((sum, r) => sum + r.duration, 0) / successResults.length / 1000).toFixed(1) : 0}秒`);

  console.log('\n【リスクレベル分布】');
  console.log(`  HIGH: ${distribution.high}件 (${(distribution.high / successResults.length * 100).toFixed(1)}%)`);
  console.log(`  MEDIUM: ${distribution.medium}件 (${(distribution.medium / successResults.length * 100).toFixed(1)}%)`);
  console.log(`  LOW: ${distribution.low}件 (${(distribution.low / successResults.length * 100).toFixed(1)}%)`);

  // パターン分析
  if (successResults.length > 0) {
    analyzePatterns(results);
  }

  // エラーの詳細
  if (errorResults.length > 0) {
    console.log('\n【エラーの詳細】');
    const errorGroups = errorResults.reduce((acc, r) => {
      const msg = r.error || 'Unknown';
      acc[msg] = (acc[msg] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(errorGroups).forEach(([msg, count]) => {
      console.log(`  ${msg}: ${count}件`);
    });
  }

  // 結果をファイルに保存
  const resultDir = path.join(process.cwd(), 'test-results');
  if (!fs.existsSync(resultDir)) {
    fs.mkdirSync(resultDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
  const resultFile = path.join(resultDir, `comprehensive-test-${timestamp}.json`);

  fs.writeFileSync(resultFile, JSON.stringify({
    summary: {
      totalTests: patterns.length,
      success: successResults.length,
      errors: errorResults.length,
      distribution,
      totalTime,
      averageTime: successResults.length > 0 ? successResults.reduce((sum, r) => sum + r.duration, 0) / successResults.length : 0,
      timestamp: new Date().toISOString()
    },
    results,
    patterns: {
      high: results.filter(r => r.riskLevel === 'high').map(r => ({
        id: r.id,
        name: r.name,
        contentType: r.contentType,
        basicFlag: r.basicFlag,
        usagePurpose: r.usagePurpose
      })),
      medium: results.filter(r => r.riskLevel === 'medium').map(r => ({
        id: r.id,
        name: r.name,
        contentType: r.contentType,
        basicFlag: r.basicFlag,
        usagePurpose: r.usagePurpose
      })),
      low: results.filter(r => r.riskLevel === 'low').map(r => ({
        id: r.id,
        name: r.name,
        contentType: r.contentType,
        basicFlag: r.basicFlag,
        usagePurpose: r.usagePurpose
      }))
    }
  }, null, 2));

  console.log(`\n📄 詳細結果を保存: ${resultFile}`);
  console.log('\n✅ テスト完了');
}

main().catch(console.error);
