import { apiClient } from './client'

/**
 * Resolves if the stored API Key is accepted by the backend.
 *
 * Uses GET /settings rather than /health: /health is intentionally public on the
 * backend (Docker/Cloudflare healthcheck), so it returns 200 even with a wrong key.
 */
export async function validateApiKey(): Promise<void> {
  await apiClient.get('/settings')
}
