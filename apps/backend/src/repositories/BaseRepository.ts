import { dbClient } from '@gigpilot/database';
import { supabaseAdmin, getSupabaseUserClient } from '../lib/supabase';
import { env } from '../config/env';

export class BaseRepository {
  public isMock: boolean;
  protected table: string;
  protected localCollection: string;

  constructor(table: string, localCollection: string) {
    this.table = table;
    this.localCollection = localCollection;
    // If running in tests or Supabase URL is mock, default to local json DB
    this.isMock = 
      process.env.NODE_ENV === 'test' || 
      env.SUPABASE_URL.includes('mock.supabase.co') || 
      env.SUPABASE_ANON_KEY === 'mock-anon-key';
  }

  public getClient(token?: string) {
    return token ? getSupabaseUserClient(token) : supabaseAdmin;
  }

  // Common CRUD operations helper
  public async queryAll<T>(token?: string): Promise<T[]> {
    if (this.isMock) {
      return dbClient.getCollection(this.localCollection) as T[];
    }
    
    const { data, error } = await this.getClient(token)
      .from(this.table)
      .select('*');
      
    if (error) throw error;
    return data as T[];
  }

  public async queryById<T>(id: string, token?: string): Promise<T | null> {
    if (this.isMock) {
      return dbClient.getById(this.localCollection, id) as T | null;
    }

    const { data, error } = await this.getClient(token)
      .from(this.table)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data as T | null;
  }

  public async insertRecord<T>(item: any, token?: string): Promise<T> {
    if (this.isMock) {
      return dbClient.insert(this.localCollection, item) as T;
    }

    const { data, error } = await this.getClient(token)
      .from(this.table)
      .insert(item)
      .select()
      .single();

    if (error) throw error;
    return data as T;
  }

  public async updateRecord<T>(id: string, updates: any, token?: string): Promise<T | null> {
    if (this.isMock) {
      return dbClient.update(this.localCollection, id, updates) as T | null;
    }

    const { data, error } = await this.getClient(token)
      .from(this.table)
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data as T | null;
  }

  public async deleteRecord(id: string, token?: string, soft: boolean = true): Promise<boolean> {

    if (this.isMock) {
      return dbClient.delete(this.localCollection, id, soft);
    }

    if (soft) {
      const { error } = await this.getClient(token)
        .from(this.table)
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    } else {
      const { error } = await this.getClient(token)
        .from(this.table)
        .delete()
        .eq('id', id);
      if (error) throw error;
    }
    return true;
  }
}
