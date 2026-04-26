import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Import our standalone handlers
import webhookHandler from './api/webhook';
import checkoutHandler from './api/create-checkout-session';
import portalHandler from './api/create-portal-session';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use the handlers for local development
  // We need to handle the Vercel-style raw body for the webhook locally too
  app.post('/api/webhook', async (req, res) => {
    // Vercel handlers look like (req, res) => void
    // We can cast them or wrap them
    return webhookHandler(req as any, res as any);
  });

  app.use(express.json());

  app.post('/api/create-checkout-session', (req, res) => {
    return checkoutHandler(req as any, res as any);
  });

  app.post('/api/create-portal-session', (req, res) => {
    return portalHandler(req as any, res as any);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
