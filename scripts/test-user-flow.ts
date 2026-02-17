/**
 * 実際のユーザーフロー動作確認テスト
 *
 * 3つの代表的なシナリオで最適化されたロジックの動作を確認
 */

import axios from 'axios';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

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

interface TestScenario {
  name: string;
  description: string;
  expectedRiskLevel: 'high' | 'medium' | 'low';
  input: DiagnosisInput;
}

const scenarios: TestScenario[] = [
  {
    name: 'シナリオ1: 社内研修支援（LOW期待）',
    description: '社内の研修資料作成にテキスト生成AIを活用。外部APIなし、ローカル処理のみ。',
    expectedRiskLevel: 'low',
    input: {
      appName: '社内研修資料作成支援AI',
      appDescription: `
サービス形態: 社内利用
AI生成コンテンツ: テキスト
利用目的: 社内研修・教育
ローカル処理
      `.trim(),
      aiTechnologies: ['llm'],
      aiProviders: ['self_hosted'],
      inputDataTypes: ['text'],
      dataTransmission: 'local',
      dataStorage: ['一時的な処理のみ'],
      targetUsers: ['internal'],
      pricingModel: 'internal',
      useCases: ['社内研修・教育'],
      concernedRisks: [],
    }
  },
  {
    name: 'シナリオ2: 法人向けサービス紹介（MEDIUM期待）',
    description: '法人向けのサービス紹介資料に画像生成を利用。会員登録なし、一般公開。',
    expectedRiskLevel: 'medium',
    input: {
      appName: '法人向けサービス紹介資料作成',
      appDescription: `
サービス形態: 法人サービス
AI生成コンテンツ: 画像
利用目的: 会社案内・サービス紹介
外部API（OpenAI等）を利用
      `.trim(),
      aiTechnologies: ['image_generation'],
      aiProviders: ['OpenAI', 'その他外部API'],
      inputDataTypes: ['text'],
      dataTransmission: 'external_api',
      dataStorage: ['一時的な処理のみ'],
      targetUsers: ['business'],
      pricingModel: 'B2B',
      useCases: ['会社案内・サービス紹介'],
      concernedRisks: ['著作権侵害'],
    }
  },
  {
    name: 'シナリオ3: マーケティング動画作成（HIGH期待）',
    description: '一般消費者向けマーケティング動画を外部APIで生成。会員登録あり。',
    expectedRiskLevel: 'high',
    input: {
      appName: 'マーケティング動画自動生成サービス',
      appDescription: `
サービス形態: 法人サービス、会員登録あり
AI生成コンテンツ: 動画
利用目的: マーケティング・広告
外部API（OpenAI等）を利用
ユーザー登録機能あり
      `.trim(),
      aiTechnologies: ['video_generation'],
      aiProviders: ['OpenAI', 'その他外部API'],
      inputDataTypes: ['text', 'personal_info'],
      dataTransmission: 'external_api',
      dataStorage: ['ユーザー入力データ', 'アカウント情報'],
      targetUsers: ['general_public', 'business'],
      pricingModel: 'subscription',
      useCases: ['マーケティング・広告'],
      concernedRisks: ['著作権侵害', '個人情報保護', '景品表示法', '利用規約・免責'],
    }
  }
];

async function runScenario(scenario: TestScenario, index: number) {
  console.log('\n' + '='.repeat(100));
  console.log(`${scenario.name}`);
  console.log('='.repeat(100));
  console.log(`📝 説明: ${scenario.description}`);
  console.log(`🎯 期待リスクレベル: ${scenario.expectedRiskLevel.toUpperCase()}`);
  console.log('\n実行中...');

  try {
    const startTime = Date.now();
    const response = await axios.post(
      `${BASE_URL}/api/diagnosis/analyze`,
      scenario.input,
      { timeout: 250000 }
    );
    const duration = Date.now() - startTime;

    const result = response.data;
    const actualRiskLevel = result.overallRiskLevel;
    const isCorrect = actualRiskLevel === scenario.expectedRiskLevel;

    console.log(`\n${'='.repeat(100)}`);
    console.log(`📊 診断結果`);
    console.log(`${'='.repeat(100)}`);
    console.log(`\n${isCorrect ? '✅ 期待通りの判定' : '⚠️  期待と異なる判定'}`);
    console.log(`  期待: ${scenario.expectedRiskLevel.toUpperCase()}`);
    console.log(`  実際: ${actualRiskLevel.toUpperCase()}`);
    console.log(`  処理時間: ${(duration / 1000).toFixed(1)}秒`);

    console.log(`\n📋 総合サマリー:`);
    console.log(result.executiveSummary);

    console.log(`\n🔍 検出されたリスク項目（${result.risks.length}件）:`);
    result.risks.forEach((risk: any, idx: number) => {
      console.log(`  ${idx + 1}. [${risk.level}] ${risk.category}`);
      console.log(`     ${risk.summary}`);
    });

    console.log(`\n⚡ 優先対応事項:`);
    result.priorityActions.forEach((action: string, idx: number) => {
      console.log(`  ${idx + 1}. ${action}`);
    });

    console.log(`\n💡 主な推奨対策:`);
    result.risks.slice(0, 2).forEach((risk: any) => {
      console.log(`  【${risk.category}】`);
      risk.recommendations.slice(0, 2).forEach((rec: string) => {
        console.log(`    • ${rec}`);
      });
    });

    return {
      scenario: scenario.name,
      expected: scenario.expectedRiskLevel,
      actual: actualRiskLevel,
      isCorrect,
      duration,
      riskCount: result.risks.length
    };

  } catch (error: any) {
    console.log('\n❌ エラー発生');
    console.log(`  エラー: ${error.message}`);

    return {
      scenario: scenario.name,
      expected: scenario.expectedRiskLevel,
      actual: 'ERROR',
      isCorrect: false,
      duration: 0,
      riskCount: 0,
      error: error.message
    };
  }
}

async function main() {
  console.log('🚀 実際のユーザーフロー動作確認テスト');
  console.log('=' .repeat(100));
  console.log(`BASE_URL: ${BASE_URL}`);
  console.log(`テストシナリオ数: ${scenarios.length}`);

  const results = [];

  for (let i = 0; i < scenarios.length; i++) {
    const result = await runScenario(scenarios[i], i);
    results.push(result);

    // 次のテストまで少し待機
    if (i < scenarios.length - 1) {
      console.log('\n⏳ 次のテストまで5秒待機...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  // 最終サマリー
  console.log('\n' + '='.repeat(100));
  console.log('📊 最終サマリー');
  console.log('='.repeat(100));

  const correctCount = results.filter(r => r.isCorrect).length;
  const errorCount = results.filter(r => r.actual === 'ERROR').length;

  console.log(`\n総合結果: ${correctCount}/${scenarios.length} 正解 (${((correctCount / scenarios.length) * 100).toFixed(1)}%)`);
  console.log(`エラー: ${errorCount}件`);

  console.log('\n【各シナリオの結果】');
  results.forEach(r => {
    const icon = r.isCorrect ? '✅' : (r.actual === 'ERROR' ? '❌' : '⚠️');
    console.log(`${icon} ${r.scenario}`);
    console.log(`   期待=${r.expected}, 実際=${r.actual}, 時間=${(r.duration / 1000).toFixed(1)}s`);
  });

  console.log('\n✅ テスト完了');
}

main().catch(console.error);
