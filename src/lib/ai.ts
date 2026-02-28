import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { LlmProvider, ApiKeys, useStore } from '../store/useStore';

const getApiKey = (provider: LlmProvider, apiKeys: ApiKeys): string | undefined => {
  const userKey = apiKeys[provider]?.trim();
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
  const apiKey = getApiKey(provider, apiKeys);
  if (!apiKey) throw new Error(`${provider} API key is missing`);

  try {
    if (provider === 'gemini') {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: JSON.stringify(gameState),
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
        },
      });
      
      const usage = response.usageMetadata;
      if (usage) {
        logTokens(gameId, provider, usage.promptTokenCount || 0, usage.candidatesTokenCount || 0);
      }
      
      return JSON.parse(response.text || '{}');
    } 
    
    else if (provider === 'openai') {
      const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
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
      const anthropic = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
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
  const apiKey = getApiKey(provider, apiKeys);
  if (!apiKey) throw new Error(`${provider} API key is missing`);

  try {
    if (provider === 'gemini') {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: prompt,
        config: systemInstruction ? { systemInstruction } : undefined,
      });
      
      const usage = response.usageMetadata;
      if (usage) {
        logTokens(gameId, provider, usage.promptTokenCount || 0, usage.candidatesTokenCount || 0);
      }
      
      return response.text || '';
    } 
    
    else if (provider === 'openai') {
      const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
      const messages: any[] = [];
      if (systemInstruction) {
        messages.push({ role: 'system', content: systemInstruction });
      }
      messages.push({ role: 'user', content: prompt });
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
      });
      
      if (response.usage) {
        logTokens(gameId, provider, response.usage.prompt_tokens, response.usage.completion_tokens);
      }
      
      return response.choices[0].message.content || '';
    } 
    
    else if (provider === 'anthropic') {
      const anthropic = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
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
  const apiKey = getApiKey(provider, apiKeys);
  if (!apiKey) return 'Do 10 jumping jacks while singing the alphabet backwards!';

  const prompt = `I just lost a game of ${gameId} to you (the AI). Give me a funny, harmless, and slightly embarrassing task to do as a penalty. Keep it under 2 sentences.`;
  
  try {
    if (provider === 'gemini') {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: prompt,
      });
      
      const usage = response.usageMetadata;
      if (usage) {
        logTokens(gameId, provider, usage.promptTokenCount || 0, usage.candidatesTokenCount || 0);
      }
      
      return response.text || 'Do 10 jumping jacks while singing the alphabet backwards!';
    }
    
    else if (provider === 'openai') {
      const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }]
      });
      
      if (response.usage) {
        logTokens(gameId, provider, response.usage.prompt_tokens, response.usage.completion_tokens);
      }
      
      return response.choices[0].message.content || 'Do 10 jumping jacks while singing the alphabet backwards!';
    }
    
    else if (provider === 'anthropic') {
      const anthropic = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
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
