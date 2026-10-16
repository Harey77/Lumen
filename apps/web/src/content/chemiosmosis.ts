export interface Choice {
  id: string
  label: string
}

export interface Scenario {
  id: string
  title: string
  question: string
  revised: string
  reviewer: string | null
  guardrail: string
  belief: { prompt: string; choices: Choice[]; consensus: string }
  role: { name: string; brief: string[]; paraphrase: { text: string; source: string } }
  argumentPrompt: string
  prediction: { prompt: string; choices: Choice[]; roleAnswer: string; actual: string; explanation: string }
  convincer: { prompt: string; choices: Choice[]; actual: string; explanation: string }
  consensus: { summary: string[]; paraphrase: { text: string; source: string } }
  timeline: { year: string; text: string; source: string }[]
  sources: Record<string, string>
}

export const chemiosmosis: Scenario = {
  id: 'chemiosmosis',
  title: 'How does food energy reach ATP?',
  question: 'Argue the losing side of a real scientific controversy, then see what settled it.',
  revised: '2026-10-16',
  reviewer: null,
  guardrail:
    'This question is settled. The losing side is here because it was a reasonable hypothesis given the evidence of the 1950s, not because it is a valid view today.',
  belief: {
    prompt: 'Before you start: how do you think the energy released by the electron transport chain is used to make ATP?',
    choices: [
      { id: 'intermediate', label: 'A high-energy chemical is formed and hands its energy directly to ADP' },
      { id: 'gradient', label: 'Ions are pushed across a membrane, and their flow back drives an enzyme' },
      { id: 'unsure', label: "I don't know yet" },
    ],
    consensus: 'gradient',
  },
  role: {
    name: 'A biochemist in 1960 who expects a chemical intermediate',
    brief: [
      'You know glycolysis well. There, a phosphorylated molecule hands its phosphate group straight to ADP, making ATP. Every step is an ordinary chemical reaction you can write on paper.',
      'It seems natural that mitochondria work the same way: electron transport should form some high-energy compound, and that compound should make ATP.',
      'Many laboratories are searching for this intermediate. Nobody has found it yet, but it is early.',
    ],
    paraphrase: {
      text: 'By analogy with glycolysis, electron transport produces a high-energy intermediate compound, and that compound drives the formation of ATP.',
      source: 'slater',
    },
  },
  argumentPrompt: 'Write the strongest case for your side, as a 1960 biochemist would make it.',
  prediction: {
    prompt:
      'A lab breaks mitochondria into leaky membrane fragments that still contain every enzyme. Ions can now leak freely across the membranes. What does your hypothesis predict for ATP production?',
    choices: [
      { id: 'continues', label: 'It continues: the enzymes and the intermediate are all still there' },
      { id: 'stops', label: 'It stops: an intact, sealed membrane is needed' },
    ],
    roleAnswer: 'continues',
    actual: 'stops',
    explanation:
      'Experiments showed that ATP synthesis needs a sealed membrane. Chemicals that make the membrane leaky to hydrogen ions, called uncouplers, stop ATP production while electron transport carries on. A chemical intermediate should not care whether the membrane leaks. A gradient does.',
  },
  convincer: {
    prompt: 'Which result would hurt your hypothesis the most?',
    choices: [
      { id: 'acid-bath', label: 'Membranes soaked in acid and moved into a neutral bath make ATP with no electron transport at all' },
      { id: 'found', label: 'A chemist isolates the high-energy intermediate' },
      { id: 'oxygen', label: 'Mitochondria are shown to consume oxygen' },
    ],
    actual: 'acid-bath',
    explanation:
      'In 1966 Jagendorf and Uribe did exactly this with chloroplast membranes: an artificial ion gradient alone made ATP. Finding the intermediate would have supported your side, but it was never found. Oxygen use fits both hypotheses, so it cannot decide between them.',
  },
  consensus: {
    summary: [
      'The electron transport chain pumps hydrogen ions across the inner membrane, building a gradient of concentration and charge.',
      'Ions flowing back through ATP synthase drive the formation of ATP. No chemical intermediate is involved.',
      'This is the chemiosmotic theory. It is the textbook account today.',
    ],
    paraphrase: {
      text: 'ATP synthesis is coupled to electron transport through a gradient of hydrogen ions across the membrane, rather than through a chemical intermediate.',
      source: 'mitchell',
    },
  },
  timeline: [
    { year: '1953', text: 'Slater proposes the chemical intermediate hypothesis.', source: 'slater' },
    { year: '1961', text: 'Mitchell proposes the chemiosmotic hypothesis, and it is widely doubted.', source: 'mitchell' },
    { year: '1966', text: 'Jagendorf and Uribe make ATP in the dark from an artificial pH gradient.', source: 'jagendorf' },
    { year: '1974', text: 'Racker and Stoeckenius rebuild the system from parts: a light-driven ion pump plus ATP synthase in a sealed vesicle makes ATP.', source: 'racker' },
    { year: '1978', text: 'Mitchell receives the Nobel Prize in Chemistry.', source: 'nobel' },
  ],
  sources: {
    slater: 'Slater, E. C. "Mechanism of phosphorylation in the respiratory chain." Nature 172, 975 to 978 (1953).',
    mitchell: 'Mitchell, P. "Coupling of phosphorylation to electron and hydrogen transfer by a chemi-osmotic type of mechanism." Nature 191, 144 to 148 (1961).',
    jagendorf: 'Jagendorf, A. T., Uribe, E. "ATP formation caused by acid-base transition of spinach chloroplasts." PNAS 55, 170 to 177 (1966).',
    racker: 'Racker, E., Stoeckenius, W. "Reconstitution of purple membrane vesicles catalyzing light-driven proton uptake and adenosine triphosphate formation." Journal of Biological Chemistry 249, 662 to 663 (1974).',
    nobel: 'The Nobel Prize in Chemistry 1978, awarded to Peter Mitchell. nobelprize.org.',
  },
}
