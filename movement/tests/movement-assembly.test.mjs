import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MovementLayerAssembly,
  PRIMARY_DIMENSION_ORDER,
  EMERGENT_DIMENSION,
  MOVEMENT_LEVELS,
  CURRENT_DIMENSION_CANON,
  SOURCE_CONFLICTS,
  assemble321,
} from '../src/index.mjs';

const baseAddress = {
  planetary: 1, dimension: 1, gate: 25, line: 4, color: 4, tone: 4, base: 2,
  degree: 25, minute: 59, second: 31, arc: 92, zodiac: 6, house: 5,
};

test('vertical boundary exposes four primary dimensions and emergent Space', () => {
  assert.deepEqual(PRIMARY_DIMENSION_ORDER, ['Movement', 'Evolution', 'Being', 'Design']);
  assert.equal(EMERGENT_DIMENSION, 'Space');
  assert.equal(CURRENT_DIMENSION_CANON.Movement.interrogative, 'When');
  assert.equal(CURRENT_DIMENSION_CANON.Movement.axTerm, 'Axiom');
  assert.equal(CURRENT_DIMENSION_CANON.Space.emergent, true);
});

test('Movement quality chain is preserved from the supplied canon', () => {
  assert.deepEqual(MOVEMENT_LEVELS, ['Energy', 'Creation', 'Seeing', 'Landscape', 'Environment']);
});

test('R21.22 state space remains the 64-locus substrate', () => {
  const movement = new MovementLayerAssembly();
  const snapshot = movement.snapshot();
  assert.equal(snapshot.stateSpace.codons, 64);
  assert.equal(snapshot.stateSpace.coordinateStates, 6987202560000000);
  assert.equal(snapshot.donorMovement.interrogativePreservedInVendor, 'What');
  assert.equal(snapshot.currentMovementCanon.interrogative, 'When');
  assert.match(SOURCE_CONFLICTS.interrogatives.resolution, /donor files remain unchanged/i);
});

test('Movement naming uses existing ContentGraph and preserves dependency order', () => {
  const movement = new MovementLayerAssembly();
  movement.name({ id: 'energy', text: 'Energy', gate: 1 });
  movement.name({ id: 'creation', text: 'Creation', gate: 1, dependsOn: ['energy'] });
  assert.deepEqual(movement.naming.dependenciesOf('creation').map((x) => x.id), ['energy']);
  assert.deepEqual(movement.naming.dependentsOf('energy').map((x) => x.id), ['creation']);
});

test('Movement measurement keeps local nested D/M/S/arc and round-trips', () => {
  const movement = new MovementLayerAssembly();
  const measured = movement.measure(baseAddress);
  assert.deepEqual(measured.nestedLocalCoordinate, { zodiac: 6, degree: 25, minute: 59, second: 31, arc: 92 });
  assert.deepEqual(movement.measurement.recover(measured.encodedIndex).address, measured.address);
});

test('Movement transport preserves identity through binary -> decimal -> hex', () => {
  const result = new MovementLayerAssembly().transportGate(25);
  assert.equal(result.identityPreserved, true);
  assert.equal(result.roundTripPreserved, true);
  assert.equal(result.gateIdentityPreserved, true);
  assert.deepEqual(result.path, ['binary', 'decimal', 'hex']);
});

test('one gate is simultaneously 3 bigrams + 2 trigrams + 1 hexagram', () => {
  const swarm = assemble321(25, { quality: 'Energy' });
  assert.equal(swarm.constituentLineCount, 6);
  assert.equal(swarm.structureCount, 6);
  assert.deepEqual(swarm.bigrams.map((x) => x.linePositions), [[1,2],[3,4],[5,6]]);
  assert.deepEqual(swarm.trigrams.map((x) => x.linePositions), [[1,2,3],[4,5,6]]);
  assert.deepEqual(swarm.hexagram.linePositions, [1,2,3,4,5,6]);
  assert.deepEqual(swarm.hexagram.bits, swarm.lineBits);
});

test('each Movement quality releases its own 3+2+1 swarm over same gate substrate', () => {
  const releases = new MovementLayerAssembly().emitAllLevels(25);
  assert.equal(releases.length, 5);
  assert.deepEqual(releases.map((x) => x.quality), MOVEMENT_LEVELS);
  assert.ok(releases.every((x) => x.lineBits.join('') === releases[0].lineBits.join('')));
});

test('connection reach is explicit and optional rather than guessed', () => {
  const movement = new MovementLayerAssembly({
    reach: {
      bigram: { meters: 1e-18, label: 'attometer-scale' },
      trigram: { meters: 1e-15, label: 'femtometer-scale' },
      hexagram: { meters: 1e-12, label: 'picometer-scale' },
    },
  });
  const swarm = movement.emit(25, 'Energy');
  assert.equal(swarm.bigrams[0].reach.meters, 1e-18);
  assert.equal(swarm.trigrams[0].reach.meters, 1e-15);
  assert.equal(swarm.hexagram.reach.meters, 1e-12);
});

test('Movement rule surface blocks transitions until evidence lands', () => {
  const movement = new MovementLayerAssembly({
    conditions: [{ id: 'path-open', actor: 'environment', satisfied: false }],
    actions: [{ id: 'move-forward', actor: 'agent', gate: 1, requires: ['path-open'] }],
  });
  assert.equal(movement.constraints.execute('move-forward', { evidence: { ok: true } }).status, 'blocked');
  movement.constraints.observeCondition('path-open', { observed: true });
  assert.equal(movement.constraints.execute('move-forward', { evidence: { ok: true } }).status, 'verified');
});
