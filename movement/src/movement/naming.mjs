/**
 * Thin Movement-only facade over the existing R21.22 ContentGraph held by
 * SynthiaStateSpace. It creates no second registry.
 */
export class MovementNaming {
  constructor(stateSpace) {
    if (!stateSpace?.content || typeof stateSpace.addContent !== 'function') {
      throw new TypeError('MovementNaming requires an R21.22 SynthiaStateSpace');
    }
    this.stateSpace = stateSpace;
  }

  name({ id, text, gate, scale = 'word', dependsOn = [], relation = null, metadata = {} } = {}) {
    if (!id || !text) throw new TypeError('Movement naming requires id and text');
    return this.stateSpace.addContent({
      id: String(id),
      text: String(text),
      gate: Number(gate),
      dimension: 'Movement',
      scale,
      dependsOn: [...dependsOn],
      relation,
      metadata: structuredClone(metadata),
    });
  }

  link(fromId, toId, relation = 'depends-on') {
    return this.stateSpace.linkContent(fromId, toId, relation);
  }

  get(id) { return this.stateSpace.content.get(id); }
  dependenciesOf(id) { return this.stateSpace.content.dependenciesOf(id); }
  dependentsOf(id) { return this.stateSpace.content.dependentsOf(id); }
}
