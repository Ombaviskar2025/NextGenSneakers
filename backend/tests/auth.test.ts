import request from 'supertest';
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { emailService } from '../src/services/email.service';

// Create a mock app for testing routes
import authRoutes from '../src/routes/auth.routes';
import { db } from '../src/config/db';

jest.mock('../src/config/db', () => ({
  db: {
    query: jest.fn(),
    transaction: jest.fn((cb) => cb({ query: jest.fn() })),
  },
}));

jest.mock('../src/services/email.service', () => ({
  emailService: {
    sendVerificationEmail: jest.fn().mockResolvedValue(true),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
  },
}));

const app = express();
app.use(express.json());
// Stub cookie parsing
app.use((req: any, res, next) => {
  req.cookies = {};
  next();
});
app.use('/api/auth', authRoutes);

describe('Authentication API Routes', () => {
  beforeEach(() => {
    (emailService.sendVerificationEmail as jest.Mock).mockResolvedValue(true);
    (emailService.sendPasswordResetEmail as jest.Mock).mockResolvedValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new customer successfully', async () => {
      // Mock db.query for findByEmail (return null, meaning user does not exist)
      (db.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] }) // Check email
        .mockResolvedValueOnce({ rows: [{ id: 'role-123', name: 'customer' }] }) // Role fetch
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'user-123',
              email: 'test@example.com',
              full_name: 'Test User',
              role_id: 'role-123',
              is_verified: false,
            },
          ],
        }); // User creation

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123',
          fullName: 'Test User',
          phone: '+15550000',
        });

      expect(res.status).toBe(201);
      expect(res.body.message).toContain('Registration successful');
      expect(res.body.user.email).toBe('test@example.com');
    });

    it('should block registration if email already exists', async () => {
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ id: 'user-123', email: 'test@example.com' }],
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123',
          fullName: 'Test User',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already registered');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should log in successfully with correct credentials', async () => {
      const passwordHash = await bcrypt.hash('Password123', 10);
      
      (db.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'user-123',
              email: 'test@example.com',
              password_hash: passwordHash,
              full_name: 'Test User',
              role_id: 'role-123',
              role_name: 'customer',
              is_verified: true,
            },
          ],
        }); // Find user

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123',
        });

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.user.email).toBe('test@example.com');
    });

    it('should fail login if password is incorrect', async () => {
      const passwordHash = await bcrypt.hash('Password123', 10);

      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [
          {
            id: 'user-123',
            email: 'test@example.com',
            password_hash: passwordHash,
            role_name: 'customer',
          },
        ],
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword',
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Invalid email or password');
    });
  });
});
