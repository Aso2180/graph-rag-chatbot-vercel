export interface ChatRequest {
  message: string;
  useGraphContext?: boolean;
}

export interface ChatResponse {
  response: string;
  graphContextUsed: boolean;
  model: string;
}

export interface ErrorResponse {
  error: string;
}