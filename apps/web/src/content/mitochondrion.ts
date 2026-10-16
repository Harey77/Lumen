import type { ExplainerModule } from './types'

export const mitochondrion: ExplainerModule = {
  id: 'mitochondrion',
  title: 'Inside the mitochondrion',
  question: 'How does a cell turn food into energy it can spend?',
  revised: '2026-10-16',
  reviewer: null,
  simplification:
    'Simplified and not to scale. Real cristae vary in shape, one mitochondrion holds thousands of transport chains and ATP synthases, and the proteins here are drawn hundreds of times too large so you can see them.',
  sources: [
    {
      id: 'openstax',
      citation: 'Clark, M. A., Douglas, M., Choi, J. Biology 2e, section 7.4 "Oxidative Phosphorylation". OpenStax, 2018.',
      url: 'https://openstax.org/books/biology-2e/pages/7-4-oxidative-phosphorylation',
    },
    {
      id: 'alberts',
      citation: 'Alberts, B. et al. Molecular Biology of the Cell, 6th ed., chapter 14 "Energy Conversion: Mitochondria and Chloroplasts". Garland Science, 2015.',
    },
    {
      id: 'mitchell',
      citation: 'Mitchell, P. "Coupling of phosphorylation to electron and hydrogen transfer by a chemi-osmotic type of mechanism." Nature 191, 144 to 148 (1961).',
    },
  ],
  parts: {
    'outer-membrane': {
      id: 'outer-membrane',
      name: 'Outer membrane',
      role: 'The boundary',
      line: 'A smooth outer layer. Porin channels let small molecules through; large proteins need dedicated import gates.',
    },
    'intermembrane-space': {
      id: 'intermembrane-space',
      name: 'Intermembrane space',
      role: 'The ion reservoir',
      line: 'The narrow gap between the two membranes, where pumped hydrogen ions build up.',
    },
    cristae: {
      id: 'cristae',
      name: 'Inner membrane and cristae',
      role: 'The working surface',
      line: 'The inner membrane folds into cristae, giving far more surface for energy-converting proteins. It barely lets ions through, so a gradient can hold.',
    },
    etc: {
      id: 'etc',
      name: 'Electron transport chain',
      role: 'The pumps',
      line: 'Protein complexes in the inner membrane pass electrons from NADH toward oxygen and use the released energy to pump hydrogen ions out of the matrix.',
    },
    'atp-synthase': {
      id: 'atp-synthase',
      name: 'ATP synthase',
      role: 'The turbine',
      line: 'Hydrogen ions flow back into the matrix through this enzyme. The flow turns its rotor, which joins ADP and phosphate into ATP.',
    },
    matrix: {
      id: 'matrix',
      name: 'Matrix',
      role: 'The inner workshop',
      line: "The innermost space. It holds the citric acid cycle enzymes, the mitochondrion's own DNA and its ribosomes.",
    },
  },
  steps: [
    {
      id: 'cell',
      title: 'Cell context',
      partId: null,
      focus: [],
      reader: [
        'Inside most of your cells are mitochondria, from a handful to thousands depending on the cell.',
        'Much of the energy in the food you eat is finally captured here as ATP, the molecule cells spend to do work.',
        "Let's cut one open.",
      ],
      narration: [
        'Inside most of your cells are mitochondria.',
        'Much of the energy in your food is finally captured here, as a molecule called ATP.',
        'ATP is the energy cells spend to do work.',
        "Let's cut one open and look inside.",
      ],
      scaffold: [
        'Your cells contain mitochondria.',
        'Mitochondria turn energy from food into ATP.',
        'ATP is the energy a cell can spend.',
      ],
      analogy: {
        machines: {
          text: 'A mitochondrion is like a small power station inside a town.',
          breaks: 'A power station feeds a shared grid. A mitochondrion makes ATP mainly for its own cell, and it can divide like a living thing.',
        },
        cooking: {
          text: 'Think of a kitchen inside every house, turning groceries into ready meals.',
          breaks: 'Meals can be stored for days. ATP is not stored for long; cells remake it constantly.',
        },
      },
    },
    {
      id: 'outer-membrane',
      title: 'Outer membrane',
      partId: 'outer-membrane',
      focus: ['outer-membrane', 'intermembrane-space'],
      reader: [
        'The outer membrane is a smooth boundary around the whole organelle.',
        'Channels called porins let small molecules through, so the space just inside is close in make-up to the rest of the cell.',
      ],
      narration: [
        'This is the outer membrane, a smooth boundary around the whole mitochondrion.',
        'Small channels called porins let small molecules pass through.',
        'Larger proteins need special gates to get in.',
      ],
      scaffold: ['This is the outer layer.', 'Small molecules pass through its channels.', 'Big molecules need special gates.'],
      analogy: {
        machines: {
          text: 'The fence around the power station: it marks the site and has gates.',
          breaks: 'A fence keeps most things out. The outer membrane is open to small molecules on purpose.',
        },
        cooking: {
          text: 'The kitchen door, which lets people and groceries in.',
          breaks: 'A door is open or shut. The outer membrane is always open to small molecules and selective about large ones.',
        },
      },
    },
    {
      id: 'intermembrane-space',
      title: 'Intermembrane space',
      partId: 'intermembrane-space',
      focus: ['intermembrane-space', 'outer-membrane', 'cristae'],
      reader: [
        'Between the outer and inner membranes is a narrow gap: the intermembrane space.',
        'Soon, hydrogen ions will be pumped into this gap until it holds far more of them than the inside does.',
      ],
      narration: [
        'Between the two membranes is a narrow gap, the intermembrane space.',
        'Hydrogen ions will be pumped into this gap.',
        'They build up until the gap holds far more of them than the inside does.',
      ],
      scaffold: ['There are two membranes.', 'The gap between them is the intermembrane space.', 'Hydrogen ions pile up in this gap.'],
      analogy: {
        machines: {
          text: 'The reservoir behind a dam, where water is held at a higher level.',
          breaks: 'A reservoir stores water by height. This gap stores a difference in ion concentration and electric charge, with no gravity involved.',
        },
        cooking: {
          text: 'The sealed space in a pressure cooker, where pressure builds up.',
          breaks: 'A pressure cooker can vent anywhere. Here the ions can return through only one kind of gate.',
        },
      },
    },
    {
      id: 'cristae',
      title: 'Cristae',
      partId: 'cristae',
      focus: ['cristae', 'intermembrane-space', 'matrix'],
      reader: [
        'The inner membrane folds inward again and again. The folds are called cristae.',
        'Folding packs far more membrane, and so far more energy-converting proteins, into the same small space.',
      ],
      narration: [
        'The inner membrane folds inward again and again.',
        'These folds are called cristae.',
        'Folding packs much more membrane into the same space, so there is room for many more energy-making proteins.',
      ],
      scaffold: ['The inner membrane is folded.', 'The folds are called cristae.', 'More folds means more working surface.'],
      analogy: {
        machines: {
          text: 'Fins on a radiator: folding packs more working surface into a small space.',
          breaks: 'Radiator fins are rigid metal. Cristae are living membrane that changes shape with the cell\'s energy demand.',
        },
        cooking: {
          text: 'Layers folded into puff pastry, many surfaces in one small block.',
          breaks: 'Pastry layers are separate sheets. Cristae are continuous with the rest of the inner membrane.',
        },
      },
      recall: {
        prompt: 'Tap the folds that increase surface area.',
        target: 'cristae',
        why: 'The cristae are folds of the inner membrane. The outer membrane stays smooth.',
      },
    },
    {
      id: 'etc',
      title: 'Electron transport chain',
      partId: 'etc',
      focus: ['etc', 'cristae', 'intermembrane-space'],
      flow: 'pump',
      reader: [
        'Sitting in the inner membrane is the electron transport chain, a row of protein complexes.',
        'Electrons carried by NADH pass from complex to complex toward oxygen.',
        'The energy released pumps hydrogen ions out of the matrix and into the intermembrane space.',
      ],
      narration: [
        'In the inner membrane sits the electron transport chain, a row of protein complexes.',
        'Electrons carried by NADH pass from one complex to the next, toward oxygen.',
        'At each step, energy is released.',
        'That energy pumps hydrogen ions out of the matrix, into the intermembrane space.',
      ],
      scaffold: [
        'NADH brings electrons.',
        'The electrons pass along a chain of proteins.',
        'That powers pumps that push hydrogen ions into the gap.',
      ],
      analogy: {
        machines: {
          text: 'Pumps lifting water up into the reservoir, powered by the fuel being burned.',
          breaks: 'Real pumps take power from one source. Here the energy arrives in small steps as electrons move down the chain, and oxygen must be waiting at the end.',
        },
        cooking: {
          text: 'A line of cooks passing a hot pan along, each using a little of its heat to build pressure in the cooker.',
          breaks: 'Cooks can improvise. The complexes are fixed in order, and without oxygen at the end of the line the whole chain stops.',
        },
      },
    },
    {
      id: 'atp-synthase',
      title: 'ATP synthase',
      partId: 'atp-synthase',
      focus: ['atp-synthase', 'cristae', 'matrix'],
      flow: 'synthase',
      reader: [
        'The ions can flow back into the matrix through only one gate: ATP synthase.',
        'As they pass, part of the enzyme spins like a turbine.',
        'The spinning joins ADP and phosphate into ATP, three for each full turn.',
      ],
      narration: [
        'The hydrogen ions can only flow back through one gate, ATP synthase.',
        'As they pass, part of the enzyme spins, like a turbine.',
        'The spinning joins ADP and phosphate together, making ATP.',
      ],
      scaffold: ['Ions flow back through ATP synthase.', 'The flow makes part of it spin.', 'Spinning makes ATP.'],
      analogy: {
        machines: {
          text: 'The turbine in a hydroelectric dam: water rushing through spins the generator.',
          breaks: 'A turbine makes electric current. ATP synthase makes a chemical bond, and it can even run backwards, spending ATP to pump ions.',
        },
        cooking: {
          text: "Steam escaping a pressure cooker's valve and spinning a little whisk on its way out.",
          breaks: 'Escaping steam is mostly wasted. Each ion that passes through ATP synthase does useful work.',
        },
      },
      recall: {
        prompt: 'Tap the part where ATP is made.',
        target: 'atp-synthase',
        why: 'ATP synthase is the gate the ions flow back through, and its spinning makes ATP.',
      },
    },
    {
      id: 'matrix',
      title: 'Matrix',
      partId: 'matrix',
      focus: ['matrix', 'cristae', 'etc'],
      reader: [
        'The innermost space is the matrix.',
        'Here the citric acid cycle breaks down fuel from food and loads electrons onto NADH, which feeds the transport chain.',
        "The matrix also holds the mitochondrion's own DNA and ribosomes.",
      ],
      narration: [
        'The innermost space is the matrix.',
        'Here, the citric acid cycle breaks down fuel from food.',
        'It loads electrons onto NADH, which carries them to the transport chain.',
        "The matrix also holds the mitochondrion's own DNA.",
      ],
      scaffold: ['The matrix is the inside space.', 'Fuel from food is broken down here.', 'This makes NADH for the transport chain.'],
      analogy: {
        machines: {
          text: 'The fuel hall, where raw fuel is prepared before it reaches the furnace.',
          breaks: "A fuel hall does not keep its own blueprints. The matrix holds DNA, a trace of the mitochondrion's origin as a free-living bacterium.",
        },
        cooking: {
          text: 'The prep counter, where ingredients are chopped before cooking.',
          breaks: 'A counter does not build its own tools. The matrix holds DNA and ribosomes that make some of its own proteins.',
        },
      },
    },
    {
      id: 'recap',
      title: 'Recap',
      partId: null,
      focus: ['matrix', 'etc', 'intermembrane-space', 'atp-synthase'],
      flow: 'recap',
      reader: [
        'Fuel from food is broken down in the matrix, loading electrons onto NADH.',
        'The transport chain uses those electrons to pump ions into the intermembrane space.',
        'The ions rush back through ATP synthase, and ATP is made.',
      ],
      narration: [
        'Here is the whole flow.',
        'Fuel from food is broken down in the matrix, loading electrons onto NADH.',
        'The transport chain uses those electrons to pump hydrogen ions into the intermembrane space.',
        'The ions rush back through ATP synthase, and ATP is made.',
      ],
      scaffold: ['Food fuel makes NADH.', 'NADH powers the ion pumps.', 'Ions flowing back make ATP.'],
      analogy: {
        machines: {
          text: 'Fuel is burned to pump water uphill, and the water falling back spins a turbine.',
          breaks: 'A dam stores energy for hours. The ion gradient is used and rebuilt within moments.',
        },
        cooking: {
          text: 'Groceries are prepped, their heat builds pressure, and escaping steam does the work.',
          breaks: 'Kitchens waste most of their heat. Mitochondria capture a large share of the energy as ATP.',
        },
      },
    },
  ],
  recapQuiz: ['outer-membrane', 'intermembrane-space', 'cristae', 'etc', 'atp-synthase', 'matrix'],
}
