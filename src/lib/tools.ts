export interface ToolMeta {
    id: string;
    title: string;
    category: string;
    description: string;
    isAvailable: boolean;
    requiresAi?: boolean;
}

export const TOOLS: ToolMeta[] = [
    // AI Data Tools
    { id: 'app-generator', title: 'AI App Generator', category: 'AI Developer Tools', description: 'Instant generation of Landing Pages, Single-file UIs, and simple PWAs from a single prompt.', isAvailable: true },
    { id: 'data-insight-gen', title: 'Data Insight Gen', category: 'AI Data Tools', description: 'Chat securely with your CSV files and extract advanced quantitative AI data visualizations.', isAvailable: true },
    { id: 'web-scraper', title: 'Smart Scraper', category: 'AI Data Tools', description: 'Intelligently extract and scrape structured data from unstructured websites using AI logic.', isAvailable: true },
    { id: 'json-converter', title: 'Unstructured to JSON', category: 'AI Data Tools', description: 'Clean and convert messy text blocks into strict, readable JSON schemas via AI models.', isAvailable: true },
    { id: 'sentiment-analyzer', title: 'Sentiment Analyzer', category: 'AI Data Tools', description: 'Professionally analyze bulk consumer text for detailed emotion and sentiment using a semantic AI.', isAvailable: true },

    // AI Developer Tools
    { id: 'code-reviewer', title: 'AI Code Reviewer', category: 'AI Developer Tools', description: 'Analyze syntax and script code for difficult bugs, strict style standards, and advanced AI security vulnerabilities.', isAvailable: true },
    { id: 'regex-generator', title: 'RegEx Generator', category: 'AI Developer Tools', description: 'Generate robust, complex Regular Expressions instantly from plain English prompts using an AI compiler.', isAvailable: true },
    { id: 'api-mock-gen', title: 'API Mock Generator', category: 'AI Developer Tools', description: 'Rapidly generate accurate mock REST API responses and scalable OpenAPI specs powered by generative AI.', isAvailable: true },
    { id: 'agent-builder', title: 'AI Agent Builder', category: 'AI Developer Tools', description: 'Design, configure, and safely deploy custom autonomous AI agents for highly specific engineering tasks.', isAvailable: true },
    { id: 'game-mechanic', title: 'Game Mechanic Gen', category: 'AI Developer Tools', description: 'Invent completely new logical software game mechanics and interaction loops assisted by an AI game designer.', isAvailable: true },

    // AI Architecture Tools
    { id: 'architecture-planner', title: 'Architecture Planner', category: 'AI Architecture Tools', description: 'Visually plan complex server software architectures and generate backend concepts mathematically checked by AI.', isAvailable: true },

    // AI SEO Tools
    { id: 'seo-blog-writer', title: 'SEO Blog Writer', category: 'AI SEO Tools', description: 'Generate meticulously high-ranking, SEO-optimized content blog posts written and keyword-matched by AI limiters.', isAvailable: true },

    // AI Knowledge Tools
    { id: 'concept-explainer', title: 'ELI5 Knowledge Explainer', category: 'AI Knowledge Tools', description: 'Explain overwhelmingly complex topics simply and completely factually using a comprehensive knowledge AI.', isAvailable: true },
    { id: 'dream-interpreter', title: 'Dream Interpreter', category: 'AI Knowledge Tools', description: 'Deeply analyze your personal dreams using extensive psychological frameworks provided by our logical AI.', isAvailable: true },
    { id: 'medical-symptom', title: 'Symptom Checker', category: 'AI Knowledge Tools', description: 'Access our state-of-the-art AI pre-diagnostic medical symptom checking tool (for informational use only).', isAvailable: true },
    { id: 'astrology-reading', title: 'Natal Chart AI', category: 'AI Knowledge Tools', description: 'Generate heavily detailed, calculated astrological readings and cosmic charts computed by AI logic.', isAvailable: true },

    // AI Document Tools
    { id: 'document-summarizer', title: 'Document Summarizer', category: 'AI Document Tools', description: 'Instantly summarize exceptionally long text blocks, PDFs, and corporate document drafts securely utilizing AI.', isAvailable: true },

    // AI Productivity Tools
    { id: 'meeting-notes-extractor', title: 'Meeting Notes Extractor', category: 'AI Productivity Tools', description: 'Automatically extract critical action items and comprehensive professional summaries from AI meeting transcripts.', isAvailable: true },
    { id: 'recipe-chef', title: 'AI Chef', category: 'AI Productivity Tools', description: 'Generate gourmet cooking recipes dynamically based strictly on the exact ingredients you provide an AI.', isAvailable: true },
    { id: 'workout-planner', title: 'Fitness Coach', category: 'AI Productivity Tools', description: 'Receive highly custom, personalized workout routines cleanly tailored to your physiological goals by an AI coach.', isAvailable: true },
    { id: 'travel-guide', title: 'Travel Itinerary', category: 'AI Productivity Tools', description: 'Plan perfectly timed, day-by-day vacation travel itineraries generated efficiently via an AI planning logistics engine.', isAvailable: true },
    { id: 'gift-ideas', title: 'Gift Recommender', category: 'AI Productivity Tools', description: 'Search and find the perfectly matched gift based deeply on parsed personality traits evaluated by AI.', isAvailable: true },
    { id: 'password-gen', title: 'Memorable Passwords', category: 'AI Productivity Tools', description: 'Generate incredibly secure, cryptographically robust, yet narrative-based memorable passwords using AI linguistics.', isAvailable: true },
    { id: 'timezone-scheduler', title: 'Global Scheduler', category: 'AI Productivity Tools', description: 'Find universally optimal corporate meeting times perfectly across 5+ international time zones utilizing AI.', isAvailable: true },
    { id: 'calorie-estimator', title: 'Calorie Estimator', category: 'AI Productivity Tools', description: 'Quickly estimate macros and exact calories simply from unstructured text or food descriptions using AI nutrition datasets.', isAvailable: true },
    { id: 'habit-tracker', title: 'Habit Optimizer', category: 'AI Productivity Tools', description: 'Receive detailed, actionable AI psychological recommendations to scientifically fix failing routines and habits.', isAvailable: true },

    // AI Business Intelligence Tools
    { id: 'swot-analyzer', title: 'SWOT Analyzer', category: 'AI Business Intelligence Tools', description: 'Perform sweeping, strategic SWOT business analysis matrices for any large-scale industry evaluated by financial AI.', isAvailable: true },
    { id: 'legal-reviewer', title: 'Contract Analyzer', category: 'AI Business Intelligence Tools', description: 'Safely find dangerous loopholes in standardized NDA legal contracts using a deeply trained legal language AI.', isAvailable: true },

    // AI Project Management Tools
    { id: 'agile-sprint-planner', title: 'Agile Sprint Planner', category: 'AI Project Management Tools', description: 'Automatically generate exceptionally robust agile development user stories and sprint plans via an AI Product Manager.', isAvailable: true },

    // AI Product Management Tools
    { id: 'prd-gen', title: 'PRD Generator', category: 'AI Product Management Tools', description: 'Write heavily comprehensive, professional Product Requirements Documents fully structured entirely by AI software.', isAvailable: true },

    // AI Research Tools
    { id: 'research-analyzer', title: 'Market Research Analyzer', category: 'AI Research Tools', description: 'Holistically evaluate current consumer market trends safely based on specific custom industry parameters queried by AI.', isAvailable: true },

    // AI Content Tools
    { id: 'copywriter', title: 'Marketing Copywriter', category: 'AI Content Tools', description: 'Write natively high-converting sales funnel landing page copy specifically orchestrated by a marketing algorithm AI.', isAvailable: true },
    { id: 'voice-clone-script', title: 'TTS Script Adjuster', category: 'AI Content Tools', description: 'Phonetically optimize spoken scripts heavily for text-to-speech voice clone engines using a linguistic AI model.', isAvailable: true },
    { id: 'video-script', title: 'TikTok Script Gen', category: 'AI Content Tools', description: 'Procedurally generate highly viral short-form algorithm-focused video scripts for TikTok using an engagement AI.', isAvailable: true },
    { id: 'music-prompt', title: 'Suno Prompter', category: 'AI Content Tools', description: 'Write the perfect detailed prompts strictly tailored for generative AI audio and music generation tools like Suno.', isAvailable: true },

    // AI Financial Tools
    { id: 'finance-analyzer', title: 'Financial Risk Evaluator', category: 'AI Financial Tools', description: 'Critically assess severe business and venture risks based entirely on inputted financial metrics analyzed by an AI auditor.', isAvailable: true },
    { id: 'tax-assistant', title: 'Tax Categorizer', category: 'AI Financial Tools', description: 'Professionally categorize and sort bulk business expenses for maximum tax deductions safely processed by a CPA AI.', isAvailable: true },
    { id: 'investment-strategy', title: 'Portfolio Strategy Gen', category: 'AI Financial Tools', description: 'Generate sophisticated investment portfolio allocations and risk-adjusted growth strategies via AI wealth management.', isAvailable: true },
    { id: 'credit-strategist', title: 'Credit Score Optimizer', category: 'AI Financial Tools', description: 'Analyze debt-to-income ratios and payment history to create an aggressive AI strategy for credit score recovery.', isAvailable: true },
    { id: 'fire-planner', title: 'FIRE Retirement Planner', category: 'AI Financial Tools', description: 'Calculate precise Financial Independence numbers and early retirement trajectories synthesized by an AI actuary.', isAvailable: true },

    // AI Learning Tools
    { id: 'quiz-generator', title: 'Interactive Quiz Maker', category: 'AI Learning Tools', description: 'Instantly turn any random dense text block beautifully into an interactive quiz assessment parsed dynamically by AI.', isAvailable: true },
    { id: 'language-tutor', title: 'Language Tutor', category: 'AI Learning Tools', description: 'Practice live immersive vocal conversations continuously in 50+ languages hosted by an intelligent AI polyglot.', isAvailable: true },
    { id: 'study-plan', title: 'Study Plan Creator', category: 'AI Learning Tools', description: 'Create heavily focused, academic learning roadmaps efficiently synthesized over specified timeframes by an educational AI.', isAvailable: true },
    { id: 'math-solver', title: 'Step-by-Step Math', category: 'AI Learning Tools', description: 'Solve difficult calculus and trigonometry math problems fully backed with understandable, incremental AI steps.', isAvailable: true }
];
