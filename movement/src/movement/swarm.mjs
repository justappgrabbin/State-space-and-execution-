import { GateMath } from '../vendor/autopoietic/state-space-foundation.mjs';
import { activationSignature } from '../vendor/swarm/activation.mjs';
import { MOVEMENT_LEVELS } from './canon.mjs';

const freeze = value => Object.freeze(value);

function normalizeReach(reach) {
  if (reach == null) return null;
  if (typeof reach === 'number') {
    if (!Number.isFinite(reach) || reach < 0) throw new RangeError('reach in meters must be a finite non-negative number');
    return freeze({ meters: reach, label: null });
  }
  const meters = Number(reach.meters);
  if (!Number.isFinite(meters) || meters < 0) throw new RangeError('reach.meters must be a finite non-negative number');
  return freeze({ meters, label: reach.label == null ? null : String(reach.label) });
}

function formReach(reach, form, index) {
  if (!reach) return null;
  if (typeof reach === 'function') return normalizeReach(reach({ form, index }));
  if (reach[form] == null) return null;
  if (Array.isArray(reach[form])) return normalizeReach(reach[form][index] ?? null);
  return normalizeReach(reach[form]);
}

/**
 * Assemble the same six line positions simultaneously as:
 *   3 bigrams  [1,2] [3,4] [5,6]
 *   2 trigrams [1,2,3] [4,5,6]
 *   1 hexagram [1,2,3,4,5,6]
 *
 * This is an assembly of the existing line/bigram/trigram/hexagram fragment
 * taxonomy over the existing six-line Gate topology. No duplicate line state
 * is created; every relation points back to the same six positions.
 */
export function assemble321(gate, { dimension = 'Movement', quality = 'Energy', reach = null } = {}) {
  const bits = freeze(GateMath.bits(Number(gate)));
  const make = (form, index, positions) => freeze({
    id: `${dimension}:G${gate}:${quality}:${form}:${index + 1}`,
    dimension,
    quality,
    form,
    index: index + 1,
    linePositions: freeze([...positions]),
    bits: freeze(positions.map((position) => bits[position - 1])),
    reach: formReach(reach, form, index),
  });

  const bigrams = freeze([
    make('bigram', 0, [1, 2]),
    make('bigram', 1, [3, 4]),
    make('bigram', 2, [5, 6]),
  ]);
  const trigrams = freeze([
    make('trigram', 0, [1, 2, 3]),
    make('trigram', 1, [4, 5, 6]),
  ]);
  const hexagram = make('hexagram', 0, [1, 2, 3, 4, 5, 6]);

  return freeze({
    dimension,
    quality,
    gate: Number(gate),
    lineBits: bits,
    topology: '3-bigrams + 2-trigrams + 1-hexagram over the same six line positions',
    bigrams,
    trigrams,
    hexagram,
    structureCount: 6,
    constituentLineCount: 6,
    activationVocabulary: freeze({
      bigram: activationSignature('bigram', [1]),
      trigram: activationSignature('trigram', [1, 2]),
      hexagram: activationSignature('hexagram', [1, 2, 3, 4, 5]),
    }),
  });
}

export class MovementSwarmOutlet {
  constructor({ reach = null } = {}) {
    this.reach = reach;
  }

  emit(gate, quality, options = {}) {
    if (!MOVEMENT_LEVELS.includes(quality)) throw new RangeError(`unknown Movement quality: ${quality}`);
    return assemble321(gate, { dimension: 'Movement', quality, reach: options.reach ?? this.reach });
  }

  emitAllLevels(gate, options = {}) {
    return freeze(MOVEMENT_LEVELS.map((quality) => this.emit(gate, quality, options)));
  }
}
