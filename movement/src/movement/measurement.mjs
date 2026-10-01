import { Coordinate, CoordinateSpace, RESOLUTION_LEVELS } from '../vendor/autopoietic/state-space-foundation.mjs';
import { CURRENT_DIMENSION_CANON } from './canon.mjs';

/**
 * Movement-facing measurement boundary over the R21.22 local coordinate space.
 * Degree remains local to the 30-degree sign container; arc is the finer 0..99
 * coordinate used by the R21.22 donor. No whole-wheel arc-second canonicalization
 * is introduced here.
 */
export class MovementMeasurement {
  constructor({ coordinateSpace = new CoordinateSpace() } = {}) {
    this.coordinateSpace = coordinateSpace;
  }

  normalize(address) {
    const input = { ...address };
    if (input.dimension == null || input.dimension === 'Movement') input.dimension = 1;
    const coordinate = input instanceof Coordinate ? input : new Coordinate(input);
    if (coordinate.dimensionName !== 'Movement') {
      throw new RangeError('MovementMeasurement only accepts the Movement dimension');
    }
    return coordinate;
  }

  measure(address) {
    const coordinate = this.normalize(address);
    return Object.freeze({
      dimension: 'Movement',
      interrogative: CURRENT_DIMENSION_CANON.Movement.interrogative,
      axTerm: CURRENT_DIMENSION_CANON.Movement.axTerm,
      address: Object.freeze(coordinate.toJSON()),
      nestedLocalCoordinate: Object.freeze({
        zodiac: coordinate.zodiac,
        degree: coordinate.degree,
        minute: coordinate.minute,
        second: coordinate.second,
        arc: coordinate.arc,
      }),
      resolutionPath: RESOLUTION_LEVELS,
      encodedIndex: this.coordinateSpace.encode(coordinate),
    });
  }

  recover(encodedIndex) {
    const coordinate = this.coordinateSpace.decode(encodedIndex);
    if (coordinate.dimensionName !== 'Movement') {
      throw new RangeError('encoded coordinate does not resolve to Movement');
    }
    return this.measure(coordinate);
  }
}
