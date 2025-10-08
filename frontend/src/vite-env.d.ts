/// <reference types="vite/client" />

declare module 'maplibre-gl/dist/maplibre-gl-csp-worker.js?worker' {
  const MapLibreWorker: { new (): Worker }
  export default MapLibreWorker
}
