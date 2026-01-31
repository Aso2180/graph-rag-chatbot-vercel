'use client';

import React, { useState } from 'react';
import {
  DocumentType,
  DocumentGeneratorInput,
  GeneratedDocument,
  GOVERNING_LAW_OPTIONS,
} from '@/types/document';
import { DiagnosisResult, DiagnosisInput } from '@/types/diagnosis';
import { DocumentTypeSelector } from './DocumentTypeSelector';
import { DocumentPreview } from './DocumentPreview';

interface DocumentGeneratorProps {
  diagnosisResult?: DiagnosisResult;
  diagnosisInput?: DiagnosisInput;
  onClose?: () => void;
}

type Step = 'select' | 'info' | 'generating' | 'preview';

export function DocumentGenerator({
  diagnosisResult,
  diagnosisInput,
  onClose,
}: DocumentGeneratorProps) {
  const [step, setStep] = useState<Step>('select');
  const [selectedTypes, setSelectedTypes] = useState<DocumentType[]>([]);
  const [formData, setFormData] = useState({
    companyName: '',
    serviceUrl: '',
    contactEmail: '',
    governingLaw: 'japan',
    additionalClauses: '',
  });
  const [generatedDocuments, setGeneratedDocuments] = useState<GeneratedDocument[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (selectedTypes.length === 0) {
      setError('文書タイプを選択してください');
      return;
    }
    if (!formData.companyName.trim()) {
      setError('会社名を入力してください');
      return;
    }
    if (!formData.contactEmail.trim()) {
      setError('連絡先メールアドレスを入力してください');
      return;
    }

    setStep('generating');
    setError(null);

    try {
      const input: DocumentGeneratorInput = {
        documentTypes: selectedTypes,
        companyName: formData.companyName,
        serviceUrl: formData.serviceUrl || undefined,
        contactEmail: formData.contactEmail,
        governingLaw: formData.governingLaw,
        additionalClauses: formData.additionalClauses || undefined,
        diagnosisResult,
        diagnosisInput,
      };

      const response = await fetch('/api/generator/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '文書生成に失敗しました');
      }

      const documents: GeneratedDocument[] = await response.json();
      setGeneratedDocuments(documents);
      setStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期せぬエラーが発生しました');
      setStep('info');
    }
  };

  const handleReset = () => {
    setStep('select');
    setSelectedTypes([]);
    setGeneratedDocuments([]);
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress indicator */}
      {step !== 'preview' && (
        <div className="mb-6">
          <div className="flex items-center justify-center space-x-4">
            <StepIndicator
              number={1}
              label="文書選択"
              isActive={step === 'select'}
              isCompleted={step === 'info' || step === 'generating'}
            />
            <div className="w-12 h-0.5 bg-gray-300" />
            <StepIndicator
              number={2}
              label="情報入力"
              isActive={step === 'info'}
              isCompleted={step === 'generating'}
            />
            <div className="w-12 h-0.5 bg-gray-300" />
            <StepIndicator
              number={3}
              label="生成"
              isActive={step === 'generating'}
              isCompleted={false}
            />
          </div>
        </div>
      )}

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
        {/* Step 1: Document type selection */}
        {step === 'select' && (
          <>
            <DocumentTypeSelector
              selectedTypes={selectedTypes}
              onChange={setSelectedTypes}
            />

            {diagnosisResult && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start">
                  <svg
                    className="w-5 h-5 text-blue-500 mt-0.5 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">診断結果を反映</p>
                    <p className="text-blue-700">
                      「{diagnosisResult.appName || 'AIアプリ'}」の診断結果に基づいて、
                      リスク対応を含む文書を生成します。
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
              {onClose && (
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
                >
                  キャンセル
                </button>
              )}
              <button
                onClick={() => setStep('info')}
                disabled={selectedTypes.length === 0}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  selectedTypes.length === 0
                    ? 'bg-blue-200 text-blue-400 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                次へ
              </button>
            </div>
          </>
        )}

        {/* Step 2: Additional information */}
        {step === 'info' && (
          <>
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              文書生成に必要な情報
            </h3>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="companyName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  会社名・サービス提供者名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) =>
                    setFormData({ ...formData, companyName: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="例: 株式会社〇〇"
                />
              </div>

              <div>
                <label
                  htmlFor="serviceUrl"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  サービスURL（任意）
                </label>
                <input
                  type="url"
                  id="serviceUrl"
                  value={formData.serviceUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, serviceUrl: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="例: https://example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="contactEmail"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  連絡先メールアドレス <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="contactEmail"
                  value={formData.contactEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, contactEmail: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="例: legal@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="governingLaw"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  準拠法
                </label>
                <select
                  id="governingLaw"
                  value={formData.governingLaw}
                  onChange={(e) =>
                    setFormData({ ...formData, governingLaw: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  {GOVERNING_LAW_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="additionalClauses"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  追加条項・特記事項（任意）
                </label>
                <textarea
                  id="additionalClauses"
                  value={formData.additionalClauses}
                  onChange={(e) =>
                    setFormData({ ...formData, additionalClauses: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="文書に含めたい特別な条項や注意事項があれば記載してください"
                />
              </div>
            </div>

            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={() => setStep('select')}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
              >
                戻る
              </button>
              <button
                onClick={handleGenerate}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
              >
                文書を生成
              </button>
            </div>
          </>
        )}

        {/* Step 3: Generating */}
        {step === 'generating' && (
          <div className="py-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4" />
            <p className="text-lg font-medium text-gray-900">文書を生成しています...</p>
            <p className="text-sm text-gray-600 mt-2">
              選択された{selectedTypes.length}種類の文書を生成中です
            </p>
          </div>
        )}

        {/* Step 4: Preview */}
        {step === 'preview' && (
          <DocumentPreview
            documents={generatedDocuments}
            onBack={() => setStep('info')}
            onReset={handleReset}
          />
        )}
      </div>
    </div>
  );
}

interface StepIndicatorProps {
  number: number;
  label: string;
  isActive: boolean;
  isCompleted: boolean;
}

function StepIndicator({ number, label, isActive, isCompleted }: StepIndicatorProps) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
          isCompleted
            ? 'bg-blue-500 text-white'
            : isActive
            ? 'bg-blue-500 text-white ring-4 ring-blue-100'
            : 'bg-gray-200 text-gray-500'
        }`}
      >
        {isCompleted ? (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          number
        )}
      </div>
      <span
        className={`mt-1 text-xs ${
          isActive ? 'text-blue-600 font-medium' : 'text-gray-500'
        }`}
      >
        {label}
      </span>
    </div>
  );
}
