import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { generateFunnyTask } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Trophy, Skull, Crosshair, Shield, Info } from 'lucide-react';
import ShareButtons from '../components/ShareButtons';

type CellState = 'empty' | 'ship' | 'hit' | 'miss';
type Grid = CellState[][];

const GRID_SIZE = 10;
const SHIPS = [
  { name: 'Carrier', size: 5 },
  { name: 'Battleship', size: 4 },
  { name: 'Destroyer', size: 3 },
  { name: 'Submarine', size: 3 },
  { name: 'Patrol Boat', size: 2 },
];

export default function Battleship() {
  const [playerGrid, setPlayerGrid] = useState<Grid>([]);
  const [aiGrid, setAiGrid] = useState<Grid>([]);
  const [aiVisibleGrid, setAiVisibleGrid] = useState<Grid>([]);
  const [gameState, setGameState] = useState<'setup' | 'playing' | 'gameOver'>('setup');
  const [turn, setTurn] = useState<'player' | 'ai'>('player');
  const [winner, setWinner] = useState<'player' | 'ai' | null>(null);
  const [funnyTask, setFunnyTask] = useState<string | null>(null);
  const [message, setMessage] = useState('Place your ships or click Auto-Place');
  const { apiKeys, selectedLlm, user } = useStore();

  const createEmptyGrid = () => Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill('empty'));

  const placeShipsRandomly = (grid: Grid) => {
    const newGrid = grid.map(row => [...row]);
    SHIPS.forEach(ship => {
      let placed = false;
      while (!placed) {
        const isHorizontal = Math.random() > 0.5;
        const row = Math.floor(Math.random() * GRID_SIZE);
        const col = Math.floor(Math.random() * GRID_SIZE);

        if (canPlaceShip(newGrid, row, col, ship.size, isHorizontal)) {
          for (let i = 0; i < ship.size; i++) {
            if (isHorizontal) newGrid[row][col + i] = 'ship';
            else newGrid[row + i][col] = 'ship';
          }
          placed = true;
        }
      }
    });
    return newGrid;
  };

  const canPlaceShip = (grid: Grid, row: number, col: number, size: number, isHorizontal: boolean) => {
    if (isHorizontal) {
      if (col + size > GRID_SIZE) return false;
      for (let i = 0; i < size; i++) {
        if (grid[row][col + i] !== 'empty') return false;
      }
    } else {
      if (row + size > GRID_SIZE) return false;
      for (let i = 0; i < size; i++) {
        if (grid[row + i][col] !== 'empty') return false;
      }
    }
    return true;
  };

  const initGame = () => {
    setPlayerGrid(createEmptyGrid());
    setAiGrid(placeShipsRandomly(createEmptyGrid()));
    setAiVisibleGrid(createEmptyGrid());
    setGameState('setup');
    setTurn('player');
    setWinner(null);
    setFunnyTask(null);
    setMessage('Place your ships or click Auto-Place');
  };

  useEffect(() => {
    initGame();
  }, []);

  const handleAutoPlace = () => {
    setPlayerGrid(placeShipsRandomly(createEmptyGrid()));
    setMessage('Ships placed! Ready to start?');
  };

  const startGame = () => {
    const shipCount = playerGrid.flat().filter(c => c === 'ship').length;
    if (shipCount === SHIPS.reduce((a, b) => a + b.size, 0)) {
      setGameState('playing');
      setMessage('Your turn! Attack the AI grid.');
    } else {
      setMessage('Please place all your ships first.');
    }
  };

  const handleAttack = (row: number, col: number) => {
    if (gameState !== 'playing' || turn !== 'player') return;
    if (aiVisibleGrid[row][col] !== 'empty') return;

    const newAiVisible = [...aiVisibleGrid.map(r => [...r])];
    const isHit = aiGrid[row][col] === 'ship';
    newAiVisible[row][col] = isHit ? 'hit' : 'miss';
    setAiVisibleGrid(newAiVisible);

    if (isHit) {
      setMessage('Direct hit! Go again.');
      if (checkWin(newAiVisible, aiGrid)) {
        handleEnd('player');
      }
    } else {
      setMessage('Miss! AI is thinking...');
      setTurn('ai');
      setTimeout(aiTurn, 1000);
    }
  };

  const aiTurn = () => {
    if (gameState !== 'playing') return;

    const newPlayerGrid = [...playerGrid.map(r => [...r])];
    let row, col;

    // Simple AI: pick a random empty or ship cell
    do {
      row = Math.floor(Math.random() * GRID_SIZE);
      col = Math.floor(Math.random() * GRID_SIZE);
    } while (newPlayerGrid[row][col] === 'hit' || newPlayerGrid[row][col] === 'miss');

    const isHit = newPlayerGrid[row][col] === 'ship';
    newPlayerGrid[row][col] = isHit ? 'hit' : 'miss';
    setPlayerGrid(newPlayerGrid);

    if (isHit) {
      setMessage('AI hit your ship!');
      if (checkWin(newPlayerGrid, null)) {
        handleEnd('ai');
      } else {
        setTimeout(aiTurn, 1000);
      }
    } else {
      setMessage('AI missed! Your turn.');
      setTurn('player');
    }
  };

  const checkWin = (visibleGrid: Grid, hiddenGrid: Grid | null) => {
    const targetHits = SHIPS.reduce((a, b) => a + b.size, 0);
    const currentHits = visibleGrid.flat().filter(c => c === 'hit').length;
    return currentHits === targetHits;
  };

  const handleEnd = async (w: 'player' | 'ai') => {
    setGameState('gameOver');
    setWinner(w);
    let task = null;
    if (w === 'ai' && apiKeys[selectedLlm]) {
      task = await generateFunnyTask(selectedLlm, apiKeys, 'Battleship');
      setFunnyTask(task);
    }

    if (user) {
      await fetchApi('/history', {
        method: 'POST',
        body: JSON.stringify({
          game_id: 'battleship',
          winner: w === 'player' ? 'user' : 'ai',
          funny_task: task
        })
      });
    }
  };

  return (
    <div className="flex flex-col items-center max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-xl font-bold text-white mb-2">{message}</h2>
        {gameState === 'setup' && (
          <div className="flex gap-4 justify-center">
            <button onClick={handleAutoPlace} className="px-6 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors border border-white/10">
              Auto-Place
            </button>
            <button onClick={startGame} className="px-6 py-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors font-bold">
              Start Game
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full">
        {/* Player Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-indigo-400 font-bold flex items-center gap-2">
              <Shield className="w-4 h-4" /> Your Fleet
            </h3>
            <span className="text-xs text-slate-500 uppercase font-bold tracking-widest">Defense</span>
          </div>
          <div className="grid grid-cols-10 gap-1 bg-slate-900 p-2 rounded-2xl border border-white/10 shadow-xl aspect-square">
            {playerGrid.map((row, rIdx) =>
              row.map((cell, cIdx) => (
                <div
                  key={`${rIdx}-${cIdx}`}
                  className={`rounded-sm transition-all duration-300 flex items-center justify-center
                    ${cell === 'empty' ? 'bg-slate-800/50' :
                      cell === 'ship' ? 'bg-indigo-500/40 border border-indigo-500/50' :
                        cell === 'hit' ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' :
                          'bg-slate-700'}
                  `}
                >
                  {cell === 'hit' && <Crosshair className="w-3 h-3 text-white" />}
                  {cell === 'miss' && <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />}
                </div>
              ))
            )}
          </div>
        </div>

        {/* AI Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-rose-400 font-bold flex items-center gap-2">
              <Crosshair className="w-4 h-4" /> Enemy Waters
            </h3>
            <span className="text-xs text-slate-500 uppercase font-bold tracking-widest">Attack</span>
          </div>
          <div className="grid grid-cols-10 gap-1 bg-slate-900 p-2 rounded-2xl border border-white/10 shadow-xl aspect-square">
            {aiVisibleGrid.map((row, rIdx) =>
              row.map((cell, cIdx) => (
                <button
                  key={`${rIdx}-${cIdx}`}
                  onClick={() => handleAttack(rIdx, cIdx)}
                  disabled={gameState !== 'playing' || turn !== 'player' || cell !== 'empty'}
                  className={`rounded-sm transition-all duration-300 flex items-center justify-center
                    ${cell === 'empty' ? 'bg-slate-800 hover:bg-slate-700 cursor-crosshair' :
                      cell === 'hit' ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' :
                        'bg-slate-700'}
                  `}
                >
                  {cell === 'hit' && <Crosshair className="w-3 h-3 text-white" />}
                  {cell === 'miss' && <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />}
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {gameState === 'gameOver' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-12 w-full max-w-md"
          >
            <div className={`p-10 rounded-3xl border text-center ${winner === 'player' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
              {winner === 'player' ? (
                <>
                  <Trophy className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                  <h3 className="text-3xl font-bold text-white mb-2">Victory!</h3>
                  <p className="text-slate-400">You've sunk the entire enemy fleet.</p>
                </>
              ) : (
                <>
                  <Skull className="w-16 h-16 text-rose-400 mx-auto mb-4" />
                  <h3 className="text-3xl font-bold text-white mb-2">Defeat!</h3>
                  <p className="text-slate-400">Your fleet has been destroyed.</p>
                </>
              )}
            </div>

            <ShareButtons
              gameTitle="Battleship"
              result={winner === 'player' ? 'sunk the enemy fleet' : 'lost their fleet to the AI'}
              penalty={funnyTask}
              onPlayAgain={initGame}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-12 p-6 bg-slate-900/50 border border-white/5 rounded-3xl flex gap-4 items-start w-full">
        <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-1" />
        <div className="text-sm text-slate-400 space-y-2">
          <p><strong className="text-white">Objective:</strong> Find and sink all 5 enemy ships before they sink yours.</p>
          <p><strong className="text-white">Ships:</strong> Carrier (5), Battleship (4), Destroyer (3), Submarine (3), Patrol Boat (2).</p>
          <p><strong className="text-white">Rules:</strong> If you hit a ship, you get another turn. Misses end your turn.</p>
        </div>
      </div>
    </div>
  );
}
