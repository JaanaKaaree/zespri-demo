const SESSION_KEY = 'session_data';

export interface SessionData {
  user: {
    id: string;
    email: string;
    name?: string;
  };
  sessionId: string;
}

export const sessionStorage = {
  get: (): SessionData | null => {
    if (typeof window === 'undefined') return null;
    const data = localStorage.getItem(SESSION_KEY);
    return data ? JSON.parse(data) : null;
  },

  set: (data: SessionData): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SESSION_KEY, JSON.stringify(data));
  },

  remove: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(SESSION_KEY);
  },
};
