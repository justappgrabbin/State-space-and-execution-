import SynthiaStateSpace from '../../movement/src/vendor/autopoietic/state-space-foundation.mjs';

import { DimensionalModelMaker, ARRIVAL_DIMENSIONS } from './model-maker.mjs';
import { seedToCondition, reduceConditionToPrimitives } from './seed-adapter.mjs';
import { oAutomaton, oBundle, oSequence } from './operators.mjs';
import { traceArrival } from './trace.mjs';

function makeAutomaton(dimension, condition, primitives) {
  const states = primitives.map((primitive, index) => Object.freeze({
    ...primitive,
    initial: index === 0,
    accepting: index === primitives.length - 1,
  }));

  const transitions = states.slice(0, -1).map((state, index) => Object.freeze({
    from: state.id,
    to: states[index + 1].id,
    relation: 'next-model-token',
    conditionId: condition.id,
    modelId: condition.payload.modelId,
    dimension,
  }));

  const base = oAutomaton({
    id: `dimension-automaton:${dimension}`,
    states,
    transitions,
  });

  return Object.freeze({
    ...base,
    dimension,
    modelId: condition.payload.modelId,
    conditionId: condition.id,
  });
}

export class MinimumArrivalSystem {
  constructor({ modelMaker = new DimensionalModelMaker() } = {}) {
    this.id = 'synthia-minimum-arrival-system-v0.1.0';
    this.modelMaker = modelMaker;
    this.stateSpace = new SynthiaStateSpace();
  }

  run({
    prompt = 'establish the first condition in the shared system',
    forceModels = false,
    modelEpochs = Number(process.env.SYNTHIA_MODEL_EPOCHS || 3),
  } = {}) {
    const models = this.modelMaker.createModels({
      force: forceModels,
      epochs: modelEpochs,
    });

    const dimensions = models.map(model => model.dimension);
    if (dimensions.some((dimension, index) => dimension !== ARRIVAL_DIMENSIONS[index])) {
      throw new Error('Model Maker returned the wrong dimensional identities/order');
    }

    const seeds = models.map(model => model.emitSeed(prompt));
    const conditions = seeds.map(seed => seedToCondition(this.stateSpace, seed));
    const primitiveGroups = conditions.map(
      condition => reduceConditionToPrimitives(this.stateSpace, condition)
    );

    // Put one primitive from every dimensional model into explicit shared contact.
    // This is an experimental relation in the existing ContentGraph, not a new
    // linguistic schema or a prewritten arrived structure.
    const representatives = primitiveGroups.map(group => group[0]);
    const interplayRelations = representatives.map((from, index) => {
      const to = representatives[(index + 1) % representatives.length];
      const linked = this.stateSpace.linkContent(from.id, to.id, 'dimension-contact');
      return Object.freeze({ from: from.id, to: to.id, relation: linked.relation });
    });

    const interplayEvent = this.stateSpace.recordEvent({
      dimension: null,
      scale: 'automaton',
      source: 'minimum-arrival-experiment',
      kind: 'swarm-interplay',
      payload: { relations: interplayRelations },
      evidence: { conditions: conditions.map(condition => condition.id) },
      activation: 0.75,
    });

    const automata = ARRIVAL_DIMENSIONS.map((dimension, index) =>
      makeAutomaton(dimension, conditions[index], primitiveGroups[index])
    );

    // Shared relational contact. o_bundle preserves every constituent identity.
    const swarm = oBundle(automata);

    // The exact members that entered the swarm are composed upward.
    // automaton -> mesh is the existing scale ladder's next step.
    const arrival = oSequence(swarm.members.map(entry => entry.member));

    if (arrival.scale !== 'mesh') {
      throw new Error(`cross-scale composition did not arrive at mesh scale: ${arrival.scale}`);
    }

    const arrivalEvent = this.stateSpace.recordEvent({
      dimension: null,
      scale: 'mesh',
      source: 'minimum-arrival-experiment',
      kind: 'system-arrival',
      payload: {
        arrivalId: arrival.id,
        operator: arrival.operator,
        swarmOperator: swarm.operator,
        interplayEventId: interplayEvent.id,
        interplayRelations,
        constituentAutomata: automata.map(automaton => automaton.id),
      },
      evidence: {
        modelConditions: conditions.map(condition => condition.id),
        dimensions: [...ARRIVAL_DIMENSIONS],
      },
      activation: 1,
    });

    const trace = traceArrival(arrival, { swarm, conditions });

    return Object.freeze({
      systemId: this.id,
      stateSpace: this.stateSpace,
      models,
      seeds,
      conditions,
      primitiveGroups,
      automata: Object.freeze(automata),
      interplayRelations: Object.freeze(interplayRelations),
      interplayEvent,
      swarm,
      arrival,
      arrivalEvent,
      trace,
    });
  }
}
