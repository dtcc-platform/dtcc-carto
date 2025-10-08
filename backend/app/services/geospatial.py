from typing import Any, Dict, List
from shapely.geometry import Polygon, mapping, shape
from shapely.geometry.base import BaseGeometry

SWEDEN_OUTLINE: List[tuple[float, float]] = [
    (10.5, 55.2),
    (11.5, 55.3),
    (12.8, 56.2),
    (14.3, 57.1),
    (16.0, 57.6),
    (17.7, 58.8),
    (18.5, 59.5),
    (19.6, 60.6),
    (20.3, 62.0),
    (21.5, 63.5),
    (22.5, 65.0),
    (23.0, 66.5),
    (23.5, 67.9),
    (23.0, 68.6),
    (21.5, 69.0),
    (19.0, 68.9),
    (17.0, 67.5),
    (15.5, 66.0),
    (14.0, 64.2),
    (13.0, 62.5),
    (12.0, 60.8),
    (11.2, 59.3),
    (10.8, 58.0),
    (10.4, 56.0),
    (10.5, 55.2),
]

SWEDEN_BOUNDARY = Polygon(SWEDEN_OUTLINE).buffer(0.15)


def geometry_from_geojson(data: Dict[str, Any]) -> BaseGeometry:
    geometry = shape(data)
    if geometry.is_empty:
        raise ValueError('Geometry is empty')

    if geometry.geom_type not in {'Polygon', 'MultiPolygon'}:
        raise ValueError('Geometry must be a polygon')

    return geometry


def intersects_sweden(geometry: BaseGeometry) -> bool:
    return geometry.intersects(SWEDEN_BOUNDARY)


def build_dummy_features(geometry: BaseGeometry) -> List[Dict[str, Any]]:
    centroid = geometry.centroid

    return [
        {
            'type': 'Feature',
            'properties': {
                'id': 'selection',
                'note': 'Original selection geometry provided by the client.',
            },
            'geometry': mapping(geometry),
        },
        {
            'type': 'Feature',
            'properties': {
                'id': 'centroid',
                'note': 'Centroid of the selection. Replace with real data when backend ready.',
            },
            'geometry': mapping(centroid),
        },
    ]
