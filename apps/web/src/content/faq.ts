export interface Faq {
  id: string
  q: string
  a: string[]
}

export const faqs: Faq[] = [
  {
    id: 'offline',
    q: 'Does Lumen really work without internet?',
    a: [
      'Yes, after your first visit. Lumen saves its own code, fonts and lessons in your browser, so the next time you open it the network is not needed.',
      'Settings shows whether this device is ready to work offline.',
    ],
  },
  {
    id: 'stored',
    q: 'What does Lumen store, and where?',
    a: [
      'Your preferences (theme, motion, analogy choice) are kept in local storage. Your learning record (lesson position, quiz results, bookmarks, tutor conversations, notes, your argument in Perspectives) is kept in IndexedDB. The app itself is kept in the cache so it can run offline.',
      'All of it stays in this browser on this device. It is not encrypted, so anyone who uses this browser profile can read it. You can export it or delete it in Settings.',
    ],
  },
  {
    id: 'tracking',
    q: 'Is anything sent to a server?',
    a: [
      'Only when you use the AI tutor. When you send a question, it and the earlier messages in that conversation go to Lumen\x27s server, which forwards them to Anthropic\x27s Claude API to write the answer. Nothing else leaves the device: Lumen sets no cookies, has no analytics, and lessons, quizzes and progress make no network requests. Campaign tags such as utm_source are removed from the address bar and are not saved.',
      'Links to sources open the source website only when you choose to follow them.',
    ],
  },
  {
    id: 'adapt',
    q: 'Why did the lesson suddenly get simpler?',
    a: [
      'Lumen watches a few signals inside the lesson: missed recall taps, stepping back, replays and long pauses. When they add up, it shows fewer labels, splits the step into smaller cards and slows narration.',
      'It always says why, you can undo it in one tap, and you can switch adaptation off in Settings. These signals never leave your device and are forgotten when you close the tab.',
    ],
  },
  {
    id: 'ai',
    q: 'Is an AI writing these explanations?',
    a: [
      'Lessons, quizzes, analogies and the Perspectives scenario were written by people. Only the tutor uses AI: its answers are generated live by Claude on Lumen\x27s server and are labelled with the model name. AI answers can be wrong, so check them against the lessons.',
      'When the tutor is offline or not configured, it quotes saved lessons instead, and labels those answers "From saved lessons, not AI".',
    ],
  },
  {
    id: 'skills',
    q: 'Are my skills a certificate?',
    a: [
      'Not yet. Skills shows what you explored and what you answered correctly in Lumen\'s own recall checks. It is not signed and is not a credential anyone else can verify. Verifiable credentials are on the roadmap.',
    ],
  },
  {
    id: 'model',
    q: 'Is the 3D model accurate?',
    a: [
      'It is a teaching model drawn in code: simplified and not to scale. The proteins are drawn far larger than life so you can see them. Each lesson lists its sources and what it simplifies.',
    ],
  },
]
