import {
  SCALE_LADDER,
} from '../../movement/src/vendor/autopoietic/state-space-foundation.mjs';

/*
 * Minimum recovered Pure Synthia composition semantics.
 * Source semantics: o_bundle, o_sequence, o_automaton from the supplied
 * Pure Synthia state-space/operator package. Kept deliberately small.
 */

const asList = operands => Array.isArray(operands) ? operands : [operands];

export function promoteScale(scale) {
  const index = SCALE_LADDER.indexOf(scale);
  return index < 0
    ? 'mesh'
    : SCALE_LADDER[Math.min(index + 1, SCALE_LADDER.length - 1)];
}

function commonScale(members) {
  const scales = new Set(members.map(member => member?.scale).filter(Boolean));
  return scales.size === 1 ? [...scales][0] : null;
}

export function oBundle(operands) {
  const members = asList(operands).map((member, slot) => Object.freeze({ slot, member }));
  return Object.freeze({
    kind: 'bundle',
    operator: 'o_bundle',
    scale: commonScale(members.map(entry => entry.member)) || 'mixed',
    unordered: true,
    invariants: Object.freeze(['constituent-identity-preserved', 'order-insensitive']),
    members: Object.freeze(members),
  });
}

export function oSequence(operands) {
  const members = asList(operands);
  const base = commonScale(members);
  return Object.freeze({
    kind: 'sequence',
    operator: 'o_sequence',
    id: `composite_${members.length}`,
    positional: true,
    scale: base ? promoteScale(base) : 'mixed',
    invariants: Object.freeze(['order-sensitive', 'length-preserving']),
    members: Object.freeze(
      members.map((member, position) => Object.freeze({ position, member }))
    ),
  });
}

export function oAutomaton(descriptor) {
  const desc = descriptor?.states ? descriptor : { states: asList(descriptor), transitions: [] };
  const states = [...(desc.states || [])];
  const q0 = (states.find(state => state?.initial) || states[0] || {}).id ?? null;
  const finals = states.filter(state => state?.accepting).map(state => state.id);

  return Object.freeze({
    kind: 'automaton',
    operator: 'o_automaton',
    scale: 'automaton',
    id: desc.id || `automaton_${states.length}`,
    states: Object.freeze(states),
    transitions: Object.freeze([...(desc.transitions || [])]),
    q0,
    finals: Object.freeze(finals),
    invariants: Object.freeze([
      'q0-is-first-state-unless-marked-initial',
      'finals-are-accepting-states',
    ]),
  });
}
