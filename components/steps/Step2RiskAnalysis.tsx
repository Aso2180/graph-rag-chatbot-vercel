'use client';

import { useState } from 'react';
import { UserContext, userContextToDiagnosisInput, riskHintsByPurpose } from '@/types/userContext';
import { DiagnosisResult } from '@/types/diagnosis';

interface Step2RiskAnalysisProps {
  userContext: UserContext;
  riskAnalysisResult: DiagnosisResult | null;
  onAnalyze: () => void;
  onAnalysisComplete: (result: DiagnosisResult) => void;
  onNext: () => void;
  onBack: () => void;
  isAnalyzing: boolean;
  // チャット関連
  messages: Array<{ id: string; role: 'user' | 'assistant'; content: string; timestamp: Date }>;
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export function Step2RiskAnalysis({
  userContext,
  riskAnalysisResult,
  onAnalyze,
  onNext,
  onBack,
  isAnalyzing,
  messages,
  onSendMessage,
  isLoading,
}: Step2RiskAnalysisProps) {
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);

  // ユーザーコンテキストからサマリーを生成
  const getSummary = () => {
    const basicInfo: string[] = [];
    if (userContext.isIndividual) basicInfo.push('個人開発');
    if (userContext.isCorporate) basicInfo.push('法人サービス');
    if (userContext.hasRegistration) basicInfo.push('会員登録あり');
    if (userContext.hasExternalAPI) basicInfo.push('外部API利用');

    const contentTypes: string[] = [];
    if (userContext.contentTypes.text) contentTypes.push('テキスト');
    if (userContext.contentTypes.image) contentTypes.push('画像');
    if (userContext.contentTypes.video) contentTypes.push('動画');
    if (userContext.contentTypes.audio) contentTypes.push('音声');

    const purposes: string[] = [];
    if (userContext.usagePurposes.internalTraining) purposes.push('社内利用（研修）');
    if (userContext.usagePurposes.internalOperations) purposes.push('社内利用（業務）');
    if (userContext.usagePurposes.companyIntroduction) purposes.push('会社案内');
    if (userContext.usagePurposes.recruitment) purposes.push('採用');
    if (userContext.usagePurposes.marketing) purposes.push('マーケティング');
    if (userContext.usagePurposes.customerService) purposes.push('顧客向けサービス');
    if (userContext.usagePurposes.productIntegration) purposes.push('製品組込み');

    return { basicInfo, contentTypes, purposes };
  };

  // 選択された利用目的に基づくリスクヒントを取得
  const getRiskHints = (): string[] => {
    const hints: string[] = [];
    const purposes = userContext.usagePurposes;

    if (purposes.internalTraining) hints.push(...riskHintsByPurpose.internalTraining);
    if (purposes.internalOperations) hints.push(...riskHintsByPurpose.internalOperations);
    if (purposes.companyIntroduction) hints.push(...riskHintsByPurpose.companyIntroduction);
    if (purposes.recruitment) hints.push(...riskHintsByPurpose.recruitment);
    if (purposes.marketing) hints.push(...riskHintsByPurpose.marketing);
    if (purposes.customerService) hints.push(...riskHintsByPurpose.customerService);
    if (purposes.productIntegration) hints.push(...riskHintsByPurpose.productIntegration);

    // 重複を削除
    return [...new Set(hints)];
  };

