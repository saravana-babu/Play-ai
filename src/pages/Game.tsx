import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore, LlmProvider } from '../store/useStore';
import { GAMES } from '../lib/games';
import TicTacToe from '../games/TicTacToe';
import Connect4 from '../games/Connect4';
import WordChain from '../games/WordChain';
import Sudoku from '../games/Sudoku';
import MemoryMatch from '../games/MemoryMatch';
import Hangman from '../games/Hangman';
import Minesweeper from '../games/Minesweeper';
import Game2048 from '../games/Game2048';
import Trivia from '../games/Trivia';
import MathQuiz from '../games/MathQuiz';
import SimonSays from '../games/SimonSays';
import EmojiCharades from '../games/EmojiCharades';
import Pong from '../games/Pong';
import FlappyBird from '../games/FlappyBird';
import Wordle from '../games/Wordle';
import ReactionTime from '../games/ReactionTime';
import TypingTest from '../games/TypingTest';
import ColorblindTest from '../games/ColorblindTest';
import Mastermind from '../games/Mastermind';
import Anagrams from '../games/Anagrams';
import Nim from '../games/Nim';
import DotsAndBoxes from '../games/DotsAndBoxes';
import AimTrainer from '../games/AimTrainer';
import WordSearch from '../games/WordSearch';
import SlidingPuzzle from '../games/SlidingPuzzle';
import ChimpTest from '../games/ChimpTest';
import VisualMemory from '../games/VisualMemory';
import SequenceMemory from '../games/SequenceMemory';
import NumberMemory from '../games/NumberMemory';
import VerbalMemory from '../games/VerbalMemory';
import Chess from '../games/Chess';
import Mancala from '../games/Mancala';
import Battleship from '../games/Battleship';
import Checkers from '../games/Checkers';
import Reversi from '../games/Reversi';
import PatternMatch from '../games/PatternMatch';
import GoFish from '../games/GoFish';
import Cryptogram from '../games/Cryptogram';
import Crossword from '../games/Crossword';
import Boggle from '../games/Boggle';
import SpatialReasoning from '../games/SpatialReasoning';
import Scrabble from '../games/Scrabble';
import Backgammon from '../games/Backgammon';
import DinosaurRun from '../games/DinosaurRun';
import GenericAIGame from '../games/GenericAIGame';
import TokenLogViewer from '../components/TokenLogViewer';
import { ArrowLeft, AlertCircle, BrainCircuit } from 'lucide-react';
import { motion } from 'motion/react';

