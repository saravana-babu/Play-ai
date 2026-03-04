import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { fetchApi } from '../lib/api';
import { Send, Bot, User, Loader2, Trophy, Skull, BrainCircuit } from 'lucide-react';
import { getLlmResponse } from '../lib/ai';
import { GAMES } from '../lib/games';
import { useParams } from 'react-router-dom';
import ShareButtons from '../components/ShareButtons';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export default function GenericAIGame() {
  const { id } = useParams<{ id: string }>();
  const gameMeta = GAMES.find(g => g.id === id);
  const { user, apiKeys, selectedLlm, player1Llm, gameMode, gameSessionTokens, resetSessionTokens } = useStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<'user' | 'ai' | 'ai-1' | 'ai-2' | 'draw' | null>(null);
  const [penalty, setPenalty] = useState<string | null>(null);
  const [turn, setTurn] = useState<'p1' | 'p2'>('p1');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (gameMode === 'llm-vs-llm' && !gameOver && !isLoading && isMounted.current) {
      if (messages.length === 0 && turn === 'p1') {
        const initText = `We are playing ${gameMeta?.title}. ${gameMeta?.description} Make the first move. If someone wins, you MUST include "GAME_OVER_WIN" or "GAME_OVER_DRAW".`;
        handleAutoMove('p1', initText, true);
      } else {
        setTimeout(() => handleAutoMove(turn), 1500);
      }
    }
  }, [messages, gameMode, turn, gameOver]);

  const handleAutoMove = async (currentTurn: 'p1' | 'p2', initText?: string, isInit = false) => {
    if (isLoading || gameOver || !isMounted.current) return;

    setIsLoading(true);
    const llmToUse = currentTurn === 'p1' ? player1Llm : selectedLlm;

    try {
      let promptText = "";
      if (isInit && initText) {
        promptText = initText;
      } else {
        promptText = messages.map(m => `${m.role === 'user' ? 'Player 1' : 'Player 2'}: ${m.content}`).join('\n') + `\n${currentTurn === 'p1' ? 'Player 1' : 'Player 2'}:`;
      }

      const systemPrompt = `You are playing ${gameMeta?.title} against another AI.
      Act as ${currentTurn === 'p1' ? 'Player 1' : 'Player 2'}. Keep your responses concise and just make your move.
      If you determine that you have won, you MUST include "GAME_OVER_WIN" in your response. 
      If it's a draw, include "GAME_OVER_DRAW".`;

      const response = await getLlmResponse(
        promptText,
        apiKeys,
        llmToUse,
        systemPrompt,
        id
      );

      if (!isMounted.current) return;

      processGameEnding(response, currentTurn === 'p1' ? 'user' : 'assistant', currentTurn);
    } catch (e) {
      if (isMounted.current) setIsLoading(false);
    }
  };

  const handleSend = async (text: string, isInit = false) => {
    if (!text.trim() || isLoading || gameOver || !isMounted.current || gameMode === 'llm-vs-llm') return;

    const newUserMsg: Message = { role: 'user', content: text };
    const newMessages = isInit ? [] : [...messages, newUserMsg];

    if (!isInit) {
      setMessages(newMessages);
      setInput('');
    }

    setIsLoading(true);

    try {
      const systemPrompt = `You are playing ${gameMeta?.title} with the user. 
      Act as the game master and opponent. 
      Keep your responses concise. 
      If the user wins, include "GAME_OVER_USER_WINS" in your response. 
      If you (the AI) win, include "GAME_OVER_AI_WINS" in your response. 
      If it's a draw, include "GAME_OVER_DRAW".`;

      const prompt = newMessages.map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`).join('\n') + `\nUser: ${text}\nAI:`;

      const response = await getLlmResponse(
        isInit ? text : prompt,
        apiKeys,
        selectedLlm,
        systemPrompt,
        id
      );

      if (!isMounted.current) return;
      processGameEnding(response, 'assistant', 'p2', newMessages);

    } catch (error) {
      if (!isMounted.current) return;
      console.error('Failed to get AI response:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error processing your move. Please try again.' }]);
      setIsLoading(false);
    }
  };

  const processGameEnding = async (response: string, msgRole: 'user' | 'assistant', currentTurn: 'p1' | 'p2', baseMessages = messages) => {
    let cleanResponse = response;
    let gameEnded = false;
    let currentWinner: 'user' | 'ai' | 'ai-1' | 'ai-2' | 'draw' | null = null;

    if (gameMode === 'llm-vs-llm') {
      if (response.includes('GAME_OVER_WIN')) {
        cleanResponse = response.replace('GAME_OVER_WIN', '').trim();
        gameEnded = true;
        currentWinner = currentTurn === 'p1' ? 'ai-1' : 'ai-2';
      } else if (response.includes('GAME_OVER_DRAW')) {
        cleanResponse = response.replace('GAME_OVER_DRAW', '').trim();
        gameEnded = true;
        currentWinner = 'draw';
      }
    } else {
      if (response.includes('GAME_OVER_USER_WINS')) {
        cleanResponse = response.replace('GAME_OVER_USER_WINS', '').trim();
        gameEnded = true;
        currentWinner = 'user';
      } else if (response.includes('GAME_OVER_AI_WINS')) {
        cleanResponse = response.replace('GAME_OVER_AI_WINS', '').trim();
        gameEnded = true;
        currentWinner = 'ai';
      } else if (response.includes('GAME_OVER_DRAW')) {
        cleanResponse = response.replace('GAME_OVER_DRAW', '').trim();
        gameEnded = true;
        currentWinner = 'draw';
      }
    }

    const newMsg: Message = { role: msgRole, content: cleanResponse };
    setMessages([...baseMessages, newMsg]);
    setIsLoading(false);
    setTurn(currentTurn === 'p1' ? 'p2' : 'p1');

    if (gameEnded) {
      setGameOver(true);
      setWinner(currentWinner);

      let penaltyTask = null;
      if (currentWinner === 'ai' && gameMode !== 'llm-vs-llm') {
        penaltyTask = await getLlmResponse(
          'The user just lost a game. Generate a short, funny, harmless penalty task for them to do in real life (e.g., "Do 5 jumping jacks", "Sing the alphabet backwards"). Just the task, no intro.',
          apiKeys,
          selectedLlm,
          undefined,
          id
        );
        if (isMounted.current) setPenalty(penaltyTask);
      }

      if (user && isMounted.current) {
        await fetchApi('/history', {
          method: 'POST',
          body: JSON.stringify({
            game_id: id,
            winner: currentWinner,
            funny_task: penaltyTask,
            total_tokens: gameSessionTokens
          })
        });
      }
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-slate-950 rounded-2xl border border-white/10 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.filter(m => m.role !== 'system').map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 text-indigo-400" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === 'user'
              ? 'bg-indigo-500 text-white rounded-tr-sm'
              : 'bg-slate-800 text-slate-200 rounded-tl-sm'
              }`}>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                {gameMode === 'llm-vs-llm' ? (
                  <BrainCircuit className="w-5 h-5 text-indigo-400" />
                ) : (
                  <User className="w-5 h-5 text-slate-300" />
                )}
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="bg-slate-800 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
              <span className="text-sm text-slate-400">
                {gameMode === 'llm-vs-llm'
                  ? `${turn === 'p1' ? 'AI 1' : 'AI 2'} is thinking...`
                  : 'AI is thinking...'}
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {gameOver && (
        <div className="p-6 bg-slate-900 border-t border-white/10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 bg-slate-800">
            {winner === 'user' ? (
              <Trophy className="w-8 h-8 text-yellow-400" />
            ) : winner === 'ai' ? (
              <Skull className="w-8 h-8 text-rose-400" />
            ) : (
              <Bot className="w-8 h-8 text-slate-400" />
            )}
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">
            {winner === 'user' ? 'You Won!' : winner === 'ai' ? 'AI Wins!' : winner === 'ai-1' ? 'AI 1 Wins!' : winner === 'ai-2' ? 'AI 2 Wins!' : 'Draw!'}
          </h3>
          {penalty && (
            <div className="mt-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl inline-block text-left max-w-md">
              <p className="text-sm font-semibold text-rose-400 mb-1">Your Penalty Task:</p>
              <p className="text-white">{penalty}</p>
            </div>
          )}

          <ShareButtons
            gameTitle={gameMeta?.title || 'a mystery game'}
            result={winner === 'user' ? 'won' : winner === 'draw' ? 'tied' : 'lost'}
            penalty={penalty}
          />

          <div className="mt-6">
            <button
              onClick={() => {
                setMessages([]);
                setGameOver(false);
                setWinner(null);
                setPenalty(null);
                resetSessionTokens();
              }}
              className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium transition-colors"
            >
              Play Again
            </button>
          </div>
        </div>
      )}

      {!gameOver && gameMode !== 'llm-vs-llm' && (
        <div className="p-4 bg-slate-900 border-t border-white/10">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your move or message..."
              className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-4 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      )}
      {!gameOver && gameMode === 'llm-vs-llm' && (
        <div className="p-4 bg-slate-900 border-t border-white/10 flex justify-center text-slate-400 text-sm italic">
          AI bots are playing against each other automatically...
        </div>
      )}
    </div>
  );
}
