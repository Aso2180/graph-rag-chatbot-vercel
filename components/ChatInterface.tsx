'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import LegalDisclaimer from './LegalDisclaimer';
import MemberDashboard from './MemberDashboard';
import { validateUploadPermission } from '@/lib/member/validation';
import { Modal } from './ui/Modal';
import { DiagnosisResult, DiagnosisInput } from '@/types/diagnosis';
import {
  AppStep,
  UserContext,
  initialUserContext,
  userContextToDiagnosisInput,
} from '@/types/userContext';
import { StepNavigation } from './steps/StepNavigation';
import { Step1UserContext } from './steps/Step1UserContext';
import { Step2RiskAnalysis } from './steps/Step2RiskAnalysis';
import { Step3TermsGeneration } from './steps/Step3TermsGeneration';
import { AdvancedSettings } from './steps/AdvancedSettings';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: {
    graphSources: number;
    webSources: number;
  };
}

export default function ChatInterface() {
  // アプリステップ管理
  const [currentStep, setCurrentStep] = useState<AppStep>(1);
  const [completedSteps, setCompletedSteps] = useState<Set<AppStep>>(new Set());
  const [userContext, setUserContext] = useState<UserContext>(initialUserContext);

  // 既存の状態
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [useGraphContext, setUseGraphContext] = useState(true);
  const [useWebSearch, setUseWebSearch] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [memberEmail, setMemberEmail] = useState('gais@test.com');
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(null);
  const [diagnosisInput, setDiagnosisInput] = useState<DiagnosisInput | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // ステップ遷移
  const handleStepClick = (step: AppStep) => {
    if (completedSteps.has(step) || step === currentStep) {
      setCurrentStep(step);
    }
  };

  const goToStep = (step: AppStep) => {
    // 現在のステップを完了としてマーク
    if (step > currentStep) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
    }
    setCurrentStep(step);
  };

  // ユーザーコンテキストの更新
  const updateUserContext = (updates: Partial<UserContext>) => {
    setUserContext(prev => ({ ...prev, ...updates }));
  };

  // リスク診断の実行
  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const input = userContextToDiagnosisInput(userContext);
      // チャット履歴を追加
      const inputWithChat = {
        ...input,
        chatHistory: messages.map(m => ({ role: m.role, content: m.content }))
      };
      setDiagnosisInput(inputWithChat);

      const response = await fetch('/api/diagnosis/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputWithChat),
      });

      const data = await response.json();

      if (response.ok) {
        setDiagnosisResult(data);
        // 診断完了でステップ2を完了としてマーク
        setCompletedSteps(prev => new Set([...prev, 2]));
      } else {
        throw new Error(data.error || '分析に失敗しました');
      }
    } catch (error) {
      console.error('診断エラー:', error);
      alert('診断中にエラーが発生しました。再度お試しください。');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // PDFアップロード
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileSizeMB = file.size / (1024 * 1024);
    const validationResult = validateUploadPermission(memberEmail, file.type, fileSizeMB);

    if (!validationResult.isValid) {
      alert(validationResult.error);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('memberEmail', memberEmail);

    try {
      setIsLoading(true);
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        updateUserContext({ hasPDFUploaded: true });

        const systemMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `📄 PDF「${file.name}」のアップロードが完了しました。分析精度が向上します。`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, systemMessage]);
      } else {
        alert(data.error || 'アップロードに失敗しました。');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('アップロード中にエラーが発生しました。');
    } finally {
      setIsLoading(false);
      event.target.value = '';
    }
  };

  // チャットメッセージ送信
  const sendMessage = async (messageContent: string) => {
    if (!messageContent.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageContent,
          useGraphContext,
          useWebSearch,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
          sources: data.sources,
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '申し訳ありません。エラーが発生しました。再度お試しください。',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen max-w-4xl mx-auto p-2 sm:p-4">
      {/* 法的免責事項 */}
      <LegalDisclaimer />

      {/* ヘッダー */}
      <div className="mb-4 bg-white rounded-lg shadow p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
              <div className="text-xl sm:text-2xl font-bold text-blue-600 bg-yellow-200 px-2 w-fit">GAIS</div>
              <h1 className="text-base sm:text-xl font-bold bg-green-200 px-1 w-fit">AI使用上の法的リスク分析</h1>
            </div>
            <p className="text-gray-600 text-xs sm:text-sm">生成AI協会会員向け法的リスク検討支援システム</p>
          </div>
          <div className="flex items-center justify-end gap-2 sm:gap-3 flex-shrink-0">
            {/* キャラクター＆バナー */}
            <div className="hidden sm:flex flex-col items-center">
              <Image
                src="/tane-kun.png"
                alt="タネ君"
                width={64}
                height={64}
                className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
                priority
              />
              <div className="text-[9px] sm:text-[10px] font-medium text-green-700 bg-green-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded mt-1 whitespace-nowrap">
                皆で安全に楽しくAIを活用しよう
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* 設定ボタン */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-1.5 sm:p-2 text-lg sm:text-xl text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors shadow-sm border border-gray-300"
                title="詳細設定"
              >
                ⚙️
              </button>
              {/* ダッシュボードボタン */}
              {memberEmail && (
                <button
                  onClick={() => setShowDashboard(!showDashboard)}
                  className="px-2 sm:px-3 py-1 bg-green-600 text-white rounded text-xs sm:text-sm hover:bg-green-700 transition-colors whitespace-nowrap"
                >
                  📊 Dashboard
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 設定パネル */}
        {showSettings && (
          <div className="mb-4 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-xs sm:text-sm font-bold text-gray-700 mb-2 sm:mb-3">詳細設定（上級者向け）</h3>
            <p className="text-[10px] sm:text-xs text-gray-500 mb-2 sm:mb-3">※ 通常は変更不要です</p>
            <div className="space-y-2 sm:space-y-3">
              <label className="flex items-start gap-2 sm:gap-3 cursor-pointer p-2 sm:p-3 rounded-lg hover:bg-gray-100 transition-colors">
                <input
                  type="checkbox"
                  checked={useGraphContext}
                  onChange={(e) => setUseGraphContext(e.target.checked)}
                  className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 accent-blue-600 cursor-pointer flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs sm:text-sm font-medium text-gray-700">内部知識ベースを使用</span>
                    <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap ${useGraphContext ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                      {useGraphContext ? 'ON' : 'OFF'}
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-gray-500 mt-1">専門知識データベースから関連情報を検索します</p>
                </div>
              </label>
              <label className="flex items-start gap-2 sm:gap-3 cursor-pointer p-2 sm:p-3 rounded-lg hover:bg-gray-100 transition-colors">
                <input
                  type="checkbox"
                  checked={useWebSearch}
                  onChange={(e) => setUseWebSearch(e.target.checked)}
                  className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 accent-green-600 cursor-pointer flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs sm:text-sm font-medium text-gray-700">Web検索を使用</span>
                    <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap ${useWebSearch ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {useWebSearch ? 'ON' : 'OFF'}
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-gray-500 mt-1">最新の法規制情報をWeb検索で取得します</p>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* ダッシュボード */}
        {showDashboard && memberEmail && (
          <div className="mb-3 p-4 bg-white rounded-lg shadow">
            <MemberDashboard memberEmail={memberEmail} />
          </div>
        )}

        {/* おすすめの使い方 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4">
          <p className="text-[10px] sm:text-xs text-blue-800 font-medium">
            📖 おすすめの使い方: ① 利用状況を入力 → ② 法的リスクを確認 → ③ 利用規約を作成
          </p>
        </div>

        {/* ステップナビゲーション */}
        <StepNavigation
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepClick={handleStepClick}
        />
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 overflow-y-auto bg-white rounded-lg shadow p-3 sm:p-6">
        {currentStep === 1 && (
          <Step1UserContext
            userContext={userContext}
            onUpdate={updateUserContext}
            onNext={() => goToStep(2)}
            onFileUpload={handleFileUpload}
            memberEmail={memberEmail}
            onMemberEmailChange={setMemberEmail}
            isLoading={isLoading}
          />
        )}

        {currentStep === 2 && (
          <Step2RiskAnalysis
            userContext={userContext}
            riskAnalysisResult={diagnosisResult}
            onAnalyze={handleAnalyze}
            onAnalysisComplete={setDiagnosisResult}
            onNext={() => goToStep(3)}
            onBack={() => setCurrentStep(1)}
            isAnalyzing={isAnalyzing}
            messages={messages}
            onSendMessage={sendMessage}
            isLoading={isLoading}
          />
        )}

        {currentStep === 3 && (
          <Step3TermsGeneration
            userContext={userContext}
            riskAnalysisResult={diagnosisResult}
            diagnosisInput={diagnosisInput}
            chatHistory={messages.map(m => ({ role: m.role, content: m.content }))}
            onBack={() => setCurrentStep(2)}
            onComplete={() => {
              setCompletedSteps(prev => new Set([...prev, 3]));
            }}
          />
        )}
      </div>
    </div>
  );
}
