import { useEffect, useMemo, useRef, useState } from 'react'
import { Box, Paper, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import maplibregl, { Map as MapLibreMap, MapMouseEvent } from 'maplibre-gl'
import type { IControl } from 'maplibre-gl'
import MapLibreDraw from 'maplibre-gl-draw'
import DrawRectangleMode from 'mapbox-gl-draw-rectangle-mode'
import MapLibreWorker from 'maplibre-gl/dist/maplibre-gl-csp-worker.js?worker'
import type {
  DrawCreateEvent,
  DrawDeleteEvent,
  DrawModeChangeEvent,
  DrawUpdateEvent,
} from '@mapbox/mapbox-gl-draw'
import type MapboxDraw from '@mapbox/mapbox-gl-draw'
import type { Feature } from 'geojson'

import 'maplibre-gl/dist/maplibre-gl.css'
import 'maplibre-gl-draw/dist/mapbox-gl-draw.css'

import { basemapOptionById, basemapOptions, defaultBasemap } from '../../config/basemaps'
import type { BasemapId } from '../../config/basemaps'
import { convertToSweref } from '../../lib/projections'
import type { SwerefCoordinate } from '../../lib/projections'

;(maplibregl as typeof maplibregl & { workerClass?: typeof Worker }).workerClass =
  MapLibreWorker as unknown as typeof Worker
type DrawMode = 'none' | 'bbox' | 'polygon'

interface MapViewProps {
  onSelectionChange: (feature: Feature | null) => void
}

const INITIAL_VIEW_STATE = {
  center: [15.0, 62.0] as [number, number],
  zoom: 4.5,
  minZoom: 3,
  maxZoom: 16,
}

const createDrawInstance = () =>
  new MapLibreDraw({
    displayControlsDefault: false,
    defaultMode: 'simple_select',
    controls: {
      trash: false,
    },
    modes: {
      ...MapLibreDraw.modes,
      draw_rectangle: DrawRectangleMode as MapboxDraw.DrawMode,
    } as any,
  })

const formatLatLon = (value: number) =>
  new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 5 }).format(value)

