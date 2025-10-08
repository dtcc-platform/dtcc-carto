import proj4 from 'proj4'

const SWEREF_PROJECTION = 'EPSG:3006'
const WGS84_PROJECTION = 'EPSG:4326'

const swerefDefinition =
  '+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs'

proj4.defs(SWEREF_PROJECTION, swerefDefinition)

export interface SwerefCoordinate {
  northing: number
  easting: number
}

export const convertToSweref = (longitude: number, latitude: number): SwerefCoordinate => {
  const [easting, northing] = proj4(WGS84_PROJECTION, SWEREF_PROJECTION, [longitude, latitude])
  return { easting, northing }
}
