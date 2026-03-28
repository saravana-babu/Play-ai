export interface LLMResponse {
  text: string;
  error?: string;
}

export interface LLMPayload {
  prompt: string;
  model: string;
  apiKey: string;
  context?: string;
}

export interface AIAdapter {
  id: string;
  name: string;
  models: string[];
  generate(payload: LLMPayload): Promise<LLMResponse>;
}
