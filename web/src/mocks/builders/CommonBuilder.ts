// This is merely for test
// As we're in NZ, a degree is roughly 110km in both directions
export const APPROX_DEGREES_PER_METRE = 1.0 / 110000.0;

export type LatLong = [number, number];
export type OffsetXY = [number, number];
export const TEST_LOCATION_LAT_LONG: LatLong = [14.825, -41.311];

export class CommonBuilder<T> {
  protected originGeogCoordinates?: LatLong;

  withOrigin(geogCoordinates: LatLong): T {
    this.originGeogCoordinates = geogCoordinates;
    return this as unknown as T;
  }

  transformMetres(offsetMetres: OffsetXY): LatLong {
    if (!this.originGeogCoordinates) {
      throw Error("Can't use withApproxMetres until after withOrigin");
    }

    return [
      this.originGeogCoordinates[0] + offsetMetres[0] * APPROX_DEGREES_PER_METRE,
      this.originGeogCoordinates[1] + offsetMetres[1] * APPROX_DEGREES_PER_METRE,
    ];
  }
}
