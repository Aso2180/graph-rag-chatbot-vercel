'use client';

import { useState, useEffect } from 'react';
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
  const [memberEmail, setMemberEmail] = useState('');
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
      setDiagnosisInput(input);

      const response = await fetch('/api/diagnosis/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
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
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4">
      {/* 法的免責事項 */}
      <LegalDisclaimer />

      {/* ヘッダー */}
      <div className="mb-4 bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="text-2xl font-bold text-blue-600 bg-yellow-200 px-2">GAIS [UPDATED]</div>
              <h1 className="text-xl font-bold bg-green-200 px-1">AI使用上の法的リスク分析</h1>
            </div>
            <p className="text-gray-600 text-sm">生成AI協会会員向け法的リスク検討支援システム</p>
          </div>
          <div className="flex items-center gap-2">
            {/* 設定ボタン */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="詳細設定"
            >
              ⚙
            </button>
            {/* ダッシュボードボタン */}
            {memberEmail && (
              <button
                onClick={() => setShowDashboard(!showDashboard)}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
              >
                📊 Dashboard
              </button>
            )}
          </div>
        </div>

        {/* 設定パネル */}
        {showSettings && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-sm font-bold text-gray-700 mb-3">詳細設定（上級者向け）</h3>
            <p className="text-xs text-gray-500 mb-3">※ 通常は変更不要です</p>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useGraphContext}
                  onChange={(e) => setUseGraphContext(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">内部知識ベースを使用</span>
                  <p className="text-xs text-gray-500">専門知識データベースから関連情報を検索します</p>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useWebSearch}
                  onChange={(e) => setUseWebSearch(e.target.checked)}
                  className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">Web検索を使用</span>
                  <p className="text-xs text-gray-500">最新の法規制情報をWeb検索で取得します</p>
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
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-xs text-blue-800 font-medium">
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
      <div className="flex-1 overflow-y-auto bg-white rounded-lg shadow p-6">
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
