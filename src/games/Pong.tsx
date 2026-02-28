import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { generateFunnyTask } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion } from 'motion/react';
import { RefreshCw, Trophy, Skull, Play } from 'lucide-react';

export default function Pong() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState({ user: 0, ai: 0 });
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [funnyTask, setFunnyTask] = useState<string | null>(null);
  const { apiKeys, selectedLlm, user } = useStore();

  const paddleHeight = 80;
  const paddleWidth = 10;
  const ballSize = 10;
  const width = 600;
  const height = 400;

  const stateRef = useRef({
    userY: height / 2 - paddleHeight / 2,
    aiY: height / 2 - paddleHeight / 2,
    ballX: width / 2,
    ballY: height / 2,
    ballDX: 4,
    ballDY: 4,
  });

  const initGame = () => {
    setScore({ user: 0, ai: 0 });
    setGameOver(false);
    setGameStarted(false);
    setFunnyTask(null);
    stateRef.current = {
      userY: height / 2 - paddleHeight / 2,
      aiY: height / 2 - paddleHeight / 2,
      ballX: width / 2,
      ballY: height / 2,
      ballDX: 4,
      ballDY: 4,
    };
  };

  const handleEnd = async (winner: 'user' | 'ai') => {
    setGameOver(true);
    setGameStarted(false);
    
    let task = null;
    if (winner === 'ai' && apiKeys[selectedLlm]) {
      task = await generateFunnyTask(selectedLlm, apiKeys, 'Pong');
      setFunnyTask(task);
    }

    if (user) {
      await fetchApi('/history', {
        method: 'POST',
        body: JSON.stringify({
          game_id: 'pong',
          winner: winner,
          funny_task: task
        })
      });
    }
  };

  const update = useCallback(() => {
    if (!gameStarted || gameOver) return;

    const state = stateRef.current;
    
    // Ball movement
    state.ballX += state.ballDX;
    state.ballY += state.ballDY;

    // Wall collision
    if (state.ballY <= 0 || state.ballY + ballSize >= height) {
      state.ballDY *= -1;
    }

    // Paddle collision
    if (
      state.ballX <= paddleWidth && 
      state.ballY + ballSize >= state.userY && 
      state.ballY <= state.userY + paddleHeight
    ) {
      state.ballDX *= -1.1; // Speed up
      state.ballX = paddleWidth;
    }

    if (
      state.ballX + ballSize >= width - paddleWidth && 
      state.ballY + ballSize >= state.aiY && 
      state.ballY <= state.aiY + paddleHeight
    ) {
      state.ballDX *= -1.1;
      state.ballX = width - paddleWidth - ballSize;
    }

    // AI logic
    const aiCenter = state.aiY + paddleHeight / 2;
    if (aiCenter < state.ballY) state.aiY += 3.5;
    else if (aiCenter > state.ballY) state.aiY -= 3.5;

    // Scoring
    if (state.ballX < 0) {
      setScore(s => {
        const newScore = { ...s, ai: s.ai + 1 };
        if (newScore.ai >= 5) handleEnd('ai');
        else resetBall();
        return newScore;
      });
    } else if (state.ballX > width) {
      setScore(s => {
        const newScore = { ...s, user: s.user + 1 };
        if (newScore.user >= 5) handleEnd('user');
        else resetBall();
        return newScore;
      });
    }
  }, [gameStarted, gameOver]);

  const resetBall = () => {
    stateRef.current.ballX = width / 2;
    stateRef.current.ballY = height / 2;
    stateRef.current.ballDX = 4 * (Math.random() > 0.5 ? 1 : -1);
    stateRef.current.ballDY = 4 * (Math.random() > 0.5 ? 1 : -1);
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const state = stateRef.current;

    ctx.clearRect(0, 0, width, height);
    
    // Middle line
    ctx.setLineDash([10, 10]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();

    // Paddles
    ctx.fillStyle = '#6366f1'; // Indigo
    ctx.fillRect(0, state.userY, paddleWidth, paddleHeight);
    
    ctx.fillStyle = '#10b981'; // Emerald
    ctx.fillRect(width - paddleWidth, state.aiY, paddleWidth, paddleHeight);

    // Ball
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(state.ballX + ballSize / 2, state.ballY + ballSize / 2, ballSize / 2, 0, Math.PI * 2);
    ctx.fill();
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

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const y = e.clientY - rect.top - paddleHeight / 2;
      stateRef.current.userY = Math.max(0, Math.min(height - paddleHeight, y));
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="flex flex-col items-center max-w-2xl mx-auto">
      <div className="flex justify-between w-full mb-8 items-center px-4">
        <div className="flex items-center gap-8">
          <div className="text-center">
            <p className="text-xs text-slate-400 font-bold uppercase">You</p>
            <p className="text-3xl font-bold text-indigo-400">{score.user}</p>
          </div>
          <div className="text-xl font-bold text-slate-600">VS</div>
          <div className="text-center">
            <p className="text-xs text-slate-400 font-bold uppercase">AI</p>
            <p className="text-3xl font-bold text-emerald-400">{score.ai}</p>
          </div>
        </div>
        <button onClick={initGame} className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors">
          <RefreshCw className="w-6 h-6" />
        </button>
      </div>

      <div className="relative bg-slate-950 rounded-3xl border-4 border-slate-800 overflow-hidden shadow-2xl cursor-none">
        <canvas 
          ref={canvasRef} 
          width={width} 
          height={height} 
          className="w-full h-auto max-w-[600px]"
        />

        {!gameStarted && !gameOver && (
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <Play className="w-16 h-16 text-indigo-500 mb-4 animate-bounce" />
            <h3 className="text-2xl font-bold text-white mb-2">Pong Challenge</h3>
            <p className="text-slate-400 mb-6">First to 5 points wins. Move your mouse to control the paddle.</p>
            <button 
              onClick={() => setGameStarted(true)}
              className="px-8 py-3 bg-indigo-500 text-white rounded-xl font-bold hover:bg-indigo-600 transition-all"
            >
              Start Game
            </button>
          </div>
        )}

        {gameOver && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center z-20">
            {score.user >= 5 ? <Trophy className="w-16 h-16 text-yellow-400 mb-4" /> : <Skull className="w-16 h-16 text-rose-500 mb-4" />}
            <h3 className="text-3xl font-bold text-white mb-2">{score.user >= 5 ? 'You Won!' : 'AI Wins!'}</h3>
            <p className="text-slate-400 mb-6">Final Score: {score.user} - {score.ai}</p>
            {funnyTask && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl mb-6 max-w-xs">
                <p className="text-xs text-rose-400 font-bold uppercase mb-1">Penalty</p>
                <p className="text-sm text-rose-200 italic">"{funnyTask}"</p>
              </div>
            )}
            <button onClick={initGame} className="px-8 py-3 bg-indigo-500 text-white rounded-xl font-bold hover:bg-indigo-600 transition-colors">
              Try Again
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}