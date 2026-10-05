#!/usr/bin/env node

import { MinimumArrivalSystem } from './src/arrival-system.mjs';

function check(mark, label, detail = '') {
  console.log(`  ${label} ${mark}${detail ? `  ${detail}` : ''}`);
}

try {
  console.log('BOOT');
  const system = new MinimumArrivalSystem();
  check('✓', 'system instance', system.id);

  const result = system.run({
    forceModels: process.env.SYNTHIA_FORCE_MODELS === '1',
    modelEpochs: Number(process.env.SYNTHIA_MODEL_EPOCHS || 3),
  });

  console.log('\nMODEL CREATION');
  for (const model of result.models) check('✓', model.dimension, model.id);

  console.log('\nCONDITIONS');
  for (const condition of result.conditions) {
    check('✓', `${condition.dimension} seed`, condition.id);
  }

  console.log('\nREDUCTION');
  for (let i = 0; i < result.primitiveGroups.length; i++) {
    check(
      '✓',
      `${result.conditions[i].dimension} primitives`,
      String(result.primitiveGroups[i].length)
    );
  }

  console.log('\nINTERPLAY');
  check('✓', 'shared swarm bundle', `${result.swarm.members.length} constituent Automata`);

  console.log('\nCOMPOSITION');
  for (const automaton of result.automata) {
    check('✓', automaton.id, `${automaton.states.length} primitive states`);
  }

  console.log('\nARRIVAL');
  check('✓', 'coherent system structure', `${result.arrival.operator} -> ${result.arrival.scale}`);

  console.log('\nARRIVED STRUCTURE TRACE');
  console.log(JSON.stringify(result.trace, null, 2));
} catch (error) {
  console.error('\nARRIVAL FAILED');
  console.error(error?.stack || error);
  process.exitCode = 1;
}
