from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .schemas import GeoJSONGeometry, SelectionResponse
from .services.geospatial import build_dummy_features, geometry_from_geojson, intersects_sweden
from .services.osm import OverpassError, fetch_osm_features
from .settings import get_settings


settings = get_settings()


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.api_title,
        version=settings.api_version,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.frontend_origin],
        allow_credentials=True,
        allow_methods=['*'],
        allow_headers=['*'],
    )

    @app.get('/health', response_model=dict[str, str])
    async def health() -> dict[str, str]:
        return {'status': 'ok'}

    @app.post('/select', response_model=SelectionResponse)
    async def select(geometry: GeoJSONGeometry) -> SelectionResponse:
        try:
            shapely_geometry = geometry_from_geojson(geometry.model_dump())
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

        if intersects_sweden(shapely_geometry):
            features = build_dummy_features(shapely_geometry)
            return SelectionResponse(
                source='dummy',
                features=features,
                message='Selection intersects Sweden – returning placeholder dataset.',
            )

        try:
            features = await fetch_osm_features(shapely_geometry, settings.overpass_url)
        except OverpassError as exc:
            raise HTTPException(status_code=502, detail=f'Overpass API error: {exc}') from exc

        message = 'Fetched features from OpenStreetMap.' if features else 'No OSM features found for the selection.'

        return SelectionResponse(
            source='osm',
            features=features,
            message=message,
        )

    return app


app = create_app()
