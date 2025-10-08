import type { Feature, Geometry } from 'geojson'

const DEFAULT_API_URL = 'http://localhost:8000'

const env = import.meta.env as Record<string, string | undefined>
const apiUrl = env.VITE_API_URL?.replace(/\/$/, '') ?? DEFAULT_API_URL

export interface SelectionRequest {
  geometry: Geometry
  properties?: Feature['properties']
}

export interface SelectionResponse {
  source: 'dummy' | 'osm'
  features: Feature[]
  message?: string
}

export const postSelection = async (geometry: Geometry): Promise<SelectionResponse> => {
  const response = await fetch(`${apiUrl}/select`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(geometry),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Selection request failed: ${response.status} ${response.statusText} - ${body}`)
  }

  const data = (await response.json()) as SelectionResponse
  return data
}
