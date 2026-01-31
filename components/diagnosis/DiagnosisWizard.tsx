'use client';

import React, { useState } from 'react';
import { DiagnosisInput, DiagnosisResult } from '@/types/diagnosis';
import { WizardProgress } from './WizardProgress';
import { StepBasicInfo } from './steps/StepBasicInfo';
import { StepAIUsage } from './steps/StepAIUsage';
import { StepDataHandling } from './steps/StepDataHandling';
import { StepTargetUsers } from './steps/StepTargetUsers';
import { StepConcerns } from './steps/StepConcerns';
import { DiagnosisResultView } from './DiagnosisResult';

const STEPS = [
  { title: '基本情報', shortTitle: '基本情報' },
  { title: 'AI利用形態', shortTitle: 'AI利用' },
  { title: 'データ取扱', shortTitle: 'データ' },
  { title: '想定ユーザー', shortTitle: 'ユーザー' },
  { title: '懸念事項', shortTitle: '懸念事項' },
];

interface DiagnosisWizardProps {
  onComplete?: (result: DiagnosisResult) => void;
  onChatWithResult?: (summary: string) => void;
  onGenerateDocuments?: (result: DiagnosisResult, input: DiagnosisInput) => void;
}

export function DiagnosisWizard({ onComplete, onChatWithResult, onGenerateDocuments }: DiagnosisWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<DiagnosisInput>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/diagnosis/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '診断の実行に失敗しました');
      }

      const diagnosisResult: DiagnosisResult = await response.json();
      setResult(diagnosisResult);
      onComplete?.(diagnosisResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期せぬエラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setFormData({});
    setResult(null);
    setError(null);
  };

  const handleChatWithResult = () => {
    if (result) {
      const summary = `【リスク診断結果のサマリー】
アプリ名: ${result.appName || '未設定'}
総合リスクレベル: ${result.overallRiskLevel === 'high' ? '高' : result.overallRiskLevel === 'medium' ? '中' : '低'}

${result.executiveSummary}

優先対応事項:
${result.priorityActions.map((action, i) => `${i + 1}. ${action}`).join('\n')}

上記の診断結果について、詳しく相談させてください。`;
      onChatWithResult?.(summary);
    }
  };

  const handleGenerateDocuments = () => {
    if (result && formData) {
      onGenerateDocuments?.(result, formData as DiagnosisInput);
    }
  };

  const isStepValid = (): boolean => {
    switch (currentStep) {
      case 1:
        return !!(formData.appDescription?.trim() && formData.pricingModel);
      case 2:
        return !!(
          formData.aiTechnologies?.length &&
          formData.aiProviders?.length &&
          formData.useCases?.length
        );
      case 3:
        return !!(
          formData.inputDataTypes?.length &&
          formData.dataTransmission &&
          formData.dataStorage?.length
        );
      case 4:
        return !!(formData.targetUsers?.length);
      case 5:
        return true; // 最終ステップはオプション項目のみ
      default:
        return false;
    }
  };

  // 結果表示
  if (result) {
    return (
      <DiagnosisResultView
        result={result}
        onReset={handleReset}
        onChatWithResult={handleChatWithResult}
        onGenerateDocuments={onGenerateDocuments ? handleGenerateDocuments : undefined}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <WizardProgress
        currentStep={currentStep}
        totalSteps={STEPS.length}
        steps={STEPS}
      />

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-red-500 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        {/* Step content */}
        {currentStep === 1 && (
          <StepBasicInfo data={formData} onChange={setFormData} />
        )}
        {currentStep === 2 && (
          <StepAIUsage data={formData} onChange={setFormData} />
        )}
        {currentStep === 3 && (
          <StepDataHandling data={formData} onChange={setFormData} />
        )}
        {currentStep === 4 && (
          <StepTargetUsers data={formData} onChange={setFormData} />
        )}
        {currentStep === 5 && (
          <StepConcerns data={formData} onChange={setFormData} />
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              currentStep === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
          >
            戻る
          </button>

          {currentStep < STEPS.length ? (
            <button
              onClick={handleNext}
              disabled={!isStepValid()}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                isStepValid()
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-blue-200 text-blue-400 cursor-not-allowed'
              }`}
            >
              次へ
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center ${
                isSubmitting
                  ? 'bg-blue-400 text-white cursor-wait'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  診断中...
                </>
              ) : (
                '診断を実行'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
