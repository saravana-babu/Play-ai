import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import Stripe from 'stripe';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder_key_for_dev_only';
const stripe = new Stripe(STRIPE_SECRET_KEY);

const app = express();
app.use(express.json());
app.use(cors());

const PORT = parseInt(process.env.PORT || '3000');
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

// DB Setup
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/play-ai'
});

// Init DB
const initDb = async () => {
  try {
    const shouldTruncate = process.env.DB_TRUNCATE === 'true';

    if (shouldTruncate) {
      console.log('Truncating database...');
      await pool.query(`
        DROP TABLE IF EXISTS generated_games CASCADE;
        DROP TABLE IF EXISTS game_results CASCADE;
        DROP TABLE IF EXISTS profiles CASCADE;
        DROP TABLE IF EXISTS users CASCADE;
      `);
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS profiles (
        id INTEGER PRIMARY KEY REFERENCES users(id),
        gemini_key TEXT,
        openai_key TEXT,
        anthropic_key TEXT,
        deepseek_key TEXT,
        groq_key TEXT,
        selected_llm VARCHAR(50) DEFAULT 'gemini',
        provider_models JSONB DEFAULT '{}',
        ollama_url TEXT DEFAULT 'http://localhost:11434',
        ollama_model TEXT DEFAULT 'llama3',
        is_subscribed BOOLEAN DEFAULT FALSE,
        plan_type VARCHAR(20) DEFAULT 'free', -- 'free', 'basic', 'advance'
        generations_count INTEGER DEFAULT 0,
        stripe_customer_id TEXT,
        stripe_subscription_id TEXT,
        subscription_status TEXT,
        subscription_end_date TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS game_results (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        game_id VARCHAR(50) NOT NULL,
        winner VARCHAR(20) NOT NULL,
        funny_task TEXT,
        total_tokens INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS generated_games (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        prompt TEXT NOT NULL,
        code TEXT NOT NULL,
        is_public BOOLEAN DEFAULT TRUE,
        is_published BOOLEAN DEFAULT FALSE,
        share_slug VARCHAR(100) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Database initialized');
  } catch (err) {
    console.error('Failed to initialize database:', err);
  }
};
initDb();

// Auth Middleware
interface AuthRequest extends Request {
  user?: any;
}

const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Routes
app.post('/api/auth/signup', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const lowerEmail = email.toLowerCase();
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email',
      [lowerEmail, hashedPassword]
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
    res.json({ user, token });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const lowerEmail = email.toLowerCase();
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [lowerEmail]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
    res.json({ user: { id: user.id, email: user.email }, token });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/auth/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const lowerEmail = email.toLowerCase();
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [lowerEmail]);
    const user = result.rows[0];
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Generate a temporary password
    const tempPass = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPass, 10);

    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, user.id]);

    // In a real app, you'd send this via email. For now, we'll return it in the response
    // so the user can see it in this demo environment.
    console.log(`Temporary password for ${lowerEmail}: ${tempPass}`);

    res.json({
      success: true,
      message: 'A temporary password has been generated.',
      tempPass: tempPass // Returning it for demo purposes.
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', authenticate, (req: AuthRequest, res: Response) => {
  res.json({ user: req.user });
});

app.get('/api/profiles/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT gemini_key, openai_key, anthropic_key, deepseek_key, groq_key, selected_llm, provider_models, ollama_url, ollama_model, is_subscribed, plan_type, generations_count FROM profiles WHERE id = $1',
      [req.user.id]
    );
    res.json(result.rows[0] || {
      gemini_key: null,
      openai_key: null,
      anthropic_key: null,
      deepseek_key: null,
      groq_key: null,
      selected_llm: 'groq',
      provider_models: {},
      ollama_url: 'http://localhost:11434',
      ollama_model: 'llama3',
      is_subscribed: false,
      plan_type: 'free',
      generations_count: 0
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/generate-game', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { prompt } = req.body;
    const userId = req.user.id;

    // Check subscription and quota
    const profileRes = await pool.query('SELECT is_subscribed, generations_count FROM profiles WHERE id = $1', [userId]);
    const profile = profileRes.rows[0];

    if (!profile.is_subscribed && profile.generations_count >= 1) {
      res.status(403).json({ error: 'Generation limit reached. Please subscribe for unlimited access.' });
      return;
    }

    // In a real app, you'd call your chosen LLM here using your backend API key
    // For now, we'll simulate a response or use the user's key logic if provided
    // Since the prompt says "use our api key in backend", I'll mock the logic
    // but the actual call should use process.env.BACKEND_API_KEY
    let BACKEND_GEMINI_KEY = process.env.GEMINI_API_KEY;

    if (!BACKEND_GEMINI_KEY) {
      BACKEND_GEMINI_KEY = 'AIzaSyD1jSwUs8uL9EAoyF_iB0oshulfh6UQH8s';
      // res.status(500).json({ error: 'Backend AI configuration missing' });
      // return;
    }

    const systemInstruction = `
      You are an expert web developer specializing in single-file PWAs and responsive UIs. Generate a complete, single-file HTML5 application or landing page based on the user's idea. 
      The idea could be a game (Canvas/Phaser), a utility tool (converter, calculator), a SaaS Landing Page, or a complex UI Component.
      
      The output must be a single HTML file containing all HTML, CSS, and JavaScript.
      The app should:
      1. Be responsive and work on mobile and desktop.
      2. Use Vanilla JS or lightweight libraries (e.g., Canvas API, Lucide icons via CDN if needed).
      3. Include a simple PWA manifest and a dummy service worker script within the same file (for demo/preview purposes).
      4. Have a polished, premium aesthetic with modern UI/UX.
      5. Include appropriate controls (touch/mouse).
      6. Handle "Install" prompt logic.
      
      Respond with ONLY the HTML code along with JS inline and libraries from CDN.
    `;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-002:generateContent?key=${BACKEND_GEMINI_KEY}`;

    const aiResponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: systemInstruction }] }
      })
    });

    if (!aiResponse.ok) {
      const errData = await aiResponse.json().catch(() => ({}));
      console.error('Gemini Backend Error:', errData);
      throw new Error(`AI Generation failed: ${aiResponse.status} ${JSON.stringify(errData.error || errData)}`);
    }

    const data = await aiResponse.json();
    const code = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Save to history and increment count
    await pool.query('UPDATE profiles SET generations_count = generations_count + 1 WHERE id = $1', [userId]);
    const insertRes = await pool.query(
      'INSERT INTO generated_games (user_id, prompt, code) VALUES ($1, $2, $3) RETURNING id', 
      [userId, prompt, code]
    );

    res.json({ id: insertRes.rows[0].id, code });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/profiles/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const {
      gemini_key, openai_key, anthropic_key, deepseek_key, groq_key,
      selected_llm, provider_models, ollama_url, ollama_model
    } = req.body;

    await pool.query(
      `INSERT INTO profiles (
        id, gemini_key, openai_key, anthropic_key, deepseek_key, groq_key, 
        selected_llm, provider_models, ollama_url, ollama_model
      ) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
       ON CONFLICT (id) DO UPDATE SET 
       gemini_key = EXCLUDED.gemini_key, 
       openai_key = EXCLUDED.openai_key, 
       anthropic_key = EXCLUDED.anthropic_key, 
       deepseek_key = EXCLUDED.deepseek_key, 
       groq_key = EXCLUDED.groq_key, 
       selected_llm = EXCLUDED.selected_llm,
       provider_models = EXCLUDED.provider_models,
       ollama_url = EXCLUDED.ollama_url,
       ollama_model = EXCLUDED.ollama_model`,
      [
        req.user.id, gemini_key, openai_key, anthropic_key, deepseek_key, groq_key,
        selected_llm, JSON.stringify(provider_models || {}), ollama_url, ollama_model
      ]
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/history', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM game_results WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/history', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { game_id, winner, funny_task, total_tokens } = req.body;
    await pool.query(
      'INSERT INTO game_results (user_id, game_id, winner, funny_task, total_tokens) VALUES ($1, $2, $3, $4, $5)',
      [req.user.id, game_id, winner, funny_task, total_tokens || 0]
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Stripe Integration
app.post('/api/stripe/create-checkout-session', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { plan = 'basic' } = req.body;
    const userId = req.user.id;
    const userEmail = req.user.email;

    const priceAmount = plan === 'advance' ? 2000 : 1000;
    const planName = plan === 'advance' ? 'Play-AI Advance Plan' : 'Play-AI Basic Plan';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: planName,
              description: plan === 'advance' ? 'Unlimited App Publishing & Pro Tools' : '1 Public App Link & Pro Tools',
            },
            unit_amount: priceAmount,
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      metadata: { plan_type: plan }, // Store plan in metadata
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings`,
      customer_email: userEmail,
      client_reference_id: userId.toString(),
    });

    res.json({ url: session.url });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET || '');
  } catch (err: any) {
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.client_reference_id;
    const stripeCustomerId = session.customer as string;
    const stripeSubscriptionId = session.subscription as string;

    if (userId) {
      const planType = session.metadata?.plan_type || 'basic';
      await pool.query(
        'UPDATE profiles SET is_subscribed = TRUE, plan_type = $1, stripe_customer_id = $2, stripe_subscription_id = $3, subscription_status = $4 WHERE id = $5',
        [planType, stripeCustomerId, stripeSubscriptionId, 'active', userId]
      );
    }
  } else if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription;
    const stripeSubscriptionId = subscription.id;

    await pool.query(
      'UPDATE profiles SET is_subscribed = FALSE, subscription_status = $1 WHERE stripe_subscription_id = $2',
      ['canceled', stripeSubscriptionId]
    );
  }

  res.json({ received: true });
});

