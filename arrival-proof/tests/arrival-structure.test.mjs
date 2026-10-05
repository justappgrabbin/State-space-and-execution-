import test from 'node:test';
import assert from 'node:assert/strict';

import SynthiaStateSpace from '../../movement/src/vendor/autopoietic/state-space-foundation.mjs';
import { ARRIVAL_DIMENSIONS } from '../src/model-maker.mjs';
import { seedToCondition, reduceConditionToPrimitives } from '../src/seed-adapter.mjs';
import { oAutomaton, oBundle, oSequence } from '../src/operators.mjs';
import { traceArrival } from '../src/trace.mjs';

function fixtureSeed(dimension, index) {
  return {
    modelId: `synthia-dimension:${dimension}`,
    dimension,
    artifact: `${dimension.toLowerCase()}.pt`,
    artifactSha256: `fixture-${index}`,
    prompt: 'test-only adapter fixture',
    generatedTokenIds: [65 + index, 97 + index, 33 + index],
    generatedProjection: 'fixture',
    samplingSeed: 100 + index,
  };
}

test('adapter keeps four dimensional conditions in one shared state space', () => {
  const stateSpace = new SynthiaStateSpace();
  const conditions = ARRIVAL_DIMENSIONS.map((dimension, index) =>
    seedToCondition(stateSpace, fixtureSeed(dimension, index))
  );

  assert.equal(conditions.length, 4);
  assert.deepEqual(conditions.map(x => x.dimension), ARRIVAL_DIMENSIONS);
  assert.ok(conditions.every(x => stateSpace.events.has(x.id)));
});

test('primitive reduction comes from emitted token ids and keeps origin', () => {
  const stateSpace = new SynthiaStateSpace();
  const condition = seedToCondition(stateSpace, fixtureSeed('Movement', 0));
  const primitives = reduceConditionToPrimitives(stateSpace, condition);

  assert.deepEqual(primitives.map(x => x.value), [65, 97, 33]);
  assert.ok(primitives.every(x => x.origin.conditionId === condition.id));
  assert.ok(primitives.every(x => x.origin.modelId === 'synthia-dimension:Movement'));
});

test('four automata compose upward to mesh while preserving trace to four conditions', () => {
  const stateSpace = new SynthiaStateSpace();
  const conditions = ARRIVAL_DIMENSIONS.map((dimension, index) =>
    seedToCondition(stateSpace, fixtureSeed(dimension, index))
  );

  const automata = conditions.map((condition, index) => {
    const primitives = reduceConditionToPrimitives(stateSpace, condition);
    const states = primitives.map((primitive, i) => ({
      ...primitive,
      initial: i === 0,
      accepting: i === primitives.length - 1,
    }));
    return Object.freeze({
      ...oAutomaton({
        id: `test-automaton:${ARRIVAL_DIMENSIONS[index]}`,
        states,
        transitions: [],
      }),
      dimension: ARRIVAL_DIMENSIONS[index],
      conditionId: condition.id,
    });
  });

  const swarm = oBundle(automata);
  const arrival = oSequence(swarm.members.map(entry => entry.member));

  assert.equal(swarm.members.length, 4);
  assert.equal(arrival.scale, 'mesh');

  const trace = traceArrival(arrival, { swarm, conditions });
  assert.deepEqual(trace.modelConditions.map(x => x.dimension), ARRIVAL_DIMENSIONS);
});

/*
 * These are structural tests only.
 * The acceptance experiment is `npm run arrival`, which invokes the real local
 * Model Maker and fails if the local model runtime cannot create/generate models.
 */
