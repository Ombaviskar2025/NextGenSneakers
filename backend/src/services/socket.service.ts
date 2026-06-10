import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { db } from '../config/db';

let io: SocketIOServer | null = null;
const userSockets = new Map<string, string[]>(); // userId -> socketIds

export const socketService = {
  /**
   * Initialize Socket.io server
   */
  initialize(server: HTTPServer) {
    io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
      },
    });

    io.on('connection', (socket) => {
      let currentUserId: string | null = null;

      // Handle user registration with socket connection
      socket.on('register', (userId: string) => {
        currentUserId = userId;
        const sockets = userSockets.get(userId) || [];
        if (!sockets.includes(socket.id)) {
          sockets.push(socket.id);
          userSockets.set(userId, sockets);
        }
        
        // Join specific room for notifications
        socket.join(`user_${userId}`);
        if (process.env.DEBUG_SQL === 'true') {
          console.log(`Socket register: User ${userId} bound to Socket ${socket.id}`);
        }
      });

      // Join vendor store room
      socket.on('join_store', (storeId: string) => {
        socket.join(`store_${storeId}`);
      });

      // Join admin role room
      socket.on('join_admins', () => {
        socket.join('admins_room');
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        if (currentUserId) {
          const sockets = userSockets.get(currentUserId) || [];
          const updated = sockets.filter((id) => id !== socket.id);
          if (updated.length > 0) {
            userSockets.set(currentUserId, updated);
          } else {
            userSockets.delete(currentUserId);
          }
        }
      });
    });

    return io;
  },

  /**
   * Send notification to a specific user and save it in database
   */
  async sendNotification(
    userId: string,
    notification: {
      title: string;
      message: string;
      type: 'order' | 'stock' | 'system' | 'vendor';
    }
  ) {
    try {
      // 1. Save to DB
      const query = `
        INSERT INTO notifications (user_id, title, message, type, is_read)
        VALUES ($1, $2, $3, $4, FALSE)
        RETURNING *
      `;
      const res = await db.query(query, [
        userId,
        notification.title,
        notification.message,
        notification.type,
      ]);
      const savedNotification = res.rows[0];

      // 2. Emit event via socket
      if (io) {
        io.to(`user_${userId}`).emit('notification', savedNotification);
      }
      return savedNotification;
    } catch (error) {
      console.error('Error saving or sending notification via socket:', error);
      return null;
    }
  },

  /**
   * Broadcast notification to all Admin users
   */
  async notifyAdmins(notification: { title: string; message: string; type: 'system' | 'vendor' }) {
    try {
      // Find all admin IDs
      const adminsQuery = `
        SELECT u.id 
        FROM users u 
        JOIN roles r ON u.role_id = r.id 
        WHERE r.name = 'admin'
      `;
      const admins = await db.query(adminsQuery);
      
      for (const admin of admins.rows) {
        await this.sendNotification(admin.id, {
          title: notification.title,
          message: notification.message,
          type: notification.type,
        });
      }

      // Also emit to the admin socket room
      if (io) {
        io.to('admins_room').emit('admin_alert', notification);
      }
    } catch (error) {
      console.error('Error broadcasting admin notifications:', error);
    }
  },

  /**
   * Notify vendor store about an update (e.g. order placed, stock depletion)
   */
  async notifyStore(
    storeId: string,
    notification: { title: string; message: string; type: 'order' | 'stock' }
  ) {
    try {
      // Find the store's vendor user ID
      const query = `
        SELECT v.user_id 
        FROM stores s 
        JOIN vendors v ON s.vendor_id = v.id 
        WHERE s.id = $1
      `;
      const storeRes = await db.query(query, [storeId]);
      if (storeRes.rows.length > 0) {
        const vendorUserId = storeRes.rows[0].user_id;
        await this.sendNotification(vendorUserId, {
          title: notification.title,
          message: notification.message,
          type: notification.type,
        });
      }

      // Also emit to the store socket room
      if (io) {
        io.to(`store_${storeId}`).emit('store_update', notification);
      }
    } catch (error) {
      console.error('Error notifying vendor store:', error);
    }
  },
};
