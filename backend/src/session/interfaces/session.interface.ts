export interface ISession {
  userId: string;
  email: string;
  createdAt: Date;
  expiresAt: Date;
  data?: Record<string, any>;
}

export interface ISessionStore {
  get(sessionId: string): Promise<ISession | null>;
  set(sessionId: string, session: ISession, ttl?: number): Promise<void>;
  delete(sessionId: string): Promise<void>;
  exists(sessionId: string): Promise<boolean>;
}
