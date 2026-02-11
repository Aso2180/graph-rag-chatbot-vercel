import { DiagnosisInput, DiagnosisResult } from './diagnosis';

export type DocumentType =
  | 'terms_of_service'
  | 'privacy_policy'
  | 'ai_disclaimer'
  | 'internal_risk_report'
  | 'user_guidelines';

export interface DocumentGeneratorInput {
  documentTypes: DocumentType[];
  companyName: string;
  serviceUrl?: string;
  contactEmail: string;
  governingLaw: string;
  additionalClauses?: string;
  diagnosisResult?: DiagnosisResult;
  diagnosisInput?: DiagnosisInput;
  chatHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface GeneratedDocument {
  type: DocumentType;
  title: string;
  content: string;
  generatedAt: string;
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  terms_of_service: '利用規約',
  privacy_policy: 'プライバシーポリシー',
  ai_disclaimer: 'AI免責事項',
  internal_risk_report: '社内リスクレポート',
  user_guidelines: 'ユーザーガイドライン',
};

export const GOVERNING_LAW_OPTIONS = [
  { value: 'japan', label: '日本法' },
  { value: 'eu', label: 'EU法' },
];
