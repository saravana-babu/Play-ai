import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { LlmProvider, ApiKeys, useStore } from '../store/useStore';

const getApiKey = (provider: LlmProvider, apiKeys: ApiKeys): string | undefined => {
  const userKey = apiKeys[provider === 'ollama' ? 'gemini' : provider]?.trim();
  if (userKey) return userKey;

  if (provider === 'gemini') {
    return (process.env.GEMINI_API_KEY || '').trim();
  }
  return undefined;
};

const logTokens = (gameId: string, provider: LlmProvider, promptTokens: number, completionTokens: number) => {
  useStore.getState().addLog({
    id: Math.random().toString(36).substring(7),
    timestamp: new Date().toISOString(),
    gameId,
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens,
    provider
  });
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateNextMove = async (
  provider: LlmProvider,
  apiKeys: ApiKeys,
  gameId: string,
  gameState: any,
  systemInstruction: string,
  retries = 2
): Promise<any> => {
  const state = useStore.getState();
  const apiKey = provider !== 'ollama' ? getApiKey(provider, apiKeys) : 'ollama';
  const modelName = state.providerModels[provider];

  if (provider !== 'ollama' && !apiKey) throw new Error(`${provider} API key is missing`);

  try {
    if (provider === 'gemini') {
      const model = modelName || 'gemini-1.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: JSON.stringify(gameState) }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: { responseMimeType: 'application/json' }
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(`Gemini API Error: ${response.statusText} - ${JSON.stringify(errData)}`);
      }
      const data = await response.json();

      const usage = data.usageMetadata;
      if (usage) {
        logTokens(gameId, provider, usage.promptTokenCount || 0, usage.candidatesTokenCount || 0);
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      return JSON.parse(text);
    }

    else if (provider === 'openai' || provider === 'deepseek' || provider === 'groq' || provider === 'ollama') {
      let baseURL = provider === 'deepseek'
        ? 'https://api.deepseek.com'
        : provider === 'groq'
          ? 'https://api.groq.com/openai/v1'
          : provider === 'ollama'
            ? `${state.ollamaSettings.url}/v1`
            : undefined;

      const model = provider === 'ollama' ? state.ollamaSettings.model : modelName;

      const openai = new OpenAI({
        apiKey: provider === 'ollama' ? 'ollama' : apiKey!,
        baseURL,
        dangerouslyAllowBrowser: true
      });

      const response = await openai.chat.completions.create({
        model: model || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: JSON.stringify(gameState) }
        ],
        response_format: { type: 'json_object' }
      });

      if (response.usage) {
        logTokens(gameId, provider, response.usage.prompt_tokens, response.usage.completion_tokens);
      }

      return JSON.parse(response.choices[0].message.content || '{}');
    }

    else if (provider === 'anthropic') {
      const anthropic = new Anthropic({ apiKey: apiKey!, dangerouslyAllowBrowser: true });
      const response = await anthropic.messages.create({
        model: modelName || 'claude-3-5-sonnet-latest',
        max_tokens: 1024,
        system: systemInstruction,
        messages: [
          { role: 'user', content: `Respond with ONLY JSON. ${JSON.stringify(gameState)}` }
        ]
      });

      if (response.usage) {
        logTokens(gameId, provider, response.usage.input_tokens, response.usage.output_tokens);
      }

      const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      return JSON.parse(jsonMatch ? jsonMatch[0] : '{}');
    }

    throw new Error('Invalid provider');
  } catch (error: any) {
    if (retries > 0 && (error.status === 429 || error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED'))) {
      await sleep(2000 * (3 - retries));
      return generateNextMove(provider, apiKeys, gameId, gameState, systemInstruction, retries - 1);
    }
    console.error(`Error generating AI move with ${provider}:`, error);
    throw error;
  }
};

