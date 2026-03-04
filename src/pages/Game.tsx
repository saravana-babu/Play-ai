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
import Wordle from '../games/Wordle';
import Mastermind from '../games/Mastermind';
import Anagrams from '../games/Anagrams';
import Nim from '../games/Nim';
import DotsAndBoxes from '../games/DotsAndBoxes';
import WordSearch from '../games/WordSearch';
import SlidingPuzzle from '../games/SlidingPuzzle';
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
import CircuitMapping from '../games/CircuitMapping';
import PlantGrowth from '../games/PlantGrowth';
import NetworkRouting from '../games/NetworkRouting';
import CryptoMarket from '../games/CryptoMarket';
import QuantumLogic from '../games/QuantumLogic';
import SqlMystery from '../games/SqlMystery';
import AlgorithmAssembly from '../games/AlgorithmAssembly';
import NeuralArchitect from '../games/NeuralArchitect';
import PhysicsDrop from '../games/PhysicsDrop';
import DataStructureFlow from '../games/DataStructureFlow';
import Scrabble from '../games/Scrabble';
import Backgammon from '../games/Backgammon';
import StoryTeller from '../games/StoryTeller';
import WiringConnection from '../games/WiringConnection';
import Blackjack from '../games/Blackjack';
import War from '../games/War';
import Baccarat from '../games/Baccarat';
import Poker from '../games/Poker';
import Solitaire from '../games/Solitaire';
import CyberDefense from '../games/CyberDefense';
import Mahjong from '../games/Mahjong';
import MLTuning from '../games/MLTuning';
import Genetic from '../games/Genetic';
import RobotPath from '../games/RobotPath';
import LogicEvaluator from '../games/LogicEvaluator';
import CircuitConnector from '../games/CircuitConnector';
import TuringMachine from '../games/TuringMachine';
import AIKnowledge from '../games/AIKnowledge';
import RegexGolf from '../games/RegexGolf';
import MazeSolver from '../games/MazeSolver';
import GenericAIGame from '../games/GenericAIGame';
import TokenLogViewer from '../components/TokenLogViewer';
import { ArrowLeft, AlertCircle, BrainCircuit } from 'lucide-react';
import { motion } from 'motion/react';

