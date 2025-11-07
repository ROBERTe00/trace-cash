/**
 * Local authentication fallback when Supabase is not available
 * Stores user data in localStorage for offline/demo mode
 */

export interface LocalSession {
  user: {
    id: string;
    email: string;
    name?: string;
  };
  access_token: string;
  expires_at: number;
}

const LOCAL_AUTH_KEY = 'trace-cash-local-auth';
const USERS_KEY = 'trace-cash-local-users';

interface LocalUser {
  email: string;
  password: string; // Hashed (base64 for simplicity, in production use proper hashing)
  name?: string;
  id: string;
}

// Simple base64 encoding for demo (NOT secure for production)
function hashPassword(password: string): string {
  return btoa(password);
}

function verifyPassword(password: string, hash: string): boolean {
  return btoa(password) === hash;
}

export const localAuth = {
  // Check if Supabase is available
  isSupabaseAvailable(): boolean {
    const url = import.meta.env.VITE_SUPABASE_URL;
    return !!url && url !== '' && !url.includes('undefined');
  },

  // Sign up with local storage
  async signUp(email: string, password: string, name?: string): Promise<{ user: LocalSession['user'] | null, error: Error | null }> {
    try {
      const users = this.getLocalUsers();
      
      // Check if user already exists
      if (users.find(u => u.email === email.toLowerCase())) {
        return { user: null, error: new Error('User already exists') };
      }

      const newUser: LocalUser = {
        id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        email: email.toLowerCase(),
        password: hashPassword(password),
        name: name || email.split('@')[0],
      };

      users.push(newUser);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));

      // Auto-login after signup
      return this.signIn(email, password);
    } catch (error) {
      return { user: null, error: error as Error };
    }
  },

  // Sign in with local storage
  async signIn(email: string, password: string): Promise<{ user: LocalSession['user'] | null, error: Error | null }> {
    try {
      const users = this.getLocalUsers();
      const user = users.find(u => u.email === email.toLowerCase());

      if (!user) {
        return { user: null, error: new Error('Invalid email or password') };
      }

      if (!verifyPassword(password, user.password)) {
        return { user: null, error: new Error('Invalid email or password') };
      }

      const session: LocalSession = {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        access_token: `local-token-${user.id}`,
        expires_at: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
      };

      localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(session));
      
      return { user: session.user, error: null };
    } catch (error) {
      return { user: null, error: error as Error };
    }
  },

  // Get current session
  getSession(): LocalSession | null {
    try {
      const stored = localStorage.getItem(LOCAL_AUTH_KEY);
      if (!stored) return null;

      const session: LocalSession = JSON.parse(stored);
      
      // Check if expired
      if (session.expires_at < Date.now()) {
        this.signOut();
        return null;
      }

      return session;
    } catch (error) {
      return null;
    }
  },

  // Sign out
  signOut(): void {
    localStorage.removeItem(LOCAL_AUTH_KEY);
  },

  // Get local users (for debugging)
  getLocalUsers(): LocalUser[] {
    try {
      const stored = localStorage.getItem(USERS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      return [];
    }
  },

  // Create a mock Supabase session object
  createMockSession(session: LocalSession): any {
    return {
      user: {
        id: session.user.id,
        email: session.user.email,
        user_metadata: {
          name: session.user.name,
        },
      },
      access_token: session.access_token,
      refresh_token: `local-refresh-${session.user.id}`,
      expires_at: session.expires_at,
      expires_in: Math.floor((session.expires_at - Date.now()) / 1000),
      token_type: 'bearer',
    };
  },
};



