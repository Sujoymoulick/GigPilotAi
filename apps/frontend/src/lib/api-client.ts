import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || 'https://mock.supabase.co';
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || 'mock-key';

// Reusable Supabase client instance for frontend
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3000';

class ApiClient {
  // Returns a valid session token, attempting auto-refresh via Supabase if needed
  private async getValidToken(): Promise<string> {
    const isMockMode = supabaseUrl.includes('mock.supabase.co') || supabaseAnonKey === 'mock-key';
    if (isMockMode) {
      return localStorage.getItem('gp_token') || 'mock-session-token';
    }

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;

      if (session) {
        // Sync and cache the fresh access token
        localStorage.setItem('gp_token', session.access_token);
        return session.access_token;
      }
    } catch (err) {
      console.warn('[API Client] Supabase session retrieval failed:', err);
    }

    return localStorage.getItem('gp_token') || '';
  }

  // Handle expired sessions by clearing local token cache and redirecting to login
  private handleExpiredSession() {
    console.warn('[API Client] Authentication Session expired. Redirecting to login.');
    localStorage.removeItem('gp_token');
    localStorage.removeItem('gp_user');
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  // General request utility that injects bearer auth and parses response envelopes
  public async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getValidToken();
    const headers = new Headers(options.headers);
    
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      // Handle 401 session expiry and retry once with fresh token
      if (response.status === 401) {
        const refreshedToken = await this.getValidToken();
        if (refreshedToken) {
          headers.set('Authorization', `Bearer ${refreshedToken}`);
          const retryResponse = await fetch(url, { ...options, headers });
          if (retryResponse.status === 401) {
            this.handleExpiredSession();
            throw new Error('Session Expired');
          }
          return this.parseResponse(retryResponse);
        } else {
          this.handleExpiredSession();
          throw new Error('Session Expired');
        }
      }

      return this.parseResponse(response);
    } catch (err: any) {
      console.error(`[API Client] Fetch Error for ${url}:`, err.message);
      throw err;
    }
  }

  private async parseResponse(response: Response) {
    const contentType = response.headers.get('content-type');
    let data: any = {};
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = { message: await response.text() };
    }

    if (!response.ok) {
      throw new Error(data.message || data.error || `HTTP Error ${response.status}`);
    }

    return data;
  }

  // REST wrappers
  public get<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  public post<T = any>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined
    });
  }

  public put<T = any>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined
    });
  }

  public delete<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const api = new ApiClient();
