'use client';

import { useState } from 'react';
import { UserContext } from '@/types/userContext';
import { DiagnosisResult, DiagnosisInput } from '@/types/diagnosis';
import { DocumentGenerator } from '../generator/DocumentGenerator';

interface Step3TermsGenerationProps {
  userContext: UserContext;
  riskAnalysisResult: DiagnosisResult | null;
  diagnosisInput: DiagnosisInput | null;
  chatHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  onBack: () => void;
  onComplete: () => void;
}

type TermsType = 'risk-reflected' | 'general' | null;

export function Step3TermsGeneration({
  userContext,
  riskAnalysisResult,
  diagnosisInput,
  chatHistory,
  onBack,
  onComplete,
}: Step3TermsGenerationProps) {
  const [selectedType, setSelectedType] = useState<TermsType>(null);
  const [showGenerator, setShowGenerator] = useState(false);

  const canGenerateRiskReflected = riskAnalysisResult !== null;

  const handleSelectType = (type: TermsType) => {
    setSelectedType(type);
    setShowGenerator(true);
  };

  if (showGenerator) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setShowGenerator(false)}
          className="text-sm text-blue-600 hover:underline"
        >
          ← 規約タイプ選択に戻る
        </button>
        <DocumentGenerator
          diagnosisResult={selectedType === 'risk-reflected' ? riskAnalysisResult || undefined : undefined}
          diagnosisInput={selectedType === 'risk-reflected' ? diagnosisInput || undefined : undefined}
          chatHistory={selectedType === 'risk-reflected' ? chatHistory : undefined}
          onClose={onComplete}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          利用規約を作成する
        </h2>
        <p className="text-sm text-gray-600">
          生成する規約の種類を選択してください
        </p>
      </div>

      {/* 規約生成について */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-bold text-blue-800 mb-2 flex items-center gap-2">
          <span>💡</span>
          規約生成について
        </h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• リスク分析を行った場合：分析結果を反映した規約が生成されます（推奨）</li>
          <li>• リスク分析を行っていない場合：一般的な利用規約が生成されます</li>
        </ul>
      </div>

      {/* 規約タイプ選択 */}
      <div className="space-y-4">
        {/* リスク反映版 */}
        <button
          onClick={() => handleSelectType('risk-reflected')}
          disabled={!canGenerateRiskReflected}
          className={`
            w-full p-6 rounded-lg border-2 text-left transition-all
            ${canGenerateRiskReflected
              ? 'border-green-500 bg-green-50 hover:bg-green-100 cursor-pointer'
              : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'}
          `}
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">{canGenerateRiskReflected ? '⭐' : '🔒'}</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-gray-800">
                  リスク反映版
                </h3>
                {canGenerateRiskReflected && (
                  <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded-full">
                    推奨
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                分析結果を反映した、あなた専用の規約
              </p>
              {!canGenerateRiskReflected && (
                <p className="text-xs text-amber-600 mt-2">
                  ※ STEP②の分析が必要です
                </p>
              )}
              {canGenerateRiskReflected && riskAnalysisResult && (
                <div className="mt-3 p-2 bg-white rounded border border-green-200">
                  <p className="text-xs text-gray-600">
                    反映されるリスク分析:
                  </p>
                  <p className="text-sm font-medium text-gray-800">
                    {riskAnalysisResult.risks.length}件のリスクに対応した規約を生成
                  </p>
                </div>
              )}
            </div>
          </div>
        </button>

        {/* 一般版 */}
        <button
          onClick={() => handleSelectType('general')}
          className="w-full p-6 rounded-lg border-2 border-gray-200 bg-white hover:bg-gray-50 text-left transition-all"
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">📄</span>
            <div>
              <h3 className="text-lg font-bold text-gray-800">
                一般版
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                標準的な利用規約テンプレート
              </p>
              <p className="text-xs text-gray-500 mt-2">
                基本的な条項を含む汎用的な規約
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* 戻るボタン */}
      <div className="flex justify-center pt-4">
        <button
          onClick={onBack}
          className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          ← リスク分析に戻る
        </button>
      </div>

      {/* ユーザーコンテキストサマリー */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-bold text-gray-700 mb-2">入力された情報</h4>
        <div className="text-xs text-gray-600 space-y-1">
          {userContext.isCorporate && <p>• 法人サービス</p>}
          {userContext.isIndividual && <p>• 個人開発</p>}
          {userContext.hasRegistration && <p>• 会員登録機能あり</p>}
          {userContext.hasExternalAPI && <p>• 外部API利用</p>}
          {userContext.contentTypes.text && <p>• テキスト生成</p>}
          {userContext.contentTypes.image && <p>• 画像生成</p>}
          {userContext.contentTypes.video && <p>• 動画生成</p>}
          {userContext.contentTypes.audio && <p>• 音声生成</p>}
          {userContext.usagePurposes.internalTraining && <p>• 社内利用（研修・教育）</p>}
          {userContext.usagePurposes.internalOperations && <p>• 社内利用（業務効率化）</p>}
          {userContext.usagePurposes.companyIntroduction && <p>• 会社案内・サービス紹介</p>}
          {userContext.usagePurposes.recruitment && <p>• 採用・リクルート</p>}
          {userContext.usagePurposes.marketing && <p>• マーケティング・広告</p>}
          {userContext.usagePurposes.customerService && <p>• 顧客向けサービス提供</p>}
          {userContext.usagePurposes.productIntegration && <p>• 商品・製品への組込み</p>}
        </div>
      </div>
    </div>
  );
}
