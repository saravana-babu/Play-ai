import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { generateNextMove, generateFunnyTask } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Trophy, Frown, Send, AlertCircle } from 'lucide-react';
import ShareButton from '../components/ShareButton';

interface WordEntry {
  word: string;
  player: 'user' | 'ai';
}

export default function WordChain() {
  const [words, setWords] = useState<WordEntry[]>([]);
  const [inputWord, setInputWord] = useState('');
  const [isUserTurn, setIsUserTurn] = useState(true);
  const [winner, setWinner] = useState<'user' | 'ai' | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [funnyTask, setFunnyTask] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { apiKeys, selectedLlm, user, gameSessionTokens, resetSessionTokens } = useStore();
  const endOfListRef = useRef<HTMLDivElement>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    endOfListRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [words]);

  useEffect(() => {
    if (!isUserTurn && !winner) {
      makeAiMove();
    }
  }, [isUserTurn, winner]);

  const handleWin = async (result: 'user' | 'ai') => {
    if (!isMounted.current) return;
    setWinner(result);
    let task = null;
    
    if (result === 'ai' && apiKeys[selectedLlm]) {
      task = await generateFunnyTask(selectedLlm, apiKeys, 'Word Chain');
      if (!isMounted.current) return;
      setFunnyTask(task);
    }

    if (user && isMounted.current) {
      try {
        await fetchApi('/history', {
          method: 'POST',
          body: JSON.stringify({
            game_id: 'wordchain',
            winner: result,
            funny_task: task,
            total_tokens: gameSessionTokens
          })
        });
      } catch (err) {
        console.error('Failed to save game result:', err);
      }
    }
  };

  const validateWord = (word: string): string | null => {
    const cleanWord = word.trim().toLowerCase();
    
    if (!cleanWord) return 'Please enter a word.';
    if (!/^[a-z]+$/.test(cleanWord)) return 'Words can only contain letters.';
    if (cleanWord.length < 3) return 'Word must be at least 3 letters long.';
    
    if (words.length > 0) {
      const lastWord = words[words.length - 1].word;
      const expectedLetter = lastWord[lastWord.length - 1];
      
      if (cleanWord[0] !== expectedLetter) {
        return `Word must start with '${expectedLetter.toUpperCase()}'.`;
      }
      
      if (words.some(w => w.word === cleanWord)) {
        return 'That word has already been used!';
      }
    }
    
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isUserTurn || winner || isAiThinking) return;

    const validationError = validateWord(inputWord);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    const newWord = inputWord.trim().toLowerCase();
    setWords([...words, { word: newWord, player: 'user' }]);
    setInputWord('');
    setIsUserTurn(false);
  };

  const makeAiMove = async () => {
    if (!apiKeys[selectedLlm] || !isMounted.current) return;
    setIsAiThinking(true);

    try {
      const lastWord = words[words.length - 1].word;
      const startingLetter = lastWord[lastWord.length - 1];
      const usedWords = words.map(w => w.word);
      
      const systemInstruction = `You are playing a Word Chain game. The user just played "${lastWord}". You must respond with a valid English word that starts with the letter "${startingLetter}". The word must be at least 3 letters long. You CANNOT use any of these previously used words: ${usedWords.join(', ')}. Return ONLY a JSON object with a single key 'word' containing your chosen word. If you cannot think of a word, return {"word": "GIVE_UP"}.`;
      
      const response = await generateNextMove(selectedLlm, apiKeys, 'wordchain', { lastWord, usedWords }, systemInstruction);
      
      if (!isMounted.current) return;

      if (response && response.word) {
        const aiWord = response.word.toLowerCase();
        
        if (aiWord === 'give_up') {
          handleWin('user');
        } else {
          setWords(prev => [...prev, { word: aiWord, player: 'ai' }]);
          setIsUserTurn(true);
        }
      } else {
        throw new Error("Invalid AI response");
      }
    } catch (error) {
      if (!isMounted.current) return;
      console.error('AI move failed:', error);
      // If AI fails, user wins
      handleWin('user');
    } finally {
      if (isMounted.current) {
        setIsAiThinking(false);
      }
    }
  };

  const resetGame = () => {
    setWords([]);
    setInputWord('');
    setIsUserTurn(true);
    setWinner(null);
    setFunnyTask(null);
    setError(null);
    resetSessionTokens();
  };

  return (
    <div className="flex flex-col items-center max-w-2xl mx-auto">
      <div className="mb-8 flex items-center gap-8 text-center w-full justify-center">
        <div className={`p-4 rounded-2xl border transition-colors ${isUserTurn && !winner ? 'bg-indigo-500/20 border-indigo-500/50' : 'bg-slate-800 border-white/10'}`}>
          <p className="text-sm text-slate-400 font-semibold uppercase tracking-wider mb-1">You</p>
          <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xl">
            {words.filter(w => w.player === 'user').length}
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-500">VS</div>
        <div className={`p-4 rounded-2xl border transition-colors ${!isUserTurn && !winner ? 'bg-emerald-500/20 border-emerald-500/50' : 'bg-slate-800 border-white/10'}`}>
          <p className="text-sm text-slate-400 font-semibold uppercase tracking-wider mb-1">AI</p>
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xl">
            {words.filter(w => w.player === 'ai').length}
          </div>
        </div>
      </div>

      <div className="w-full bg-slate-950 border border-white/10 rounded-3xl p-4 sm:p-6 shadow-inner min-h-[300px] max-h-[400px] overflow-y-auto mb-6 flex flex-col gap-3">
        {words.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-slate-500 text-center">
            <p>You go first! Enter any word to start the chain.</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {words.map((entry, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${entry.player === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`px-4 py-3 rounded-2xl max-w-[80%] ${
                  entry.player === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-sm' 
                    : 'bg-slate-800 text-slate-200 rounded-tl-sm border border-white/5'
                }`}>
                  <span className="text-lg font-medium tracking-wide">
                    {entry.word.split('').map((char, i) => (
                      <span key={i} className={
                        (index > 0 && i === 0) || (i === entry.word.length - 1) 
                          ? 'font-bold text-amber-300' 
                          : ''
                      }>
                        {char}
                      </span>
                    ))}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        
        {isAiThinking && !winner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="px-4 py-3 rounded-2xl bg-slate-800 text-slate-400 rounded-tl-sm border border-white/5 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-sm">Thinking...</span>
            </div>
          </motion.div>
        )}
        <div ref={endOfListRef} />
      </div>

      {!winner ? (
        <form onSubmit={handleSubmit} className="w-full space-y-3">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-rose-400 text-sm px-2"
            >
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </motion.div>
          )}
          
          <div className="relative flex items-center">
            {words.length > 0 && (
              <div className="absolute left-4 w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center font-bold text-amber-400 border border-white/10">
                {words[words.length - 1].word.slice(-1).toUpperCase()}
              </div>
            )}
            
            <input
              type="text"
              value={inputWord}
              onChange={(e) => {
                setInputWord(e.target.value);
                setError(null);
              }}
              disabled={!isUserTurn || isAiThinking}
              placeholder={words.length === 0 ? "Enter a starting word..." : "Type your word..."}
              className={`w-full bg-slate-900 border border-white/10 rounded-2xl py-4 pr-14 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${
                words.length > 0 ? 'pl-16' : 'pl-6'
              }`}
              autoFocus
            />
            
            <button
              type="submit"
              disabled={!inputWord.trim() || !isUserTurn || isAiThinking}
              className="absolute right-2 p-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex justify-between px-2 text-xs text-slate-500">
            <span>Min 3 letters</span>
            <button 
              type="button" 
              onClick={() => handleWin('ai')}
              className="hover:text-rose-400 transition-colors"
            >
              I give up!
            </button>
          </div>
        </form>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full text-center space-y-4"
        >
          <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-xl shadow-lg ${
            winner === 'user' ? 'bg-indigo-500 text-white shadow-indigo-500/25' :
            'bg-rose-500 text-white shadow-rose-500/25'
          }`}>
            {winner === 'user' ? <><Trophy className="w-6 h-6" /> You Win!</> :
             <><Frown className="w-6 h-6" /> AI Wins!</>}
          </div>

          {funnyTask && (
            <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl mt-6">
              <p className="text-sm text-rose-400 font-bold uppercase tracking-widest mb-2">Penalty Task</p>
              <p className="text-lg font-medium text-rose-100">{funnyTask}</p>
            </div>
          )}

          <div className="flex gap-4 justify-center mt-6">
            <button
              onClick={resetGame}
              className="px-8 py-4 bg-white text-slate-950 hover:bg-slate-200 rounded-2xl font-bold transition-colors flex items-center justify-center gap-2 shadow-xl"
            >
              <RefreshCw className="w-5 h-5" />
              Play Again
            </button>
            <ShareButton 
              gameTitle="Word Chain" 
              winner={winner} 
              funnyTask={funnyTask} 
            />
          </div>
        </motion.div>
      )}
    </div>
  );
}
