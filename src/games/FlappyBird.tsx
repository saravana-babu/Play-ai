import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { generateFunnyTask } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion } from 'motion/react';
import { RefreshCw, Trophy, Skull, Play } from 'lucide-react';

export default function FlappyBird() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [funnyTask, setFunnyTask] = useState<string | null>(null);
  const { apiKeys, selectedLlm, user, gameSessionTokens, resetSessionTokens } = useStore();
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const width = 400;
  const height = 600;
  const birdSize = 30;
  const gravity = 0.6;
  const jump = -8;
  const pipeWidth = 60;
  const pipeGap = 180;
  const pipeSpeed = 3;

  const stateRef = useRef({
    birdY: height / 2,
    birdVelocity: 0,
    pipes: [] as { x: number; top: number }[],
    frameCount: 0,
  });

  const initGame = () => {
    setScore(0);
    setGameOver(false);
    setGameStarted(false);
    setFunnyTask(null);
    resetSessionTokens();
    stateRef.current = {
      birdY: height / 2,
      birdVelocity: 0,
      pipes: [],
      frameCount: 0,
    };
  };

  const handleEnd = async (finalScore: number) => {
    if (!isMounted.current) return;
    setGameOver(true);
    setGameStarted(false);
    
    let task = null;
    if (finalScore < 10 && apiKeys[selectedLlm]) {
      task = await generateFunnyTask(selectedLlm, apiKeys, 'Flappy Bird');
      if (!isMounted.current) return;
      setFunnyTask(task);
    }

    if (user && isMounted.current) {
      await fetchApi('/history', {
        method: 'POST',
        body: JSON.stringify({
          game_id: 'flappybird',
          winner: finalScore >= 10 ? 'user' : 'ai',
          funny_task: task,
          total_tokens: gameSessionTokens
        })
      });
    }
  };

  const update = useCallback(() => {
    if (!gameStarted || gameOver) return;

    const state = stateRef.current;
    state.frameCount++;

    // Bird physics
    state.birdVelocity += gravity;
    state.birdY += state.birdVelocity;

    // Floor/Ceiling collision
    if (state.birdY + birdSize > height || state.birdY < 0) {
      handleEnd(score);
    }

    // Pipes
    if (state.frameCount % 100 === 0) {
      const minPipeHeight = 50;
      const maxPipeHeight = height - pipeGap - minPipeHeight;
      const top = Math.floor(Math.random() * (maxPipeHeight - minPipeHeight + 1)) + minPipeHeight;
      state.pipes.push({ x: width, top });
    }

    state.pipes.forEach((pipe, index) => {
      pipe.x -= pipeSpeed;

      // Collision
      if (
        50 + birdSize > pipe.x && 
        50 < pipe.x + pipeWidth && 
        (state.birdY < pipe.top || state.birdY + birdSize > pipe.top + pipeGap)
      ) {
        handleEnd(score);
      }

      // Score
      if (pipe.x + pipeWidth < 50 && !pipe.passed) {
        (pipe as any).passed = true;
        setScore(s => s + 1);
      }
    });

    state.pipes = state.pipes.filter(p => p.x + pipeWidth > 0);
  }, [gameStarted, gameOver, score]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const state = stateRef.current;

    // Background
    ctx.fillStyle = '#0f172a'; // Slate 900
    ctx.fillRect(0, 0, width, height);

    // Pipes
    ctx.fillStyle = '#10b981'; // Emerald 500
    state.pipes.forEach(pipe => {
      // Top pipe
      ctx.fillRect(pipe.x, 0, pipeWidth, pipe.top);
      // Bottom pipe
      ctx.fillRect(pipe.x, pipe.top + pipeGap, pipeWidth, height - (pipe.top + pipeGap));
    });

    // Bird
    ctx.fillStyle = '#fbbf24'; // Amber 400
    ctx.beginPath();
    ctx.roundRect(50, state.birdY, birdSize, birdSize, 8);
    ctx.fill();
    
    // Eye
    ctx.fillStyle = '#000';
    ctx.fillRect(50 + birdSize - 10, state.birdY + 5, 4, 4);
  }, []);

  useEffect(() => {
    let frameId: number;
    const loop = () => {
      update();
      draw();
      frameId = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(frameId);
  }, [update, draw]);

  const handleJump = useCallback(() => {
    if (gameOver) return;
    if (!gameStarted) {
      setGameStarted(true);
    }
    stateRef.current.birdVelocity = jump;
  }, [gameStarted, gameOver]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleJump();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleJump]);

  return (
    <div className="flex flex-col items-center max-w-sm mx-auto">
      <div className="flex justify-between w-full mb-8 items-center px-4">
        <div className="bg-slate-800 px-4 py-2 rounded-xl border border-white/10">
          <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Score</p>
          <p className="text-2xl font-bold text-white">{score}</p>
        </div>
        <button onClick={initGame} className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors">
          <RefreshCw className="w-6 h-6" />
        </button>
      </div>

      <div 
        className="relative bg-slate-950 rounded-3xl border-4 border-slate-800 overflow-hidden shadow-2xl cursor-pointer"
        onClick={handleJump}
      >
        <canvas 
          ref={canvasRef} 
          width={width} 
          height={height} 
          className="w-full h-auto max-w-[400px]"
        />

        {!gameStarted && !gameOver && (
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <Play className="w-16 h-16 text-indigo-500 mb-4 animate-bounce" />
            <h3 className="text-2xl font-bold text-white mb-2">Flappy Challenge</h3>
            <p className="text-slate-400 mb-6">Press Space or Click to jump. Avoid the pipes!</p>
            <button 
              onClick={(e) => { e.stopPropagation(); setGameStarted(true); }}
              className="px-8 py-3 bg-indigo-500 text-white rounded-xl font-bold hover:bg-indigo-600 transition-all"
            >
              Start Game
            </button>
          </div>
        )}

        {gameOver && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center z-20">
            {score >= 10 ? <Trophy className="w-16 h-16 text-yellow-400 mb-4" /> : <Skull className="w-16 h-16 text-rose-500 mb-4" />}
            <h3 className="text-3xl font-bold text-white mb-2">{score >= 10 ? 'Great Run!' : 'Game Over!'}</h3>
            <p className="text-slate-400 mb-6">Final Score: {score}</p>
            {funnyTask && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl mb-6 max-w-xs">
                <p className="text-xs text-rose-400 font-bold uppercase mb-1">Penalty</p>
                <p className="text-sm text-rose-200 italic">"{funnyTask}"</p>
              </div>
            )}
            <button 
              onClick={(e) => { e.stopPropagation(); initGame(); }}
              className="px-8 py-3 bg-indigo-500 text-white rounded-xl font-bold hover:bg-indigo-600 transition-colors"
            >
              Try Again
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}