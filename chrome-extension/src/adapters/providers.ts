import { AIAdapter, LLMPayload, LLMResponse } from './types';

export class GeminiAdapter implements AIAdapter {
  id = 'google';
  name = 'Google Gemini';
  models = ['gemini-1.5-pro', 'gemini-1.5-flash'];

  async generate(payload: LLMPayload): Promise<LLMResponse> {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${payload.model}:generateContent?key=${payload.apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${payload.context || ''}\n\n${payload.prompt}` }] }]
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Gemini API Error');
      
      return { text: data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response.' };
    } catch (err: any) {
      return { text: '', error: err.message };
    }
  }
}

export class OpenAIAdapter implements AIAdapter {
  id = 'openai';
  name = 'OpenAI';
  models = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'];

  async generate(payload: LLMPayload): Promise<LLMResponse> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${payload.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: payload.model,
          messages: [
            { role: 'system', content: 'You are a helpful web assistant. Provide concise, high-quality responses.' },
            { role: 'user', content: `${payload.context || ''}\n\n${payload.prompt}` }
          ]
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'OpenAI API Error');
      
      return { text: data.choices[0].message.content };
    } catch (err: any) {
      return { text: '', error: err.message };
    }
  }
}

export class AnthropicAdapter implements AIAdapter {
    id = 'anthropic';
    name = 'Anthropic Claude';
    models = ['claude-3-5-sonnet-20240620', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'];
  
    async generate(payload: LLMPayload): Promise<LLMResponse> {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': payload.apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
            'dangerously-allow-browser': 'true'
          },
          body: JSON.stringify({
            model: payload.model,
            max_tokens: 2000,
            messages: [
              { role: 'user', content: `${payload.context || ''}\n\n${payload.prompt}` }
            ]
          })
        });
  
        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || 'Anthropic API Error');
        
        return { text: data.content[0].text };
      } catch (err: any) {
        return { text: '', error: err.message };
      }
    }
  }

export class DeepSeekAdapter implements AIAdapter {
  id = 'deepseek';
  name = 'DeepSeek';
  models = ['deepseek-chat', 'deepseek-reasoner'];

  async generate(payload: LLMPayload): Promise<LLMResponse> {
    try {
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${payload.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: payload.model || 'deepseek-chat',
          messages: [
            { role: 'system', content: 'You are a professional AI assistant.' },
            { role: 'user', content: `${payload.context || ''}\n\n${payload.prompt}` }
          ]
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'DeepSeek API Error');
      return { text: data.choices[0].message.content };
    } catch (err: any) {
      return { text: '', error: err.message };
    }
  }
}

export class GroqAdapter implements AIAdapter {
  id = 'groq';
  name = 'Groq';
  models = ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768'];

  async generate(payload: LLMPayload): Promise<LLMResponse> {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${payload.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: payload.model || 'llama-3.3-70b-versatile',
          messages: [
            { role: 'user', content: `${payload.context || ''}\n\n${payload.prompt}` }
          ]
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Groq API Error');
      return { text: data.choices[0].message.content };
    } catch (err: any) {
      return { text: '', error: err.message };
    }
  }
}

