# 🎮 Play AI: The Ultimate Intelligence Hub

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Host: play-ai.in](https://img.shields.io/badge/Hosted-play--ai.in-indigo)](https://play-ai.in)
[![Platform: Chrome Extension](https://img.shields.io/badge/Browser-Chrome--Extension-emerald)](https://github.com/saravana-babu/Play-ai/tree/main/chrome-extension)

Play AI is a professional, privacy-focused intelligence ecosystem designed to decentralize AI productivity. We combine a massive library of 50+ AI-driven games and tools with a high-performance **Web Assistant** extension for instant content curation and creation.

**🚀 Featured: AI PWA App Engine — Generate high-fidelity Landing Pages and PWAs from a single prompt.**

---

## 🌐 1. Play-AI Website Features

The central hub for deterministic games, cognitive tools, and the AI App Engine.

### ⚡ AI App Engine (PWA Generator)
- **Instant Deployment:** Generate complete JavaScript-based PWAs, Landing Pages, and Single-file UIs in seconds.
- **BYOK Sandbox:** Securely use your own API keys (Gemini, OpenAI, Groq) with zero server-side storage.
- **Code Export:** Download raw `.html` or export your generated code for external hosting.

### 🕹️ Unified Game Nexus
- **50+ Integrated Modules:** Classic games (Chess, Sudoku) to AI-first experiences like *Story Teller* and *Neural Cipher*.
- **LLM Duals:** Watch two different LLM providers (e.g., Gemini vs. Claude) compete in real-time strategic duels.
- **Adaptive Intelligence:** Games that evolve and learn based on your playstyle.

### 🛠️ Cognitive Tool Library
- **Developer Suite:** AI Code Reviewer, RegEx Compiler, API Mock Generator.
- **Productivity Suite:** Meeting Notes Extractor, Financial Risk Evaluator, SWOT Analyzer.
- **Learning Suite:** Interactive Quiz Maker, ELI5 Concept Explainer, Personal Study Plan Gen.

---

## 🧩 2. Play AI Web Assistant (Chrome Extension)

A powerful, high-density side panel that brings the full power of Play AI to any website.

### 🔳 3x3 High-Density Power Grid
A slim **280px Obsidian UI** featuring 9 specialized intelligence tools at your fingertips:
- **Curate Intelligence:**
    - **Summarize**: Zero-clutter webpage summaries.
    - **Insights**: Extract deep takeaways and data points.
    - **Analyze**: Evaluate tone, bias, and authority.
    - **For Kids**: Explain the current page simply for a young child.
    - **Quiz Me**: Generate test questions based on the page.
    - **Code Snippet**: Extract and explain technical logic from the page.

- **Create & Command:**
    - **Rewrite**: Rewrite selected text for clarity or professionalism.
    - **Action Items**: Extract "To-Do" lists from unstructured text.
    - **Viral Tweet**: Draft engaging social posts about the current content.
    - **Pro Email**: Write a professional email summary of the page.
    - **Interview Prep**: Predict tough questions related to the page content.

### 🚀 Performance & UI
- **Groq Integration**: Optimized for sub-second inference using Llama 3.3 and Mixtral.
- **Obsidian Glassmorphism**: Semi-transparent dark UI with a pinned, always-visible Branding Footer.
- **BYOK Security**: Securely saves API keys locally using `chrome.storage`. No keys ever touch our backend.
- **Keyboard Shortcut**: Toggle the assistant anywhere using `Alt + Shift + Space`.

---

## 🛠️ Local Development

### Prerequisites
- **Node.js** (v20+)
- **PostgreSQL** (Recommended for full History/Profile support)

### Quick Start
1. **Clone & Install:**
   ```bash
   git clone https://github.com/saravana-babu/Play-ai.git
   cd Play-AI
   npm install
   ```
2. **Environment Setup:** Create a `.env` with `DATABASE_URL` and `JWT_SECRET`.
3. **Run Platform:** `npm run dev`
4. **Build Extension:** 
   ```bash
   cd chrome-extension
   # Bundles src/ to public/
   npm run build 
   ```

---

## 🛡️ Security & Privacy (BYOK)

Play AI is built on the **Bring Your Own Key** (BYOK) principle. We act as an intelligent gateway, ensuring:
1. **No Data Snooping:** Your prompts and responses stay between you and your AI provider.
2. **Local Sovereignty:** API keys are stored in high-security local browser storage, never sent to `play-ai.in`.
3. **Cost Control:** You are in direct control of your own LLM billing and usage.

---

## 🤝 Contributing
We love PRs! Whether it's a new 3x3 tool, a game module, or a new AI adapter.
1. Fork the repo and check out [CONTRIBUTING.md](CONTRIBUTING.md).
2. All major PRs are deploy-mirrored to `play-ai.in`.

---

## 📜 License
MIT License - Developed for the future of AI-human interaction.
*Powered by [play-ai.in](https://play-ai.in)*
