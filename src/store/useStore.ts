import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type LlmProvider = 'gemini' | 'openai' | 'anthropic' | 'deepseek' | 'groq' | 'ollama';

export interface OllamaSettings {
  url: string;
  model: string;
}

export interface ApiKeys {
  gemini: string;
  openai: string;
  anthropic: string;
  deepseek: string;
  groq: string;
}

export interface User {
  id: string | number;
  email: string;
}

export interface TokenLog {
  id: string;
  timestamp: string;
  gameId: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  provider: LlmProvider;
}

export interface ProviderQuota {
  gemini: number;
  openai: number;
  anthropic: number;
  deepseek: number;
  groq: number;
  ollama: number;
}

interface AppState {
  user: User | null;
  apiKeys: ApiKeys;
  providerModels: Record<LlmProvider, string>;
  ollamaSettings: OllamaSettings;
  selectedLlm: LlmProvider;
  player1Llm: LlmProvider;
  gameMode: 'human-vs-ai' | 'llm-vs-llm';
  logs: TokenLog[];
  sessionTokens: number;
  gameSessionTokens: number;
  providerQuotas: ProviderQuota;
  setUser: (user: User | null) => void;
  setApiKeys: (keys: Partial<ApiKeys>) => void;
  setProviderModel: (provider: LlmProvider, model: string) => void;
  setOllamaSettings: (settings: Partial<OllamaSettings>) => void;
  setSelectedLlm: (llm: LlmProvider) => void;
  setPlayer1Llm: (llm: LlmProvider) => void;
  setGameMode: (mode: 'human-vs-ai' | 'llm-vs-llm') => void;
  addLog: (log: TokenLog) => void;
  clearLogs: () => void;
  resetSessionTokens: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      apiKeys: {
        gemini: '',
        openai: '',
        anthropic: '',
        deepseek: '',
        groq: '',
      },
      selectedLlm: 'groq',
      player1Llm: 'groq',
      providerModels: {
        gemini: 'gemini-1.5-flash',
        openai: 'gpt-4o-mini',
        anthropic: 'claude-3-5-sonnet-latest',
        deepseek: 'deepseek-chat',
        groq: 'llama-3.3-70b-versatile',
        ollama: 'llama3',
      },
      ollamaSettings: {
        url: 'http://localhost:11434',
        model: 'llama3',
      },
      gameMode: 'human-vs-ai',
      logs: [],
      sessionTokens: 0,
      gameSessionTokens: 0,
      providerQuotas: {
        gemini: 0,
        openai: 0,
        anthropic: 0,
        deepseek: 0,
        groq: 0,
        ollama: 0,
      },
      setUser: (user) => set({ user }),
      setApiKeys: (keys) => set((state) => ({ apiKeys: { ...state.apiKeys, ...keys } })),
      setProviderModel: (provider, model) => set((state) => ({
        providerModels: { ...state.providerModels, [provider]: model }
      })),
      setOllamaSettings: (settings) => set((state) => ({
        ollamaSettings: { ...state.ollamaSettings, ...settings }
      })),
      setSelectedLlm: (selectedLlm) => set({ selectedLlm }),
      setPlayer1Llm: (player1Llm) => set({ player1Llm }),
      setGameMode: (gameMode) => set({ gameMode }),
      addLog: (log) => set((state) => ({
        logs: [...state.logs, log],
        sessionTokens: state.sessionTokens + log.totalTokens,
        gameSessionTokens: state.gameSessionTokens + log.totalTokens,
        providerQuotas: {
          ...state.providerQuotas,
          [log.provider]: (state.providerQuotas[log.provider] || 0) + log.totalTokens
        }
      })),
      clearLogs: () => set({
        logs: [],
        sessionTokens: 0,
        gameSessionTokens: 0,
        providerQuotas: { gemini: 0, openai: 0, anthropic: 0, deepseek: 0, groq: 0, ollama: 0 }
      }),
      resetSessionTokens: () => set({ gameSessionTokens: 0 }),
    }),
    {
      name: 'neuroplay-storage',
      partialize: (state) => ({
        apiKeys: state.apiKeys,
        providerModels: state.providerModels,
        ollamaSettings: state.ollamaSettings,
        selectedLlm: state.selectedLlm,
        player1Llm: state.player1Llm,
        gameMode: state.gameMode,
        providerQuotas: state.providerQuotas,
        sessionTokens: state.sessionTokens
      }),
    }
  )
);

