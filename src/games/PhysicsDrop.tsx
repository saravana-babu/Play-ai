import React, { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import { Play, RotateCcw, PenTool, Eraser, Info, Trophy, ChevronRight, Zap, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ShareButtons from '../components/ShareButtons';

export default function PhysicsDrop() {
    const sceneRef = useRef<HTMLDivElement>(null);
    const engineRef = useRef<Matter.Engine | null>(null);
    const renderRef = useRef<Matter.Render | null>(null);
    const runnerRef = useRef<Matter.Runner | null>(null);
    const ballRef = useRef<Matter.Body | null>(null);

    const [level, setLevel] = useState(1);
    const [gameState, setGameState] = useState<'drawing' | 'running' | 'win'>('drawing');
    const [drawnLines, setDrawnLines] = useState<Matter.Body[]>([]);

    // Config
    const width = 600;
    const height = 400;

    const initLevel = (lv: number) => {
        // Cleanup previous
        if (engineRef.current) {
            Matter.World.clear(engineRef.current.world, false);
            setDrawnLines([]);
        }

        const engine = engineRef.current || Matter.Engine.create();
        engineRef.current = engine;
        const world = engine.world;

        // Boundaries
        const ground = Matter.Bodies.rectangle(width / 2, height + 10, width, 20, { isStatic: true });
        const leftWall = Matter.Bodies.rectangle(-10, height / 2, 20, height, { isStatic: true });
        const rightWall = Matter.Bodies.rectangle(width + 10, height / 2, 20, height, { isStatic: true });

        // Target Bucket
        const targetX = lv === 1 ? 500 : (lv === 2 ? 100 : 400);
        const targetY = 350;
        const bucketBottom = Matter.Bodies.rectangle(targetX, targetY + 20, 60, 10, { isStatic: true, label: 'target' });
        const bucketLeft = Matter.Bodies.rectangle(targetX - 30, targetY, 10, 50, { isStatic: true });
        const bucketRight = Matter.Bodies.rectangle(targetX + 30, targetY, 10, 50, { isStatic: true });

        // Obstacles based on level
        const obstacles: Matter.Body[] = [];
        if (lv === 2) {
            obstacles.push(Matter.Bodies.rectangle(300, 200, 200, 20, { isStatic: true, angle: Math.PI * 0.1 }));
        } else if (lv === 3) {
            obstacles.push(Matter.Bodies.rectangle(200, 150, 150, 20, { isStatic: true, angle: -Math.PI * 0.1 }));
            obstacles.push(Matter.Bodies.rectangle(400, 250, 150, 20, { isStatic: true, angle: Math.PI * 0.1 }));
        }

        // The Ball (Initially frozen or created on run)
        const ball = Matter.Bodies.circle(100, 50, 15, {
            restitution: 0.5,
            friction: 0.001,
            label: 'ball',
            isStatic: true // Start static so user can draw
        });
        ballRef.current = ball;

        Matter.World.add(world, [ground, leftWall, rightWall, bucketBottom, bucketLeft, bucketRight, ball, ...obstacles]);

        // Render
        if (!renderRef.current && sceneRef.current) {
            const render = Matter.Render.create({
                element: sceneRef.current,
                engine: engine,
                options: {
                    width: width,
                    height: height,
                    wireframes: false,
                    background: 'transparent'
                }
            });
            renderRef.current = render;
            Matter.Render.run(render);

            const runner = Matter.Runner.create();
            runnerRef.current = runner;
            Matter.Runner.run(runner, engine);
        }

        setGameState('drawing');
    };

    useEffect(() => {
        initLevel(level);

        // Collision events
        const handleCollision = (event: Matter.IEventCollision<Matter.Engine>) => {
            const pairs = event.pairs;
            for (let i = 0; i < pairs.length; i++) {
                const pair = pairs[i];
                if ((pair.bodyA.label === 'ball' && pair.bodyB.label === 'target') ||
                    (pair.bodyB.label === 'ball' && pair.bodyA.label === 'target')) {
                    setGameState('win');
                }
            }
        };

        if (engineRef.current) {
            Matter.Events.on(engineRef.current, 'collisionStart', handleCollision);
        }

        return () => {
            if (engineRef.current) {
                Matter.Events.off(engineRef.current, 'collisionStart', handleCollision);
            }
        };
    }, [level]);

    // Drawing logic
    const isDrawing = useRef(false);
    const lastPos = useRef<{ x: number, y: number } | null>(null);

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        if (gameState !== 'drawing') return;
        isDrawing.current = true;
        const pos = getPos(e);
        lastPos.current = pos;
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing.current || !lastPos.current || !engineRef.current || gameState !== 'drawing') return;

        const pos = getPos(e);
        const dist = Math.hypot(pos.x - lastPos.current.x, pos.y - lastPos.current.y);

        if (dist > 10) {
            const midX = (pos.x + lastPos.current.x) / 2;
            const midY = (pos.y + lastPos.current.y) / 2;
            const angle = Math.atan2(pos.y - lastPos.current.y, pos.x - lastPos.current.x);

            const segment = Matter.Bodies.rectangle(midX, midY, dist, 5, {
                isStatic: true,
                angle: angle,
                render: { fillStyle: '#6366f1' }
            });

            Matter.World.add(engineRef.current.world, segment);
            setDrawnLines(prev => [...prev, segment]);
            lastPos.current = pos;
        }
    };

    const stopDrawing = () => {
        isDrawing.current = false;
        lastPos.current = null;
    };

    const getPos = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = sceneRef.current?.querySelector('canvas');
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const runSimulation = () => {
        if (ballRef.current) {
            Matter.Body.setStatic(ballRef.current, false);
            setGameState('running');
        }
    };

    const resetLevel = () => {
        initLevel(level);
    };

    const nextLevel = () => {
        setLevel(prev => (prev % 3) + 1);
    };

    return (
        <div className="flex flex-col items-center gap-6 max-w-4xl mx-auto w-full">
            <div className="w-full flex justify-between items-center bg-slate-900/50 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-2xl">
                <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-2">
                        <Zap className="w-6 h-6 text-indigo-400" /> Physics Drop
                    </h2>
                    <p className="text-slate-400 text-sm">Draw paths to guide the ball into the bucket.</p>
                </div>
                <div className="flex gap-4">
                    <div className="px-4 py-2 bg-slate-800 rounded-xl border border-white/5 text-center">
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest block">Level</span>
                        <span className="text-xl font-black text-indigo-400">{level}</span>
                    </div>
                    <button
                        onClick={resetLevel}
                        className="p-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl transition-all border border-white/5 shadow-lg active:scale-95"
                    >
                        <RotateCcw className="w-6 h-6" />
                    </button>
                    {gameState === 'drawing' ? (
                        <button
                            onClick={runSimulation}
                            className="px-8 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-black transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] flex items-center gap-2 active:scale-95"
                        >
                            <Play className="w-6 h-6 fill-current" /> DROP
                        </button>
                    ) : (
                        <div className="px-8 py-2 bg-slate-800 text-slate-500 rounded-2xl font-black flex items-center gap-2 cursor-not-allowed border border-white/5">
                            <Activity className="w-6 h-6" /> RUNNING
                        </div>
                    )}
                </div>
            </div>

            <div className="relative group">
                {/* Canvas Container */}
                <div
                    ref={sceneRef}
                    className={`bg-slate-950 border-4 border-slate-800 rounded-[2rem] overflow-hidden shadow-2xl touch-none
                        ${gameState === 'drawing' ? 'cursor-crosshair' : 'cursor-default'}
                    `}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />

                {/* Overlays */}
                <AnimatePresence>
                    {gameState === 'drawing' && drawnLines.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-500/50"
                        >
                            <PenTool className="w-16 h-16 mb-4 animate-bounce" />
                            <p className="font-bold text-xl">Draw a path with your mouse</p>
                        </motion.div>
                    )}

                    {gameState === 'win' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute inset-0 bg-indigo-500/20 backdrop-blur-sm flex items-center justify-center z-20 rounded-[2rem]"
                        >
                            <div className="bg-slate-900 border border-white/20 p-8 rounded-[2rem] text-center shadow-2xl max-w-xs w-full">
                                <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-4" />
                                <h3 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">Level Clear!</h3>
                                <p className="text-slate-400 text-sm mb-6">Physics principles applied successfully.</p>

                                <ShareButtons
                                    gameTitle="Physics Drop"
                                    result="cleared a level"
                                />

                                <button
                                    onClick={nextLevel}
                                    className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] active:scale-95 mt-4"
                                >
                                    Next Level <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Visual Indicators */}
                <div className="absolute top-4 left-4 flex gap-2">
                    <div className="px-3 py-1 bg-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase rounded-lg border border-indigo-500/30 flex items-center gap-1">
                        <PenTool className="w-3 h-3" /> Drawing Tool Active
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                <div className="bg-slate-900/50 border border-white/5 p-6 rounded-3xl">
                    <div className="flex items-center gap-3 mb-3 text-indigo-400">
                        <Info className="w-5 h-5" />
                        <h4 className="font-bold text-sm uppercase tracking-widest">How to play</h4>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                        Use your mouse or touch to draw lines. These lines become solid physical barriers once you drop the ball.
                    </p>
                </div>
                <div className="bg-slate-900/50 border border-white/5 p-6 rounded-3xl">
                    <div className="flex items-center gap-3 mb-3 text-emerald-400">
                        <Activity className="w-5 h-5" />
                        <h4 className="font-bold text-sm uppercase tracking-widest">Gravity</h4>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                        Once you hit "DROP", gravity is applied. The ball will slide, bounce, and roll along your drawn paths.
                    </p>
                </div>
                <div className="bg-slate-900/50 border border-white/5 p-6 rounded-3xl">
                    <div className="flex items-center gap-3 mb-3 text-amber-400">
                        <Trophy className="w-5 h-5" />
                        <h4 className="font-bold text-sm uppercase tracking-widest">Goal</h4>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                        Get the purple ball to land and stay inside the indigo bucket to clear the level.
                    </p>
                </div>
            </div>
        </div>
    );
}