export const getLlmResponse = async (
  prompt: string,
  apiKeys: ApiKeys,
  provider: LlmProvider,
  systemInstruction?: string,
  gameId: string = 'generic',
  retries = 2
): Promise<string> => {
  const state = useStore.getState();
  const apiKey = provider !== 'ollama' ? getApiKey(provider, apiKeys) : 'ollama';
  const modelName = state.providerModels[provider];

  if (provider !== 'ollama' && !apiKey) throw new Error(`${provider} API key is missing`);

  try {
    if (provider === 'gemini') {
      const model = modelName || 'gemini-1.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(`Gemini API Error: ${response.statusText} - ${JSON.stringify(errData)}`);
      }
      const data = await response.json();

      const usage = data.usageMetadata;
      if (usage) {
        logTokens(gameId, provider, usage.promptTokenCount || 0, usage.candidatesTokenCount || 0);
      }

      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }

    else if (provider === 'openai' || provider === 'deepseek' || provider === 'groq' || provider === 'ollama') {
      let baseURL = provider === 'deepseek'
        ? 'https://api.deepseek.com'
        : provider === 'groq'
          ? 'https://api.groq.com/openai/v1'
          : provider === 'ollama'
            ? `${state.ollamaSettings.url}/v1`
            : undefined;

      const model = provider === 'ollama' ? state.ollamaSettings.model : modelName;

      const openai = new OpenAI({
        apiKey: provider === 'ollama' ? 'ollama' : apiKey!,
        baseURL,
        dangerouslyAllowBrowser: true
      });

      const messages: any[] = [];
      if (systemInstruction) {
        messages.push({ role: 'system', content: systemInstruction });
      }
      messages.push({ role: 'user', content: prompt });

      const response = await openai.chat.completions.create({
        model: model || 'gpt-4o-mini',
        messages,
      });

      if (response.usage) {
        logTokens(gameId, provider, response.usage.prompt_tokens, response.usage.completion_tokens);
      }

      return response.choices[0].message.content || '';
    }

    else if (provider === 'anthropic') {
      const anthropic = new Anthropic({ apiKey: apiKey!, dangerouslyAllowBrowser: true });
      const response = await anthropic.messages.create({
        model: modelName || 'claude-3-5-sonnet-latest',
        max_tokens: 1024,
        system: systemInstruction,
        messages: [{ role: 'user', content: prompt }]
      });

      if (response.usage) {
        logTokens(gameId, provider, response.usage.input_tokens, response.usage.output_tokens);
      }

      return response.content[0].type === 'text' ? response.content[0].text : '';
    }

    throw new Error('Invalid provider');
  } catch (error: any) {
    if (retries > 0 && (error.status === 429 || error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED'))) {
      await sleep(2000 * (3 - retries));
      return getLlmResponse(prompt, apiKeys, provider, systemInstruction, gameId, retries - 1);
    }
    console.error(`Error getting LLM response with ${provider}:`, error);
    throw error;
  }
};

export const generateFunnyTask = async (
  provider: LlmProvider,
  apiKeys: ApiKeys,
  gameId: string
): Promise<string> => {
  const state = useStore.getState();
  const apiKey = provider !== 'ollama' ? getApiKey(provider, apiKeys) : 'ollama';
  const modelName = state.providerModels[provider];

  if (provider !== 'ollama' && !apiKey) return 'Do 10 jumping jacks while singing the alphabet backwards!';

  const prompt = `I just lost a game of ${gameId} to you (the AI). Give me a funny, harmless, and slightly embarrassing task to do as a penalty. Keep it under 2 sentences.`;

  try {
    if (provider === 'gemini') {
      const model = modelName || 'gemini-1.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }]
        })
      });

      if (!response.ok) return 'Do 10 jumping jacks while singing the alphabet backwards!';
      const data = await response.json();

      const usage = data.usageMetadata;
      if (usage) {
        logTokens(gameId, provider, usage.promptTokenCount || 0, usage.candidatesTokenCount || 0);
      }

      return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Do 10 jumping jacks while singing the alphabet backwards!';
    }

    else if (provider === 'openai' || provider === 'deepseek' || provider === 'groq' || provider === 'ollama') {
      let baseURL = provider === 'deepseek'
        ? 'https://api.deepseek.com'
        : provider === 'groq'
          ? 'https://api.groq.com/openai/v1'
          : provider === 'ollama'
            ? `${state.ollamaSettings.url}/v1`
            : undefined;

      const model = provider === 'ollama' ? state.ollamaSettings.model : modelName;

      const openai = new OpenAI({
        apiKey: provider === 'ollama' ? 'ollama' : apiKey!,
        baseURL,
        dangerouslyAllowBrowser: true
      });

      const response = await openai.chat.completions.create({
        model: model || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }]
      });

      if (response.usage) {
        logTokens(gameId, provider, response.usage.prompt_tokens, response.usage.completion_tokens);
      }

      return response.choices[0].message.content || 'Do 10 jumping jacks while singing the alphabet backwards!';
    }

    else if (provider === 'anthropic') {
      const anthropic = new Anthropic({ apiKey: apiKey!, dangerouslyAllowBrowser: true });
      const response = await anthropic.messages.create({
        model: modelName || 'claude-3-5-sonnet-latest',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }]
      });

      if (response.usage) {
        logTokens(gameId, provider, response.usage.input_tokens, response.usage.output_tokens);
      }

      return response.content[0].type === 'text' ? response.content[0].text : 'Do 10 jumping jacks while singing the alphabet backwards!';
    }

    return 'Do 10 jumping jacks while singing the alphabet backwards!';
  } catch (error) {
    console.error(`Error generating funny task with ${provider}:`, error);
    return 'Do 10 jumping jacks while singing the alphabet backwards!';
  }
};
