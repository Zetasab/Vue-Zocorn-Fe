const API_BASE_PATH = '/api/movies'

type QueryParams = Record<string, string | number | boolean>

class TmdbApiService {
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
    return `${API_BASE_PATH}/${normalizedPath}${queryString ? `?${queryString}` : ''}`
  }
}

export const tmdbApiService = new TmdbApiService()
