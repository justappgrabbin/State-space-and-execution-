/**
 * Current vertical boundary for the Movement assembly.
 *
 * This file does not rewrite donor constants. It records the current project
 * placement supplied by the user and exposes the donor conflicts explicitly.
 */

export const PRIMARY_DIMENSION_ORDER = Object.freeze([
  'Movement',
  'Evolution',
  'Being',
  'Design',
]);

export const EMERGENT_DIMENSION = 'Space';

export const CURRENT_DIMENSION_CANON = Object.freeze({
  Movement: Object.freeze({
    dimension: 'Movement',
    root: 'Energy',
    interrogative: 'When',
    axTerm: 'Axiom',
    role: 'measurement-and-naming',
    qualities: Object.freeze(['Energy', 'Creation', 'Seeing', 'Landscape', 'Environment']),
  }),
  Evolution: Object.freeze({
    dimension: 'Evolution',
    root: 'Gravity',
    interrogative: 'What',
    axTerm: 'Axion',
    role: 'presence-history-evolution',
    qualities: Object.freeze(['Gravity', 'Memory', 'Taste', 'Love', 'Light']),
  }),
  Being: Object.freeze({
    dimension: 'Being',
    root: 'Matter',
    interrogative: 'Where',
    axTerm: 'Arc-second',
    role: 'viewable-material-state',
    qualities: Object.freeze(['Matter', 'Touch', 'Sex', 'Survival']),
  }),
  Design: Object.freeze({
    dimension: 'Design',
    root: 'Structure',
    interrogative: 'Why',
    axTerm: 'Axis',
    role: 'organization-and-design',
    qualities: Object.freeze(['Structure', 'Progress', 'Smell', 'Life', 'Art']),
  }),
  Space: Object.freeze({
    dimension: 'Space',
    root: 'Form',
    interrogative: 'Who',
    axTerm: 'Axon',
    role: 'emergent-interplay',
    emergent: true,
    qualities: Object.freeze(['Form', 'Illusion', 'Hearing', 'Music', 'Freedom']),
  }),
});

export const MOVEMENT_LEVELS = CURRENT_DIMENSION_CANON.Movement.qualities;

export const SOURCE_CONFLICTS = Object.freeze({
  interrogatives: Object.freeze({
    current: Object.freeze({ Movement: 'When', Evolution: 'What', Being: 'Where', Design: 'Why', Space: 'Who' }),
    autopoieticR2122: Object.freeze({ Movement: 'What', Evolution: 'When', Being: 'Where', Design: 'Why', Space: 'Who' }),
    kimiFocalLegacy: Object.freeze({ Movement: 'Where', Evolution: 'What', Being: 'When', Design: 'Why', Space: 'Who' }),
    resolution: 'Current user canon is used only at this assembly boundary; donor files remain unchanged.',
  }),
  movementSequence: Object.freeze({
    donor: 'reverse',
    donorStatus: 'PROJECT_HYPOTHESIS / explicitly unconfirmed in the Kimi state-space donor',
    assemblyStatus: 'preserved but not promoted to governing Movement order',
  }),
  spaceRole: Object.freeze({
    donor: 'first-class fifth cell exists in several historical runtimes',
    current: 'Space is emergent from interaction of Movement, Evolution, Being, and Design',
    resolution: 'Underlying donor cell is preserved; the current vertical spine exposes four primary dimensions plus emergent Space.',
  }),
});

export function verticalSpine() {
  return Object.freeze({
    primary: PRIMARY_DIMENSION_ORDER.map((name, index) => Object.freeze({
      order: index + 1,
      ...CURRENT_DIMENSION_CANON[name],
    })),
    emergent: CURRENT_DIMENSION_CANON.Space,
  });
}
