'use client';

import React from 'react';
import { DiagnosisInput } from '@/types/diagnosis';
import { CheckboxGroup } from '@/components/ui/Checkbox';

interface StepAIUsageProps {
  data: Partial<DiagnosisInput>;
  onChange: (data: Partial<DiagnosisInput>) => void;
}

const AI_TECHNOLOGIES = [
  { id: 'llm', label: '大規模言語モデル（LLM）', description: 'ChatGPT、Claude等' },
  { id: 'image_generation', label: '画像生成AI', description: 'DALL-E、Stable Diffusion等' },
  { id: 'speech_recognition', label: '音声認識', description: 'Whisper等' },
  { id: 'speech_synthesis', label: '音声合成（TTS）', description: '合成音声生成' },
  { id: 'translation', label: '機械翻訳', description: '自動翻訳機能' },
  { id: 'ocr', label: 'OCR・文字認識', description: '画像からテキスト抽出' },
  { id: 'face_recognition', label: '顔認識', description: '顔検出・照合' },
  { id: 'sentiment_analysis', label: '感情分析', description: 'テキストの感情判定' },
  { id: 'recommendation', label: 'レコメンデーション', description: '推薦システム' },
  { id: 'prediction', label: '予測・予想', description: '需要予測、価格予測等' },
  { id: 'code_generation', label: 'コード生成', description: 'プログラム自動生成' },
  { id: 'other', label: 'その他', description: '上記以外のAI技術' },
];

const AI_PROVIDERS = [
  { id: 'openai', label: 'OpenAI', description: 'GPT-4, DALL-E, Whisper等' },
  { id: 'anthropic', label: 'Anthropic', description: 'Claude' },
  { id: 'google', label: 'Google', description: 'Gemini, PaLM, Vertex AI' },
  { id: 'microsoft', label: 'Microsoft / Azure', description: 'Azure OpenAI, Cognitive Services' },
  { id: 'amazon', label: 'Amazon / AWS', description: 'Bedrock, SageMaker' },
  { id: 'meta', label: 'Meta', description: 'LLaMA' },
  { id: 'stability', label: 'Stability AI', description: 'Stable Diffusion' },
  { id: 'cohere', label: 'Cohere', description: 'Command, Embed' },
  { id: 'huggingface', label: 'Hugging Face', description: 'オープンソースモデル' },
  { id: 'self_hosted', label: '自社ホスティング', description: 'オンプレミス/自社クラウド' },
  { id: 'other', label: 'その他', description: '上記以外のプロバイダー' },
];

const USE_CASES = [
  { id: 'customer_support', label: 'カスタマーサポート', description: 'チャットボット、FAQ対応' },
  { id: 'content_creation', label: 'コンテンツ作成', description: '記事、広告文、SNS投稿' },
  { id: 'document_processing', label: '文書処理', description: '要約、翻訳、校正' },
  { id: 'data_analysis', label: 'データ分析', description: 'レポート生成、インサイト抽出' },
  { id: 'search', label: '検索・情報取得', description: '社内検索、ナレッジ管理' },
  { id: 'education', label: '教育・学習', description: 'eラーニング、チューター' },
  { id: 'healthcare', label: '医療・ヘルスケア', description: '症状チェック、健康管理' },
  { id: 'legal', label: '法務・契約', description: '契約レビュー、リーガルリサーチ' },
  { id: 'finance', label: '金融・投資', description: '投資分析、リスク評価' },
  { id: 'hr', label: '人事・採用', description: '履歴書分析、面接支援' },
  { id: 'creative', label: 'クリエイティブ', description: 'デザイン、音楽、動画' },
  { id: 'development', label: '開発支援', description: 'コード生成、デバッグ' },
  { id: 'other', label: 'その他', description: '上記以外の用途' },
];

export function StepAIUsage({ data, onChange }: StepAIUsageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          AI技術の利用形態
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          使用しているAI技術とプロバイダーを選択してください。
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            使用するAI技術 <span className="text-red-500">*</span>
          </label>
          <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
            <CheckboxGroup
              options={AI_TECHNOLOGIES}
              selectedValues={data.aiTechnologies || []}
              onChange={(values) => onChange({ ...data, aiTechnologies: values })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            AIプロバイダー / サービス <span className="text-red-500">*</span>
          </label>
          <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
            <CheckboxGroup
              options={AI_PROVIDERS}
              selectedValues={data.aiProviders || []}
              onChange={(values) => onChange({ ...data, aiProviders: values })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            主な用途・ユースケース <span className="text-red-500">*</span>
          </label>
          <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
            <CheckboxGroup
              options={USE_CASES}
              selectedValues={data.useCases || []}
              onChange={(values) => onChange({ ...data, useCases: values })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
