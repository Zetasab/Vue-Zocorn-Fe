import type { VercelRequest, VercelResponse } from '@vercel/node'
import { queryParam, tmdbGet, withTmdbErrorHandling } from '../_lib/tmdb.js'

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  await withTmdbErrorHandling(res, async () => {
    const page = queryParam(req, 'page') ?? '1'
    const language = queryParam(req, 'language') ?? 'en-US'
    const sortBy = queryParam(req, 'sort_by') ?? 'popularity.desc'
    const withGenres = queryParam(req, 'with_genres')
    const primaryReleaseYear = queryParam(req, 'primary_release_year')
    const voteAverageGte = queryParam(req, 'vote_average.gte')
    const voteAverageLte = queryParam(req, 'vote_average.lte')
    const withOriginalLanguage = queryParam(req, 'with_original_language')
    const includeAdult = queryParam(req, 'include_adult') ?? 'false'

    await tmdbGet(res, '/discover/movie', {
      page,
      language,
      sort_by: sortBy,
      with_genres: withGenres,
      primary_release_year: primaryReleaseYear,
      'vote_average.gte': voteAverageGte,
      'vote_average.lte': voteAverageLte,
      with_original_language: withOriginalLanguage,
      include_adult: includeAdult
    })
  })
}
