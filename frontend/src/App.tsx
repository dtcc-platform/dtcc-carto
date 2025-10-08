import { useCallback, useRef, useState } from 'react'
import { Alert, Box, CircularProgress, Container, Paper, Stack, Typography } from '@mui/material'
import type { Feature } from 'geojson'
import MapView from './components/map/MapView'
import { postSelection, type SelectionResponse } from './api/select'

function App() {
  const [selectionFeature, setSelectionFeature] = useState<Feature | null>(null)
  const [selectionResponse, setSelectionResponse] = useState<SelectionResponse | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const requestIdRef = useRef(0)

  const handleSelectionChange = useCallback(async (feature: Feature | null) => {
    requestIdRef.current += 1
    const currentRequestId = requestIdRef.current

    setSelectionFeature(feature)
    setSelectionResponse(null)

    if (!feature || !feature.geometry) {
      setStatus('idle')
      setErrorMessage(null)
      return
    }

    setStatus('loading')
    setErrorMessage(null)

    try {
      const response = await postSelection(feature.geometry)
      if (currentRequestId === requestIdRef.current) {
        setSelectionResponse(response)
        setStatus('success')
      }
    } catch (error) {
      if (currentRequestId === requestIdRef.current) {
        const message =
          error instanceof Error ? error.message : 'Selection request failed unexpectedly.'
        setErrorMessage(message)
        setStatus('error')
      }
    }
  }, [])

  return (
    <Box className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      <Container maxWidth="lg">
        <Stack spacing={4} className="py-6">
          <Typography variant="h3" component="h1">
            DTCC Cartography
          </Typography>
          <Typography color="text.secondary">
            Explore the interactive map, switch basemaps, and draw a bounding box or polygon to send
            the selection to the backend.
          </Typography>
          <MapView onSelectionChange={handleSelectionChange} />
          <Paper elevation={1} className="px-4 py-3">
            <Stack spacing={2}>
              <Typography variant="h6">Selection status</Typography>
              {status === 'idle' && (
                <Typography color="text.secondary">
                  Draw a bounding box or polygon to trigger a backend request.
                </Typography>
              )}

              {status === 'loading' && (
                <Stack direction="row" spacing={2} alignItems="center">
                  <CircularProgress size={20} />
                  <Typography>Sending selection to backend…</Typography>
                </Stack>
              )}

              {status === 'error' && errorMessage ? (
                <Alert severity="error" variant="filled">
                  {errorMessage}
                </Alert>
              ) : null}

              {status === 'success' && selectionResponse ? (
                <Stack spacing={0.5}>
                  <Typography>
                    Source:{' '}
                    <Typography component="span" fontWeight={600}>
                      {selectionResponse.source.toUpperCase()}
                    </Typography>
                  </Typography>
                  <Typography>
                    Features returned:{' '}
                    <Typography component="span" fontWeight={600}>
                      {selectionResponse.features.length}
                    </Typography>
                  </Typography>
                  {selectionResponse.message ? (
                    <Typography color="text.secondary">{selectionResponse.message}</Typography>
                  ) : null}
                </Stack>
              ) : null}

              {selectionFeature ? (
                <Typography variant="body2" color="text.secondary">
                  Selected geometry type: {selectionFeature.geometry?.type}
                </Typography>
              ) : null}
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </Box>
  )
}

export default App
