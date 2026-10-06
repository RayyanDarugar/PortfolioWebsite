import { geoDistance, geoOrthographic } from 'd3-geo'

/** The globe's projection at a rotation, sized to a `size` px canvas. */
export function projection(rotate: [number, number], size: number) {
  return geoOrthographic().scale(size / 2 - 1).translate([size / 2, size / 2]).rotate([rotate[0], rotate[1]])
}

/** Where a pin lands on the canvas, and whether it is on the side facing you. */
export function projectPin(lon: number, lat: number, rotate: [number, number], size: number): { x: number; y: number; visible: boolean } {
  const [x, y] = projection(rotate, size)([lon, lat]) ?? [0, 0]
  const visible = geoDistance([lon, lat], [-rotate[0], -rotate[1]]) < Math.PI / 2 - 0.05
  return { x, y, visible }
}