export default function Game() {
  const { id } = useParams<{ id: string }>();
  const { user, apiKeys, selectedLlm, setSelectedLlm, resetSessionTokens } = useStore();
  const navigate = useNavigate();
  const [gameKey, setGameKey] = useState(0);

  useEffect(() => {
    return () => {
      resetSessionTokens();
    };
  }, [resetSessionTokens]);
  
  const game = GAMES.find((g) => g.id === id);
  const hasAnyKey = !!(apiKeys.gemini || apiKeys.openai || apiKeys.anthropic);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (!hasAnyKey) {
      navigate('/settings');
    }
  }, [user, hasAnyKey, navigate]);

  const handleLlmChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLlm = e.target.value as LlmProvider;
    if (newLlm !== selectedLlm) {
      if (window.confirm('Changing the AI provider will restart the current game. Are you sure?')) {
        setSelectedLlm(newLlm);
        setGameKey(prev => prev + 1); // Force re-render of the game component
      }
    }
  };

  if (!game) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-white mb-4">Game not found</h2>
        <button onClick={() => navigate('/')} className="text-indigo-400 hover:underline">
          Return to Home
        </button>
      </div>
    );
  }

  if (!game.isPlayable) {
    return (
      <div className="text-center py-20">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/20 mb-4">
          <AlertCircle className="w-8 h-8 text-amber-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">{game.title} is coming soon!</h2>
        <p className="text-slate-400 mb-8">Our AI is still learning how to play this game.</p>
        <button onClick={() => navigate('/')} className="text-indigo-400 hover:underline">
          Return to Home
        </button>
      </div>
    );
  }

  const renderGame = () => {
    switch (id) {
      case 'tictactoe':
        return <TicTacToe key={gameKey} />;
      case 'connect4':
        return <Connect4 key={gameKey} />;
      case 'wordchain':
        return <WordChain key={gameKey} />;
      case 'sudoku':
        return <Sudoku key={gameKey} />;
      case 'memory':
        return <MemoryMatch key={gameKey} />;
      case 'hangman':
        return <Hangman key={gameKey} />;
      case 'minesweeper':
        return <Minesweeper key={gameKey} />;
      case '2048':
        return <Game2048 key={gameKey} />;
      case 'trivia':
        return <Trivia key={gameKey} />;
      case 'mathquiz':
        return <MathQuiz key={gameKey} />;
      case 'simonsays':
        return <SimonSays key={gameKey} />;
      case 'emojicharades':
        return <EmojiCharades key={gameKey} />;
      case 'pong':
        return <Pong key={gameKey} />;
      case 'flappybird':
        return <FlappyBird key={gameKey} />;
      case 'wordle':
        return <Wordle key={gameKey} />;
      case 'reaction':
        return <ReactionTime key={gameKey} />;
      case 'typing':
        return <TypingTest key={gameKey} />;
      case 'colorblind':
        return <ColorblindTest key={gameKey} />;
      case 'mastermind':
        return <Mastermind key={gameKey} />;
      case 'anagrams':
        return <Anagrams key={gameKey} />;
      case 'aimtrainer':
        return <AimTrainer key={gameKey} />;
      case 'wordsearch':
        return <WordSearch key={gameKey} />;
      case 'slidingpuzzle':
        return <SlidingPuzzle key={gameKey} />;
      case 'chimp':
        return <ChimpTest key={gameKey} />;
      case 'visualmemory':
        return <VisualMemory key={gameKey} />;
      case 'sequence':
        return <SequenceMemory key={gameKey} />;
      case 'numbermemory':
        return <NumberMemory key={gameKey} />;
      case 'verbalmemory':
        return <VerbalMemory key={gameKey} />;
      case 'nim':
        return <Nim key={gameKey} />;
      case 'dots':
        return <DotsAndBoxes key={gameKey} />;
      case 'chess':
        return <Chess key={gameKey} />;
      case 'mancala':
        return <Mancala key={gameKey} />;
      case 'battleship':
        return <Battleship key={gameKey} />;
      case 'checkers':
        return <Checkers key={gameKey} />;
      case 'reversi':
        return <Reversi key={gameKey} />;
      case 'patternmatch':
        return <PatternMatch key={gameKey} />;
      case 'gofish':
        return <GoFish key={gameKey} />;
      case 'cryptogram':
        return <Cryptogram key={gameKey} />;
      case 'crossword':
        return <Crossword key={gameKey} />;
      case 'boggle':
        return <Boggle key={gameKey} />;
      case 'spatial':
        return <SpatialReasoning key={gameKey} />;
      case 'scrabble':
        return <Scrabble key={gameKey} />;
      case 'backgammon':
        return <Backgammon key={gameKey} />;
      case 'dinosaur':
        return <DinosaurRun key={gameKey} />;
      default:
        return <GenericAIGame key={gameKey} />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-white/5 rounded-xl transition-colors text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">{game.title}</h1>
            <p className="text-sm text-slate-400">{game.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 border border-white/10 rounded-xl px-3 py-2">
          <BrainCircuit className="w-4 h-4 text-indigo-400" />
          <select
            value={selectedLlm}
            onChange={handleLlmChange}
            className="bg-transparent text-sm text-white font-medium focus:outline-none cursor-pointer"
          >
            <option value="gemini" disabled={!apiKeys.gemini}>Gemini {apiKeys.gemini ? '' : '(Key Missing)'}</option>
            <option value="openai" disabled={!apiKeys.openai}>OpenAI {apiKeys.openai ? '' : '(Key Missing)'}</option>
            <option value="anthropic" disabled={!apiKeys.anthropic}>Anthropic {apiKeys.anthropic ? '' : '(Key Missing)'}</option>
          </select>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl"
      >
        {renderGame()}
      </motion.div>

      <TokenLogViewer />
    </div>
  );
}
