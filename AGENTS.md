# agents.md

## purpose

Interactive map web app built with React + FastAPI.
Shows map like minkarta.lantmateriet.se, supports zoom, basemap switch, and geometry selection.

## stack

* frontend: React 18 + TypeScript 5.9 + Vite 5
* ui: Material-UI 5.15 + Tailwind 3.4
* backend: FastAPI (Python)

## key features

* zoomable map (MapLibre or equivalent)
* cursor shows coordinates in SWEREF 99 TM
* basemap switch (osm light, dark, satellite, terrain)
* selection tools: bounding box or polygon (MVP)
* future: search by city/municipality/neighborhood via OSM admin boundaries
* backend logic:

  * if selection in Sweden → call dummy backend
  * else → query OSM

## frontend agent

1. set up vite + react + typescript + mui + tailwind
2. render a map component with:

   * initial center over Sweden
   * zoom and navigation controls
   * coordinate readout (convert lon/lat → EPSG:3006 using proj4)
3. implement basemap switcher
4. implement draw mode (bbox, polygon)
5. send selection geometry to backend `/select`

## backend agent

1. build FastAPI app with CORS enabled for localhost frontend
2. endpoints:

   * `GET /health` → {status:"ok"}
   * `POST /select`

     * input: GeoJSON geometry
     * if intersects Sweden → return dummy data
     * else → fetch from OSM (Overpass API)
3. (optional) future endpoint `/search?q=` using OSM admin boundaries

## notes

* frontend served at [http://localhost:5173](http://localhost:5173)
* backend at [http://localhost:8000](http://localhost:8000)
* convert coordinates using proj4 definition for EPSG:3006
* keep basemap URLs configurable in `.env`

## goal

Deliver a working MVP with:

* visible basemap switch
* coordinate display in SWEREF 99 TM
* geometry selection + backend roundtrip

Keep code small, typed, and testable.
