'use client';

import { useState, useEffect } from 'react';
import { UserContext, userContextToDiagnosisInput, riskHintsByPurpose } from '@/types/userContext';
import { DiagnosisResult } from '@/types/diagnosis';
import { DiagnosisProgress } from './DiagnosisProgress';

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
  const [modalMessage, setModalMessage] = useState<string | null>(null);

  // 診断進捗管理
  const [diagnosisStep, setDiagnosisStep] = useState<'init' | 'graph-search' | 'analyzing' | 'complete'>('init');
  const [estimatedTime, setEstimatedTime] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (isAnalyzing) {
      // 診断開始
      setDiagnosisStep('init');
      setEstimatedTime(120); // 初期推定2分

      // 段階的に進捗を更新
      const timer1 = setTimeout(() => {
        setDiagnosisStep('graph-search');
        setEstimatedTime(90);
      }, 5000);

      const timer2 = setTimeout(() => {
        setDiagnosisStep('analyzing');
        setEstimatedTime(60);
      }, 30000);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    } else if (riskAnalysisResult) {
      setDiagnosisStep('complete');
      setEstimatedTime(undefined);
    }
  }, [isAnalyzing, riskAnalysisResult]);

  // ユーザーコンテキストからサマリーを生成
  const getSummary = () => {
    const basicInfo: string[] = [];
    if (userContext.isIndividual) basicInfo.push('社内利用');
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
        isAnalyzing ? (
          <DiagnosisProgress
            currentStep={diagnosisStep}
            estimatedTimeRemaining={estimatedTime}
          />
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-2">法的リスクを自動診断する</h3>
            <p className="text-sm text-gray-600 mb-4">
              入力内容をもとに、想定される法的リスクをAIが自動分析します。
            </p>
            <button
              onClick={onAnalyze}
              disabled={isAnalyzing}
              className="w-full py-3 rounded-lg font-bold text-lg transition-all bg-purple-600 text-white hover:bg-purple-700 shadow-lg hover:shadow-xl"
            >
              <span className="flex items-center justify-center gap-2">
                🔍 リスク診断を開始する
              </span>
            </button>
          </div>
        )
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

          {/* リスクレベルの凡例 */}
          <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs font-medium text-blue-800 mb-2">リスクレベルの凡例：</p>
            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                <span className="text-gray-700">高リスク</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                <span className="text-gray-700">中リスク</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span className="text-gray-700">低リスク</span>
              </div>
            </div>
          </div>

          {/* 全リスク一覧 */}
          <div className="mb-4">
            <h4 className="font-bold text-gray-700 mb-2">検出されたリスク（全{riskAnalysisResult.risks.length}件）</h4>
            <div className="space-y-2">
              {riskAnalysisResult.risks.map((risk, index) => (
                <div key={index} className="flex items-start gap-2 p-3 bg-gray-50 rounded border border-gray-200">
                  <span className={`
                    mt-0.5 w-2 h-2 rounded-full flex-shrink-0
                    ${risk.level === 'high' ? 'bg-red-500' :
                      risk.level === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}
                  `} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{risk.category}</p>
                    <p className="text-xs text-gray-600 mt-1">{risk.summary}</p>
                  </div>
                </div>
              ))}
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
            <div className="h-96 overflow-y-auto bg-gray-50 rounded-lg p-4 border border-gray-200">
              {messages.length === 0 ? (
                <div className="text-center text-gray-400 text-sm mt-16">
                  <p className="mb-2">💬 法的リスクについて質問してください</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-2xl p-3 rounded-lg ${
                          msg.role === 'user'
                            ? 'bg-blue-500 text-white'
                            : 'bg-white text-gray-800 shadow-md border border-gray-200'
                        }`}
                      >
                        {msg.role === 'assistant' ? (
                          <div>
                            <div className="prose prose-sm max-w-none">
                              {msg.content.split('\n').slice(0, 5).map((line, i) => {
                                if (line.startsWith('## ')) {
                                  return <h2 key={i} className="text-base font-bold mt-3 mb-2">{line.replace('## ', '')}</h2>;
                                } else if (line.startsWith('### ')) {
                                  return <h3 key={i} className="text-sm font-bold mt-2 mb-1">{line.replace('### ', '')}</h3>;
                                } else if (line.startsWith('**') && line.endsWith('**')) {
                                  return <p key={i} className="font-semibold mt-1">{line.replace(/\*\*/g, '')}</p>;
                                } else if (line.startsWith('- ')) {
                                  return <li key={i} className="ml-4">{line.replace('- ', '')}</li>;
                                } else if (line.trim() === '') {
                                  return <br key={i} />;
                                } else {
                                  return <p key={i} className="text-sm leading-relaxed">{line}</p>;
                                }
                              })}
                            </div>
                            <button
                              onClick={() => setModalMessage(msg.content)}
                              className="mt-2 text-xs text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                              </svg>
                              全文を拡大表示
                            </button>
                          </div>
                        ) : (
                          <p className="text-sm">{msg.content}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white shadow-md border border-gray-200 p-3 rounded-lg">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-100" />
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-200" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 入力エリア */}
            <div className="flex gap-2">
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendChat();
                  }
                }}
                placeholder="法的リスクについて質問してください"
                disabled={isLoading}
                rows={2}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <button
                onClick={handleSendChat}
                disabled={isLoading || !chatInput.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? '送信中...' : '送信'}
              </button>
            </div>
            <p className="text-xs text-gray-500 text-center">
              💡 GraphRAGとWeb検索を使用して、保存された法的資料と最新情報を基に回答します
            </p>
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

      {/* チャット回答の拡大表示モーダル */}
      {modalMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">回答の詳細</h3>
              <button
                onClick={() => setModalMessage(null)}
                className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8">
              <div className="prose prose-sm max-w-none">
                {modalMessage.split('\n').map((line, i) => {
                  if (line.startsWith('## ')) {
                    return <h2 key={i} className="text-xl font-bold mt-6 mb-3">{line.replace('## ', '')}</h2>;
                  } else if (line.startsWith('### ')) {
                    return <h3 key={i} className="text-lg font-bold mt-4 mb-2">{line.replace('### ', '')}</h3>;
                  } else if (line.startsWith('**') && line.endsWith('**')) {
                    return <p key={i} className="font-semibold mt-2">{line.replace(/\*\*/g, '')}</p>;
                  } else if (line.startsWith('- ')) {
                    return <li key={i} className="ml-6 my-1">{line.replace('- ', '')}</li>;
                  } else if (line.trim() === '') {
                    return <br key={i} />;
                  } else {
                    return <p key={i} className="text-base leading-relaxed my-2">{line}</p>;
                  }
                })}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setModalMessage(null)}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
