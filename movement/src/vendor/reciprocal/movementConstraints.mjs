import { transitionBits } from "./primitiveTopology.mjs";

const clone = value => structuredClone(value);
const uniq = values => [...new Set((values || []).map(String))];

export const ACTORS = Object.freeze(["agent", "human", "shared", "environment"]);

function normalizeCondition(condition = {}) {
  if (!condition.id) throw new TypeError("condition requires id");
  const actor = condition.actor || "shared";
  if (!ACTORS.includes(actor)) throw new RangeError(`unknown condition actor: ${actor}`);
  return {
    id: String(condition.id),
    label: String(condition.label || condition.id),
    actor,
    satisfied: Boolean(condition.satisfied),
    evidence: Array.isArray(condition.evidence) ? clone(condition.evidence) : [],
    capability: condition.capability ? String(condition.capability) : null,
    metadata: clone(condition.metadata || {}),
  };
}

function normalizeAction(action = {}) {
  if (!action.id) throw new TypeError("action requires id");
  const actor = action.actor || "agent";
  if (!ACTORS.includes(actor)) throw new RangeError(`unknown action actor: ${actor}`);
  const gate = Number(action.gate || 1);
  if (!Number.isInteger(gate) || gate < 1 || gate > 64) throw new RangeError("action gate must be 1..64");
  return {
    id: String(action.id),
    label: String(action.label || action.id),
    actor,
    gate,
    transition: transitionBits(gate),
    requires: uniq(action.requires),
    produces: uniq(action.produces),
    grants: uniq(action.grants),
    cost: Math.max(0, Number(action.cost) || 0),
    metadata: clone(action.metadata || {}),
  };
}

export class MovementConstraintSurface {
  constructor({ conditions = [], actions = [], capabilities = {} } = {}) {
    this.id = "synthia-movement-constraint-surface";
    this.address = { dimension: "Movement" };
    this.metadata = { capabilities: [
      "movement.condition.define",
      "movement.condition.observe",
      "movement.action.define",
      "movement.admissible",
      "movement.execute",
      "movement.capability.grant",
      "movement.snapshot",
    ] };
    this.conditions = new Map();
    this.actions = new Map();
    this.capabilities = {
      agent: new Set(capabilities.agent || []),
      human: new Set(capabilities.human || []),
      shared: new Set(capabilities.shared || []),
      environment: new Set(capabilities.environment || []),
    };
    this.history = [];
    conditions.forEach(condition => this.defineCondition(condition));
    actions.forEach(action => this.defineAction(action));
  }

  defineCondition(condition) {
    const normalized = normalizeCondition(condition);
    const prior = this.conditions.get(normalized.id);
    if (prior?.satisfied && !normalized.satisfied) {
      normalized.satisfied = true;
      normalized.evidence = [...prior.evidence, ...normalized.evidence];
    }
    this.conditions.set(normalized.id, normalized);
    return clone(normalized);
  }

  observeCondition(id, evidence, { satisfied = true } = {}) {
    const condition = this.conditions.get(String(id));
    if (!condition) throw new RangeError(`unknown condition: ${id}`);
    if (!evidence || (typeof evidence === "object" && !Object.keys(evidence).length)) {
      throw new TypeError("condition observation requires evidence");
    }
    condition.evidence.push(clone(evidence));
    if (satisfied) condition.satisfied = true;
    if (condition.satisfied && condition.capability) this.capabilities[condition.actor].add(condition.capability);
    const event = Object.freeze({
      type: "condition-observed",
      condition: condition.id,
      satisfied: condition.satisfied,
      evidence: clone(evidence),
      at: Date.now(),
    });
    this.history.push(event);
    return clone(condition);
  }

  defineAction(action) {
    const normalized = normalizeAction(action);
    this.actions.set(normalized.id, normalized);
    return clone(normalized);
  }

  hasCapability(actor, capability) {
    return this.capabilities[actor]?.has(String(capability)) || false;
  }

