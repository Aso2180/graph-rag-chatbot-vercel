// 診断入力データ
export interface DiagnosisInput {
  appName?: string;
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
  chatHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

// リスク項目
export interface RiskItem {
  category: string;
  level: 'high' | 'medium' | 'low';
  summary: string;
  details: string;
  legalBasis: string[];
  recommendations: string[];
  graphRagSources: string[];
}

// 診断結果
export interface DiagnosisResult {
  overallRiskLevel: 'high' | 'medium' | 'low';
  executiveSummary: string;
  risks: RiskItem[];
  priorityActions: string[];
  relatedCases: string[];
  disclaimer: string;
  diagnosedAt: string;
  appName?: string;
}
