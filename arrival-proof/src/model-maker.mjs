import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  DIMENSIONS,
} from '../../movement/src/vendor/autopoietic/state-space-foundation.mjs';

export const ARRIVAL_DIMENSIONS = Object.freeze(['Movement', 'Evolution', 'Being', 'Design']);

const HERE = dirname(fileURLToPath(import.meta.url));
const ARRIVAL_ROOT = resolve(HERE, '..');
const DEFAULT_MODEL_ROOT = resolve(ARRIVAL_ROOT, '.local-models');

function assertExactDimensions(values) {
  const got = [...values];
  if (got.length !== ARRIVAL_DIMENSIONS.length ||
      got.some((value, index) => value !== ARRIVAL_DIMENSIONS[index])) {
    throw new Error(
      `expected exact dimensional order ${ARRIVAL_DIMENSIONS.join(', ')}, got ${got.join(', ')}`
    );
  }
}

function corpusFromCanonicalDimensions() {
  const corpus = {};
  for (const dimension of ARRIVAL_DIMENSIONS) {
    const spec = DIMENSIONS[dimension];
    if (!spec) throw new Error(`canonical state-space has no dimension ${dimension}`);
    corpus[dimension] = [
      `${dimension}. ${spec.keynote}. ${spec.interrogative}.`,
      `${dimension} qualities: ${spec.qualities.join(' -> ')}.`,
      `${dimension} process: ${spec.process.join(' -> ')}.`,
      `${dimension} sense: ${spec.senseName || spec.sense}.`,
      `${dimension} operation: ${spec.operation}.`,
    ];
  }
  return corpus;
}

function runLocalPython(python, script, args) {
  const run = spawnSync(python, [script, ...args], {
    cwd: ARRIVAL_ROOT,
    encoding: 'utf8',
    windowsHide: true,
    env: {
      ...process.env,
      PYTHONUNBUFFERED: '1',
    },
  });

  if (run.error) {
    throw new Error(`local model runtime failed to start: ${run.error.message}`);
  }
  if (run.status !== 0) {
    throw new Error(
      `local model runtime failed (exit ${run.status})\n${run.stderr || run.stdout || ''}`
    );
  }
  return String(run.stdout || '').trim();
}

export class LocalDimensionalModel {
  constructor({ dimension, manifestPath, python = 'python3' }) {
    if (!ARRIVAL_DIMENSIONS.includes(dimension)) {
      throw new RangeError(`unknown arrival dimension ${dimension}`);
    }
    this.dimension = dimension;
    this.id = `synthia-dimension:${dimension}`;
    this.manifestPath = resolve(manifestPath);
    this.python = python;
    Object.freeze(this);
  }

  emitSeed(prompt, { maxNew = 12, temperature = 0.8, topK = 40 } = {}) {
    const script = resolve(ARRIVAL_ROOT, 'model-maker', 'emit_seed.py');
    const stdout = runLocalPython(this.python, script, [
      '--manifest', this.manifestPath,
      '--dimension', this.dimension,
      '--prompt', String(prompt),
      '--max-new', String(maxNew),
      '--temperature', String(temperature),
      '--top-k', String(topK),
    ]);

    let seed;
    try {
      seed = JSON.parse(stdout);
    } catch {
      throw new Error(`${this.id} emitted non-JSON output; refusing untraceable seed`);
    }

    if (seed.modelId !== this.id || seed.dimension !== this.dimension) {
      throw new Error(`${this.id} seed lost model/dimensional identity`);
    }
    if (!Array.isArray(seed.generatedTokenIds) || seed.generatedTokenIds.length === 0) {
      throw new Error(`${this.id} emitted no generated tokens`);
    }
    return Object.freeze(seed);
  }
}

export class DimensionalModelMaker {
  constructor({
    python = process.env.SYNTHIA_LOCAL_PYTHON || 'python3',
    modelRoot = process.env.SYNTHIA_LOCAL_MODEL_ROOT || DEFAULT_MODEL_ROOT,
  } = {}) {
    this.python = python;
    this.modelRoot = resolve(modelRoot);
    this.manifestPath = resolve(this.modelRoot, 'manifest.json');
    this.corpusPath = resolve(this.modelRoot, 'dimension-corpus.json');
  }

  createModels({
    force = false,
    epochs = Number(process.env.SYNTHIA_MODEL_EPOCHS || 8),
    seed = Number(process.env.SYNTHIA_MODEL_SEED || 1729),
  } = {}) {
    mkdirSync(this.modelRoot, { recursive: true });

    const corpus = corpusFromCanonicalDimensions();
    writeFileSync(this.corpusPath, JSON.stringify(corpus, null, 2));

    if (force || !existsSync(this.manifestPath)) {
      const builder = resolve(ARRIVAL_ROOT, 'model-maker', 'build_dimensions.py');
      runLocalPython(this.python, builder, [
        '--corpus', this.corpusPath,
        '--out', this.modelRoot,
        '--epochs', String(Math.max(1, epochs)),
        '--seed', String(seed),
      ]);
    }

    if (!existsSync(this.manifestPath)) {
      throw new Error('Model Maker completed without a local manifest; refusing to fabricate models');
    }

    const manifest = JSON.parse(readFileSync(this.manifestPath, 'utf8'));
    assertExactDimensions(manifest.dimensions || []);

    for (const row of manifest.models || []) {
      const artifact = resolve(this.modelRoot, row.artifact);
      if (!existsSync(artifact)) {
        throw new Error(`missing local model artifact for ${row.dimension}: ${artifact}`);
      }
    }

    const models = ARRIVAL_DIMENSIONS.map(
      dimension => new LocalDimensionalModel({
        dimension,
        manifestPath: this.manifestPath,
        python: this.python,
      })
    );

    assertExactDimensions(models.map(model => model.dimension));
    return Object.freeze(models);
  }
}