const MapView = ({ onSelectionChange }: MapViewProps) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const drawRef = useRef<MapLibreDraw | null>(null)
  const programmaticDeleteRef = useRef(false)

  const [basemapId, setBasemapId] = useState<BasemapId>(defaultBasemap)
  const [drawMode, setDrawMode] = useState<DrawMode>('none')
  const [cursorLonLat, setCursorLonLat] = useState<{ lon: number; lat: number } | null>(null)
  const [cursorSweref, setCursorSweref] = useState<SwerefCoordinate | null>(null)

  const numberFormat = useMemo(
    () => new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 1 }),
    [],
  )

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return
    }

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: basemapOptionById[basemapId].styleUrl,
      center: INITIAL_VIEW_STATE.center,
      zoom: INITIAL_VIEW_STATE.zoom,
      minZoom: INITIAL_VIEW_STATE.minZoom,
      maxZoom: INITIAL_VIEW_STATE.maxZoom,
      attributionControl: false,
    })

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-left')
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 120, unit: 'metric' }), 'bottom-left')
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right')

    const draw = createDrawInstance()
    drawRef.current = draw
    map.addControl(draw as unknown as IControl)

    const handleCursorMove = (event: MapMouseEvent) => {
      const { lng, lat } = event.lngLat
      setCursorLonLat({ lon: lng, lat })
      setCursorSweref(convertToSweref(lng, lat))
    }

    const resetCursor = () => {
      setCursorLonLat(null)
      setCursorSweref(null)
    }

    const handleSelection = (feature: Feature | null) => {
      onSelectionChange(feature)
    }

    const handleDrawCreate = (event: DrawCreateEvent) => {
      const feature = event.features?.[0] ?? null
      if (feature) {
        handleSelection(feature)
        setDrawMode('none')
      }
    }

    const handleDrawUpdate = (event: DrawUpdateEvent) => {
      const feature = event.features?.[0] ?? null
      if (feature) {
        handleSelection(feature)
      }
    }

    const handleDrawDelete = (_event: DrawDeleteEvent) => {
      if (programmaticDeleteRef.current) {
        programmaticDeleteRef.current = false
        return
      }
      handleSelection(null)
      setDrawMode('none')
    }

    const handleModeChange = (event: DrawModeChangeEvent) => {
      if (event.mode === 'simple_select') {
        setDrawMode('none')
      }
    }

    map.on('mousemove', handleCursorMove)
    map.on('mouseout', resetCursor)
    map.on('draw.create', handleDrawCreate)
    map.on('draw.update', handleDrawUpdate)
    map.on('draw.delete', handleDrawDelete)
    map.on('draw.modechange', handleModeChange)

    mapRef.current = map

    return () => {
      map.off('mousemove', handleCursorMove)
      map.off('mouseout', resetCursor)
      map.off('draw.create', handleDrawCreate)
      map.off('draw.update', handleDrawUpdate)
      map.off('draw.delete', handleDrawDelete)
      map.off('draw.modechange', handleModeChange)
      map.remove()
      mapRef.current = null
      drawRef.current = null
    }
  }, [onSelectionChange])

  useEffect(() => {
    const map = mapRef.current
    const draw = drawRef.current
    if (!map || !draw) {
      return
    }

    const previousData = draw.getAll()
    map.once('style.load', () => {
      if (previousData.features.length > 0) {
        draw.set(previousData)
      }
    })

    map.setStyle(basemapOptionById[basemapId].styleUrl)
  }, [basemapId])

  useEffect(() => {
    const draw = drawRef.current
    if (!draw) return

    const changeMode = (mode: string) => {
      ;(draw as unknown as { changeMode: (mode: string) => void }).changeMode(mode)
    }

    if (drawMode === 'bbox') {
      programmaticDeleteRef.current = true
      draw.deleteAll()
      onSelectionChange(null)
      changeMode('draw_rectangle')
    } else if (drawMode === 'polygon') {
      programmaticDeleteRef.current = true
      draw.deleteAll()
      onSelectionChange(null)
      changeMode('draw_polygon')
    } else {
      changeMode('simple_select')
    }
  }, [drawMode, onSelectionChange])

  const handleBasemapChange = (_: unknown, value: BasemapId | null) => {
    if (value && value !== basemapId) {
      setBasemapId(value)
    }
  }

  const handleDrawModeChange = (_: unknown, value: DrawMode | null) => {
    if (value) {
      setDrawMode(value)
    }
  }

  return (
    <Box position="relative" className="w-full">
      <Box ref={mapContainerRef} className="h-[70vh] w-full rounded-xl shadow-lg" />

      <Box className="pointer-events-none absolute left-4 top-4 flex flex-col gap-3">
        <Paper elevation={2} className="pointer-events-auto">
          <Stack direction="column" spacing={1} className="px-3 py-2">
            <Typography variant="subtitle2" className="uppercase text-xs text-slate-500">
              Basemap
            </Typography>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={basemapId}
              onChange={handleBasemapChange}
            >
              {basemapOptions.map((option) => (
                <ToggleButton key={option.id} value={option.id}>
                  {option.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Stack>
        </Paper>
      </Box>

      <Box className="pointer-events-none absolute right-4 top-4 flex flex-col gap-3">
        <Paper elevation={2} className="pointer-events-auto">
          <Stack direction="column" spacing={1} className="px-3 py-2">
            <Typography variant="subtitle2" className="uppercase text-xs text-slate-500">
              Draw Mode
            </Typography>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={drawMode}
              onChange={handleDrawModeChange}
            >
              <ToggleButton value="none">None</ToggleButton>
              <ToggleButton value="bbox">BBox</ToggleButton>
              <ToggleButton value="polygon">Polygon</ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </Paper>
      </Box>

      <Box className="pointer-events-none absolute left-4 bottom-4">
        <Paper elevation={2} className="pointer-events-auto px-3 py-2">
          <Stack spacing={0.5}>
            <Typography variant="subtitle2" className="uppercase text-xs text-slate-500">
              Cursor SWEREF 99 TM
            </Typography>
            <Typography variant="body2">
              {cursorSweref
                ? `N: ${numberFormat.format(cursorSweref.northing)} m  E: ${numberFormat.format(
                    cursorSweref.easting,
                  )} m`
                : 'Move cursor over map'}
            </Typography>
            {cursorLonLat ? (
              <Typography variant="caption" color="text.secondary">
                WGS84 lat {formatLatLon(cursorLonLat.lat)}°, lon {formatLatLon(cursorLonLat.lon)}°
              </Typography>
            ) : null}
          </Stack>
        </Paper>
      </Box>
    </Box>
  )
}

export default MapView
