import { GeminiAdapter, OpenAIAdapter, AnthropicAdapter, DeepSeekAdapter, GroqAdapter } from '../adapters/providers';
import { LLMPayload } from '../adapters/types';

const providers = {
  google: new GeminiAdapter(),
  openai: new OpenAIAdapter(),
  anthropic: new AnthropicAdapter(),
  deepseek: new DeepSeekAdapter(),
  groq: new GroqAdapter()
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GENERATE_RESPONSE') {
    handleGeneration(request.payload).then(sendResponse);
    return true; // Keep channel open
  }
});

async function handleGeneration(payload: LLMPayload) {
  const settings = await chrome.storage.local.get(['selectedProvider', 'selectedModel', 'apiKeys']);
  const providerKey = settings.selectedProvider || 'google';
  const apiKey = settings.apiKeys?.[providerKey];
  const model = settings.selectedModel;

  if (!apiKey) return { text: '', error: `API Key for ${providerKey} is missing.` };

  const adapter = (providers as any)[providerKey];
  if (!adapter) return { text: '', error: 'Unsupported provider.' };

  return await adapter.generate({
    ...payload,
    model: model || adapter.models[0],
    apiKey
  });
}
