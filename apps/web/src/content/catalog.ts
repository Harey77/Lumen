/** Typed learning catalogue: subjects, lessons and quiz questions. Authored, not generated. */

export type Domain = 'programming' | 'biology'
export type SubjectId = 'html' | 'css' | 'c' | 'csharp' | 'java' | 'python' | 'javascript' | 'anatomy' | 'biology' | 'botany'

export interface Subject {
  id: SubjectId
  name: string
  domain: Domain
  blurb: string
}

export type Block =
  | { type: 'h'; id: string; text: string }
  | { type: 'p'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'code'; code: string; caption?: string; lang?: string }
  | { type: 'callout'; title: string; text: string }
  | { type: 'widget'; name: WidgetName }

export type WidgetName =
  | 'binary-search'
  | 'growth'
  | 'counter'
  | 'box-model'
  | 'html-dom'
  | 'html-playground'
  | 'python-trace'
  | 'c-memory'
  | 'references-csharp'
  | 'references-java'
  | 'heart'
  | 'photosynthesis'
  | 'plant-cell'
  | 'js-playground'

export interface Choice {
  id: string
  text: string
  /** Why this choice is wrong, shown when a learner picks it. */
  why?: string
}

export interface Question {
  id: string
  lessonId: string
  concept: string
  difficulty: 1 | 2 | 3
  interview?: boolean
  prompt: string
  code?: string
  choices: Choice[]
  answer: string
  explanation: string
  /** An easier question on the same concept, asked next if this one is missed. */
  followUp?: string
  /** Only asked as a follow-up, not in the main sequence. */
  remedial?: boolean
}

export interface Concept {
  label: string
  /** Where to re-read it: a section anchor in this lesson, or a step link. */
  href: string
  /** A lesson that teaches the prerequisite, if any. */
  prereq?: string
}

export interface Lesson {
  id: string
  subject: SubjectId
  title: string
  level: 'Beginner' | 'Intermediate'
  minutes: number
  objective: string
  kind: 'article' | 'explainer'
  sections: Block[]
  takeaways: string[]
  concepts: Record<string, Concept>
  next?: string
}

export const domains: { id: Domain; name: string; blurb: string }[] = [
  { id: 'programming', name: 'Computer programming', blurb: 'Seven languages, from page structure to pointers, objects and algorithms.' },
  { id: 'biology', name: 'Biology and life sciences', blurb: 'The body, the cell and the plant, explored as models you can turn and test.' },
]

export const subjects: Subject[] = [
  { id: 'html', name: 'HTML', domain: 'programming', blurb: 'How web pages are structured, and why semantic tags matter.' },
  { id: 'css', name: 'CSS', domain: 'programming', blurb: 'How browsers size and space every element on the page.' },
  { id: 'c', name: 'C', domain: 'programming', blurb: 'Memory, addresses and pointers, the foundation under every other language.' },
  { id: 'csharp', name: 'C#', domain: 'programming', blurb: 'Types and objects on .NET: what gets copied and what gets shared.' },
  { id: 'java', name: 'Java', domain: 'programming', blurb: 'Objects, references and equality, the source of many interview questions.' },
  { id: 'python', name: 'Python', domain: 'programming', blurb: 'Names, objects and mutability, traced line by line.' },
  { id: 'javascript', name: 'JavaScript', domain: 'programming', blurb: 'Closures, complexity and binary search, with code that runs in the page.' },
  { id: 'anatomy', name: 'Human anatomy and physiology', domain: 'biology', blurb: 'The heart in 3D: chambers, valves and the two circuits of blood.' },
  { id: 'biology', name: 'Basic and cellular biology', domain: 'biology', blurb: 'Inside the cell: how mitochondria turn food into usable energy.' },
  { id: 'botany', name: 'Botany and plant biology', domain: 'biology', blurb: 'Plant cells and photosynthesis, with a model you can experiment on.' },
]

