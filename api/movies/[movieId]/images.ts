import type { VercelRequest, VercelResponse } from '@vercel/node'
import { pathParam, tmdbGet, withTmdbErrorHandling } from '../../_lib/tmdb'

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  await withTmdbErrorHandling(res, async () => {
    const movieId = pathParam(req, 'movieId')
    await tmdbGet(res, `/movie/${encodeURIComponent(movieId)}/images`, {})
  })
}
