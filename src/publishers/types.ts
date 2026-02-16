export interface UpsertDraftInput {
  remotePostId?: number | null;
  title: string;
  contentHtml: string;
  labels?: string[];
}

export interface UpsertDraftResult {
  remotePostId: number;
  viewUrl?: string;
  selfLink?: string;
  editUrl?: string;
}

export interface PublishResult {
  remotePostId: number;
  viewUrl?: string;
  selfLink?: string;
}

export interface PostLinks {
  viewUrl?: string;
  selfLink?: string;
  editUrl?: string;
}

export interface Publisher {
  upsertDraft(input: UpsertDraftInput): Promise<UpsertDraftResult>;
  publish(remotePostId: number): Promise<PublishResult>;
  getPostLinks(remotePostId: number): Promise<PostLinks>;
}
