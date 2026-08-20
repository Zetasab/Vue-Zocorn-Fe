import type { VercelRequest, VercelResponse } from '@vercel/node'
import { queryParam, tmdbGet, withTmdbErrorHandling } from '../_lib/tmdb.js'

const LIST_ENDPOINTS = ['popular', 'top_rated', 'now_playing', 'upcoming']
const DETAIL_SUBRESOURCES = ['credits', 'videos', 'images', 'recommendations', 'similar', 'reviews']
const PAGINATED_SUBRESOURCES = ['recommendations', 'similar', 'reviews']

function pathSegments(req: VercelRequest): string[] {
  const raw = req.query.path
  if (Array.isArray(raw)) {
    return raw
  }

  return typeof raw === 'string' ? raw.split('/') : []
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  await withTmdbErrorHandling(res, async () => {
    const segments = pathSegments(req)
    const page = queryParam(req, 'page') ?? '1'
    const language = queryParam(req, 'language') ?? 'en-US'
    const [first, second] = segments

    if (segments.length === 1 && LIST_ENDPOINTS.includes(first)) {
      await tmdbGet(res, `/movie/${first}`, { page, language })
      return
    }

    if (segments.length === 1 && first === 'search') {
      const query = queryParam(req, 'query')
      if (!query) {
        res.status(400).json({ message: "El parámetro 'query' es obligatorio." })
        return
      }

      const includeAdult = queryParam(req, 'include_adult') ?? 'false'
      await tmdbGet(res, '/search/movie', { query, page, language, include_adult: includeAdult })
      return
    }

    if (segments.length === 1 && first === 'discover') {
      await tmdbGet(res, '/discover/movie', {
        page,
        language,
        sort_by: queryParam(req, 'sort_by') ?? 'popularity.desc',
        with_genres: queryParam(req, 'with_genres'),
        primary_release_year: queryParam(req, 'primary_release_year'),
        'vote_average.gte': queryParam(req, 'vote_average.gte'),
        'vote_average.lte': queryParam(req, 'vote_average.lte'),
        with_original_language: queryParam(req, 'with_original_language'),
        include_adult: queryParam(req, 'include_adult') ?? 'false'
      })
      return
    }

    if (segments.length === 1 && first === 'genres') {
      await tmdbGet(res, '/genre/movie/list', { language })
      return
    }

    if (segments.length === 2 && first === 'trending') {
      await tmdbGet(res, `/trending/movie/${encodeURIComponent(second)}`, { page, language })
      return
    }

    if (segments.length >= 1 && /^\d+$/.test(first)) {
      const movieId = first

      if (segments.length === 1) {
        await tmdbGet(res, `/movie/${encodeURIComponent(movieId)}`, { language })
        return
      }

      if (segments.length === 2 && DETAIL_SUBRESOURCES.includes(second)) {
        const query = second === 'images' ? {} : PAGINATED_SUBRESOURCES.includes(second) ? { page, language } : { language }
        await tmdbGet(res, `/movie/${encodeURIComponent(movieId)}/${second}`, query)
        return
      }
    }

    res.status(404).json({ message: 'Ruta no encontrada.' })
  })
}
