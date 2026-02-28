import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { generateFunnyTask } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Trophy, Skull, HelpCircle } from 'lucide-react';
import ShareButton from '../components/ShareButton';

export default function DinosaurRun() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [funnyTask, setFunnyTask] = useState<string | null>(null);
  const { apiKeys, selectedLlm, user, gameSessionTokens, resetSessionTokens } = useStore();
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  const gameState = useRef({
    dinoY: 0,
    dinoVelocity: 0,
    isJumping: false,
    obstacles: [] as { x: number; width: number; height: number }[],
    gameSpeed: 5,
    frameCount: 0,
    score: 0
  });

  const initGame = () => {
    gameState.current = {
      dinoY: 0,
      dinoVelocity: 0,
      isJumping: false,
      obstacles: [],
      gameSpeed: 5,
      frameCount: 0,
      score: 0
    };
    setScore(0);
    setGameOver(false);
    setFunnyTask(null);
    resetSessionTokens();
  };

  useEffect(() => {
    initGame();
    let animationFrameId: number;

    const update = () => {
      if (gameOver) return;

      const state = gameState.current;
      state.frameCount++;
      state.score += 0.1;
      setScore(Math.floor(state.score));

      // Dino physics
      if (state.isJumping) {
        state.dinoVelocity += 0.6; // Gravity
        state.dinoY += state.dinoVelocity;
        if (state.dinoY >= 0) {
          state.dinoY = 0;
          state.dinoVelocity = 0;
          state.isJumping = false;
        }
      }

      // Obstacles
      if (state.frameCount % 100 === 0) {
        state.obstacles.push({
          x: 800,
          width: 20 + Math.random() * 30,
          height: 30 + Math.random() * 40
        });
      }

      state.obstacles.forEach(obs => {
        obs.x -= state.gameSpeed;
      });

      state.obstacles = state.obstacles.filter(obs => obs.x > -50);

      // Collision
      const dinoX = 50;
      const dinoWidth = 40;
      const dinoHeight = 40;
      const dinoBottom = 150 + state.dinoY;

      state.obstacles.forEach(obs => {
        if (
          dinoX < obs.x + obs.width &&
          dinoX + dinoWidth > obs.x &&
          dinoBottom > 150 - obs.height
        ) {
          handleEnd();
        }
      });

      // Draw
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Ground
          ctx.strokeStyle = '#475569';
          ctx.beginPath();
          ctx.moveTo(0, 150);
          ctx.lineTo(800, 150);
          ctx.stroke();

          // Dino
          ctx.fillStyle = '#6366f1';
          ctx.fillRect(dinoX, 150 + state.dinoY - dinoHeight, dinoWidth, dinoHeight);

          // Obstacles
          ctx.fillStyle = '#f43f5e';
          state.obstacles.forEach(obs => {
            ctx.fillRect(obs.x, 150 - obs.height, obs.width, obs.height);
          });
        }
      }

      animationFrameId = requestAnimationFrame(update);
    };

    update();
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameOver]);

  const handleJump = () => {
    if (gameOver) return;
    if (!gameState.current.isJumping) {
      gameState.current.isJumping = true;
      gameState.current.dinoVelocity = -12;
    }
  };

  const handleEnd = async () => {
    if (!isMounted.current) return;
    setGameOver(true);
    let task = null;
    if (apiKeys[selectedLlm]) {
      task = await generateFunnyTask(selectedLlm, apiKeys, 'Dinosaur Run');
      if (!isMounted.current) return;
      setFunnyTask(task);
    }

    if (user && isMounted.current) {
      await fetchApi('/history', {
        method: 'POST',
        body: JSON.stringify({
          game_id: 'dinosaur',
          winner: 'ai',
          funny_task: task,
          total_tokens: gameSessionTokens
        })
      });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        handleJump();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center bg-slate-900 p-6 rounded-3xl border border-white/10 shadow-xl">
        <div className="text-center">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Score</p>
          <p className="text-2xl font-black text-indigo-400">{score}</p>
        </div>
        <button onClick={initGame} className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div 
        className="bg-slate-900 border border-white/10 rounded-[40px] p-8 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center cursor-pointer"
        onClick={handleJump}
      >
        <canvas 
          ref={canvasRef} 
          width={800} 
          height={200} 
          className="w-full h-auto max-w-full rounded-2xl bg-slate-950"
        />

        <AnimatePresence>
          {gameOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center z-50 p-8"
            >
              <div className="text-center space-y-8 max-w-md">
                <div className="space-y-2">
                  <Skull className="w-20 h-20 text-rose-500 mx-auto" />
                  <h2 className="text-4xl font-black text-white">Game Over</h2>
                  <p className="text-slate-400">You ran {score} meters!</p>
                </div>

                {funnyTask && (
                  <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-3xl">
                    <p className="text-xs text-rose-400 font-bold uppercase tracking-widest mb-2">Penalty Task</p>
                    <p className="text-lg text-rose-100 italic font-medium">"{funnyTask}"</p>
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    onClick={initGame}
                    className="flex-1 py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-bold transition-all"
                  >
                    Play Again
                  </button>
                  <ShareButton 
                    gameTitle="Dinosaur Run" 
                    score={score}
                    winner="ai" 
                    funnyTask={funnyTask} 
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 flex gap-4 items-start">
        <HelpCircle className="w-6 h-6 text-indigo-400 shrink-0 mt-1" />
        <div className="space-y-1">
          <p className="text-sm text-white font-bold">How to Play</p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Press SPACE or UP ARROW to jump over the obstacles. The game gets faster as you go!
          </p>
        </div>
      </div>
    </div>
  );
}
