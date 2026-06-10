import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { UserModel } from '../models/user.model';
import { emailService } from '../services/email.service';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'default_access_token_secret_398284729384';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'default_refresh_token_secret_471928473928';
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '15m';
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d';

/**
 * Helper: Generate Access and Refresh Tokens
 */
const generateTokens = async (user: any) => {
  // Check if user is a vendor, get vendor and store IDs
  let vendorId: string | undefined;
  let storeId: string | undefined;

  if (user.role_name === 'vendor') {
    const vendor = await UserModel.findVendorByUserId(user.id);
    if (vendor) {
      vendorId = vendor.id;
      // Get store
      const storeQuery = 'SELECT id FROM stores WHERE vendor_id = $1';
      const storeResDirect = await require('../config/db').db.query(storeQuery, [vendor.id]);
      storeId = storeResDirect.rows[0]?.id;
    }
  }

  const payload = {
    id: user.id,
    email: user.email,
    role: user.role_name,
    vendorId,
    storeId,
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY } as any);
  const refreshToken = jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY } as any);

  return { accessToken, refreshToken };
};

export const authController = {
  /**
   * Register User (Defaults to customer role)
   */
  async register(req: Request, res: Response) {
    const { email, password, fullName, phone } = req.body;

    try {
      // 1. Check if user exists
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'User with this email already registered.' });
      }

      // 2. Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // 3. Create verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');

      // 4. Save user
      const user = await UserModel.createUser({
        email,
        passwordHash,
        roleName: 'customer', // Always register as customer; vendors apply separately
        fullName,
        phone,
        verificationToken,
      });

      // 5. Send verification email (async)
      emailService.sendVerificationEmail(user.email, verificationToken).catch((err) => {
        console.error('Failed to send verification email:', err);
      });

      return res.status(201).json({
        message: 'Registration successful. Please check your email to verify your account.',
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role_name,
          isVerified: user.is_verified,
        },
      });
    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({ message: 'Internal server error.' });
    }
  },

  /**
   * Login User
   */
  async login(req: Request, res: Response) {
    const { email, password } = req.body;

    try {
      // 1. Find user
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password.' });
      }

      // 2. Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid email or password.' });
      }

      // 3. Generate tokens
      const { accessToken, refreshToken } = await generateTokens(user);

      // 4. Update refresh token in DB
      await UserModel.updateRefreshToken(user.id, refreshToken);

      // 5. Set refresh token in HttpOnly cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // 6. Return response
      return res.status(200).json({
        message: 'Login successful',
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role_name,
          isVerified: user.is_verified,
          avatarUrl: user.avatar_url,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ message: 'Internal server error.' });
    }
  },

  /**
   * Refresh Token
   */
  async refresh(req: Request, res: Response) {
    // Get refresh token from cookie or body
    const token = req.cookies?.refreshToken || req.body.refreshToken;

    if (!token) {
      return res.status(401).json({ message: 'Refresh token required.' });
    }

    try {
      // 1. Verify token
      const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as any;

      // 2. Find user by refresh token
      const user = await UserModel.findByRefreshToken(token);
      if (!user || user.id !== decoded.id) {
        return res.status(403).json({ message: 'Invalid refresh token.' });
      }

      // 3. Generate new tokens
      const { accessToken, refreshToken: newRefreshToken } = await generateTokens(user);

      // 4. Save new refresh token
      await UserModel.updateRefreshToken(user.id, newRefreshToken);

      // 5. Update cookie
      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.status(200).json({ accessToken });
    } catch (error) {
      console.error('Token refresh error:', error);
      return res.status(403).json({ message: 'Session expired. Please log in again.' });
    }
  },

  /**
   * Logout User
   */
  async logout(req: Request, res: Response) {
    const token = req.cookies?.refreshToken || req.body.refreshToken;
    
    if (token) {
      const user = await UserModel.findByRefreshToken(token);
      if (user) {
        await UserModel.updateRefreshToken(user.id, null);
      }
    }

    res.clearCookie('refreshToken');
    return res.status(200).json({ message: 'Logged out successfully.' });
  },

  /**
   * Verify Email
   */
  async verifyEmail(req: Request, res: Response) {
    const token = req.query.token as string;

    if (!token) {
      return res.status(400).json({ message: 'Verification token is required.' });
    }

    try {
      const success = await UserModel.verifyEmail(token);
      if (!success) {
        return res.status(400).json({ message: 'Invalid or expired verification token.' });
      }
      return res.status(200).json({ message: 'Email verified successfully. You can now log in.' });
    } catch (error) {
      console.error('Email verification error:', error);
      return res.status(500).json({ message: 'Internal server error.' });
    }
  },

  /**
   * Forgot Password
   */
  async forgotPassword(req: Request, res: Response) {
    const { email } = req.body;

    try {
      const user = await UserModel.findByEmail(email);
      if (!user) {
        // Return 200 even if email doesn't exist for security reasons
        return res.status(200).json({ message: 'If the email exists, a password reset link has been sent.' });
      }

      // Generate reset token (expires in 1h)
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      await UserModel.updateResetToken(email, resetToken, expiry);

      // Send email (async)
      emailService.sendPasswordResetEmail(email, resetToken).catch((err) => {
        console.error('Failed to send reset email:', err);
      });

      return res.status(200).json({ message: 'If the email exists, a password reset link has been sent.' });
    } catch (error) {
      console.error('Forgot password error:', error);
      return res.status(500).json({ message: 'Internal server error.' });
    }
  },

  /**
   * Reset Password
   */
  async resetPassword(req: Request, res: Response) {
    const { token, password } = req.body;

    try {
      const user = await UserModel.findByResetToken(token);
      if (!user) {
        return res.status(400).json({ message: 'Invalid or expired reset token.' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      await UserModel.updatePassword(user.id, passwordHash);

      return res.status(200).json({ message: 'Password reset successful. You can now log in.' });
    } catch (error) {
      console.error('Reset password error:', error);
      return res.status(500).json({ message: 'Internal server error.' });
    }
  },

  /**
   * Google Login / Registration
   * Resolves Google ID token and logs user in
   */
  async googleLogin(req: Request, res: Response) {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: 'Google ID token is required' });
    }

    try {
      let email = '';
      let fullName = '';
      let avatarUrl = '';

      // Google OAuth token validation
      if (idToken.startsWith('mock_google_token_')) {
        // Mock verification for local testing
        const suffix = idToken.replace('mock_google_token_', '');
        email = `${suffix}@gmail.com`;
        fullName = `GoogleUser ${suffix}`;
        avatarUrl = `https://lh3.googleusercontent.com/a/mock_avatar`;
      } else {
        // Real HTTP call to Google Tokeninfo endpoint
        const googleResponse = await axios.get(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
        );
        const payload = googleResponse.data;

        if (!payload.email) {
          return res.status(400).json({ message: 'Invalid ID token content' });
        }

        email = payload.email;
        fullName = payload.name || 'Google User';
        avatarUrl = payload.picture || '';
      }

      // 1. Find or create user
      let user = await UserModel.findByEmail(email);

      if (!user) {
        // Create user with random password
        const randomPassword = crypto.randomBytes(16).toString('hex');
        const passwordHash = await bcrypt.hash(randomPassword, 10);
        
        user = await UserModel.createUser({
          email,
          passwordHash,
          roleName: 'customer',
          fullName,
          isVerified: true, // Auto-verify Google login users
        });

        // Set avatar
        if (avatarUrl) {
          await UserModel.updateProfile(user.id, { avatarUrl });
          user.avatar_url = avatarUrl;
        }
      }

      // 2. Generate tokens
      const { accessToken, refreshToken } = await generateTokens(user);
      await UserModel.updateRefreshToken(user.id, refreshToken);

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.status(200).json({
        message: 'Google login successful',
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role_name,
          isVerified: user.is_verified,
          avatarUrl: user.avatar_url,
        },
      });
    } catch (error: any) {
      console.error('Google login error:', error.message);
      return res.status(400).json({ message: 'Google OAuth authentication failed.' });
    }
  },

  /**
   * Get User Profile
   */
  async getProfile(req: any, res: Response) {
    try {
      const user = await UserModel.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      return res.status(200).json({
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          phone: user.phone,
          avatarUrl: user.avatar_url,
          role: user.role_name,
          isVerified: user.is_verified,
        },
      });
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error.' });
    }
  },

  /**
   * Update Profile
   */
  async updateProfile(req: any, res: Response) {
    const { fullName, phone, avatarUrl } = req.body;
    try {
      const user = await UserModel.updateProfile(req.user.id, { fullName, phone, avatarUrl });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      return res.status(200).json({
        message: 'Profile updated successfully',
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          phone: user.phone,
          avatarUrl: user.avatar_url,
          role: user.role_name,
        },
      });
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error.' });
    }
  },

  /**
   * Register as Vendor
   */
  async applyForVendor(req: any, res: Response) {
    const { businessName, businessDescription, taxId } = req.body;
    const userId = req.user.id;

    try {
      // Check if already vendor
      const existingVendor = await UserModel.findVendorByUserId(userId);
      if (existingVendor) {
        return res.status(400).json({ 
          message: `Vendor application already exists. Status: ${existingVendor.status}` 
        });
      }

      const vendor = await UserModel.createVendor({
        userId,
        businessName,
        businessDescription,
        taxId,
      });

      // Notify admins via WebSockets
      require('../services/socket.service').socketService.notifyAdmins({
        title: 'New Vendor Application',
        message: `Vendor ${businessName} has applied for store activation. Tax ID: ${taxId}`,
        type: 'vendor',
      });

      return res.status(201).json({
        message: 'Vendor application submitted successfully. Pending Admin approval.',
        vendor,
      });
    } catch (error) {
      console.error('Apply for vendor error:', error);
      return res.status(500).json({ message: 'Internal server error.' });
    }
  },
};
