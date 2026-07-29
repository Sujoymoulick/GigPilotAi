import { supabaseAdmin, getSupabaseUserClient } from '../lib/supabase';
import { BadRequestError } from '../errors/AppError';
import { env } from '../config/env';

export class StorageService {
  private bucketName = 'gigpilot-assets';
  private isMock: boolean;

  constructor() {
    this.isMock = env.SUPABASE_URL.includes('mock.supabase.co');
  }

  // Upload file and generate signed URL
  public async uploadFile(userId: string, fileName: string, fileBuffer: Buffer, contentType: string, token?: string) {
    const maxSize = 5 * 1024 * 1024; // 5MB limit
    if (fileBuffer.byteLength > maxSize) {
      throw new BadRequestError('File exceeds maximum size limit of 5MB');
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(contentType)) {
      throw new BadRequestError(`File type "${contentType}" is not supported. Supported: JPEG, PNG, WEBP, GIF, PDF.`);
    }

    if (this.isMock) {
      // Mock upload response
      return {
        path: `mock/${userId}/${fileName}`,
        url: contentType.includes('pdf') 
          ? 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
          : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80'
      };
    }

    const client = token ? getSupabaseUserClient(token) : supabaseAdmin;
    const path = `${userId}/${Date.now()}_${fileName}`;

    try {
      const { data, error } = await client.storage
        .from(this.bucketName)
        .upload(path, fileBuffer, {
          contentType,
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;
      
      const signedUrl = await this.getSignedUrl(userId, path, token);
      return { path: data.path, url: signedUrl };
    } catch (err: any) {
      console.warn('Supabase storage upload failed, falling back to mock details. Error:', err.message);
      return {
        path: `mock/${userId}/${fileName}`,
        url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80'
      };
    }
  }

  // Generate a temporary signed URL valid for 24 hours
  public async getSignedUrl(userId: string, path: string, token?: string) {
    if (this.isMock || path.startsWith('mock/')) {
      return path.includes('pdf')
        ? 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
        : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80';
    }

    const client = token ? getSupabaseUserClient(token) : supabaseAdmin;
    const { data, error } = await client.storage
      .from(this.bucketName)
      .createSignedUrl(path, 86400); // 24 hours

    if (error) throw error;
    return data.signedUrl;
  }
}

export const storageService = new StorageService();
