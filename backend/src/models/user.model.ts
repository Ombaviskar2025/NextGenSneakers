import { db } from '../config/db';

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  role_id: string;
  role_name: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  is_verified: boolean;
  verification_token: string | null;
  reset_token: string | null;
  reset_token_expires: Date | null;
  refresh_token: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface VendorRow {
  id: string;
  user_id: string;
  business_name: string;
  business_description: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  logo_url: string | null;
  banner_url: string | null;
  bank_details: any | null;
  tax_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export const UserModel = {
  /**
   * Find user by Email (joins role)
   */
  async findByEmail(email: string): Promise<UserRow | null> {
    const query = `
      SELECT u.*, r.name as role_name 
      FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE u.email = $1
    `;
    const res = await db.query(query, [email.toLowerCase().trim()]);
    return res.rows[0] || null;
  },

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<UserRow | null> {
    const query = `
      SELECT u.*, r.name as role_name 
      FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE u.id = $1
    `;
    const res = await db.query(query, [id]);
    return res.rows[0] || null;
  },

  /**
   * Get role ID by name
   */
  async getRoleIdByName(name: string): Promise<string | null> {
    const query = 'SELECT id FROM roles WHERE name = $1';
    const res = await db.query(query, [name]);
    return res.rows[0]?.id || null;
  },

  /**
   * Create user
   */
  async createUser(data: {
    email: string;
    passwordHash: string;
    roleName: string;
    fullName: string;
    phone?: string;
    isVerified?: boolean;
    verificationToken?: string | null;
  }): Promise<UserRow> {
    const roleId = await this.getRoleIdByName(data.roleName);
    if (!roleId) {
      throw new Error(`Role name '${data.roleName}' not found`);
    }

    const query = `
      INSERT INTO users (email, password_hash, role_id, full_name, phone, is_verified, verification_token)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const res = await db.query(query, [
      data.email.toLowerCase().trim(),
      data.passwordHash,
      roleId,
      data.fullName,
      data.phone || null,
      data.isVerified || false,
      data.verificationToken || null,
    ]);

    const createdUser = res.rows[0];
    return { ...createdUser, role_name: data.roleName };
  },

  /**
   * Update refresh token
   */
  async updateRefreshToken(userId: string, token: string | null): Promise<void> {
    const query = 'UPDATE users SET refresh_token = $1 WHERE id = $2';
    await db.query(query, [token, userId]);
  },

  /**
   * Find user by refresh token
   */
  async findByRefreshToken(token: string): Promise<UserRow | null> {
    const query = `
      SELECT u.*, r.name as role_name 
      FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE u.refresh_token = $1
    `;
    const res = await db.query(query, [token]);
    return res.rows[0] || null;
  },

  /**
   * Verify Email by token
   */
  async verifyEmail(token: string): Promise<boolean> {
    const query = `
      UPDATE users 
      SET is_verified = TRUE, verification_token = NULL 
      WHERE verification_token = $1 
      RETURNING id
    `;
    const res = await db.query(query, [token]);
    return (res.rowCount ?? 0) > 0;
  },

  /**
   * Update password reset token
   */
  async updateResetToken(email: string, token: string | null, expires: Date | null): Promise<boolean> {
    const query = `
      UPDATE users 
      SET reset_token = $1, reset_token_expires = $2 
      WHERE email = $3
      RETURNING id
    `;
    const res = await db.query(query, [token, expires, email.toLowerCase().trim()]);
    return (res.rowCount ?? 0) > 0;
  },

  /**
   * Find user by reset token
   */
  async findByResetToken(token: string): Promise<UserRow | null> {
    const query = `
      SELECT u.*, r.name as role_name 
      FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE u.reset_token = $1 AND u.reset_token_expires > CURRENT_TIMESTAMP
    `;
    const res = await db.query(query, [token]);
    return res.rows[0] || null;
  },

  /**
   * Update password hash
   */
  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    const query = `
      UPDATE users 
      SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL 
      WHERE id = $2
    `;
    await db.query(query, [passwordHash, userId]);
  },

  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: { fullName?: string; phone?: string; avatarUrl?: string }): Promise<UserRow | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let counter = 1;

    if (data.fullName !== undefined) {
      updates.push(`full_name = $${counter++}`);
      values.push(data.fullName);
    }
    if (data.phone !== undefined) {
      updates.push(`phone = $${counter++}`);
      values.push(data.phone);
    }
    if (data.avatarUrl !== undefined) {
      updates.push(`avatar_url = $${counter++}`);
      values.push(data.avatarUrl);
    }

    if (updates.length === 0) return this.findById(userId);

    values.push(userId);
    const query = `
      UPDATE users 
      SET ${updates.join(', ')} 
      WHERE id = $${counter} 
      RETURNING *
    `;
    const res = await db.query(query, values);
    if (res.rows[0]) {
      return this.findById(userId);
    }
    return null;
  },

  // ==========================================
  // VENDOR OPERATIONS
  // ==========================================

  /**
   * Create Vendor account request
   */
  async createVendor(data: {
    userId: string;
    businessName: string;
    businessDescription?: string;
    taxId: string;
  }): Promise<VendorRow> {
    return db.transaction(async (client) => {
      // 1. Insert into vendors
      const vendorQuery = `
        INSERT INTO vendors (user_id, business_name, business_description, status, tax_id)
        VALUES ($1, $2, $3, 'pending', $4)
        RETURNING *
      `;
      const vendorRes = await client.query(vendorQuery, [
        data.userId,
        data.businessName,
        data.businessDescription || null,
        data.taxId,
      ]);
      const vendor = vendorRes.rows[0];

      // 2. Generate slug for the store
      const baseSlug = data.businessName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;

      // 3. Create placeholder store
      const storeQuery = `
        INSERT INTO stores (vendor_id, name, slug, description)
        VALUES ($1, $2, $3, $4)
      `;
      await client.query(storeQuery, [
        vendor.id,
        `${data.businessName} Store`,
        slug,
        `Official store for ${data.businessName}`,
      ]);

      return vendor;
    });
  },

  /**
   * Find Vendor by User ID
   */
  async findVendorByUserId(userId: string): Promise<VendorRow | null> {
    const query = 'SELECT * FROM vendors WHERE user_id = $1';
    const res = await db.query(query, [userId]);
    return res.rows[0] || null;
  },

  /**
   * Find Vendor by Vendor ID
   */
  async findVendorById(vendorId: string): Promise<VendorRow | null> {
    const query = 'SELECT * FROM vendors WHERE id = $1';
    const res = await db.query(query, [vendorId]);
    return res.rows[0] || null;
  },

  /**
   * Update Vendor status (Admin tool)
   */
  async updateVendorStatus(vendorId: string, status: 'approved' | 'rejected' | 'suspended'): Promise<VendorRow | null> {
    return db.transaction(async (client) => {
      const query = `
        UPDATE vendors 
        SET status = $1 
        WHERE id = $2 
        RETURNING *
      `;
      const res = await client.query(query, [status, vendorId]);
      const vendor = res.rows[0] || null;

      if (!vendor) return null;

      // If approved, update the corresponding user's role to 'vendor'
      if (status === 'approved') {
        const roleQuery = "SELECT id FROM roles WHERE name = 'vendor'";
        const roleRes = await client.query(roleQuery);
        const vendorRoleId = roleRes.rows[0]?.id;

        if (vendorRoleId) {
          await client.query('UPDATE users SET role_id = $1 WHERE id = $2', [
            vendorRoleId,
            vendor.user_id,
          ]);
        }
      } else if (status === 'suspended' || status === 'rejected') {
        // Fallback user's role back to 'customer'
        const roleQuery = "SELECT id FROM roles WHERE name = 'customer'";
        const roleRes = await client.query(roleQuery);
        const customerRoleId = roleRes.rows[0]?.id;

        if (customerRoleId) {
          await client.query('UPDATE users SET role_id = $1 WHERE id = $2', [
            customerRoleId,
            vendor.user_id,
          ]);
        }
      }

      return vendor;
    });
  },

  // ==========================================
  // ADMIN USER MANAGEMENT
  // ==========================================

  /**
   * List all vendors with their user emails & status
   */
  async listVendors(): Promise<any[]> {
    const query = `
      SELECT v.*, u.email, u.full_name, s.slug as store_slug, s.name as store_name
      FROM vendors v
      JOIN users u ON v.user_id = u.id
      LEFT JOIN stores s ON v.id = s.vendor_id
      ORDER BY v.created_at DESC
    `;
    const res = await db.query(query);
    return res.rows;
  },

  /**
   * List all users
   */
  async listUsers(): Promise<any[]> {
    const query = `
      SELECT u.id, u.email, u.full_name, u.phone, u.avatar_url, u.is_verified, 
             u.created_at, r.name as role_name
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE r.name != 'admin'
      ORDER BY u.created_at DESC
    `;
    const res = await db.query(query);
    return res.rows;
  },

  /**
   * Delete User (Admin action)
   */
  async deleteUser(userId: string): Promise<boolean> {
    const query = 'DELETE FROM users WHERE id = $1';
    const res = await db.query(query, [userId]);
    return (res.rowCount ?? 0) > 0;
  },
};
