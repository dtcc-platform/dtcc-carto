export type BasemapId = 'light' | 'dark' | 'terrain' | 'satellite'

export interface BasemapOption {
  id: BasemapId
  label: string
  styleUrl: string
}

const fallbackBasemaps: Record<BasemapId, BasemapOption> = {
  light: {
    id: 'light',
    label: 'OSM Light',
    styleUrl: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  },
  dark: {
    id: 'dark',
    label: 'OSM Dark',
    styleUrl: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  },
  terrain: {
    id: 'terrain',
    label: 'Terrain',
    styleUrl: 'https://demotiles.maplibre.org/style.json',
  },
  satellite: {
    id: 'satellite',
    label: 'Satellite',
    styleUrl: 'https://api.maptiler.com/maps/hybrid/style.json?key=YOUR_API_KEY',
  },
}

const resolveFromEnv = (id: BasemapId): BasemapOption => {
  const env = import.meta.env as Record<string, string | undefined>
  const envKey = `VITE_BASEMAP_${id.toUpperCase()}`
  const value = env[envKey]
  if (value && value.trim().length > 0) {
    return {
      id,
      label: fallbackBasemaps[id].label,
      styleUrl: value.trim(),
    }
  }

  return fallbackBasemaps[id]
}

export const basemapOptions: BasemapOption[] = (['light', 'dark', 'terrain', 'satellite'] as const).map(
  (id) => resolveFromEnv(id),
)

export const basemapOptionById: Record<BasemapId, BasemapOption> = basemapOptions.reduce(
  (acc, option) => {
    acc[option.id] = option
    return acc
  },
  {} as Record<BasemapId, BasemapOption>,
)

export const defaultBasemap: BasemapId = 'light'
