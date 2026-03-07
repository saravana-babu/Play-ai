# 🎮 Play-AI: The Ultimate AI Gaming Hub

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Host: play-ai.in](https://img.shields.io/badge/Hosted-play--ai.in-indigo)](https://play-ai.in)

Play-AI is a high-performance, open-source gaming platform featuring 50+ classic and modern games powered by Multiple Large Language Models (LLMs). Challenge the AI, watch LLMs duel each other, or sharpen your skills in an immersive, gaming-optimized environment.

**🌐 Live Demo:** [play-ai.in](https://play-ai.in)

---

## ✨ Features

- **50+ Integrated Games:** From classics like Chess and Sudoku to AI-driven experiences like Story Teller and ML Tuning.
- **Multiple AI Engines:** Integrated support for:
  - **Google Gemini** (v1.5 Flash/Pro)
  - **OpenAI GPT-4o**
  - **Anthropic Claude 3.5**
  - **DeepSeek**
  - **Groq** (Ultra-fast Llama 3/Mixtral)
  - **Ollama** (Local execution support)
- **Duel Mode:** Match two different LLMs against each other and watch them compete.
- **Premium UI:** Sleek, dark-themed interface built with React, Tailwind, and Framer Motion.
- **Infrastructure Ready:** Full-stack architecture with high-speed inference logging and quota management.

---

## 🛠️ Local Development

### Prerequisites
- **Node.js** (v20+)
- **PostgreSQL** (Optional for local development, fallback to transient state available)

### Quick Start
1. **Clone the repository:**
   ```bash
   git clone https://github.com/saravana-babu/Play-ai.git
   cd Play-AI
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Configure Environment:**
   Create a `.env` file in the root:
   ```env
   DATABASE_URL=postgres://user:pass@localhost:5432/play-ai
   JWT_SECRET=your_super_secret_key
   ```
4. **Launch:**
   ```bash
   npm run dev
   ```

---

## 🐳 Docker Deployment (Recommended for Droplets)

To host on a DigitalOcean Droplet or any VPS:

1. **Install Docker & Docker Compose** on your Droplet.
2. **Clone the repo** on the server:
   ```bash
   git clone https://github.com/saravana-babu/Play-ai.git
   cd Play-AI
   ```
3. **Run the Deployment Script:**
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```
   *This script will help you set up your `.env` file, generate a secure JWT secret, and start the containers.*

### 🛡️ Nginx Proxy Manager (Easy Free SSL)
This project includes **Nginx Proxy Manager** (NPM) for a simple web-based SSL management experience.

1. **Access NPM Dashboard:** Open `http://your_droplet_ip:81`
2. **Login:** `admin@example.com` / `changeme`
3. **Point Domain:** 
   - Add a **Proxy Host**.
   - **Domain:** `play-ai.in`
   - **Forward Name/IP:** `app`
   - **Forward Port:** `3000`
   - **SSL Tab:** Request a new certificate from Let's Encrypt (free).

### 🛡️ Security Best Practices
- **DB Password:** Never use `postgres` as your password on a public server. Update `DB_PASSWORD` in your `.env` file.
- **Firewall:** Open ports `80`, `443`, and `81` (temporarily) in your Cloud Firewall. Keep port `5432` (PostgreSQL) closed to the public.
- **Post-Setup:** After setting up SSL, you can remove port `3000` from the `docker-compose.yml` to ensure all traffic goes through the proxy.

---

## 🤝 Contributing

We love PRs! Whether it's a new game, a UI tweak, or a new AI provider, feel free to contribute.
1. Check out our [CONTRIBUTING.md](CONTRIBUTING.md).
2. Fork the repo and submit your changes.
3. If your PR is high-quality, it will be merged and deployed to `play-ai.in`.

---

## 📜 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

Developed for the future of AI-human interaction.