  const summary = getSummary();
  const riskHints = getRiskHints();

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    onSendMessage(chatInput);
    setChatInput('');
  };

  return (
    <div className="space-y-6">
      {/* 入力サマリー */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-bold text-gray-700 mb-3">入力された状況</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          {summary.basicInfo.length > 0 && (
            <div>
              <span className="text-gray-500">📋 基本情報：</span>
              <p className="font-medium text-gray-800">{summary.basicInfo.join(' / ')}</p>
            </div>
          )}
          {summary.contentTypes.length > 0 && (
            <div>
              <span className="text-gray-500">📋 コンテンツ：</span>
              <p className="font-medium text-gray-800">{summary.contentTypes.join(' / ')}</p>
            </div>
          )}
          {summary.purposes.length > 0 && (
            <div>
              <span className="text-gray-500">📋 利用目的：</span>
              <p className="font-medium text-gray-800">{summary.purposes.join(' / ')}</p>
            </div>
          )}
        </div>
        <button
          onClick={onBack}
          className="mt-3 text-sm text-blue-600 hover:underline"
        >
          ← 利用状況を修正する
        </button>
      </div>

      {/* リスクヒント表示 */}
      {riskHints.length > 0 && !riskAnalysisResult && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h4 className="text-sm font-bold text-amber-800 mb-2">
            想定される法的リスク観点
          </h4>
          <ul className="text-sm text-amber-700 space-y-1">
            {riskHints.slice(0, 5).map((hint, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-amber-500">•</span>
                <span>{hint}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 自動診断セクション */}
      {!riskAnalysisResult ? (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-2">法的リスクを自動診断する</h3>
          <p className="text-sm text-gray-600 mb-4">
            入力内容をもとに、想定される法的リスクをAIが自動分析します。
          </p>
          <button
            onClick={onAnalyze}
            disabled={isAnalyzing}
            className={`
              w-full py-3 rounded-lg font-bold text-lg transition-all
              ${isAnalyzing
                ? 'bg-gray-300 text-gray-500 cursor-wait'
                : 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg hover:shadow-xl'}
            `}
          >
            {isAnalyzing ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                分析中です...
              </span>
            ) : (
              '法的リスクを自動診断する'
            )}
          </button>
        </div>
      ) : (
        /* 診断結果表示 */
        <div className="bg-white rounded-lg border border-green-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-green-600 text-xl">✓</span>
            <h3 className="text-lg font-bold text-green-800">リスク分析が完了しました</h3>
          </div>

          {/* リスク概要 */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-bold text-gray-700 mb-2">分析結果サマリー</h4>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-gray-600">総合リスクレベル:</span>
              <span className={`
                px-3 py-1 rounded-full text-sm font-bold
                ${riskAnalysisResult.overallRiskLevel === 'high'
                  ? 'bg-red-100 text-red-800'
                  : riskAnalysisResult.overallRiskLevel === 'medium'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-green-100 text-green-800'}
              `}>
                {riskAnalysisResult.overallRiskLevel === 'high' ? '高' :
                 riskAnalysisResult.overallRiskLevel === 'medium' ? '中' : '低'}
              </span>
            </div>
            <p className="text-sm text-gray-700">{riskAnalysisResult.executiveSummary}</p>
          </div>

          {/* 主要リスク一覧 */}
          <div className="mb-4">
            <h4 className="font-bold text-gray-700 mb-2">検出されたリスク</h4>
            <div className="space-y-2">
              {riskAnalysisResult.risks.slice(0, 3).map((risk, index) => (
                <div key={index} className="flex items-start gap-2 p-2 bg-gray-50 rounded">
                  <span className={`
                    mt-0.5 w-2 h-2 rounded-full
                    ${risk.level === 'high' ? 'bg-red-500' :
                      risk.level === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}
                  `} />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{risk.category}</p>
                    <p className="text-xs text-gray-600">{risk.summary}</p>
                  </div>
                </div>
              ))}
              {riskAnalysisResult.risks.length > 3 && (
                <p className="text-xs text-gray-500 text-center">
                  他 {riskAnalysisResult.risks.length - 3} 件のリスクが検出されました
                </p>
              )}
            </div>
          </div>

          {/* 次へ誘導 */}
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-800 mb-3">
              分析結果をもとに、あなた専用の利用規約を作成できます。
            </p>
            <button
              onClick={onNext}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all"
            >
              利用規約を作成する →
            </button>
          </div>
        </div>
      )}

      {/* チャット相談セクション */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <button
          onClick={() => setShowChat(!showChat)}
          className="w-full flex items-center justify-between text-left"
        >
          <div>
            <h3 className="text-sm font-bold text-gray-700">より詳しく相談する</h3>
            <p className="text-xs text-gray-500">チャットで法的リスクについて質問できます</p>
          </div>
          <span className="text-gray-400">{showChat ? '▲' : '▼'}</span>
        </button>

        {showChat && (
          <div className="mt-4 space-y-4">
            {/* メッセージ表示エリア */}
            <div className="h-48 overflow-y-auto bg-gray-50 rounded-lg p-3">
              {messages.length === 0 ? (
                <p className="text-center text-gray-400 text-sm mt-8">
                  法的リスクについて質問してください
                </p>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs p-2 rounded-lg text-sm ${
                          msg.role === 'user'
                            ? 'bg-blue-500 text-white'
                            : 'bg-white text-gray-800 shadow'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white shadow p-2 rounded-lg">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 入力エリア */}
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendChat();
                  }
                }}
                placeholder="法的リスクについて質問してください..."
                disabled={isLoading}
                className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSendChat}
                disabled={isLoading || !chatInput.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                送信
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 規約生成へのスキップ（診断なしでも可能） */}
      {!riskAnalysisResult && (
        <div className="text-center">
          <button
            onClick={onNext}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            診断をスキップして規約生成へ進む
          </button>
          <p className="text-xs text-gray-400 mt-1">
            ※ リスク分析なしの場合は一般的な規約が生成されます
          </p>
        </div>
      )}
    </div>
  );
}
