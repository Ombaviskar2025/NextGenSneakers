import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import dotenv from 'dotenv';

// Import Routes
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import orderRoutes from './routes/order.routes';
import adminRoutes from './routes/admin.routes';
import vendorRoutes from './routes/vendor.routes';
import reviewRoutes from './routes/review.routes';
import aiRoutes from './routes/ai.routes';

dotenv.config();

// Auto-seed database if sneaker categories are missing (e.g. in live environment)
import { seedDatabase } from './utils/dbSeeder';
seedDatabase().catch((err) => {
  console.error('[DB AUTOSEED ERROR] Failed to seed database:', err);
});

const app = express();
const PORT = process.env.PORT || 5000;

// ==========================================
// MIDDLEWARES
// ==========================================

// Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

// Logging
app.use(morgan('dev'));

// CORS configuration — allow Vercel frontend domain + localhost
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'https://next-gen-sneakers.vercel.app',
  /\.vercel\.app$/,
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const allowed =
        allowedOrigins.some((o) =>
          typeof o === 'string' ? o === origin : o.test(origin)
        );
      callback(null, allowed);
    },
    credentials: true,
  })
);

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Custom Light Cookie Parser Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const cookieHeader = req.headers.cookie;
  (req as any).cookies = {};
  if (cookieHeader) {
    cookieHeader.split(';').forEach((cookie) => {
      const parts = cookie.split('=');
      const name = parts[0].trim();
      const value = parts.slice(1).join('=').trim();
      (req as any).cookies[name] = decodeURIComponent(value);
    });
  }
  next();
});

// Serve Local Uploaded Files (Cloudinary fallback)
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

// Rate Limiter
if (process.env.NODE_ENV === 'production') {
  const generalRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { message: 'Too many requests from this IP, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: { message: 'Brute-force limit hit. Try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use('/api', generalRateLimiter);
  app.use('/api/auth/login', authRateLimiter);
  app.use('/api/auth/register', authRateLimiter);
}

// ==========================================
// API ROUTES
// ==========================================
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/ai', aiRoutes);

// Health Check API
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date() });
});
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date() });
});

// ==========================================
// ERROR HANDLING
// ==========================================
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Application Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'An unexpected application error occurred.',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

// ==========================================
// SERVER START
// ==========================================
// Start the HTTP server when run directly (local dev + Render production).
// When imported as a module (Vercel serverless), the listener is NOT started.
const isMainModule =
  typeof require !== 'undefined' && require.main === module;
const isDirectRun = process.env.RENDER === 'true' || isMainModule || process.argv[1]?.includes('index');

if (isDirectRun) {
  const server = http.createServer(app);

  // Initialize WebSockets (supported on Render and local dev, not on Vercel)
  import('./services/socket.service').then(({ socketService }) => {
    socketService.initialize(server);
  });

  server.listen(PORT, () => {
    console.log(`[SERVER RUNNING] Mode: ${process.env.NODE_ENV}. Listening on Port: ${PORT}`);
  });
}

// Export app for Vercel serverless handler
export default app;
