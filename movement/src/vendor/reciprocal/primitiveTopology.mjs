/**
 * Binary-generative topology for the living RPG substrate.
 *
 * Four primitives are represented by the 2-bit square. Space is NOT a fifth
 * primitive; it is a relational projection produced from the four primitive
 * conditions and their current relations.
 *
 * The second binary axis is deliberately left semantically unnamed. The map is
 * configurable so later source-backed work can change the permutation without
 * rewriting the life engine.
 */
export const PRIMITIVES = Object.freeze(["Movement", "Evolution", "Being", "Design"]);
export const SPACE = "Space";

export const DEFAULT_BINARY_MAP = Object.freeze({
  "00": "Movement",
  "01": "Evolution",
  "10": "Being",
  "11": "Design",
});

const clamp01 = n => Math.max(0, Math.min(1, Number(n) || 0));
const clone = value => structuredClone(value);

export function validateBinaryMap(map = DEFAULT_BINARY_MAP) {
  const keys = ["00", "01", "10", "11"];
  if (!map || typeof map !== "object") throw new TypeError("binary map must be an object");
  const values = keys.map(key => map[key]);
  if (values.some(value => !PRIMITIVES.includes(value))) throw new RangeError("binary map must assign each 2-bit state to a primitive");
  if (new Set(values).size !== 4) throw new RangeError("binary map must be a bijection over the four primitives");
  return Object.freeze(Object.fromEntries(keys.map(key => [key, map[key]])));
}

export function primitiveForBits(bits, map = DEFAULT_BINARY_MAP) {
  const normalized = String(bits).padStart(2, "0").slice(-2);
  if (!/^[01]{2}$/.test(normalized)) throw new TypeError("primitive bits must be a 2-bit binary string");
  return validateBinaryMap(map)[normalized];
}

export function bitsForPrimitive(primitive, map = DEFAULT_BINARY_MAP) {
  const valid = validateBinaryMap(map);
  const found = Object.entries(valid).find(([, value]) => value === primitive);
  if (!found) throw new RangeError(`unknown primitive: ${primitive}`);
  return found[0];
}

export function transitionBits(gate) {
  const number = Number(gate);
  if (!Number.isInteger(number) || number < 1 || number > 64) throw new RangeError("gate must be 1..64");
  return (number - 1).toString(2).padStart(6, "0");
}

export function transitionGate(bits) {
  const normalized = String(bits);
  if (!/^[01]{6}$/.test(normalized)) throw new TypeError("transition bits must be a 6-bit binary string");
  return parseInt(normalized, 2) + 1;
}

export function projectSpace(primitives = {}, relations = []) {
  const values = Object.fromEntries(PRIMITIVES.map(name => [name, clamp01(primitives[name] ?? 0)]));
  const relationStrengths = (relations || []).map(rel => clamp01(rel?.strength ?? 0));
  const relationMean = relationStrengths.length
    ? relationStrengths.reduce((a, b) => a + b, 0) / relationStrengths.length
    : 0;
  const primitiveMean = PRIMITIVES.reduce((sum, name) => sum + values[name], 0) / PRIMITIVES.length;
  const spread = Math.max(...PRIMITIVES.map(name => values[name])) - Math.min(...PRIMITIVES.map(name => values[name]));
  return Object.freeze({
    dimension: SPACE,
    coherence: clamp01(1 - spread),
    relationalDensity: clamp01(relationMean),
    affordance: clamp01((primitiveMean + relationMean) / 2),
    primitives: Object.freeze(values),
    relations: Object.freeze(clone(relations || [])),
  });
}

export default Object.freeze({
  PRIMITIVES,
  SPACE,
  DEFAULT_BINARY_MAP,
  primitiveForBits,
  bitsForPrimitive,
  transitionBits,
  transitionGate,
  projectSpace,
});
