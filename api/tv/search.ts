import type { VercelRequest, VercelResponse } from '@vercel/node'
import { queryParam, tmdbGet, withTmdbErrorHandling } from '../_lib/tmdb.js'

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  await withTmdbErrorHandling(res, async () => {
    const query = queryParam(req, 'query')
    if (!query) {
      res.status(400).json({ message: "El parámetro 'query' es obligatorio." })
      return
    }

    const page = queryParam(req, 'page') ?? '1'
    const language = queryParam(req, 'language') ?? 'en-US'
    const includeAdult = queryParam(req, 'include_adult') ?? 'false'
    await tmdbGet(res, '/search/tv', { query, page, language, include_adult: includeAdult })
  })
}
