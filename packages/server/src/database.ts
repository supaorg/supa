import SQLiteDatabase from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import { mkdirSync, existsSync } from 'node:fs';

export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  user_id: string;
  provider: string;
  provider_account_id: string;
  provider_email: string;
  created_at: string;
}

export class Database {
  private db: SQLiteDatabase.Database;

  constructor(dbPath: string) {
    // Ensure data directory exists (simple approach)
    if (!existsSync('./data')) {
      mkdirSync('./data', { recursive: true });
    }
    
    this.db = new SQLiteDatabase(dbPath);
    this.init();
  }

  private init() {
    // Create tables
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        avatar_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        provider TEXT NOT NULL,
        provider_account_id TEXT NOT NULL,
        provider_email TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        UNIQUE(provider, provider_account_id)
      );

      CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
      CREATE INDEX IF NOT EXISTS idx_accounts_provider ON accounts(provider, provider_account_id);
    `);
  }

  // User methods
  createUser(email: string, name: string): User {
    const id = randomUUID();
    const now = new Date().toISOString();
    
    const stmt = this.db.prepare(`
      INSERT INTO users (id, email, name, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(id, email, name, now, now);
    
    return {
      id,
      email,
      name,
      created_at: now,
      updated_at: now
    };
  }

  getUserById(id: string): User | null {
    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id) as User | null;
  }

  getUserByEmail(email: string): User | null {
    const stmt = this.db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email) as User | null;
  }

  updateUser(id: string, updates: Partial<Pick<User, 'name'>>): void {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    
    if (fields) {
      const stmt = this.db.prepare(`
        UPDATE users 
        SET ${fields}, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `);
      stmt.run(...values, id);
    }
  }

  // Account methods
  createAccount(
    userId: string,
    provider: string,
    providerAccountId: string,
    providerEmail: string
  ): Account {
    const id = randomUUID();
    const now = new Date().toISOString();
    
    const stmt = this.db.prepare(`
      INSERT INTO accounts (id, user_id, provider, provider_account_id, provider_email, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(id, userId, provider, providerAccountId, providerEmail, now);
    
    return {
      id,
      user_id: userId,
      provider,
      provider_account_id: providerAccountId,
      provider_email: providerEmail,
      created_at: now
    };
  }

  getAccountByProvider(provider: string, providerAccountId: string): Account | null {
    const stmt = this.db.prepare('SELECT * FROM accounts WHERE provider = ? AND provider_account_id = ?');
    return stmt.get(provider, providerAccountId) as Account | null;
  }

  getUserAccounts(userId: string): Account[] {
    const stmt = this.db.prepare('SELECT * FROM accounts WHERE user_id = ?');
    return stmt.all(userId) as Account[];
  }

  close() {
    this.db.close();
  }
} 