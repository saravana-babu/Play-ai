import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore, LlmProvider } from '../store/useStore';
import { TOOLS } from '../lib/tools';
import { ArrowLeft, BrainCircuit } from 'lucide-react';
import { motion } from 'motion/react';
import GenericTool from '../tools/GenericTool';
import DataInsightGen from '../tools/DataInsightGen';
import WebScraper from '../tools/WebScraper';
import JsonConverter from '../tools/JsonConverter';
import SentimentAnalyzer from '../tools/SentimentAnalyzer';
import CodeReviewer from '../tools/CodeReviewer';
import RegexGenerator from '../tools/RegexGenerator';
import ApiMockGen from '../tools/ApiMockGen';
import AgentBuilder from '../tools/AgentBuilder';
import ArchitecturePlanner from '../tools/ArchitecturePlanner';
import SeoBlogWriter from '../tools/SeoBlogWriter';
import ConceptExplainer from '../tools/ConceptExplainer';
import DreamInterpreter from '../tools/DreamInterpreter';
import DocumentSummarizer from '../tools/DocumentSummarizer';
import MeetingNotesExtractor from '../tools/MeetingNotesExtractor';
import RecipeChef from '../tools/RecipeChef';
import WorkoutPlanner from '../tools/WorkoutPlanner';
import TravelGuide from '../tools/TravelGuide';
import GiftIdeas from '../tools/GiftIdeas';
import PasswordGen from '../tools/PasswordGen';
import TimezoneScheduler from '../tools/TimezoneScheduler';
import CalorieEstimator from '../tools/CalorieEstimator';
import HabitStrategy from '../tools/HabitStrategy';
import SwotAnalyzer from '../tools/SwotAnalyzer';
import AgileSprintPlanner from '../tools/AgileSprintPlanner';
import PrdGenerator from '../tools/PrdGenerator';
import ResearchAnalyzer from '../tools/ResearchAnalyzer';
import AIAdCopywriter from '../tools/AIAdCopywriter';
import VoiceScriptGen from '../tools/VoiceScriptGen';
import PersonalFinanceGenius from '../tools/PersonalFinanceGenius';
import AIQuizMaster from '../tools/AIQuizMaster';
import LanguageTutor from '../tools/LanguageTutor';
import StudyPlanGen from '../tools/StudyPlanGen';
import MathSolver from '../tools/MathSolver';
import TikTokScriptGen from '../tools/TikTokScriptGen';
import SunoPrompter from '../tools/SunoPrompter';
import GameMechanicGen from '../tools/GameMechanicGen';
import LegalReviewer from '../tools/LegalReviewer';
import SymptomChecker from '../tools/SymptomChecker';
import NatalChartAI from '../tools/NatalChartAI';
import TaxCategorizer from '../tools/TaxCategorizer';
import InvestmentStrategy from '../tools/InvestmentStrategy';
import CreditStrategist from '../tools/CreditStrategist';
import FirePlanner from '../tools/FirePlanner';
import TokenLogViewer from '../components/TokenLogViewer';

