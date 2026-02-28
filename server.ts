import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(cors());

const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

// DB Setup
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/neuroplay'
});

// Init DB
const initDb = async () => {
  try {
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
        selected_llm VARCHAR(50) DEFAULT 'gemini'
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
      'SELECT gemini_key, openai_key, anthropic_key, selected_llm FROM profiles WHERE id = $1',
      [req.user.id]
    );
    res.json(result.rows[0] || { gemini_key: null, openai_key: null, anthropic_key: null, selected_llm: 'gemini' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/profiles/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { gemini_key, openai_key, anthropic_key, selected_llm } = req.body;
    await pool.query(
      `INSERT INTO profiles (id, gemini_key, openai_key, anthropic_key, selected_llm) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT (id) DO UPDATE SET 
       gemini_key = EXCLUDED.gemini_key, 
       openai_key = EXCLUDED.openai_key, 
       anthropic_key = EXCLUDED.anthropic_key, 
       selected_llm = EXCLUDED.selected_llm`,
      [req.user.id, gemini_key, openai_key, anthropic_key, selected_llm]
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
