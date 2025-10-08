from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field, model_validator
from shapely.geometry import shape


class GeoJSONGeometry(BaseModel):
    model_config = ConfigDict(extra='forbid')

    type: str = Field(..., description='GeoJSON geometry type')
    coordinates: Any

    @model_validator(mode='after')
    def validate_geometry(cls, model: 'GeoJSONGeometry') -> 'GeoJSONGeometry':
        try:
            geom = shape(model.model_dump())
        except Exception as exc:  # pragma: no cover - shapely raises various errors
            raise ValueError('Invalid GeoJSON geometry') from exc

        if geom.is_empty:
            raise ValueError('Geometry cannot be empty')

        if geom.geom_type not in {'Polygon', 'MultiPolygon'}:
            raise ValueError('Only Polygon and MultiPolygon geometries are supported')

        return model


class FeatureModel(BaseModel):
    type: Literal['Feature'] = 'Feature'
    geometry: Dict[str, Any]
    properties: Dict[str, Any] = Field(default_factory=dict)


class SelectionResponse(BaseModel):
    source: Literal['dummy', 'osm']
    features: List[FeatureModel]
    message: Optional[str] = None
