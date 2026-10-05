# Synthia Minimum Arrival Proof

This directory proves one thing only:

```
local system instance
  -> creates four dimensional LLMs
  -> dimensions emit seeds
  -> seeds enter one shared state space
  -> seeds reduce to primitive model-token states
  -> primitive states form constituent Automata
  -> Automata enter shared swarm interplay
  -> existing composition semantics scale them upward
  -> first mesh-scale structure arrives
  -> reverse trace reaches the original four model conditions
```

It deliberately stops there.

## What is reused

The state-space is imported directly from the existing Movement assembly vendor source. The local model architecture is an intact copy of the recovered TRIDENT source in `Synthia-server/model.py`. The minimum composition functions preserve the supplied Pure Synthia `o_bundle`, `o_sequence`, and `o_automaton` semantics.

## What is new

Only the missing bridge:

- Model Maker that locally creates four separate TRIDENT instances: Movement, Evolution, Being, Design
- model seed -> SynthiaStateSpace adapter
- first-arrival harness
- reverse provenance trace

The four training corpora are generated at boot from the existing canonical `DIMENSIONS` object. They are not separately hand-maintained dimensional definitions.

## Local-only behavior

There is no HTTP request, hosted inference call, Hugging Face call, GitHub call, CDN import, or cloud storage call in this experiment.

The recovered TRIDENT architecture uses PyTorch. This harness never installs it and never downloads it. The local runtime must already contain/bundle Python + PyTorch. If it does not, Model Maker fails closed instead of substituting a fake model.

Generated model artifacts are written under `.local-models/` and are not committed.

## Run

From this directory:

```
npm test
npm run arrival
```

Optional:

```
SYNTHIA_MODEL_EPOCHS=3 npm run arrival
SYNTHIA_FORCE_MODELS=1 npm run arrival
```

The second command is the real acceptance experiment. The Node unit tests use fixture seeds only to verify the adapter/composition wiring; fixture data is never accepted as arrival evidence.

## Expected acceptance log

```
BOOT
  system instance ✓

MODEL CREATION
  Movement ✓
  Evolution ✓
  Being ✓
  Design ✓

CONDITIONS
  Movement seed ✓
  Evolution seed ✓
  Being seed ✓
  Design seed ✓

REDUCTION
  ... ✓

INTERPLAY
  shared swarm bundle ✓

COMPOSITION
  ... ✓

ARRIVAL
  coherent system structure ✓
```

The final JSON trace must walk:

```
mesh
  -> constituent Automata
  -> primitive token states
  -> conditions
  -> originating dimensional models
```
