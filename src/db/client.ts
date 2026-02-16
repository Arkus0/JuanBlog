import Database from 'better-sqlite3';
import { config } from '../config/env';

export const db = new Database(config.DATABASE_PATH);

export function initDb(): void {
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      status TEXT NOT NULL,
      target_words INTEGER NOT NULL,
      topic_label TEXT NOT NULL,
      wp_post_id INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      article_id INTEGER NOT NULL,
      version_number INTEGER NOT NULL,
      title TEXT NOT NULL,
      slug TEXT NOT NULL,
      meta_description TEXT NOT NULL,
      tags_json TEXT NOT NULL,
      content_markdown TEXT NOT NULL,
      claims_to_verify_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(article_id) REFERENCES articles(id)
    );

    CREATE TABLE IF NOT EXISTS ideas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      article_id INTEGER NOT NULL,
      text TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(article_id) REFERENCES articles(id)
    );

    CREATE INDEX IF NOT EXISTS idx_versions_article_id ON versions(article_id);
    CREATE INDEX IF NOT EXISTS idx_ideas_article_id ON ideas(article_id);
  `);
}
