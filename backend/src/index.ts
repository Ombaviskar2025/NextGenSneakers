import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import dotenv from 'dotenv';

// Import Services
import { socketService } from './services/socket.service';

// Import Routes
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import orderRoutes from './routes/order.routes';
import adminRoutes from './routes/admin.routes';
import vendorRoutes from './routes/vendor.routes';
import reviewRoutes from './routes/review.routes';
import aiRoutes from './routes/ai.routes';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize WebSockets
socketService.initialize(server);

// ==========================================
// MIDDLEWARES
// ==========================================

// Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: false, // Allows loading local uploaded product images
  })
);

// Logging
app.use(morgan('dev'));

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Custom Light Cookie Parser Middleware (removes cookie-parser dependency)
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
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: { message: 'Too many requests from this IP, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30, // Limit login/register actions
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

// Start Server
server.listen(PORT, () => {
  console.log(`[SERVER RUNNING] Mode: ${process.env.NODE_ENV}. Listening on Port: ${PORT}`);
});
