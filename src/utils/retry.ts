export async function withRetry<T>(fn: () => Promise<T>, retries = 3, baseMs = 400): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === retries) break;
      const waitMs = baseMs * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }
  throw lastError;
}
