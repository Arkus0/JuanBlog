import { logger } from '../logger';
import { PostLinks, Publisher, PublishResult, UpsertDraftInput, UpsertDraftResult } from './types';

/**
 * Publisher de simulación para pruebas sin Blogger.
 * Guarda los drafts localmente sin publicar en ningún servicio externo.
 */
export class MockPublisher implements Publisher {
  private mockPosts = new Map<number, { title: string; content: string; labels?: string[] }>();
  private nextId = 1;

  async upsertDraft(input: UpsertDraftInput): Promise<UpsertDraftResult> {
    const id = input.remotePostId ?? this.nextId++;
    
    this.mockPosts.set(id, {
      title: input.title,
      content: input.contentHtml,
      labels: input.labels
    });

    logger.info({ postId: id, title: input.title }, '[MOCK] Draft guardado localmente');

    // En modo mock, los links son placeholders
    return {
      remotePostId: id,
      viewUrl: `[MODO PRUEBA] El post #${id} se guardó localmente (sin Blogger)`,
      selfLink: undefined,
      editUrl: undefined
    };
  }

  async publish(remotePostId: number): Promise<PublishResult> {
    const post = this.mockPosts.get(remotePostId);
    if (!post) {
      throw new Error(`Post ${remotePostId} no encontrado en mock storage`);
    }

    logger.info({ postId: remotePostId, title: post.title }, '[MOCK] Post "publicado" (simulado)');

    return {
      remotePostId,
      viewUrl: `[MODO PRUEBA] Post #${remotePostId} estaría publicado en Blogger`,
      selfLink: undefined
    };
  }

  async getPostLinks(remotePostId: number): Promise<PostLinks> {
    if (!this.mockPosts.has(remotePostId)) {
      throw new Error(`Post ${remotePostId} no encontrado`);
    }

    return {
      viewUrl: `[MOCK] Post #${remotePostId}`,
      selfLink: undefined,
      editUrl: undefined
    };
  }

  // Método extra para debugging
  getMockPosts(): Map<number, { title: string; content: string; labels?: string[] }> {
    return this.mockPosts;
  }
}