export default function Tool() {
    const { id } = useParams<{ id: string }>();
    const { user, apiKeys, selectedLlm, setSelectedLlm, resetSessionTokens } = useStore();
    const navigate = useNavigate();

    useEffect(() => {
        return () => {
            resetSessionTokens();
        };
    }, [resetSessionTokens]);

    const tool = TOOLS.find((t) => t.id === id);
    const hasAnyKey = !!(apiKeys.gemini || apiKeys.openai || apiKeys.anthropic || apiKeys.deepseek || apiKeys.groq);

    useEffect(() => {
        if (!user) {
            navigate('/login');
        } else if (tool && tool.requiresAi !== false && !hasAnyKey) {
            navigate('/settings');
        }
    }, [user, hasAnyKey, navigate, tool]);

    if (!tool) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold text-white mb-4">Tool not found</h2>
                <button onClick={() => navigate('/')} className="text-emerald-400 hover:underline">
                    Return to Home
                </button>
            </div>
        );
    }

    const handleLlmChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedLlm(e.target.value as LlmProvider);
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
                        <h1 className="text-2xl font-bold text-white border-l-4 border-emerald-500 pl-3">{tool.title}</h1>
                        <p className="text-sm text-slate-400 mt-1 pl-3">{tool.description}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-slate-900 border border-white/10 rounded-xl px-3 py-2">
                    <BrainCircuit className="w-4 h-4 text-emerald-400" />
                    <select
                        value={selectedLlm}
                        onChange={handleLlmChange}
                        className="bg-transparent text-xs sm:text-sm text-white font-bold focus:outline-none cursor-pointer hover:text-emerald-400 transition-colors"
                    >
                        <option value="gemini" disabled={!apiKeys.gemini} className="bg-slate-800">Gemini {apiKeys.gemini ? '⚡' : '(Missing)'}</option>
                        <option value="openai" disabled={!apiKeys.openai} className="bg-slate-800">OpenAI {apiKeys.openai ? '⚡' : '(Missing)'}</option>
                        <option value="anthropic" disabled={!apiKeys.anthropic} className="bg-slate-800">Anthropic {apiKeys.anthropic ? '⚡' : '(Missing)'}</option>
                        <option value="deepseek" disabled={!apiKeys.deepseek} className="bg-slate-800">DeepSeek {apiKeys.deepseek ? '⚡' : '(Missing)'}</option>
                        <option value="groq" disabled={!apiKeys.groq} className="bg-slate-800">Groq {apiKeys.groq ? '⚡' : '(Missing)'}</option>
                        <option value="ollama" className="bg-slate-800">Ollama 🏠</option>
                    </select>
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                {id === 'data-insight-gen' ? (
                    <DataInsightGen />
                ) : id === 'web-scraper' ? (
                    <WebScraper />
                ) : id === 'json-converter' ? (
                    <JsonConverter />
                ) : id === 'sentiment-analyzer' ? (
                    <SentimentAnalyzer />
                ) : id === 'game-mechanic' ? (
                    <GameMechanicGen />
                ) : id === 'code-reviewer' ? (
                    <CodeReviewer />
                ) : id === 'regex-generator' ? (
                    <RegexGenerator />
                ) : id === 'api-mock-gen' ? (
                    <ApiMockGen />
                ) : id === 'agent-builder' ? (
                    <AgentBuilder />
                ) : id === 'architecture-planner' ? (
                    <ArchitecturePlanner />
                ) : id === 'seo-blog-writer' ? (
                    <SeoBlogWriter />
                ) : id === 'concept-explainer' ? (
                    <ConceptExplainer />
                ) : id === 'dream-interpreter' ? (
                    <DreamInterpreter />
                ) : id === 'medical-symptom' ? (
                    <SymptomChecker />
                ) : id === 'astrology-reading' ? (
                    <NatalChartAI />
                ) : id === 'document-summarizer' ? (
                    <DocumentSummarizer />
                ) : id === 'meeting-notes-extractor' ? (
                    <MeetingNotesExtractor />
                ) : id === 'recipe-chef' ? (
                    <RecipeChef />
                ) : id === 'workout-planner' ? (
                    <WorkoutPlanner />
                ) : id === 'travel-guide' ? (
                    <TravelGuide />
                ) : id === 'gift-ideas' ? (
                    <GiftIdeas />
                ) : id === 'password-gen' ? (
                    <PasswordGen />
                ) : id === 'timezone-scheduler' ? (
                    <TimezoneScheduler />
                ) : id === 'calorie-estimator' ? (
                    <CalorieEstimator />
                ) : id === 'habit-tracker' ? (
                    <HabitStrategy />
                ) : id === 'swot-analyzer' ? (
                    <SwotAnalyzer />
                ) : id === 'legal-reviewer' ? (
                    <LegalReviewer />
                ) : id === 'agile-sprint-planner' ? (
                    <AgileSprintPlanner />
                ) : id === 'prd-gen' ? (
                    <PrdGenerator />
                ) : id === 'research-analyzer' ? (
                    <ResearchAnalyzer />
                ) : id === 'copywriter' ? (
                    <AIAdCopywriter />
                ) : id === 'voice-clone-script' ? (
                    <VoiceScriptGen />
                ) : id === 'finance-analyzer' ? (
                    <PersonalFinanceGenius />
                ) : id === 'tax-assistant' ? (
                    <TaxCategorizer />
                ) : id === 'investment-strategy' ? (
                    <InvestmentStrategy />
                ) : id === 'credit-strategist' ? (
                    <CreditStrategist />
                ) : id === 'fire-planner' ? (
                    <FirePlanner />
                ) : id === 'quiz-generator' ? (
                    <AIQuizMaster />
                ) : id === 'language-tutor' ? (
                    <LanguageTutor />
                ) : id === 'study-plan' ? (
                    <StudyPlanGen />
                ) : id === 'math-solver' ? (
                    <MathSolver />
                ) : id === 'video-script' ? (
                    <TikTokScriptGen />
                ) : id === 'music-prompt' ? (
                    <SunoPrompter />
                ) : (
                    <GenericTool />
                )}
            </motion.div>

            <div className="mt-8">
                <TokenLogViewer />
            </div>
        </div>
    );
}
