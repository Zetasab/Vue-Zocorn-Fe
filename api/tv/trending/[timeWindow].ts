import type { VercelRequest, VercelResponse } from '@vercel/node'
import { pathParam, queryParam, tmdbGet, withTmdbErrorHandling } from '../../_lib/tmdb.js'

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  await withTmdbErrorHandling(res, async () => {
    const timeWindow = pathParam(req, 'timeWindow')
    const page = queryParam(req, 'page') ?? '1'
    const language = queryParam(req, 'language') ?? 'en-US'
    await tmdbGet(res, `/trending/tv/${encodeURIComponent(timeWindow)}`, { page, language })
  })
}
