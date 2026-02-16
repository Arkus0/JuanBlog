import { google } from 'googleapis';
import { config } from '../config/env';
import { logger } from '../logger';
import { PostLinks, Publisher, PublishResult, UpsertDraftInput, UpsertDraftResult } from './types';

function toNumericId(id: string | number | undefined): number {
  if (!id) throw new Error('Blogger no devolvió post id');
  const parsed = Number(id);
  if (Number.isNaN(parsed)) {
    throw new Error(`Post id no numérico: ${id}`);
  }
  return parsed;
}

function mapLinks(post: { url?: string | null; selfLink?: string | null }): PostLinks {
  return {
    viewUrl: post.url ?? undefined,
    selfLink: post.selfLink ?? undefined,
    editUrl: post.selfLink ?? undefined
  };
}

export class BloggerPublisher implements Publisher {
  private blogger = google.blogger('v3');
  private oauth2 = new google.auth.OAuth2(config.GOOGLE_CLIENT_ID, config.GOOGLE_CLIENT_SECRET);

  constructor() {
    this.oauth2.setCredentials({ refresh_token: config.GOOGLE_REFRESH_TOKEN });
  }

  async upsertDraft(input: UpsertDraftInput): Promise<UpsertDraftResult> {
    if (input.remotePostId) {
      const response = await this.blogger.posts.patch({
        auth: this.oauth2,
        blogId: config.BLOGGER_BLOG_ID,
        postId: String(input.remotePostId),
        isDraft: true,
        requestBody: {
          title: input.title,
          content: input.contentHtml,
          labels: input.labels
        }
      });

      const post = response.data;
      return {
        remotePostId: toNumericId(post.id),
        ...mapLinks(post)
      };
    }

    const response = await this.blogger.posts.insert({
      auth: this.oauth2,
      blogId: config.BLOGGER_BLOG_ID,
      isDraft: true,
      requestBody: {
        title: input.title,
        content: input.contentHtml,
        labels: input.labels
      }
    });

    const post = response.data;
    return {
      remotePostId: toNumericId(post.id),
      ...mapLinks(post)
    };
  }

  async publish(remotePostId: number): Promise<PublishResult> {
    try {
      const published = await this.blogger.posts.publish({
        auth: this.oauth2,
        blogId: config.BLOGGER_BLOG_ID,
        postId: String(remotePostId)
      });
      return {
        remotePostId: toNumericId(published.data.id ?? remotePostId),
        viewUrl: published.data.url ?? undefined,
        selfLink: published.data.selfLink ?? undefined
      };
    } catch (error) {
      logger.warn({ err: error, remotePostId }, 'Fallback publish strategy: insert public copy from draft');
      const draft = await this.blogger.posts.get({
        auth: this.oauth2,
        blogId: config.BLOGGER_BLOG_ID,
        postId: String(remotePostId),
        view: 'ADMIN'
      });

      const copied = await this.blogger.posts.insert({
        auth: this.oauth2,
        blogId: config.BLOGGER_BLOG_ID,
        isDraft: false,
        requestBody: {
          title: draft.data.title ?? 'Untitled',
          content: draft.data.content ?? '',
          labels: draft.data.labels ?? []
        }
      });

      const finalPostId = toNumericId(copied.data.id);
      logger.info({ oldDraftPostId: remotePostId, finalPostId }, 'Published through fallback strategy');

      return {
        remotePostId: finalPostId,
        viewUrl: copied.data.url ?? undefined,
        selfLink: copied.data.selfLink ?? undefined
      };
    }
  }

  async getPostLinks(remotePostId: number): Promise<PostLinks> {
    const post = await this.blogger.posts.get({
      auth: this.oauth2,
      blogId: config.BLOGGER_BLOG_ID,
      postId: String(remotePostId),
      view: 'ADMIN'
    });

    return mapLinks(post.data);
  }
}
