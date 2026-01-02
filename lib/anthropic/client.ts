import Anthropic from '@anthropic-ai/sdk';

let anthropicClient: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not set in environment variables');
    }

    anthropicClient = new Anthropic({
      apiKey: apiKey,
    });
  }
  
  return anthropicClient;
}

export const MODEL_NAME = process.env.MODEL_NAME || 'claude-sonnet-4-5-20250929';