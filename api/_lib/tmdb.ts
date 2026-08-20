import type { VercelRequest, VercelResponse } from '@vercel/node'

const TMDB_BASE_URL = 'https://api.themoviedb.org/3'

type QueryValue = string | number | undefined | null

export function queryParam(req: VercelRequest, key: string): string | undefined {
  const value = req.query[key]
  if (Array.isArray(value)) {
    return value[0]
  }

  return value
}

export function pathParam(req: VercelRequest, key: string): string {
  const value = queryParam(req, key)
  if (!value) {
    throw new Error(`Falta el parámetro de ruta '${key}'`)
  }

  return value
}

export async function tmdbGet(
  res: VercelResponse,
  path: string,
  query: Record<string, QueryValue> = {}
): Promise<void> {
  const token = process.env.TMDB_BEARER_TOKEN

  if (!token) {
    res.status(500).json({ message: 'TMDB_BEARER_TOKEN no está configurado en el entorno.' })
    return
  }

  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value))
    }
  }

  const queryString = searchParams.toString()
  const url = `${TMDB_BASE_URL}${path}${queryString ? `?${queryString}` : ''}`

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json'
    }
  })

  const contentType = response.headers.get('content-type') ?? ''
  const payload = contentType.includes('application/json') ? await response.json() : await response.text()

  res.status(response.status).json(payload)
}

export async function withTmdbErrorHandling(
  res: VercelResponse,
  handler: () => Promise<void>
): Promise<void> {
  try {
    await handler()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error inesperado al consultar TMDB.'
    res.status(400).json({ message })
  }
}
