import { subjectById, type Lesson, type SubjectId } from '../content/catalog'

// Ordered: more specific languages first so "C#" is not read as "C", and "JavaScript" not as "Java".
const RULES: [SubjectId, RegExp][] = [
  ['csharp', /\bc#|\bc sharp\b|\.net\b|\bcsharp\b|\blinq\b|\bstruct\b.*\bclass\b/i],
  ['javascript', /\bjavascript\b|\bjs\b|\bnode(\.js)?\b|\bclosure|\bpromise|\basync\b|\bawait\b|\b(let|const|var)\b.*=|=>|\bdom event|\bbinary search\b|\bbig o\b/i],
  ['java', /\bjava\b(?!script)|\bjvm\b|\bnullpointerexception\b|\.equals\(|\bpublic static void main\b/i],
  ['python', /\bpython\b|\bdef \w+\(|\bpip\b|\blist comprehension|\bdictionar(y|ies)\b|\btuple\b|\bself\b|\.append\(/i],
  ['c', /\bc language\b|\bin c\b|\bpointer|\bmalloc\b|\bprintf\b|\bstruct\b|\bsegfault|\bsegmentation fault|\b&\w+\b|\*\w+\s*=/i],
  ['css', /\bcss\b|\bflexbox\b|\bgrid\b|\bmargin\b|\bpadding\b|\bbox model\b|\bselector|\bmedia quer/i],
  ['html', /\bhtml\b|<\w+[^>]*>|\bsemantic (tag|element)|\bdom\b|\bdoctype\b|\battribute\b/i],
  ['anatomy', /\bheart\b|\bventricle|\batri(um|a)\b|\bvalve|\bblood|\bartery|\bvein|\blung|\bskeleton|\bbone|\bmuscle|\bkidney|\bbrain|\bnerve|\borgan\b/i],
  ['botany', /\bphotosynth|\bchloroplast|\bstomat|\bxylem|\bphloem|\bplant|\bleaf|\broot\b|\bstem\b|\bflower|\bpollinat/i],
  ['biology', /\bcell\b|\bmitochondri|\batp\b|\bdna\b|\brna\b|\bnucleus|\bmitosis|\bmeiosis|\bprotein|\benzyme|\bgene|\borganelle/i],
]

export function detectSubject(text: string): SubjectId | null {
  for (const [id, re] of RULES) if (re.test(text)) return id
  return null
}

export interface ContextPayload {
  domain?: 'programming' | 'biology'
  course?: string
  subject?: string
  lessonTitle?: string
  topic?: string
  objective?: string
  concepts?: string[]
  takeaways?: string[]
}

/** What the server is told about where the learner is: the open lesson, active subject/topic, else the subject of this or earlier questions. */
export function buildContext(
  lesson: Lesson | undefined,
  question: string,
  history: string[],
  activeSubjectId?: SubjectId | null,
  activeTopic?: string | null,
): ContextPayload | null {
  if (lesson) {
    const s = subjectById(lesson.subject)
    const ctx: ContextPayload = {
      domain: s?.domain,
      subject: s?.name,
      lessonTitle: lesson.title,
      objective: lesson.objective,
      concepts: Object.values(lesson.concepts).map((c) => c.label),
      takeaways: lesson.takeaways,
    }
    if (s?.domain) ctx.course = s.domain === 'programming' ? 'Computer Programming' : 'Biology and Life Sciences'
    if (activeTopic) ctx.topic = activeTopic
    return ctx
  }
  const id = activeSubjectId ?? detectSubject(question) ?? [...history].reverse().map(detectSubject).find((x) => x) ?? null
  if (!id) return activeTopic ? { topic: activeTopic } : null
  const s = subjectById(id)
  if (!s) return activeTopic ? { topic: activeTopic } : null
  const ctx: ContextPayload = { domain: s.domain, subject: s.name }
  if (activeTopic) ctx.topic = activeTopic
  return ctx
}

