import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const isCloudinaryConfigured =
  process.env.CLOUDINARY_CLOUD_NAME &&
  !process.env.CLOUDINARY_CLOUD_NAME.includes('placeholder') &&
  process.env.CLOUDINARY_API_KEY &&
  !process.env.CLOUDINARY_API_KEY.includes('placeholder') &&
  process.env.CLOUDINARY_API_SECRET &&
  !process.env.CLOUDINARY_API_SECRET.includes('placeholder');

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export const storageService = {
  /**
   * Upload an image file (either a buffer or a file path)
   * If Cloudinary is configured, uploads to Cloudinary.
   * If not, saves it locally to standard public directory and returns relative URL.
   */
  async uploadImage(fileContent: string | Buffer, filename: string): Promise<string> {
    if (isCloudinaryConfigured) {
      try {
        // If it's a file path
        if (typeof fileContent === 'string' && fs.existsSync(fileContent)) {
          const result = await cloudinary.uploader.upload(fileContent, {
            folder: 'multivendor_marketplace',
          });
          return result.secure_url;
        }
        
        // If it's a Base64 string or buffer
        const base64Data = typeof fileContent === 'string' 
          ? fileContent 
          : fileContent.toString('base64');
        const prefix = base64Data.startsWith('data:') ? '' : 'data:image/jpeg;base64,';
        
        const result = await cloudinary.uploader.upload(`${prefix}${base64Data}`, {
          folder: 'multivendor_marketplace',
        });
        return result.secure_url;
      } catch (error) {
        console.error('Cloudinary upload error, falling back to local storage:', error);
      }
    }

    // Fallback: Local Storage
    try {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const safeFilename = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = path.join(uploadDir, safeFilename);

      if (typeof fileContent === 'string') {
        if (fs.existsSync(fileContent)) {
          fs.copyFileSync(fileContent, filePath);
        } else {
          // If it is a base64 string
          const cleanBase64 = fileContent.replace(/^data:image\/\w+;base64,/, '');
          fs.writeFileSync(filePath, Buffer.from(cleanBase64, 'base64'));
        }
      } else {
        fs.writeFileSync(filePath, fileContent);
      }

      const host = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
      return `${host}/uploads/${safeFilename}`;
    } catch (localError) {
      console.error('Local file upload fallback error:', localError);
      // Return a random Unsplash placeholder image if everything fails
      return `https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600`;
    }
  },

  /**
   * Delete image from Cloudinary or local path
   */
  async deleteImage(imageUrl: string): Promise<boolean> {
    if (isCloudinaryConfigured && imageUrl.includes('cloudinary.com')) {
      try {
        const parts = imageUrl.split('/');
        const fileWithExtension = parts[parts.length - 1];
        const publicId = fileWithExtension.split('.')[0];
        const folder = parts[parts.length - 2];
        const fullPublicId = folder ? `${folder}/${publicId}` : publicId;
        
        await cloudinary.uploader.destroy(fullPublicId);
        return true;
      } catch (error) {
        console.error('Cloudinary delete error:', error);
        return false;
      }
    }

    // Local file deletion
    if (imageUrl.includes('/uploads/')) {
      try {
        const filename = imageUrl.split('/uploads/')[1];
        const filePath = path.join(process.cwd(), 'public', 'uploads', filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          return true;
        }
      } catch (error) {
        console.error('Local delete error:', error);
        return false;
      }
    }

    return true;
  },
};
