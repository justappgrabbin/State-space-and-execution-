import { REAL_GATE_TABLE } from './real-gate-table.mjs';

const clone = (value) => globalThis.structuredClone ? structuredClone(value) : JSON.parse(JSON.stringify(value));
const clamp = (n, min = 0, max = 1) => Math.max(min, Math.min(max, Number(n) || 0));
const id = (prefix = 'evt') => `${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`}`;

export const DIMENSION_ORDER = Object.freeze(['Movement', 'Evolution', 'Being', 'Design', 'Space']);
export const SCALE_LADDER = Object.freeze(['feature','phoneme','grapheme','morpheme','word','phrase','clause','sentence','discourse','automaton','mesh']);

export const DIMENSIONS = Object.freeze({
  Movement: Object.freeze({
    index: 1, interrogative: 'What', keynote: 'I Define', sense: 'sight', senseName: 'Seeing',
    layerRole: 'knowledge', sequence: 'reverse', operation: 'transition',
    qualities: Object.freeze(['Energy','Creation','Seeing','Landscape','Environment']),
    process: Object.freeze(['wait','prepare','move','transition']),
  }),
  Evolution: Object.freeze({
    index: 2, interrogative: 'When', keynote: 'I Remember', sense: 'taste', senseName: 'Taste',
    layerRole: 'causal', sequence: 'mawangdui', chart: 'sidereal', operation: 'transform',
    qualities: Object.freeze(['Gravity','Memory','Taste','Love','Light']),
    process: Object.freeze(['retain','notice-change','adapt','transform']),
  }),
  Being: Object.freeze({
    index: 3, interrogative: 'Where', keynote: 'I Am', sense: 'touch', senseName: 'Touch',
    layerRole: 'state', sequence: 'fuxi', chart: 'tropical', operation: 'instantiate',
    qualities: Object.freeze(['Matter','Touch','Sex','Survival']),
    process: Object.freeze(['remain-self','notice-other','relate','negotiate-relation']),
  }),
  Design: Object.freeze({
    index: 4, interrogative: 'Why', keynote: 'I Design', sense: 'smell', senseName: 'Smell',
    layerRole: 'temporal', sequence: 'kingwen', chart: 'draconic', operation: 'structure',
    qualities: Object.freeze(['Structure','Progress','Smell','Life','Art']),
    process: Object.freeze(['sense','classify','build','test','mount']),
  }),
  Space: Object.freeze({
    index: 5, interrogative: 'Who', keynote: 'I Think', sense: 'hearing', senseName: 'Hearing',
    layerRole: 'dependency', sequence: 'complement', operation: 'integrate',
    qualities: Object.freeze(['Form','Illusion','Hearing','Music','Freedom']),
    process: Object.freeze(['witness','integrate','express','complete']),
  }),
});

export const SENSE_TO_DIMENSION = Object.freeze(Object.fromEntries(
  Object.entries(DIMENSIONS).map(([dimension, spec]) => [spec.sense, dimension])
));

export const AXES = Object.freeze([
  ['planetary', 1, 13], ['dimension', 1, 5], ['gate', 1, 64], ['line', 1, 6],
  ['color', 1, 6], ['tone', 1, 6], ['base', 1, 5], ['degree', 0, 29],
  ['minute', 0, 59], ['second', 0, 59], ['arc', 0, 99], ['zodiac', 1, 12], ['house', 1, 12],
]);

export const RESOLUTION_LEVELS = Object.freeze(['gate','line','color','tone','base','degree','minute','second','arc']);
export const SENTENCE_SLOTS = Object.freeze([
  'Dimension','Sign','Gate','Line','Planet','Color','Tone','Base','Center+Biology','House','Axis','YijingWrapper',
]);

export class Coordinate {
  constructor(values = {}) {
    for (const [name, lo, hi] of AXES) {
      const value = Number(values[name]);
      if (!Number.isInteger(value) || value < lo || value > hi) throw new RangeError(`${name} must be ${lo}..${hi}`);
      this[name] = value;
    }
    Object.freeze(this);
  }
  toJSON() { return Object.fromEntries(AXES.map(([name]) => [name, this[name]])); }
  get dimensionName() { return DIMENSION_ORDER[this.dimension - 1]; }
}

export class CoordinateSpace {
  size() { return AXES.reduce((n, [, lo, hi]) => n * (hi - lo + 1), 1); }
  encode(input) {
    const c = input instanceof Coordinate ? input : new Coordinate(input);
    return AXES.reduce((index, [name, lo, hi]) => index * (hi - lo + 1) + (c[name] - lo), 0);
  }
  decode(input) {
    let index = Number(input);
    if (!Number.isSafeInteger(index) || index < 0 || index >= this.size()) throw new RangeError('state index out of range');
    const values = {};
    for (const [name, lo, hi] of [...AXES].reverse()) {
      const width = hi - lo + 1;
      values[name] = (index % width) + lo;
      index = Math.floor(index / width);
    }
    return new Coordinate(values);
  }
  traverse(input, axis, steps = 1) {
    const c = input instanceof Coordinate ? input : new Coordinate(input);
    const spec = AXES.find(([name]) => name === axis);
    if (!spec) throw new RangeError(`unknown axis: ${axis}`);
    const [, lo, hi] = spec;
    const values = c.toJSON();
    const width = hi - lo + 1;
    values[axis] = lo + ((((values[axis] - lo + Number(steps)) % width) + width) % width);
    return new Coordinate(values);
  }
}

const gateByNumber = new Map(REAL_GATE_TABLE.map((g) => [g.gate, g]));
const bitsKey = (bits) => bits.join('');
const gateByBits = new Map(REAL_GATE_TABLE.map((g) => [bitsKey(g.binary), g.gate]));

export const GateMath = Object.freeze({
  bits(gate) {
    const row = gateByNumber.get(Number(gate));
    if (!row) throw new RangeError('gate must be 1..64');
    return [...row.binary];
  },
  fromBits(bits) {
    if (!Array.isArray(bits) || bits.length !== 6 || bits.some((b) => b !== 0 && b !== 1)) throw new TypeError('six 0/1 bits required');
    return gateByBits.get(bitsKey(bits)) ?? null;
  },
  reverse(gate) { return this.fromBits(this.bits(gate).reverse()); },
  inverse(gate) { return this.fromBits(this.bits(gate).map((b) => b ^ 1)); },
  converse(gate) {
    const b = this.bits(gate); return this.fromBits([...b.slice(3), ...b.slice(0, 3)]);
  },
  nuclear(gate) {
    const b = this.bits(gate);
    return this.fromBits([b[1], b[2], b[3], b[2], b[3], b[4]]);
  },
  change(gate, lines = []) {
    const b = this.bits(gate);
    for (const line of lines) {
      const i = Number(line) - 1;
      if (!Number.isInteger(i) || i < 0 || i > 5) throw new RangeError('changing line must be 1..6');
      b[i] ^= 1;
    }
    return this.fromBits(b);
  },
});

export function applyCastTransition(values) {
  if (!Array.isArray(values) || values.length !== 6 || values.some((v) => ![6,7,8,9].includes(Number(v)))) {
    throw new TypeError('cast requires six values from {6,7,8,9}, bottom line first');
  }
  const originalValues = values.map(Number);
  const originalBits = originalValues.map((v) => (v === 7 || v === 9 ? 1 : 0));
  const changingLines = [];
  const resultValues = originalValues.map((v, i) => {
    if (v === 6) { changingLines.push(i + 1); return 7; }
    if (v === 9) { changingLines.push(i + 1); return 8; }
    return v;
  });
  const resultBits = resultValues.map((v) => (v === 7 || v === 9 ? 1 : 0));
  const intermediates = [];
  let walking = [...originalBits];
  for (const line of changingLines) {
    walking[line - 1] ^= 1;
    intermediates.push({ line, bits: [...walking], gate: GateMath.fromBits(walking) });
  }
  return {
    originalValues, resultValues, changingLines,
    originalBits, resultBits,
    originalGate: GateMath.fromBits(originalBits), resultGate: GateMath.fromBits(resultBits),
    intermediates,
  };
}

function emptyTransition(level) {
  return { level, stateA: null, stability: null, stabilityBasis: null, operator: null, stateC: null, context: null, source: null };
}

function createDimensionState(dimension, saved = null) {
  const spec = DIMENSIONS[dimension];
  return {
    dimension,
    interrogative: spec.interrogative,
    keynote: spec.keynote,
    sense: spec.sense,
    qualities: [...spec.qualities],
    process: [...spec.process],
    activation: Number(saved?.activation || 0),
    pressure: Number(saved?.pressure || 0),
    stability: saved?.stability ?? null,
    choice: saved?.choice || spec.process[0],
    evidence: Array.isArray(saved?.evidence) ? saved.evidence.slice(-64) : [],
    contentIds: Array.isArray(saved?.contentIds) ? [...saved.contentIds] : [],
    eventRefs: Array.isArray(saved?.eventRefs) ? saved.eventRefs.slice(-128) : [],
    sentenceRefs: Array.isArray(saved?.sentenceRefs) ? saved.sentenceRefs.slice(-64) : [],
    updatedAt: saved?.updatedAt || null,
  };
}

export class CodonLocus {
  constructor(gate, saved = null) {
    const structural = gateByNumber.get(Number(gate));
    if (!structural) throw new RangeError('gate must be 1..64');
    this.gate = structural.gate;
    this.binary = [...structural.binary];
    this.trigrams = clone(structural.trigrams);
    this.dimensions = Object.fromEntries(DIMENSION_ORDER.map((d) => [d, createDimensionState(d, saved?.dimensions?.[d])]));
    this.sharedLedger = Array.isArray(saved?.sharedLedger) ? saved.sharedLedger.slice(-256) : [];
    this.relations = Array.isArray(saved?.relations) ? saved.relations.slice(-128) : [];
    this.transitions = Object.fromEntries(RESOLUTION_LEVELS.map((level) => [level, saved?.transitions?.[level] || emptyTransition(level)]));
  }
  record(event) {
    this.sharedLedger.push(event.id);
    if (this.sharedLedger.length > 256) this.sharedLedger.shift();
    for (const d of DIMENSION_ORDER) {
      const cell = this.dimensions[d];
      cell.eventRefs.push(event.id);
      if (cell.eventRefs.length > 128) cell.eventRefs.shift();
    }
    if (event.dimension && this.dimensions[event.dimension]) {
      const cell = this.dimensions[event.dimension];
      cell.activation = clamp(Math.max(cell.activation * 0.92, Number(event.activation ?? 0.35)));
      cell.pressure = clamp(Number(event.pressure ?? cell.pressure));
      cell.evidence.push({ eventId: event.id, source: event.source, kind: event.kind, at: event.timestamp });
      if (cell.evidence.length > 64) cell.evidence.shift();
      cell.updatedAt = event.timestamp;
    }
  }
  serialize() {
    return clone({ gate: this.gate, dimensions: this.dimensions, sharedLedger: this.sharedLedger, relations: this.relations, transitions: this.transitions });
  }
}

export class ContentGraph {
  constructor() { this.items = new Map(); this.inbound = new Map(); }
  add(item) {
    if (!item?.id) throw new TypeError('content id required');
    if (this.items.has(item.id)) throw new Error(`content '${item.id}' already exists`);
    if (!DIMENSIONS[item.dimension]) throw new RangeError(`unknown dimension '${item.dimension}'`);
    if (!Number.isInteger(Number(item.gate)) || Number(item.gate) < 1 || Number(item.gate) > 64) throw new RangeError('content gate 1..64 required');
    if (item.scale && !SCALE_LADDER.includes(item.scale)) throw new RangeError(`unknown scale '${item.scale}'`);
    const deps = [...(item.dependsOn || [])];
    for (const dep of deps) if (!this.items.has(dep)) throw new Error(`dependency '${dep}' does not exist`);
    const row = Object.freeze({ ...clone(item), gate: Number(item.gate), dependsOn: deps, scale: item.scale || 'word' });
    this.items.set(row.id, row);
    for (const dep of deps) {
      if (!this.inbound.has(dep)) this.inbound.set(dep, new Set());
      this.inbound.get(dep).add(row.id);
    }
    return clone(row);
  }
  link(fromId, toId, relation = 'depends-on') {
    const from = this.items.get(fromId), to = this.items.get(toId);
    if (!from || !to) throw new Error('both content ids must exist');
    const deps = [...new Set([...(from.dependsOn || []), toId])];
    const next = Object.freeze({ ...from, dependsOn: deps, relation });
    this.items.set(fromId, next);
    if (!this.inbound.has(toId)) this.inbound.set(toId, new Set());
    this.inbound.get(toId).add(fromId);
    return clone(next);
  }
  get(id) { const x = this.items.get(id); return x ? clone(x) : null; }
  dependentsOf(id) { return [...(this.inbound.get(id) || [])].map((x) => this.get(x)); }
  dependenciesOf(id) { const x = this.items.get(id); return x ? x.dependsOn.map((d) => this.get(d)) : []; }
  snapshot() { return [...this.items.values()].map(clone); }
}

export class SensingEngine {
  constructor(stateSpace) { this.stateSpace = stateSpace; }
  ingest(perception, { gate = null, address = null, source = 'sensory-adapter' } = {}) {
    const events = [];
    for (const modality of ['sight','taste','touch','smell','hearing']) {
      if (perception?.[modality] == null) continue;
      const dimension = SENSE_TO_DIMENSION[modality];
      const payload = clone(perception[modality]);
      events.push(this.stateSpace.recordEvent({
        gate, address, dimension, source,
        kind: `sense:${modality}`,
        payload,
        activation: modality === 'sight' && payload?.objects ? clamp(0.25 + payload.objects.length / 20) : 0.35,
      }));
    }
    return events;
  }
}

export class SentenceEngine {
  constructor(stateSpace) { this.stateSpace = stateSpace; this.externalGenerator = null; }
  attachGenerator(generator) {
    if (typeof generator !== 'function') throw new TypeError('sentence generator must be a function');
    this.externalGenerator = generator;
  }
  frame(address, extra = {}) {
    const c = address instanceof Coordinate ? address : new Coordinate(address);
    const dimension = c.dimensionName;
    return {
      slots: {
        Dimension: dimension,
        Sign: extra.sign || `Zodiac-${c.zodiac}`,
        Gate: extra.gateName || `Gate-${c.gate}`,
        Line: c.line,
        Planet: extra.planetName || `Planet-${c.planetary}`,
        Color: c.color,
        Tone: c.tone,
        Base: c.base,
        'Center+Biology': extra.centerBiology || null,
        House: c.house,
        Axis: extra.axis || `arc-${c.arc}`,
        YijingWrapper: extra.wrapper || null,
      },
      address: c.toJSON(),
      dimension,
      keynote: DIMENSIONS[dimension].keynote,
    };
  }
  generate(address, extra = {}) {
    const frame = this.frame(address, extra);
    const s = frame.slots;
    const generated = this.externalGenerator ? this.externalGenerator(frame.address, { frame, ...extra }) : null;
    const text = generated == null ? `${frame.keynote}: ${s.Gate} line ${s.Line}, color ${s.Color}, tone ${s.Tone}, base ${s.Base}; ${s.Planet} in ${s.Sign}, house ${s.House}.` : (typeof generated === 'string' ? generated : String(generated.text ?? generated.output ?? generated));
    const record = { id: id('sentence'), text, frame, engine: this.externalGenerator ? 'attached-generator' : 'foundation', generatedAt: Date.now() };
    this.stateSpace.sentences.set(record.id, record);
    const locus = this.stateSpace.codons.get(frame.address.gate);
    locus.dimensions[frame.dimension].sentenceRefs.push(record.id);
    return clone(record);
  }
}

export class SynthiaStateSpace {
  constructor({ saved = null } = {}) {
    this.coordinates = new CoordinateSpace();
    this.codons = new Map(Array.from({ length: 64 }, (_, i) => {
      const gate = i + 1;
      const prior = saved?.codons?.find?.((x) => x.gate === gate) || null;
      return [gate, new CodonLocus(gate, prior)];
    }));
    this.events = new Map();
    this.fieldEvents = [];
    this.sentences = new Map();
    this.content = new ContentGraph();
    this.sensing = new SensingEngine(this);
    this.sentence = new SentenceEngine(this);
    for (const row of saved?.content || []) this.content.add(row);
    for (const event of saved?.events || []) this.events.set(event.id, event);
    for (const sentence of saved?.sentences || []) this.sentences.set(sentence.id, sentence);
  }

  codon(gate) {
    const locus = this.codons.get(Number(gate));
    if (!locus) throw new RangeError('gate must be 1..64');
    return locus;
  }

  cell(gate, dimension) {
    const locus = this.codon(gate);
    if (!DIMENSIONS[dimension]) throw new RangeError(`unknown dimension '${dimension}'`);
    return clone(locus.dimensions[dimension]);
  }

  recordEvent({ gate = null, address = null, dimension = null, scale = 'feature', source = 'state-space', kind = 'observation', payload = null, evidence = null, activation = 0.35, pressure = null, causedBy = null } = {}) {
    if (dimension && !DIMENSIONS[dimension]) throw new RangeError(`unknown dimension '${dimension}'`);
    if (!SCALE_LADDER.includes(scale)) throw new RangeError(`unknown scale '${scale}'`);
    let coordinate = null;
    if (address) {
      coordinate = address instanceof Coordinate ? address : new Coordinate(address);
      gate = coordinate.gate;
      dimension = dimension || coordinate.dimensionName;
    }
    const event = Object.freeze({
      id: id('event'), gate: gate == null ? null : Number(gate), dimension, scale, source, kind,
      address: coordinate?.toJSON() || null, payload: clone(payload), evidence: clone(evidence),
      activation: clamp(activation), pressure: pressure == null ? null : clamp(pressure), causedBy,
      timestamp: Date.now(),
    });
    this.events.set(event.id, event);
    if (event.gate == null) {
      this.fieldEvents.push(event.id);
    } else {
      this.codon(event.gate).record(event);
    }
    return clone(event);
  }

  addContent(item) {
    const row = this.content.add(item);
    const cell = this.codon(row.gate).dimensions[row.dimension];
    cell.contentIds.push(row.id);
    return row;
  }

  linkContent(fromId, toId, relation = 'depends-on') { return this.content.link(fromId, toId, relation); }

  project(gate, fromDimension, toDimension) {
    const locus = this.codon(gate);
    if (!DIMENSIONS[fromDimension] || !DIMENSIONS[toDimension]) throw new RangeError('known source/target dimensions required');
    return {
      gate: locus.gate,
      identityPreserved: true,
      from: clone(locus.dimensions[fromDimension]),
      to: clone(locus.dimensions[toDimension]),
      transition: `T_${fromDimension}->${toDimension}`,
      sharedLedger: [...locus.sharedLedger],
    };
  }

  setTransition(gate, level, patch) {
    const locus = this.codon(gate);
    if (!RESOLUTION_LEVELS.includes(level)) throw new RangeError(`unknown resolution level '${level}'`);
    locus.transitions[level] = { ...locus.transitions[level], ...clone(patch), level };
    return clone(locus.transitions[level]);
  }

  applyCast(values, { dimension = 'Evolution', source = 'state-transition-module' } = {}) {
    const tx = applyCastTransition(values);
    if (tx.originalGate) {
      this.setTransition(tx.originalGate, 'line', {
        stateA: tx.originalValues,
        stability: tx.changingLines.length ? 'mixed/unstable-lines-present' : 'stable',
        stabilityBasis: '6 and 9 change; 7 and 8 pass unchanged',
        operator: '6->7; 9->8',
        stateC: tx.resultValues,
        context: { changingLines: tx.changingLines },
        source,
      });
      this.recordEvent({ gate: tx.originalGate, dimension, scale: 'automaton', source, kind: 'line-transition', payload: tx, activation: tx.changingLines.length ? 0.8 : 0.25 });
    }
    return tx;
  }

  operator(name, gate, options = {}) {
    const g = Number(gate);
    switch (name) {
      case 'mirror': case 'reverse': return GateMath.reverse(g);
      case 'shadow': case 'inverse': return GateMath.inverse(g);
      case 'rotation': case 'converse': return GateMath.converse(g);
      case 'core': case 'nuclear': return GateMath.nuclear(g);
      case 'becoming': case 'change': return GateMath.change(g, options.lines || []);
      default: throw new RangeError(`unknown gate operator '${name}'`);
    }
  }

  snapshot() {
    return {
      version: 'Synthia-StateSpace-Foundation-v1',
      dimensions: clone(DIMENSIONS),
      codons: [...this.codons.values()].map((c) => c.serialize()),
      content: this.content.snapshot(),
      events: [...this.events.values()].map(clone),
      fieldEvents: [...this.fieldEvents],
      sentences: [...this.sentences.values()].map(clone),
    };
  }
}

export function createDefaultAddress(overrides = {}) {
  return new Coordinate({
    planetary: 1, dimension: 1, gate: 1, line: 1, color: 1, tone: 1, base: 1,
    degree: 0, minute: 0, second: 0, arc: 0, zodiac: 1, house: 1,
    ...overrides,
  });
}

export default SynthiaStateSpace;
