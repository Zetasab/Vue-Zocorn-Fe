type QueryParams = Record<string, string | number | boolean>

class TmdbApiService {
  private readonly basePath: string

  constructor(basePath: string) {
    this.basePath = basePath
  }

  async get<T>(path: string, query?: QueryParams): Promise<T> {
    const url = this.buildUrl(path, query)
    const response = await fetch(url)
    const payload = await response.json()

    if (!response.ok) {
      const message = typeof payload?.message === 'string' ? payload.message : 'Error al consultar la API de películas.'
      throw new Error(message)
    }

    return payload as T
  }

  private buildUrl(path: string, query?: QueryParams): string {
    const normalizedPath = path.startsWith('/') ? path.slice(1) : path
    const searchParams = new URLSearchParams()

    if (query) {
      for (const [key, value] of Object.entries(query)) {
        searchParams.set(key, String(value))
      }
    }

    const queryString = searchParams.toString()
    return `${this.basePath}/${normalizedPath}${queryString ? `?${queryString}` : ''}`
  }
}

export const tmdbApiService = new TmdbApiService('/api/movies')
export const tmdbTvApiService = new TmdbApiService('/api/tv')
