import { db } from './client';
import { Article, ArticleStatus, DraftPayload, Idea, TopicLabel, Version } from '../domain/types';

function nowIso() {
  return new Date().toISOString();
}

export function createArticle(targetWords: 1000 | 2000 = 1000): Article {
  const now = nowIso();
  const stmt = db.prepare(
    `INSERT INTO articles (status, target_words, topic_label, wp_post_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  const result = stmt.run('COLLECTING', targetWords, 'mixto', null, now, now);
  return getArticleById(Number(result.lastInsertRowid))!;
}

export function getArticleById(id: number): Article | undefined {
  return db.prepare('SELECT * FROM articles WHERE id = ?').get(id) as Article | undefined;
}

export function getActiveArticle(): Article {
  const found = db
    .prepare("SELECT * FROM articles WHERE status != 'PUBLISHED' ORDER BY id DESC LIMIT 1")
    .get() as Article | undefined;
  if (found) return found;
  return createArticle(1000);
}

export function updateArticleState(params: {
  articleId: number;
  status?: ArticleStatus;
  target_words?: 1000 | 2000;
  topic_label?: TopicLabel;
  wp_post_id?: number | null;
}): void {
  const article = getArticleById(params.articleId);
  if (!article) throw new Error(`Article ${params.articleId} not found`);
  db.prepare(
    `UPDATE articles
     SET status = ?, target_words = ?, topic_label = ?, wp_post_id = ?, updated_at = ?
     WHERE id = ?`
  ).run(
    params.status ?? article.status,
    params.target_words ?? article.target_words,
    params.topic_label ?? article.topic_label,
    params.wp_post_id === undefined ? article.wp_post_id : params.wp_post_id,
    nowIso(),
    params.articleId
  );
}

export function addIdea(articleId: number, text: string): Idea {
  const now = nowIso();
  const res = db
    .prepare('INSERT INTO ideas (article_id, text, created_at) VALUES (?, ?, ?)')
    .run(articleId, text, now);
  return db.prepare('SELECT * FROM ideas WHERE id = ?').get(Number(res.lastInsertRowid)) as Idea;
}

export function listIdeas(articleId: number): Idea[] {
  return db
    .prepare('SELECT * FROM ideas WHERE article_id = ? ORDER BY id ASC')
    .all(articleId) as Idea[];
}

export function getLatestVersion(articleId: number): Version | undefined {
  return db
    .prepare('SELECT * FROM versions WHERE article_id = ? ORDER BY version_number DESC LIMIT 1')
    .get(articleId) as Version | undefined;
}

export function createVersion(articleId: number, payload: DraftPayload): Version {
  const latest = getLatestVersion(articleId);
  const version = latest ? latest.version_number + 1 : 1;
  const now = nowIso();
  const res = db
    .prepare(
      `INSERT INTO versions
      (article_id, version_number, title, slug, meta_description, tags_json, content_markdown, claims_to_verify_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      articleId,
      version,
      payload.title,
      payload.slug,
      payload.meta_description,
      JSON.stringify(payload.tags),
      payload.content_markdown,
      JSON.stringify(payload.claims_to_verify),
      now
    );

  return db.prepare('SELECT * FROM versions WHERE id = ?').get(Number(res.lastInsertRowid)) as Version;
}