export const lessons: Lesson[] = [
  {
    id: 'big-o',
    subject: 'javascript',
    title: 'Time complexity and Big O',
    level: 'Beginner',
    minutes: 8,
    objective: 'Describe how an algorithm’s running time grows with input size, and compare O(1), O(log n), O(n) and O(n²).',
    kind: 'article',
    concepts: {
      growth: { label: 'What Big O describes', href: '#what-big-o-means' },
      classes: { label: 'Common growth rates', href: '#common-classes' },
      dominant: { label: 'Dropping constants and smaller terms', href: '#simplifying' },
    },
    sections: [
      { type: 'h', id: 'what-big-o-means', text: 'What Big O means' },
      { type: 'p', text: 'Big O notation describes how the number of steps an algorithm takes grows as its input gets larger. It ignores the speed of a particular computer and focuses on the shape of the growth.' },
      { type: 'p', text: 'If an algorithm is O(n), doubling the input roughly doubles the work. If it is O(n²), doubling the input roughly quadruples the work.' },
      { type: 'h', id: 'common-classes', text: 'Common growth rates' },
      { type: 'list', items: [
        'O(1), constant: reading an array element by its index.',
        'O(log n), logarithmic: binary search, which halves the remaining range each step.',
        'O(n), linear: checking every element once, as in a simple loop.',
        'O(n²), quadratic: comparing every pair of elements with two nested loops.',
      ] },
      { type: 'widget', name: 'growth' },
      { type: 'h', id: 'simplifying', text: 'Dropping constants and smaller terms' },
      { type: 'p', text: 'Big O keeps only the fastest-growing term and drops constant factors. An algorithm that takes 3n + 20 steps is O(n), and one that takes n² + 5n steps is O(n²). For large n the dominant term decides everything.' },
      { type: 'code', caption: 'Two loops in a row are O(n); nested loops are O(n²).', code: 'function sumTwice(items) {\n  let total = 0\n  for (const x of items) total += x   // n steps\n  for (const x of items) total += x   // n more steps\n  return total                        // 2n steps: O(n)\n}\n\nfunction countPairs(items) {\n  let pairs = 0\n  for (const a of items)\n    for (const b of items) pairs++    // n × n steps: O(n²)\n  return pairs\n}' },
      { type: 'callout', title: 'In practice', text: 'Big O usually describes the worst case. A linear search might find its target on the first try, but it is still O(n) because in the worst case it checks every element.' },
    ],
    takeaways: [
      'Big O describes growth with input size, not seconds.',
      'Keep the dominant term and drop constants: 3n + 20 is O(n).',
      'O(log n) grows far more slowly than O(n); O(n²) grows far faster.',
    ],
    next: 'binary-search',
  },
  {
    id: 'binary-search',
    subject: 'javascript',
    title: 'Binary search',
    level: 'Beginner',
    minutes: 12,
    objective: 'Find an item in a sorted array in O(log n) time, write the algorithm without off-by-one errors, and recognise when binary search applies.',
    kind: 'article',
    concepts: {
      precondition: { label: 'Why the data must be sorted', href: '#the-idea' },
      halving: { label: 'Halving the search range', href: '#step-by-step' },
      boundaries: { label: 'Loop boundaries and off-by-one errors', href: '#the-code' },
      complexity: { label: 'Why it is O(log n)', href: '#how-fast', prereq: 'big-o' },
    },
    sections: [
      { type: 'h', id: 'the-idea', text: 'The idea' },
      { type: 'p', text: 'Imagine finding a word in a printed dictionary. You do not start at page one. You open it near the middle, see whether your word comes before or after that page, and throw away the half that cannot contain it.' },
      { type: 'p', text: 'Binary search does exactly this with a sorted array. Sorting is the precondition: only because the values are in order can one comparison tell you which half to discard.' },
      { type: 'h', id: 'step-by-step', text: 'Step by step' },
      { type: 'list', items: [
        'Keep two boundaries, lo and hi, around the part of the array that could still hold the target.',
        'Look at the middle element, mid.',
        'If it equals the target, you are done. If it is smaller, the target can only be to the right, so move lo to mid + 1. If it is larger, move hi to mid − 1.',
        'Repeat until you find the target or the range is empty (lo > hi).',
      ] },
      { type: 'p', text: 'Try it below. Pick a target and step through the search; watch the discarded half fade out after each comparison.' },
      { type: 'widget', name: 'binary-search' },
      { type: 'h', id: 'the-code', text: 'The code' },
      { type: 'code', caption: 'Iterative binary search. Returns the index of target, or −1 if it is absent.', code: 'function binarySearch(sorted, target) {\n  let lo = 0\n  let hi = sorted.length - 1\n\n  while (lo <= hi) {\n    const mid = lo + Math.floor((hi - lo) / 2)\n    if (sorted[mid] === target) return mid\n    if (sorted[mid] < target) lo = mid + 1\n    else hi = mid - 1\n  }\n  return -1\n}' },
      { type: 'callout', title: 'Off-by-one traps', text: 'Use lo <= hi, not lo < hi, when hi is the last valid index; otherwise a one-element range is never checked. Always move past mid (mid + 1 or mid − 1), or the loop can repeat the same mid forever.' },
      { type: 'h', id: 'how-fast', text: 'How fast is it?' },
      { type: 'p', text: 'Each comparison halves the range. Starting from n elements, after k steps about n / 2ᵏ remain, so the search ends after about log₂ n steps. That is O(log n): a million sorted items need at most 20 comparisons, and a billion need about 30.' },
      { type: 'h', id: 'where-it-is-used', text: 'Where it is used' },
      { type: 'list', items: [
        'Database indexes and sorted files, to locate a record without scanning everything.',
        'git bisect, which binary-searches your commit history to find the commit that introduced a bug.',
        'Interview problems such as "first bad version" or "search insert position", which apply the same halving to any yes-or-no question that flips once.',
      ] },
    ],
    takeaways: [
      'Binary search only works on sorted data (or any condition that flips from false to true once).',
      'Each comparison discards half of the remaining range, so it takes O(log n) steps.',
      'Loop while lo <= hi and always move past mid to avoid off-by-one errors and infinite loops.',
    ],
    next: 'js-closures',
  },
  {
    id: 'js-closures',
    subject: 'javascript',
    title: 'JavaScript closures',
    level: 'Intermediate',
    minutes: 10,
    objective: 'Explain what a closure captures, predict the output of closures created in loops, and use closures to keep private state.',
    kind: 'article',
    concepts: {
      scope: { label: 'Lexical scope', href: '#lexical-scope' },
      capture: { label: 'Closures capture variables, not values', href: '#what-is-a-closure' },
      loops: { label: 'Closures in loops: var versus let', href: '#the-loop-trap' },
    },
    sections: [
      { type: 'h', id: 'lexical-scope', text: 'Lexical scope' },
      { type: 'p', text: 'In JavaScript a function can read the variables that were in scope where the function was written, not where it is later called. This is called lexical scope.' },
      { type: 'h', id: 'what-is-a-closure', text: 'What is a closure?' },
      { type: 'p', text: 'A closure is a function together with the variables from its surrounding scope that it keeps using. Even after the outer function has returned, the inner function still has access to those variables.' },
      { type: 'code', caption: 'Each call to makeCounter creates a new, private count.', code: 'function makeCounter() {\n  let count = 0\n  return function increment() {\n    count += 1\n    return count\n  }\n}\n\nconst a = makeCounter()\nconst b = makeCounter()\na() // 1\na() // 2\nb() // 1: b has its own count' },
      { type: 'p', text: 'The two counters below are real closures running in this page. Each button calls its own increment function.' },
      { type: 'widget', name: 'counter' },
      { type: 'callout', title: 'Variables, not snapshots', text: 'A closure keeps a live reference to the variable. If the variable changes later, the closure sees the new value.' },
      { type: 'h', id: 'the-loop-trap', text: 'The loop trap: var versus let' },
      { type: 'code', caption: 'With var there is one shared i; with let each iteration gets its own.', code: 'const withVar = []\nfor (var i = 0; i < 3; i++) withVar.push(() => i)\nwithVar.map(f => f())   // [3, 3, 3]\n\nconst withLet = []\nfor (let j = 0; j < 3; j++) withLet.push(() => j)\nwithLet.map(f => f())   // [0, 1, 2]' },
      { type: 'p', text: 'var is function-scoped, so all three arrow functions close over the same variable, which is 3 when the loop ends. let is block-scoped, and a for loop creates a fresh binding for each iteration.' },
      { type: 'p', text: 'Run it yourself. Change var to let and run again.' },
      { type: 'widget', name: 'js-playground' },
    ],
    takeaways: [
      'A closure is a function plus the outer variables it keeps using.',
      'Closures capture variables by reference, so they see later changes.',
      'In loops, let gives each iteration its own binding; var shares one.',
    ],
  },
  {
    id: 'mitochondrion',
    subject: 'biology',
    title: 'Inside the mitochondrion',
    level: 'Beginner',
    minutes: 10,
    objective: 'Name the parts of a mitochondrion and explain how the electron transport chain and ATP synthase turn food energy into ATP.',
    kind: 'explainer',
    sections: [],
    concepts: {
      structure: { label: 'Membranes and cristae', href: '/learn/mitochondrion?step=4' },
      etc: { label: 'The electron transport chain', href: '/learn/mitochondrion?step=5' },
      synthase: { label: 'ATP synthase', href: '/learn/mitochondrion?step=6' },
      matrix: { label: 'The matrix and the citric acid cycle', href: '/learn/mitochondrion?step=7' },
    },
    takeaways: [
      'The electron transport chain pumps hydrogen ions into the intermembrane space.',
      'Ions flowing back through ATP synthase drive ATP production.',
      'Cristae fold the inner membrane to fit more of this machinery.',
    ],
  },
]

