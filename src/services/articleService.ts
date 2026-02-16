import {
  addIdea,
  createArticle,
  createVersion,
  getActiveArticle,
  getLatestVersion,
  listIdeas,
  updateArticleState
} from '../db/repositories';
import { logger } from '../logger';
import { classifyTopic, generateDraft } from '../pipeline/contentPipeline';
import { createDraftPost, publishPost, updateDraftPost } from '../clients/wordpressClient';

export async function handleIdea(text: string): Promise<string> {
  const article = getActiveArticle();
  addIdea(article.id, text);
  return `Idea guardada en artículo #${article.id}. Total ideas: ${listIdeas(article.id).length}.`;
}

export async function handleDraft(targetWords: 1000 | 2000): Promise<string> {
  const article = getActiveArticle();
  const ideas = listIdeas(article.id);
  if (ideas.length === 0) return 'No hay ideas en el inbox. Usa /idea <texto> primero.';

  updateArticleState({ articleId: article.id, status: 'DRAFTING', target_words: targetWords });
  const ideaTexts = ideas.map((i) => i.text);
  const topicLabel = await classifyTopic(ideaTexts.join('\n'));
  updateArticleState({ articleId: article.id, topic_label: topicLabel });

  const draft = await generateDraft({ ideas: ideaTexts, targetWords, topicLabel });
  const version = createVersion(article.id, draft);

  const active = getActiveArticle();
  if (!active.wp_post_id) {
    const postId = await createDraftPost(draft);
    updateArticleState({ articleId: article.id, wp_post_id: postId, status: 'REVIEW' });
  } else {
    await updateDraftPost(active.wp_post_id, draft);
    updateArticleState({ articleId: article.id, status: 'REVIEW' });
  }

  return `Borrador v${version.version_number} listo para revisión.\n\n*${draft.title}*\n\n${draft.content_markdown.slice(
    0,
    2500
  )}\n\nUsa /revise <instrucciones> o /approve.`;
}

export async function handleRevise(instructions: string): Promise<string> {
  const article = getActiveArticle();
  const ideas = listIdeas(article.id).map((i) => i.text);
  const latest = getLatestVersion(article.id);
  if (!latest) return 'No existe versión previa. Usa /draft primero.';

  updateArticleState({ articleId: article.id, status: 'REVISING' });

  const draft = await generateDraft({
    ideas,
    targetWords: article.target_words,
    topicLabel: article.topic_label,
    revisionInstructions: instructions,
    previousVersion: latest.content_markdown
  });

  const version = createVersion(article.id, draft);
  if (!article.wp_post_id) {
    const postId = await createDraftPost(draft);
    updateArticleState({ articleId: article.id, wp_post_id: postId, status: 'REVIEW' });
  } else {
    await updateDraftPost(article.wp_post_id, draft);
    updateArticleState({ articleId: article.id, status: 'REVIEW' });
  }

  return `Revisión aplicada. Nueva versión v${version.version_number}.\n\n*${draft.title}*\n\n${draft.content_markdown.slice(
    0,
    2500
  )}\n\nUsa /revise <instrucciones> o /approve.`;
}

export async function handleApprove(): Promise<string> {
  const article = getActiveArticle();
  if (!article.wp_post_id) {
    return 'No hay post en WordPress para publicar. Genera /draft primero.';
  }
  await publishPost(article.wp_post_id);
  updateArticleState({ articleId: article.id, status: 'PUBLISHED' });
  return `✅ Publicado post #${article.wp_post_id}. Artículo #${article.id} marcado como PUBLISHED.`;
}

export async function handleStatus(): Promise<string> {
  const article = getActiveArticle();
  const latest = getLatestVersion(article.id);
  return [
    `Artículo activo: #${article.id}`,
    `Estado: ${article.status}`,
    `Topic: ${article.topic_label}`,
    `Longitud objetivo: ${article.target_words}`,
    `Versión actual: ${latest ? `v${latest.version_number}` : 'sin versiones'}`,
    `Ideas en inbox: ${listIdeas(article.id).length}`,
    `WP Post ID: ${article.wp_post_id ?? 'no creado'}`
  ].join('\n');
}

export async function handleNew(): Promise<string> {
  const current = getActiveArticle();
  if (current.status !== 'PUBLISHED') {
    logger.info({ articleId: current.id }, 'Cerrando artículo activo y creando uno nuevo.');
    updateArticleState({ articleId: current.id, status: 'APPROVED' });
  }
  const created = createArticle(1000);
  return `Nuevo artículo #${created.id} creado en estado COLLECTING.`;
}
