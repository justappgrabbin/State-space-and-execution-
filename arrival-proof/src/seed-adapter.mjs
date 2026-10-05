import {
  DIMENSION_ORDER,
  createDefaultAddress,
} from '../../movement/src/vendor/autopoietic/state-space-foundation.mjs';
import { ARRIVAL_DIMENSIONS } from './model-maker.mjs';

function fnv1a32(values) {
  let h = 0x811c9dc5;
  for (const value of values) {
    const n = Number(value) >>> 0;
    for (let shift = 0; shift < 32; shift += 8) {
      h ^= (n >>> shift) & 0xff;
      h = Math.imul(h, 0x01000193) >>> 0;
    }
  }
  return h >>> 0;
}

function gateForSeed(seed) {
  const hash = fnv1a32(seed.generatedTokenIds);
  return (hash % 64) + 1;
}

export function seedToCondition(stateSpace, seed) {
  if (!stateSpace?.recordEvent) throw new TypeError('SynthiaStateSpace required');
  if (!ARRIVAL_DIMENSIONS.includes(seed?.dimension)) {
    throw new RangeError(`seed has unknown dimension ${seed?.dimension}`);
  }
  if (!Array.isArray(seed.generatedTokenIds) || seed.generatedTokenIds.length === 0) {
    throw new TypeError('seed must contain real generatedTokenIds');
  }

  const dimensionIndex = DIMENSION_ORDER.indexOf(seed.dimension) + 1;
  const gate = gateForSeed(seed);
  const address = createDefaultAddress({
    dimension: dimensionIndex,
    gate,
  });

  return stateSpace.recordEvent({
    address,
    dimension: seed.dimension,
    scale: 'feature',
    source: 'local-dimensional-model-maker',
    kind: 'dimension-seed',
    payload: {
      modelId: seed.modelId,
      modelArtifact: seed.artifact,
      modelArtifactSha256: seed.artifactSha256,
      prompt: seed.prompt,
      generatedTokenIds: [...seed.generatedTokenIds],
      generatedProjection: seed.generatedProjection,
      samplingSeed: seed.samplingSeed,
    },
    evidence: {
      origin: 'local-model-generation',
      dimension: seed.dimension,
      modelId: seed.modelId,
    },
    activation: 0.35,
  });
}

export function reduceConditionToPrimitives(stateSpace, condition) {
  const tokenIds = condition?.payload?.generatedTokenIds;
  if (!Array.isArray(tokenIds) || tokenIds.length === 0) {
    throw new TypeError('condition has no generated model tokens to reduce');
  }

  return Object.freeze(tokenIds.map((tokenId, index) => {
    const primitive = stateSpace.addContent({
      id: `${condition.id}:token:${index}`,
      dimension: condition.dimension,
      gate: condition.gate,
      scale: 'feature',
      kind: 'model-token',
      value: Number(tokenId),
      position: index,
      modelId: condition.payload.modelId,
      originConditionId: condition.id,
      dependsOn: [],
    });
    return Object.freeze({
      ...primitive,
      origin: Object.freeze({
        conditionId: condition.id,
        modelId: condition.payload.modelId,
        dimension: condition.dimension,
      }),
    });
  }));
}