export const questions: Question[] = [
  // Big O
  { id: 'bo-1', lessonId: 'big-o', concept: 'growth', difficulty: 2, prompt: 'An algorithm is O(n). Roughly what happens to its running time if the input size doubles?', choices: [
    { id: 'a', text: 'It stays about the same', why: 'That describes O(1), constant time.' },
    { id: 'b', text: 'It roughly doubles' },
    { id: 'c', text: 'It roughly quadruples', why: 'Quadrupling when the input doubles is the signature of O(n²).' },
  ], answer: 'b', explanation: 'Linear time means work grows in proportion to the input: twice the input, about twice the work.', followUp: 'bo-1e' },
  { id: 'bo-1e', lessonId: 'big-o', concept: 'growth', difficulty: 1, remedial: true, prompt: 'What does Big O notation describe?', choices: [
    { id: 'a', text: 'The exact number of seconds a program takes', why: 'Seconds depend on the machine; Big O deliberately ignores that.' },
    { id: 'b', text: 'How the amount of work grows as the input gets larger' },
    { id: 'c', text: 'How much memory a computer has', why: 'Big O can describe memory use, but not the computer’s capacity.' },
  ], answer: 'b', explanation: 'Big O captures the shape of growth with input size, independent of hardware.' },
  { id: 'bo-2', lessonId: 'big-o', concept: 'classes', difficulty: 2, interview: true, prompt: 'Which of these grows the slowest as n becomes very large?', choices: [
    { id: 'a', text: 'O(n)', why: 'Linear growth is faster than logarithmic growth.' },
    { id: 'b', text: 'O(log n)' },
    { id: 'c', text: 'O(n²)', why: 'Quadratic growth is the fastest of these three.' },
  ], answer: 'b', explanation: 'log n grows very slowly: going from a thousand to a million items only doubles log₂ n, from about 10 to about 20.' },
  { id: 'bo-3', lessonId: 'big-o', concept: 'dominant', difficulty: 2, prompt: 'An algorithm takes n² + 5n + 100 steps. What is its Big O?', choices: [
    { id: 'a', text: 'O(n²)' },
    { id: 'b', text: 'O(n² + 5n + 100)', why: 'Correct as a count, but Big O drops smaller terms and constants.' },
    { id: 'c', text: 'O(n)', why: 'The n² term dominates the 5n term for large n.' },
  ], answer: 'a', explanation: 'Keep only the dominant term: for large n, n² outweighs 5n and 100.', followUp: 'bo-3e' },
  { id: 'bo-3e', lessonId: 'big-o', concept: 'dominant', difficulty: 1, remedial: true, prompt: 'A loop runs 3n + 20 times. What is its Big O?', choices: [
    { id: 'a', text: 'O(3n)', why: 'Constant factors such as 3 are dropped.' },
    { id: 'b', text: 'O(n)' },
    { id: 'c', text: 'O(20)', why: 'The constant 20 does not grow with n; the 3n term does.' },
  ], answer: 'b', explanation: 'Drop the constant factor and the constant term: 3n + 20 is O(n).' },
  { id: 'bo-4', lessonId: 'big-o', concept: 'classes', difficulty: 3, interview: true, prompt: 'What is the time complexity of this function?', code: 'function f(items) {\n  for (const a of items)\n    for (const b of items)\n      if (a === b) return true\n  return false\n}', choices: [
    { id: 'a', text: 'O(n)', why: 'There are two nested loops over the same input.' },
    { id: 'b', text: 'O(n²)' },
    { id: 'c', text: 'O(1)', why: 'It may return early, but Big O describes the worst case.' },
  ], answer: 'b', explanation: 'In the worst case the inner loop runs n times for each of n outer iterations: n × n.' },

  // Binary search
  { id: 'bs-1', lessonId: 'binary-search', concept: 'precondition', difficulty: 1, prompt: 'What must be true of an array before you can binary-search it?', choices: [
    { id: 'a', text: 'It must be sorted' },
    { id: 'b', text: 'It must contain no duplicates', why: 'Binary search works with duplicates; it may just find any one of them.' },
    { id: 'c', text: 'Its length must be a power of two', why: 'Any length works; mid is rounded down.' },
  ], answer: 'a', explanation: 'Only sorted order lets one comparison tell you which half cannot contain the target.' },
  { id: 'bs-2', lessonId: 'binary-search', concept: 'halving', difficulty: 2, prompt: 'Searching for 42, binary search finds sorted[mid] = 30. What happens next?', choices: [
    { id: 'a', text: 'hi = mid − 1', why: 'That discards the right half, which is where values larger than 30, such as 42, live.' },
    { id: 'b', text: 'lo = mid + 1' },
    { id: 'c', text: 'Start again from index 0', why: 'Restarting throws away everything the search has learned.' },
  ], answer: 'b', explanation: '30 < 42, so 42 can only be to the right of mid. Moving lo past mid discards the left half.', followUp: 'bs-2e' },
  { id: 'bs-2e', lessonId: 'binary-search', concept: 'halving', difficulty: 1, remedial: true, prompt: 'In the sorted array [3, 8, 15, 23, 42], is 42 to the left or the right of 15?', choices: [
    { id: 'a', text: 'To the right' },
    { id: 'b', text: 'To the left', why: 'In ascending order, larger values come later, to the right.' },
  ], answer: 'a', explanation: 'In an ascending array, values larger than the middle element are always to its right. That is why the search moves lo up.' },
  { id: 'bs-3', lessonId: 'binary-search', concept: 'complexity', difficulty: 2, interview: true, prompt: 'What is the worst-case time complexity of binary search on n sorted elements?', choices: [
    { id: 'a', text: 'O(n)', why: 'O(n) would mean checking elements one by one. Binary search halves the range each step.' },
    { id: 'b', text: 'O(log n)' },
    { id: 'c', text: 'O(n log n)', why: 'That is the cost of sorting, not of searching sorted data.' },
  ], answer: 'b', explanation: 'Halving the range each step means about log₂ n steps before it is empty.', followUp: 'bs-3e' },
  { id: 'bs-3e', lessonId: 'binary-search', concept: 'complexity', difficulty: 1, remedial: true, prompt: 'You halve a range of 16 items repeatedly. How many halvings until one item is left?', choices: [
    { id: 'a', text: '4' },
    { id: 'b', text: '8', why: '16 → 8 is only the first halving. Keep going: 8 → 4 → 2 → 1.' },
    { id: 'c', text: '16', why: 'That would be removing one item at a time, which is linear search.' },
  ], answer: 'a', explanation: '16 → 8 → 4 → 2 → 1 is four halvings, and log₂ 16 = 4. That count of halvings is what O(log n) measures.' },
  { id: 'bs-4', lessonId: 'binary-search', concept: 'boundaries', difficulty: 3, interview: true, prompt: 'With lo = 0 and hi = length − 1, what goes wrong if the loop condition is while (lo < hi)?', choices: [
    { id: 'a', text: 'Nothing; it is equivalent', why: 'Not here: when lo equals hi, one element is still unchecked.' },
    { id: 'b', text: 'The last remaining element is never compared, so some targets are missed' },
    { id: 'c', text: 'The loop never terminates', why: 'It terminates; it just stops one comparison too early.' },
  ], answer: 'b', explanation: 'When lo === hi the range still holds one candidate. lo < hi exits before checking it.' },
  { id: 'bs-5', lessonId: 'binary-search', concept: 'complexity', difficulty: 3, interview: true, prompt: 'At most how many comparisons does binary search need for about one million sorted items?', choices: [
    { id: 'a', text: 'About 20' },
    { id: 'b', text: 'About 1,000', why: '1,000 is the square root of a million, not its logarithm.' },
    { id: 'c', text: 'About 500,000', why: 'That is the average for linear search.' },
  ], answer: 'a', explanation: '2²⁰ is about 1,048,576, so about 20 halvings reduce a million items to one.' },

  // Closures
  { id: 'cl-1', lessonId: 'js-closures', concept: 'capture', difficulty: 1, prompt: 'What does a closure keep access to?', choices: [
    { id: 'a', text: 'The variables of the scope where the function was created' },
    { id: 'b', text: 'Only global variables', why: 'Closures specifically keep access to enclosing local variables.' },
    { id: 'c', text: 'The variables of whatever function calls it', why: 'That would be dynamic scope; JavaScript uses lexical scope.' },
  ], answer: 'a', explanation: 'A closure retains the variables from the scope it was written in, even after that scope has returned.' },
  { id: 'cl-2', lessonId: 'js-closures', concept: 'capture', difficulty: 2, prompt: 'What does the last line return?', code: 'const c1 = makeCounter()\nconst c2 = makeCounter()\nc1(); c1()\nc2()', choices: [
    { id: 'a', text: '1' },
    { id: 'b', text: '3', why: 'c1 and c2 do not share a count; each makeCounter call creates a new one.' },
    { id: 'c', text: '2', why: 'Two calls went to c1, not c2.' },
  ], answer: 'a', explanation: 'Each call to makeCounter creates a fresh count. c2 has been called once, so it returns 1.', followUp: 'cl-2e' },
  { id: 'cl-2e', lessonId: 'js-closures', concept: 'capture', difficulty: 1, remedial: true, prompt: 'Two counters are created with separate calls to makeCounter(). Do they share one count?', choices: [
    { id: 'a', text: 'No, each call creates its own count' },
    { id: 'b', text: 'Yes, they share the same count', why: 'let count = 0 runs again on every call, creating a new variable.' },
  ], answer: 'a', explanation: 'Every call runs let count = 0 afresh, so each returned function closes over its own variable.' },
  { id: 'cl-3', lessonId: 'js-closures', concept: 'loops', difficulty: 3, interview: true, prompt: 'What does this log?', code: 'const fns = []\nfor (var i = 0; i < 3; i++) fns.push(() => i)\nconsole.log(fns.map(f => f()))', choices: [
    { id: 'a', text: '[0, 1, 2]', why: 'That is what let would give. With var there is a single shared i.' },
    { id: 'b', text: '[3, 3, 3]' },
    { id: 'c', text: '[undefined, undefined, undefined]', why: 'i is defined; it is 3 after the loop finishes.' },
  ], answer: 'b', explanation: 'var creates one function-scoped i. All three functions read it after the loop, when it is 3.', followUp: 'cl-3e' },
  { id: 'cl-3e', lessonId: 'js-closures', concept: 'loops', difficulty: 2, remedial: true, prompt: 'Which change makes the loop log [0, 1, 2]?', choices: [
    { id: 'a', text: 'Replace var with let' },
    { id: 'b', text: 'Replace var with const', why: 'const cannot be incremented with i++, so the loop would throw.' },
    { id: 'c', text: 'Move console.log inside the loop', why: 'That changes what is logged, but the closures still share one i.' },
  ], answer: 'a', explanation: 'let creates a new binding for each iteration, so each closure captures its own i.' },
  { id: 'cl-4', lessonId: 'js-closures', concept: 'scope', difficulty: 2, interview: true, prompt: 'Why can a returned inner function still read its outer function’s local variable?', choices: [
    { id: 'a', text: 'Because the variable is copied into the global scope', why: 'Nothing is made global; the variable stays private.' },
    { id: 'b', text: 'Because the inner function keeps a reference to the scope it was created in' },
    { id: 'c', text: 'Because JavaScript never deletes local variables', why: 'Unreachable variables are garbage-collected; this one is reachable through the closure.' },
  ], answer: 'b', explanation: 'The closure holds a reference to its defining scope, which keeps those variables alive while the function exists.' },

  // Mitochondrion
  { id: 'mt-1', lessonId: 'mitochondrion', concept: 'synthase', difficulty: 1, prompt: 'Which part of the mitochondrion directly makes ATP?', choices: [
    { id: 'a', text: 'ATP synthase' },
    { id: 'b', text: 'The outer membrane', why: 'The outer membrane is a boundary with porin channels; it makes no ATP.' },
    { id: 'c', text: 'The electron transport chain', why: 'The chain builds the ion gradient; ATP synthase uses it to make ATP.' },
  ], answer: 'a', explanation: 'Hydrogen ions flowing back through ATP synthase turn its rotor, which joins ADP and phosphate.' },
  { id: 'mt-2', lessonId: 'mitochondrion', concept: 'etc', difficulty: 2, prompt: 'What does the electron transport chain use the energy from electrons for?', choices: [
    { id: 'a', text: 'Pumping hydrogen ions into the intermembrane space' },
    { id: 'b', text: 'Copying mitochondrial DNA', why: 'DNA replication happens in the matrix and is unrelated to the chain’s pumping.' },
    { id: 'c', text: 'Breaking down glucose', why: 'Glucose is broken down earlier, in glycolysis and the citric acid cycle.' },
  ], answer: 'a', explanation: 'Each complex releases energy as electrons pass toward oxygen, and that energy pumps ions across the inner membrane.', followUp: 'mt-2e' },
  { id: 'mt-2e', lessonId: 'mitochondrion', concept: 'etc', difficulty: 1, remedial: true, prompt: 'Where do the pumped hydrogen ions build up?', choices: [
    { id: 'a', text: 'In the intermembrane space' },
    { id: 'b', text: 'Outside the cell', why: 'The pumping happens across the inner mitochondrial membrane, not the cell membrane.' },
  ], answer: 'a', explanation: 'The chain pumps ions out of the matrix into the narrow gap between the two membranes.' },
  { id: 'mt-3', lessonId: 'mitochondrion', concept: 'structure', difficulty: 2, prompt: 'Why is the inner membrane folded into cristae?', choices: [
    { id: 'a', text: 'To fit more surface, and so more energy-converting proteins, into the same space' },
    { id: 'b', text: 'To let ions leak back quickly', why: 'The inner membrane is nearly impermeable to ions; that is what lets a gradient build.' },
    { id: 'c', text: 'To store ATP', why: 'ATP is not stored in the folds; it is used and remade constantly.' },
  ], answer: 'a', explanation: 'More membrane area means more transport chains and ATP synthases per mitochondrion.' },
  { id: 'mt-4', lessonId: 'mitochondrion', concept: 'matrix', difficulty: 2, prompt: 'What happens in the matrix?', choices: [
    { id: 'a', text: 'The citric acid cycle loads electrons onto NADH' },
    { id: 'b', text: 'Ions are pumped across the outer membrane', why: 'Pumping happens across the inner membrane, by the transport chain.' },
    { id: 'c', text: 'Light is captured', why: 'That is photosynthesis in chloroplasts.' },
  ], answer: 'a', explanation: 'The matrix holds the citric acid cycle, which produces the NADH that feeds the transport chain.' },
]

import { moreLessons, moreQuestions } from './lessons-more'
lessons.push(...moreLessons)
questions.push(...moreQuestions)

export const lessonById = (id: string) => lessons.find((l) => l.id === id)
export const subjectById = (id: string) => subjects.find((s) => s.id === id)
export const questionsFor = (lessonId: string) => questions.filter((q) => q.lessonId === lessonId)
export const questionById = (id: string) => questions.find((q) => q.id === id)
