import type { VercelRequest, VercelResponse } from '@vercel/node'
import { pathParam, tmdbGet, withTmdbErrorHandling } from '../../_lib/tmdb.js'

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  await withTmdbErrorHandling(res, async () => {
    const seriesId = pathParam(req, 'seriesId')
    await tmdbGet(res, `/tv/${encodeURIComponent(seriesId)}/images`, {})
  })
}
