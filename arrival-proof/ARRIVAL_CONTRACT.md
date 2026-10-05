# Minimum Arrival Proof

This branch is an isolated experiment. It does not replace or rewrite the source systems.

## Target

```
system instance
  -> Model Maker creates Movement / Evolution / Being / Design local LLMs
  -> each dimensional model emits a real seed
  -> all seeds enter one SynthiaStateSpace
  -> model output is reduced to primitive token states
  -> primitive states become constituent Automata
  -> constituent Automata enter a shared swarm bundle
  -> existing cross-scale composition semantics promote the constituents upward
  -> first coherent mesh structure arrives
```

The experiment stops at that first arrival. It does not recurse the arrived mesh into another generation.

## Acceptance

1. Exactly four model instances exist: Movement, Evolution, Being, Design.
2. Models are created locally by Model Maker. A missing local model runtime is a hard failure; no fake model is substituted.
3. Every dimensional model must emit generated token output.
4. Every seed is written into the same SynthiaStateSpace with model id, dimension, and provenance.
5. Primitive states must be derived from emitted model tokens, not prewritten into the harness.
6. Automata must retain their primitive constituents.
7. The arrived mesh must retain all constituent Automata and the swarm relation that preceded composition.
8. Reverse tracing must reach all four original model seeds.
9. The experiment contains no network call.
10. Source packages remain untouched. This branch adds only an isolated harness and copied/referenced source mechanisms.

## Source reuse

- State-space substrate: `movement/src/vendor/autopoietic/state-space-foundation.mjs`
- Local LLM architecture: copied intact from `justappgrabbin/Synthia-server/model.py`
- Composition semantics: recovered Pure Synthia `o_bundle`, `o_sequence`, and `o_automaton` semantics, reduced to the minimum used here.
- Scale ladder: the existing Synthia state-space scale ladder.

The only new code is boundary glue for the missing Model Maker -> condition -> arrival route.
