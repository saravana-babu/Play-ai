import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type LlmProvider = 'gemini' | 'openai' | 'anthropic';

export interface ApiKeys {
  gemini: string;
  openai: string;
  anthropic: string;
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
}

interface AppState {
  user: User | null;
  apiKeys: ApiKeys;
  selectedLlm: LlmProvider;
  logs: TokenLog[];
  sessionTokens: number;
  gameSessionTokens: number;
  providerQuotas: ProviderQuota;
  setUser: (user: User | null) => void;
  setApiKeys: (keys: Partial<ApiKeys>) => void;
  setSelectedLlm: (llm: LlmProvider) => void;
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
      },
      selectedLlm: 'gemini',
      logs: [],
      sessionTokens: 0,
      gameSessionTokens: 0,
      providerQuotas: {
        gemini: 0,
        openai: 0,
        anthropic: 0,
      },
      setUser: (user) => set({ user }),
      setApiKeys: (keys) => set((state) => ({ apiKeys: { ...state.apiKeys, ...keys } })),
      setSelectedLlm: (selectedLlm) => set({ selectedLlm }),
      addLog: (log) => set((state) => ({ 
        logs: [...state.logs, log],
        sessionTokens: state.sessionTokens + log.totalTokens,
        gameSessionTokens: state.gameSessionTokens + log.totalTokens,
        providerQuotas: {
          ...state.providerQuotas,
          [log.provider]: state.providerQuotas[log.provider] + log.totalTokens
        }
      })),
      clearLogs: () => set({ 
        logs: [], 
        sessionTokens: 0, 
        gameSessionTokens: 0,
        providerQuotas: { gemini: 0, openai: 0, anthropic: 0 }
      }),
      resetSessionTokens: () => set({ gameSessionTokens: 0 }),
    }),
    {
      name: 'neuroplay-storage',
      partialize: (state) => ({ apiKeys: state.apiKeys, selectedLlm: state.selectedLlm }),
    }
  )
);

