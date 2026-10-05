import { ARRIVAL_DIMENSIONS } from './model-maker.mjs';

export function traceArrival(arrival, { swarm, conditions }) {
  if (arrival?.scale !== 'mesh') throw new Error('arrival is not a mesh-scale composition');

  const conditionById = new Map(conditions.map(condition => [condition.id, condition]));
  const automata = arrival.members.map(entry => entry.member);

  const primitives = [];
  const modelConditions = new Map();

  for (const automaton of automata) {
    for (const state of automaton.states || []) {
      const origin = state.origin;
      if (!origin?.conditionId) {
        throw new Error(`primitive ${state.id} lost condition provenance`);
      }
      const condition = conditionById.get(origin.conditionId);
      if (!condition) {
        throw new Error(`missing originating condition ${origin.conditionId}`);
      }

      primitives.push({
        primitiveId: state.id,
        value: state.value,
        automatonId: automaton.id,
        conditionId: origin.conditionId,
        modelId: origin.modelId,
        dimension: origin.dimension,
      });

      modelConditions.set(origin.dimension, {
        conditionId: condition.id,
        modelId: condition.payload.modelId,
        dimension: condition.dimension,
        generatedTokenIds: condition.payload.generatedTokenIds,
      });
    }
  }

  const reached = ARRIVAL_DIMENSIONS.filter(dimension => modelConditions.has(dimension));
  if (reached.length !== ARRIVAL_DIMENSIONS.length) {
    throw new Error(`arrival trace reached only ${reached.join(', ')}`);
  }

  return Object.freeze({
    arrival: Object.freeze({
      id: arrival.id,
      operator: arrival.operator,
      scale: arrival.scale,
    }),
    constituentAutomata: Object.freeze(automata.map(automaton => automaton.id)),
    swarm: Object.freeze({
      operator: swarm.operator,
      scale: swarm.scale,
      constituentAutomata: Object.freeze(
        swarm.members.map(entry => entry.member.id)
      ),
    }),
    primitives: Object.freeze(primitives),
    modelConditions: Object.freeze(
      ARRIVAL_DIMENSIONS.map(dimension => Object.freeze(modelConditions.get(dimension)))
    ),
  });
}
