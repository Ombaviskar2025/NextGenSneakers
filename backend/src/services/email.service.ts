import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
  port: parseInt(process.env.EMAIL_PORT || '2525', 10),
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
  },
});

export const emailService = {
  /**
   * Send a general email
   */
  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    const from = process.env.EMAIL_FROM || 'noreply@platform.com';
    
    // Check if configuration is just placeholder
    const isPlaceholder = 
      !process.env.EMAIL_USER || 
      process.env.EMAIL_USER.includes('placeholder') || 
      !process.env.EMAIL_PASS || 
      process.env.EMAIL_PASS.includes('placeholder');

    if (isPlaceholder || process.env.NODE_ENV === 'test') {
      console.log('=== [MOCK EMAIL SERVICE] ===');
      console.log(`To: ${to}`);
      console.log(`From: ${from}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body: ${html.substring(0, 300)}...`);
      console.log('============================');
      return true;
    }

    try {
      await transporter.sendMail({
        from,
        to,
        subject,
        html,
      });
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  },

  /**
   * Send Email Verification Link/Token
   */
  async sendVerificationEmail(to: string, token: string): Promise<boolean> {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #3b82f6; text-align: center;">Verify Your Account</h2>
        <p>Thank you for registering on our Multi-Vendor E-Commerce Platform. Please click the button below to verify your email address:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Verify Email Address</a>
        </div>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #4b5563;">${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
      </div>
    `;
    return this.sendEmail(to, 'Verify Your Email Address - Multi-Vendor Marketplace', html);
  },

  /**
   * Send Password Reset Email
   */
  async sendPasswordResetEmail(to: string, token: string): Promise<boolean> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #ef4444; text-align: center;">Reset Your Password</h2>
        <p>You requested a password reset for your account. Please click the button below to set a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
        </div>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #4b5563;">${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request this, you can safely ignore this email.</p>
      </div>
    `;
    return this.sendEmail(to, 'Reset Your Password - Multi-Vendor Marketplace', html);
  },

  /**
   * Send Vendor Application Update Email
   */
  async sendVendorStatusEmail(to: string, businessName: string, status: 'approved' | 'rejected' | 'suspended'): Promise<boolean> {
    let titleColor = '#3b82f6';
    let statusMsg = '';
    
    if (status === 'approved') {
      titleColor = '#10b981';
      statusMsg = 'Congratulations! Your vendor store application has been approved. You can now log in and set up your store.';
    } else if (status === 'rejected') {
      titleColor = '#ef4444';
      statusMsg = 'We regret to inform you that your vendor application has been rejected. Please review our compliance guidelines and try again.';
    } else {
      titleColor = '#f59e0b';
      statusMsg = 'Your vendor account has been suspended due to policy violations. Please contact admin support.';
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: ${titleColor}; text-align: center;">Vendor Account Status Update</h2>
        <p>Hello,</p>
        <p>There is an update on your vendor store application for <strong>${businessName}</strong>.</p>
        <p style="font-size: 16px; line-height: 1.5; color: #1f2937;"><strong>Status: ${status.toUpperCase()}</strong></p>
        <p>${statusMsg}</p>
        <div style="margin-top: 30px; text-align: center;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Go to Dashboard</a>
        </div>
      </div>
    `;
    return this.sendEmail(to, `Vendor Account Status: ${status.toUpperCase()}`, html);
  },
};
