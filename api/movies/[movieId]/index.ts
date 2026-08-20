import type { VercelRequest, VercelResponse } from '@vercel/node'
import { pathParam, queryParam, tmdbGet, withTmdbErrorHandling } from '../../_lib/tmdb.js'

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  await withTmdbErrorHandling(res, async () => {
    const movieId = pathParam(req, 'movieId')
    const language = queryParam(req, 'language') ?? 'en-US'
    await tmdbGet(res, `/movie/${encodeURIComponent(movieId)}`, { language })
  })
}