export default function Game() {
  const { id } = useParams<{ id: string }>();
  const { user, apiKeys, selectedLlm, setSelectedLlm, player1Llm, setPlayer1Llm, gameMode, setGameMode, resetSessionTokens } = useStore();
  const navigate = useNavigate();
  const [gameKey, setGameKey] = useState(0);

  useEffect(() => {
    return () => {
      resetSessionTokens();
    };
  }, [resetSessionTokens]);

  const game = GAMES.find((g) => g.id === id);
  const hasAnyKey = !!(apiKeys.gemini || apiKeys.openai || apiKeys.anthropic || apiKeys.deepseek || apiKeys.groq);

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

  const handleLlm1Change = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLlm = e.target.value as LlmProvider;
    if (newLlm !== player1Llm) {
      if (window.confirm('Changing the AI provider will restart the current game. Are you sure?')) {
        setPlayer1Llm(newLlm);
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
      case 'wordle':
        return <Wordle key={gameKey} />;
      case 'mastermind':
        return <Mastermind key={gameKey} />;
      case 'anagrams':
        return <Anagrams key={gameKey} />;
      case 'wordsearch':
        return <WordSearch key={gameKey} />;
      case 'slidingpuzzle':
        return <SlidingPuzzle key={gameKey} />;
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
      case 'circuitmapping':
        return <CircuitMapping key={gameKey} />;
      case 'plantgrowth':
        return <PlantGrowth key={gameKey} />;
      case 'networkrouting':
        return <NetworkRouting key={gameKey} />;
      case 'cryptocurrency':
        return <CryptoMarket key={gameKey} />;
      case 'quantumlogic':
        return <QuantumLogic key={gameKey} />;
      case 'sqlmystery':
        return <SqlMystery key={gameKey} />;
      case 'algorithmassembly':
        return <AlgorithmAssembly key={gameKey} />;
      case 'neuralnetwork':
        return <NeuralArchitect key={gameKey} />;
      case 'physicsdrop':
        return <PhysicsDrop key={gameKey} />;
      case 'datastructure':
        return <DataStructureFlow key={gameKey} />;
      case 'storyteller':
        return <StoryTeller key={gameKey} />;
      case 'wiring':
        return <WiringConnection key={gameKey} />;
      case 'blackjack':
        return <Blackjack key={gameKey} />;
      case 'war':
        return <War key={gameKey} />;
      case 'baccarat':
        return <Baccarat key={gameKey} />;
      case 'poker':
        return <Poker key={gameKey} />;
      case 'solitaire':
        return <Solitaire key={gameKey} />;
      case 'cybersecurity':
        return <CyberDefense key={gameKey} />;
      case 'mahjong':
        return <Mahjong key={gameKey} />;
      case 'mlhyperparameter':
        return <MLTuning key={gameKey} />;
      case 'genetic':
        return <Genetic key={gameKey} />;
      case 'robotpath':
        return <RobotPath key={gameKey} />;
      case 'logicevaluation':
        return <LogicEvaluator key={gameKey} />;
      case 'mazesolver':
        return <MazeSolver key={gameKey} />;
      case 'circuitconnector':
        return <CircuitConnector key={gameKey} />;
      case 'turingmachine':
        return <TuringMachine key={gameKey} />;
      case 'aiknowledge':
        return <AIKnowledge key={gameKey} />;
      case 'regexgolf':
        return <RegexGolf key={gameKey} />;
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

        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 mt-4 sm:mt-0">
          {gameMode === 'llm-vs-llm' && (
            <div className="flex items-center gap-2 bg-slate-900 border border-white/10 rounded-xl px-3 py-2">
              <span className="text-xs text-indigo-400 font-bold pr-2 border-r border-white/10">Player 1</span>
              <BrainCircuit className="w-4 h-4 text-indigo-400" />
              <select
                value={player1Llm}
                onChange={handleLlm1Change}
                className="bg-transparent text-xs sm:text-sm text-white font-bold focus:outline-none cursor-pointer hover:text-indigo-400 transition-colors"
              >
                <option value="gemini" disabled={!apiKeys.gemini} className="bg-slate-800">Gemini {apiKeys.gemini ? '⚡' : '(Missing)'}</option>
                <option value="openai" disabled={!apiKeys.openai} className="bg-slate-800">OpenAI {apiKeys.openai ? '⚡' : '(Missing)'}</option>
                <option value="anthropic" disabled={!apiKeys.anthropic} className="bg-slate-800">Anthropic {apiKeys.anthropic ? '⚡' : '(Missing)'}</option>
                <option value="deepseek" disabled={!apiKeys.deepseek} className="bg-slate-800">DeepSeek {apiKeys.deepseek ? '⚡' : '(Missing)'}</option>
                <option value="groq" disabled={!apiKeys.groq} className="bg-slate-800">Groq {apiKeys.groq ? '⚡' : '(Missing)'}</option>
                <option value="ollama" className="bg-slate-800">Ollama 🏠</option>
              </select>
            </div>
          )}

          <div className="flex items-center gap-2 bg-slate-900 border border-white/10 rounded-xl px-3 py-2">
            {gameMode === 'llm-vs-llm' && (
              <span className="text-xs text-emerald-400 font-bold pr-2 border-r border-white/10">Player 2</span>
            )}
            <BrainCircuit className={`w-4 h-4 ${gameMode === 'llm-vs-llm' ? 'text-emerald-400' : 'text-indigo-400'}`} />
            <select
              value={selectedLlm}
              onChange={handleLlmChange}
              className="bg-transparent text-xs sm:text-sm text-white font-bold focus:outline-none cursor-pointer hover:text-indigo-400 transition-colors"
            >
              <option value="gemini" disabled={!apiKeys.gemini} className="bg-slate-800">Gemini {apiKeys.gemini ? '⚡' : '(Missing)'}</option>
              <option value="openai" disabled={!apiKeys.openai} className="bg-slate-800">OpenAI {apiKeys.openai ? '⚡' : '(Missing)'}</option>
              <option value="anthropic" disabled={!apiKeys.anthropic} className="bg-slate-800">Anthropic {apiKeys.anthropic ? '⚡' : '(Missing)'}</option>
              <option value="deepseek" disabled={!apiKeys.deepseek} className="bg-slate-800">DeepSeek {apiKeys.deepseek ? '⚡' : '(Missing)'}</option>
              <option value="groq" disabled={!apiKeys.groq} className="bg-slate-800">Groq {apiKeys.groq ? '⚡' : '(Missing)'}</option>
              <option value="ollama" className="bg-slate-800">Ollama 🏠</option>
            </select>
          </div>

          <button
            onClick={() => {
              if (window.confirm('Changing game mode will restart the current game. Are you sure?')) {
                setGameMode(gameMode === 'human-vs-ai' ? 'llm-vs-llm' : 'human-vs-ai');
                setGameKey(prev => prev + 1);
              }
            }}
            className="px-3 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-xs font-bold text-indigo-300 rounded-xl border border-indigo-500/30 transition-colors"
          >
            {gameMode === 'human-vs-ai' ? 'AI vs AI' : 'Human vs AI'}
          </button>
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
