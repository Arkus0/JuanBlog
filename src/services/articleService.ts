import {
  addIdea,
  createArticle,
  createVersionAndUpdateArticleState,
  getActiveArticle,
  getLatestVersion,
  listIdeas,
  updateArticlePublishState,
  updateArticleState
} from '../db/repositories';
import { logger } from '../logger';
import { classifyTopic, generateDraft } from '../pipeline/contentPipeline';
import { publisher } from '../publishers';
import { markdownToSanitizedHtml } from '../utils/markdown';
import { ArticleStatus } from '../domain/types';

function logStatusTransition(articleId: number, from: ArticleStatus, to: ArticleStatus): void {
  logger.info({ articleId, from, to }, 'Article status transition');
}

function composeLinksMessage(links: Array<string | undefined>): string {
  const compact = links.filter(Boolean);
  return compact.length > 0 ? `\n${compact.join('\n')}` : '';
}

export async function handleIdea(text: string): Promise<string> {
  const article = getActiveArticle();
  addIdea(article.id, text);
  return `Idea guardada en artículo #${article.id}. Total ideas: ${listIdeas(article.id).length}.`;
}

export async function handleDraft(targetWords: 1000 | 2000): Promise<string> {
  const article = getActiveArticle();
  const ideas = listIdeas(article.id);
  if (ideas.length === 0) return 'No hay ideas en el inbox. Usa /idea <texto> primero.';

  logStatusTransition(article.id, article.status, 'DRAFTING');
  updateArticleState({ articleId: article.id, status: 'DRAFTING', target_words: targetWords });
  const ideaTexts = ideas.map((i) => i.text);
  const topicLabel = await classifyTopic(ideaTexts.join('\n'));
  updateArticleState({ articleId: article.id, topic_label: topicLabel });

  const draft = await generateDraft({ ideas: ideaTexts, targetWords, topicLabel });
  const draftResult = await publisher.upsertDraft({
    remotePostId: article.wp_post_id,
    title: draft.title,
    contentHtml: markdownToSanitizedHtml(draft.content_markdown),
    labels: draft.tags
  });

  logStatusTransition(article.id, 'DRAFTING', 'REVIEW');
  const version = createVersionAndUpdateArticleState({
    articleId: article.id,
    draftPayload: draft,
    status: 'REVIEW',
    wp_post_id: draftResult.remotePostId
  });

  const actionLabel = article.wp_post_id ? 'Draft actualizado' : 'Draft creado';
  const linksMsg = composeLinksMessage([draftResult.viewUrl, draftResult.selfLink, draftResult.editUrl]);
  const modoPrueba = !draftResult.selfLink ? '\n\n⚠️ *MODO PRUEBA*: Blogger no configurado. El draft se guardó localmente.' : '';

  return `Borrador v${version.version_number} listo para revisión.\n\n*${draft.title}*\n\n${draft.content_markdown.slice(
    0,
    2500
  )}\n\n${actionLabel}.${linksMsg}${modoPrueba}\n\nUsa /revise <instrucciones> o /approve.`;
}

export async function handleRevise(instructions: string): Promise<string> {
  const article = getActiveArticle();
  const ideas = listIdeas(article.id).map((i) => i.text);
  const latest = getLatestVersion(article.id);
  if (!latest) return 'No existe versión previa. Usa /draft primero.';

  logStatusTransition(article.id, article.status, 'REVISING');
  updateArticleState({ articleId: article.id, status: 'REVISING' });

  const draft = await generateDraft({
    ideas,
    targetWords: article.target_words,
    topicLabel: article.topic_label,
    revisionInstructions: instructions,
    previousVersion: latest.content_markdown
  });

  const draftResult = await publisher.upsertDraft({
    remotePostId: article.wp_post_id,
    title: draft.title,
    contentHtml: markdownToSanitizedHtml(draft.content_markdown),
    labels: draft.tags
  });

  logStatusTransition(article.id, 'REVISING', 'REVIEW');
  const version = createVersionAndUpdateArticleState({
    articleId: article.id,
    draftPayload: draft,
    status: 'REVIEW',
    wp_post_id: draftResult.remotePostId
  });

  const actionLabel = article.wp_post_id ? 'Draft actualizado' : 'Draft creado';
  const linksMsg = composeLinksMessage([draftResult.viewUrl, draftResult.selfLink, draftResult.editUrl]);
  const modoPrueba = !draftResult.selfLink ? '\n\n⚠️ *MODO PRUEBA*: Blogger no configurado. El draft se guardó localmente.' : '';

  return `Revisión aplicada. Nueva versión v${version.version_number}.\n\n*${draft.title}*\n\n${draft.content_markdown.slice(
    0,
    2500
  )}\n\n${actionLabel}.${linksMsg}${modoPrueba}\n\nUsa /revise <instrucciones> o /approve.`;
}

export async function handleApprove(): Promise<string> {
  const article = getActiveArticle();
  if (!article.wp_post_id) {
    return 'No hay borrador remoto para publicar. Genera /draft primero.';
  }

  if (article.status === 'PUBLISHED') {
    const links = await publisher.getPostLinks(article.wp_post_id).catch(() => ({ viewUrl: undefined, selfLink: undefined, editUrl: undefined }));
    const linksMsg = composeLinksMessage([links.viewUrl, links.selfLink, links.editUrl]);
    return `✅ Este artículo ya está publicado (post #${article.wp_post_id}).${linksMsg}`;
  }

  const result = await publisher.publish(article.wp_post_id);
  logStatusTransition(article.id, article.status, 'PUBLISHED');
  updateArticlePublishState({
    articleId: article.id,
    status: 'PUBLISHED',
    wp_post_id: result.remotePostId
  });

  const linksMsg = composeLinksMessage([result.viewUrl, result.selfLink]);
  const modoPrueba = !result.selfLink ? '\n\n⚠️ *MODO PRUEBA*: El post fue "publicado" localmente. Configura Blogger para publicación real.' : '';
  return `✅ Publicado post #${result.remotePostId}. Artículo #${article.id} marcado como PUBLISHED.${linksMsg}${modoPrueba}`;
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
    `Remote Post ID: ${article.wp_post_id ?? 'no creado'}`
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