  missingFor(actionOrId) {
    const action = typeof actionOrId === "string" ? this.actions.get(actionOrId) : actionOrId;
    if (!action) throw new RangeError("unknown action");
    return action.requires.filter(requirement => {
      if (requirement.startsWith("cap:")) return !this.hasCapability(action.actor, requirement.slice(4));
      return !this.conditions.get(requirement)?.satisfied;
    });
  }

  isAdmissible(actionOrId) {
    const action = typeof actionOrId === "string" ? this.actions.get(actionOrId) : actionOrId;
    if (!action) return false;
    return this.missingFor(action).length === 0;
  }

  admissible(actor = null) {
    return [...this.actions.values()]
      .filter(action => (!actor || action.actor === actor || action.actor === "shared"))
      .filter(action => this.isAdmissible(action))
      .map(clone);
  }

  grantCapability(actor, capability, evidence = null) {
    if (!ACTORS.includes(actor)) throw new RangeError(`unknown actor: ${actor}`);
    if (!evidence) throw new TypeError("capability grant requires verification evidence");
    this.capabilities[actor].add(String(capability));
    const event = Object.freeze({ type: "capability-granted", actor, capability: String(capability), evidence: clone(evidence), at: Date.now() });
    this.history.push(event);
    return clone(event);
  }

  execute(actionId, { evidence = null, verify = null } = {}) {
    const action = this.actions.get(String(actionId));
    if (!action) throw new RangeError(`unknown action: ${actionId}`);
    const missing = this.missingFor(action);
    if (missing.length) return Object.freeze({ ok: false, status: "blocked", action: clone(action), missing: Object.freeze(missing) });

    const verification = typeof verify === "function" ? verify(clone(action), clone(evidence)) : evidence;
    const verified = Boolean(verification && (verification.ok ?? true));
    if (!verified) {
      const event = Object.freeze({ type: "action-failed-verification", action: action.id, actor: action.actor, evidence: clone(verification || evidence), at: Date.now() });
      this.history.push(event);
      return Object.freeze({ ok: false, status: "unverified", action: clone(action), evidence: clone(verification || evidence) });
    }

    for (const conditionId of action.produces) {
      const condition = this.conditions.get(conditionId);
      if (condition) this.observeCondition(conditionId, { source: action.id, verification: clone(verification) });
    }
    for (const capability of action.grants) this.grantCapability(action.actor, capability, { source: action.id, verification: clone(verification) });

    const event = Object.freeze({ type: "action-verified", action: action.id, actor: action.actor, gate: action.gate, transition: action.transition, evidence: clone(verification), at: Date.now() });
    this.history.push(event);
    return Object.freeze({ ok: true, status: "verified", action: clone(action), event });
  }

  snapshot() {
    return Object.freeze({
      version: "synthia.movement-constraint-surface.v1",
      conditions: Object.freeze([...this.conditions.values()].map(clone)),
      actions: Object.freeze([...this.actions.values()].map(clone)),
      capabilities: Object.freeze(Object.fromEntries(Object.entries(this.capabilities).map(([actor, set]) => [actor, Object.freeze([...set])]))),
      admissible: Object.freeze(Object.fromEntries(ACTORS.map(actor => [actor, Object.freeze(this.admissible(actor).map(action => action.id))]))),
      history: Object.freeze(this.history.map(clone)),
    });
  }

  async run(input = {}) {
    switch (input.op) {
      case "define-condition": return this.defineCondition(input.condition);
      case "observe-condition": return this.observeCondition(input.id, input.evidence, input.options);
      case "define-action": return this.defineAction(input.action);
      case "admissible": return this.admissible(input.actor);
      case "execute": return this.execute(input.actionId, input);
      case "grant-capability": return this.grantCapability(input.actor, input.capability, input.evidence);
      case "snapshot": return this.snapshot();
      default: throw new RangeError(`Unknown Movement operation: ${input.op}`);
    }
  }
}

export default MovementConstraintSurface;
