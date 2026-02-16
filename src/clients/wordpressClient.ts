import { config } from '../config';
import { DraftPayload } from '../domain/types';
import { withRetry } from '../utils/retry';

const auth = Buffer.from(`${config.WP_USERNAME}:${config.WP_APP_PASSWORD}`).toString('base64');

function wpHeaders() {
  return {
    Authorization: `Basic ${auth}`,
    'content-type': 'application/json'
  };
}

export async function createDraftPost(payload: DraftPayload): Promise<number> {
  const response = await withRetry(async () =>
    fetch(`${config.WP_BASE_URL}/wp-json/wp/v2/posts`, {
      method: 'POST',
      headers: wpHeaders(),
      body: JSON.stringify({
        title: payload.title,
        slug: payload.slug,
        status: 'draft',
        excerpt: payload.meta_description,
        content: payload.content_markdown,
        tags: []
      })
    })
  );

  if (!response.ok) {
    throw new Error(`WP create draft failed ${response.status}: ${await response.text()}`);
  }
  const json = (await response.json()) as { id: number };
  return json.id;
}

export async function updateDraftPost(postId: number, payload: DraftPayload): Promise<void> {
  const response = await withRetry(async () =>
    fetch(`${config.WP_BASE_URL}/wp-json/wp/v2/posts/${postId}`, {
      method: 'POST',
      headers: wpHeaders(),
      body: JSON.stringify({
        title: payload.title,
        slug: payload.slug,
        excerpt: payload.meta_description,
        content: payload.content_markdown,
        status: 'draft'
      })
    })
  );

  if (!response.ok) {
    throw new Error(`WP update draft failed ${response.status}: ${await response.text()}`);
  }
}

export async function publishPost(postId: number): Promise<void> {
  const response = await withRetry(async () =>
    fetch(`${config.WP_BASE_URL}/wp-json/wp/v2/posts/${postId}`, {
      method: 'POST',
      headers: wpHeaders(),
      body: JSON.stringify({ status: 'publish' })
    })
  );

  if (!response.ok) {
    throw new Error(`WP publish failed ${response.status}: ${await response.text()}`);
  }
}
