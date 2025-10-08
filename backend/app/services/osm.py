from __future__ import annotations

from typing import Any, Dict, Iterable, List, Optional

import httpx
from shapely.geometry.base import BaseGeometry


class OverpassError(RuntimeError):
    """Raised when the Overpass API request fails."""


def _bbox(geometry: BaseGeometry) -> tuple[float, float, float, float]:
    minx, miny, maxx, maxy = geometry.bounds
    return miny, minx, maxy, maxx  # south, west, north, east


def _element_to_feature(element: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    element_type = element.get('type')
    tags = element.get('tags') or {}
    properties = {
        'id': element.get('id'),
        'osm_type': element_type,
        **tags,
    }

    if element_type == 'node':
        lon = element.get('lon')
        lat = element.get('lat')
        if lon is None or lat is None:
            return None
        geometry = {'type': 'Point', 'coordinates': [lon, lat]}
    elif element_type == 'way':
        coords = element.get('geometry') or []
        if not coords:
            return None
        line = [[c['lon'], c['lat']] for c in coords if 'lon' in c and 'lat' in c]
        if not line:
            return None
        if len(line) >= 4 and line[0] == line[-1]:
            geometry = {'type': 'Polygon', 'coordinates': [line]}
        else:
            geometry = {'type': 'LineString', 'coordinates': line}
    elif element_type == 'relation':
        center = element.get('center')
        if center and 'lon' in center and 'lat' in center:
            geometry = {'type': 'Point', 'coordinates': [center['lon'], center['lat']]}
        else:
            return None
    else:
        return None

    return {
        'type': 'Feature',
        'properties': properties,
        'geometry': geometry,
    }


def _build_overpass_query(geometry: BaseGeometry, limit: int) -> str:
    south, west, north, east = _bbox(geometry)
    return f"""
    [out:json][timeout:25];
    (
      node["place"]({south},{west},{north},{east});
      way["place"]({south},{west},{north},{east});
      relation["place"]({south},{west},{north},{east});
    );
    out body geom {limit};
    """


async def fetch_osm_features(
    geometry: BaseGeometry,
    overpass_url: str,
    *,
    limit: int = 20,
    client: Optional[httpx.AsyncClient] = None,
) -> List[Dict[str, Any]]:
    """Fetch place features from the Overpass API within the geometry bounds."""

    query = _build_overpass_query(geometry, limit)
    payload = {'data': query}

    close_client = False
    if client is None:
        client = httpx.AsyncClient(timeout=httpx.Timeout(20.0))
        close_client = True

    try:
        response = await client.post(overpass_url, data=payload)
        response.raise_for_status()
        data = response.json()
    except httpx.HTTPError as exc:  # pragma: no cover - network failure is runtime concern
        raise OverpassError(str(exc)) from exc
    finally:
        if close_client:
            await client.aclose()

    elements: Iterable[Dict[str, Any]] = data.get('elements', []) or []
    features: List[Dict[str, Any]] = []

    for element in elements:
        feature = _element_to_feature(element)
        if feature is not None:
            features.append(feature)
        if len(features) >= limit:
            break

    return features
