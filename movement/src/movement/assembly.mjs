import SynthiaStateSpace, { DIMENSIONS as DONOR_DIMENSIONS } from '../vendor/autopoietic/state-space-foundation.mjs';
import { MovementConstraintSurface } from '../vendor/reciprocal/movementConstraints.mjs';
import { projectSpace } from '../vendor/reciprocal/primitiveTopology.mjs';
import { MovementTransportRuntime } from './transport.mjs';
import { MovementMeasurement } from './measurement.mjs';
import { MovementNaming } from './naming.mjs';
import { MovementSwarmOutlet } from './swarm.mjs';
import { CURRENT_DIMENSION_CANON, MOVEMENT_LEVELS, verticalSpine, SOURCE_CONFLICTS } from './canon.mjs';

export class MovementLayerAssembly {
  constructor({ savedStateSpace = null, reach = null, conditions = [], actions = [], capabilities = {} } = {}) {
    this.id = 'synthia-movement-layer-assembly-v0.1.0';
    this.stateSpace = new SynthiaStateSpace({ saved: savedStateSpace });
    this.naming = new MovementNaming(this.stateSpace);
    this.measurement = new MovementMeasurement();
    this.transport = new MovementTransportRuntime();
    this.constraints = new MovementConstraintSurface({ conditions, actions, capabilities });
    this.swarm = new MovementSwarmOutlet({ reach });
  }

  spine() { return verticalSpine(); }

  movementLevels() {
    return Object.freeze(MOVEMENT_LEVELS.map((quality, index) => Object.freeze({
      order: index + 1,
      dimension: 'Movement',
      quality,
      root: CURRENT_DIMENSION_CANON.Movement.root,
      interrogative: CURRENT_DIMENSION_CANON.Movement.interrogative,
      axTerm: CURRENT_DIMENSION_CANON.Movement.axTerm,
    })));
  }

  name(input) { return this.naming.name(input); }
  measure(address) { return this.measurement.measure(address); }
  transportGate(gate, options = {}) { return this.transport.transportGate(gate, options); }
  emit(gate, quality, options = {}) { return this.swarm.emit(gate, quality, options); }
  emitAllLevels(gate, options = {}) { return this.swarm.emitAllLevels(gate, options); }

  donorMovementCell(gate) { return this.stateSpace.cell(gate, 'Movement'); }

  projectEmergentSpace(primitives = {}, relations = []) {
    return projectSpace(primitives, relations);
  }

  snapshot() {
    return Object.freeze({
      id: this.id,
      verticalSpine: this.spine(),
      movementLevels: this.movementLevels(),
      donorMovement: Object.freeze({
        qualities: Object.freeze([...DONOR_DIMENSIONS.Movement.qualities]),
        process: Object.freeze([...DONOR_DIMENSIONS.Movement.process]),
        interrogativePreservedInVendor: DONOR_DIMENSIONS.Movement.interrogative,
      }),
      currentMovementCanon: CURRENT_DIMENSION_CANON.Movement,
      conflicts: SOURCE_CONFLICTS,
      stateSpace: Object.freeze({ codons: this.stateSpace.codons.size, coordinateStates: this.stateSpace.coordinates.size() }),
      transport: this.transport.snapshot(),
      constraints: this.constraints.snapshot(),
    });
  }
}

export default MovementLayerAssembly;