// Helper for random slugs
const generateSlug = () => Math.random().toString(36).substring(2, 8) + Math.random().toString(36).substring(2, 8);

app.post('/api/publish-app', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { gameId } = req.body;
    const userId = req.user.id;

    // Check user plan and existing published games
    const profileRes = await pool.query('SELECT is_subscribed, plan_type FROM profiles WHERE id = $1', [userId]);
    const profile = profileRes.rows[0];

    if (!profile.is_subscribed) {
      res.status(403).json({ error: 'Subscription required to publish apps' });
      return;
    }

    if (profile.plan_type === 'basic') {
      const countRes = await pool.query('SELECT COUNT(*) FROM generated_games WHERE user_id = $1 AND is_published = TRUE', [userId]);
      if (parseInt(countRes.rows[0].count) >= 1) {
        res.status(403).json({ error: 'Basic plan limited to 1 published app. Upgrade to Advance for more.' });
        return;
      }
    }

    const slug = generateSlug();
    const updateRes = await pool.query(
      'UPDATE generated_games SET is_published = TRUE, share_slug = $1 WHERE id = $2 AND user_id = $3 RETURNING share_slug',
      [slug, gameId, userId]
    );

    if (updateRes.rows.length === 0) {
      res.status(404).json({ error: 'App not found or unauthorized' });
      return;
    }

    res.json({ success: true, slug: updateRes.rows[0].share_slug });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Public route to serve published games
app.get('/p/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const gameRes = await pool.query('SELECT code FROM generated_games WHERE share_slug = $1 AND is_published = TRUE', [slug]);
    
    if (gameRes.rows.length === 0) {
      res.status(404).send('<h1>App not found</h1>');
      return;
    }

    res.setHeader('Content-Type', 'text/html');
    res.send(gameRes.rows[0].code);
  } catch (err: any) {
    res.status(500).send('Server Error');
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
