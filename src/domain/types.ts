export const ARTICLE_STATUS = [
  'COLLECTING',
  'DRAFTING',
  'REVIEW',
  'REVISING',
  'APPROVED',
  'PUBLISHED'
] as const;

export type ArticleStatus = (typeof ARTICLE_STATUS)[number];

export const TOPIC_LABELS = [
  'sociologia',
  'entrenamiento',
  'politica',
  'estilo_vida',
  'tecnologia',
  'mixto'
] as const;

export type TopicLabel = (typeof TOPIC_LABELS)[number];

export interface Article {
  id: number;
  status: ArticleStatus;
  target_words: 1000 | 2000;
  topic_label: TopicLabel;
  wp_post_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface Version {
  id: number;
  article_id: number;
  version_number: number;
  title: string;
  slug: string;
  meta_description: string;
  tags_json: string;
  content_markdown: string;
  claims_to_verify_json: string;
  created_at: string;
}

export interface Idea {
  id: number;
  article_id: number;
  text: string;
  created_at: string;
}

export interface DraftPayload {
  title: string;
  slug: string;
  meta_description: string;
  tags: string[];
  topic_label: TopicLabel;
  target_words: 1000 | 2000;
  content_markdown: string;
  claims_to_verify: string[];
}
