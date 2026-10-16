import type { Lesson, Question } from './catalog'

/** Lessons for the remaining programming subjects and the three biology subjects. Authored and reviewed by hand. */
export const moreLessons: Lesson[] = [
  {
    id: 'html-structure',
    subject: 'html',
    title: 'HTML document structure',
    level: 'Beginner',
    minutes: 9,
    objective: 'Write a valid HTML page skeleton, read elements and attributes, and choose semantic tags that describe content.',
    kind: 'article',
    concepts: {
      skeleton: { label: 'The page skeleton', href: '#the-skeleton' },
      elements: { label: 'Elements and attributes', href: '#elements-and-attributes' },
      semantics: { label: 'Semantic HTML', href: '#semantic-html' },
    },
    sections: [
      { type: 'h', id: 'the-skeleton', text: 'The page skeleton' },
      { type: 'p', text: 'Every HTML page has the same outline. The doctype tells the browser to use modern standards mode. Inside the html element, the head holds information about the page, such as its title and character set, and the body holds everything the visitor sees.' },
      { type: 'code', lang: 'html', caption: 'A minimal, valid HTML page.', code: '<!DOCTYPE html>\n<html lang="en">\n  <head>\n    <meta charset="utf-8">\n    <title>My first page</title>\n  </head>\n  <body>\n    <h1>Hello</h1>\n    <p>This text appears in the browser window.</p>\n  </body>\n</html>' },
      { type: 'p', text: 'The browser turns this text into a tree of objects called the DOM (Document Object Model). Explore it below: each box is one element, and children sit inside their parent.' },
      { type: 'widget', name: 'html-dom' },
      { type: 'h', id: 'elements-and-attributes', text: 'Elements and attributes' },
      { type: 'p', text: 'An element is usually an opening tag, some content and a closing tag. Attributes sit inside the opening tag and add information as name="value" pairs.' },
      { type: 'code', lang: 'html', caption: 'href and alt are attributes; a and img are elements.', code: '<a href="/learn">See all lessons</a>\n<img src="heart.png" alt="Diagram of the four chambers of the heart">' },
      { type: 'callout', title: 'Void elements', text: 'Some elements, such as img, br and meta, have no content and no closing tag. The alt attribute on img is what screen readers announce, so describe the image, not the file.' },
      { type: 'h', id: 'semantic-html', text: 'Semantic HTML' },
      { type: 'p', text: 'Semantic elements name the role of their content. Browsers, search engines and assistive technology use these roles: a screen reader can jump straight to the nav or the main content.' },
      { type: 'list', items: ['header: introductory content for a page or section.', 'nav: a block of navigation links.', 'main: the main content, once per page.', 'article: a self-contained piece, such as a post.', 'footer: closing information for a page or section.'] },
      { type: 'p', text: 'Edit the page below and watch the preview update. The preview runs in a sandbox with scripts disabled.' },
      { type: 'widget', name: 'html-playground' },
    ],
    takeaways: ['head holds information about the page; body holds what the visitor sees.', 'Attributes add information to elements as name="value" pairs.', 'Semantic tags such as nav and main describe roles that assistive technology can use.'],
    next: 'css-box-model',
  },
  {
    id: 'css-box-model',
    subject: 'css',
    title: 'The CSS box model',
    level: 'Beginner',
    minutes: 9,
    objective: 'Name the four layers of the box model, calculate an element’s rendered width, and predict how vertical margins combine.',
    kind: 'article',
    concepts: {
      layers: { label: 'The four layers', href: '#four-layers' },
      sizing: { label: 'box-sizing and rendered width', href: '#box-sizing' },
      margins: { label: 'Margin collapsing', href: '#margins' },
    },
    sections: [
      { type: 'h', id: 'four-layers', text: 'The four layers' },
      { type: 'p', text: 'CSS treats every element as a rectangular box made of four layers, from the inside out: the content, the padding around it, the border around the padding, and the margin outside the border that pushes other elements away.' },
      { type: 'p', text: 'Change the values below. The preview is a real element styled with exactly these numbers.' },
      { type: 'widget', name: 'box-model' },
      { type: 'h', id: 'box-sizing', text: 'box-sizing and rendered width' },
      { type: 'p', text: 'By default (box-sizing: content-box), width sets only the content area. Padding and border are added on both sides, so an element with width: 200px, padding: 20px and border: 2px is 200 + 20 + 20 + 2 + 2 = 244 pixels wide.' },
      { type: 'code', lang: 'css', caption: 'border-box makes width include padding and border, which is easier to reason about.', code: '.card {\n  box-sizing: border-box;\n  width: 200px;     /* the whole box, border included */\n  padding: 20px;\n  border: 2px solid;\n}' },
      { type: 'h', id: 'margins', text: 'Margin collapsing' },
      { type: 'p', text: 'When two block elements sit one above the other, their vertical margins do not add up. They collapse into a single margin the size of the larger one. Horizontal margins never collapse.' },
      { type: 'callout', title: 'Example', text: 'A paragraph with margin-bottom: 30px followed by one with margin-top: 20px leaves a 30px gap, not 50px.' },
    ],
    takeaways: ['Content, padding, border, margin: from the inside out.', 'With content-box, rendered width = width + left and right padding + left and right border.', 'Adjacent vertical margins collapse to the larger one.'],
  },
  {
    id: 'c-pointers',
    subject: 'c',
    title: 'Pointers and memory in C',
    level: 'Intermediate',
    minutes: 12,
    objective: 'Explain what a pointer stores, read and write through a pointer, and use pointers to let a function change its caller’s variables.',
    kind: 'article',
    concepts: {
      address: { label: 'Addresses and the & operator', href: '#addresses' },
      deref: { label: 'Dereferencing with *', href: '#dereferencing' },
      passing: { label: 'Passing pointers to functions', href: '#pass-by-pointer' },
    },
    sections: [
      { type: 'h', id: 'addresses', text: 'Addresses and the & operator' },
      { type: 'p', text: 'Every variable lives at a location in memory with a numeric address. The & operator gives that address. A pointer is a variable whose value is an address.' },
      { type: 'code', lang: 'c', caption: 'p holds the address of x; *p reads the value stored there.', code: '#include <stdio.h>\n\nint main(void) {\n    int x = 42;\n    int *p = &x;          /* p stores the address of x */\n    printf("%d\\n", *p);  /* prints 42 */\n    *p = 7;               /* writes through the pointer */\n    printf("%d\\n", x);   /* prints 7 */\n    return 0;\n}' },
      { type: 'p', text: 'Step through the program below. The addresses are illustrative; real addresses differ on every run.' },
      { type: 'widget', name: 'c-memory' },
      { type: 'h', id: 'dereferencing', text: 'Dereferencing with *' },
      { type: 'p', text: 'In a declaration, int *p means "p is a pointer to int". In an expression, *p means "the int that p points to". Reading *p reads x; assigning to *p changes x.' },
      { type: 'callout', title: 'NULL and undefined behaviour', text: 'Dereferencing a NULL or uninitialised pointer is undefined behaviour: the program may crash, or worse, appear to work. Always point a pointer at valid memory before using it.' },
      { type: 'h', id: 'pass-by-pointer', text: 'Passing pointers to functions' },
      { type: 'p', text: 'C passes arguments by value: a function receives copies. To let a function change the caller’s variables, pass their addresses.' },
      { type: 'code', lang: 'c', caption: 'swap works only because it receives addresses.', code: 'void swap(int *a, int *b) {\n    int tmp = *a;\n    *a = *b;\n    *b = tmp;\n}\n\n/* in main: */\nint m = 1, n = 2;\nswap(&m, &n);   /* now m == 2 and n == 1 */' },
    ],
    takeaways: ['A pointer stores an address; &x gives the address of x.', '*p refers to the variable p points to, for reading and writing.', 'C passes copies, so functions change caller variables only through pointers.'],
  },
  {
    id: 'csharp-types',
    subject: 'csharp',
    title: 'Value types and reference types in C#',
    level: 'Intermediate',
    minutes: 10,
    objective: 'Predict what happens when you assign a struct versus a class, and explain why string behaves like a value even though it is a reference type.',
    kind: 'article',
    concepts: {
      value: { label: 'Value types copy their data', href: '#value-types' },
      reference: { label: 'Reference types share one object', href: '#reference-types' },
      strings: { label: 'Why string feels like a value', href: '#strings' },
    },
    sections: [
      { type: 'h', id: 'value-types', text: 'Value types copy their data' },
      { type: 'p', text: 'int, double, bool, char and every struct are value types. A variable of a value type holds the data itself, so assigning it to another variable copies the data.' },
      { type: 'h', id: 'reference-types', text: 'Reference types share one object' },
      { type: 'p', text: 'Classes, arrays and strings are reference types. A variable holds a reference to an object elsewhere in memory. Assigning it copies the reference, so both variables point at the same object.' },
      { type: 'code', lang: 'csharp', caption: 'Same assignment, different result.', code: 'struct PointS { public int X; }\nclass  PointC { public int X; }\n\nvar s1 = new PointS { X = 1 };\nvar s2 = s1;   // copies the whole struct\ns2.X = 5;      // s1.X is still 1\n\nvar c1 = new PointC { X = 1 };\nvar c2 = c1;   // copies the reference only\nc2.X = 5;      // c1.X is now 5: same object' },
      { type: 'widget', name: 'references-csharp' },
      { type: 'h', id: 'strings', text: 'Why string feels like a value' },
      { type: 'p', text: 'string is a reference type, but it is immutable: no operation changes an existing string. Methods such as ToUpper and the + operator build a new string, so code that seems to modify a string really points a variable at a new object.' },
      { type: 'callout', title: 'Interview tip', text: 'Use a struct for small, immutable data such as a coordinate. Use a class when objects have identity, change over time, or are large, because structs are copied on every assignment.' },
    ],
    takeaways: ['Assigning a struct copies its data; assigning a class copies a reference.', 'Two class variables can refer to the same object, so a change through one is seen through the other.', 'string is an immutable reference type: "changes" produce new strings.'],
  },
  {
    id: 'java-objects',
    subject: 'java',
    title: 'Objects, references and equals() in Java',
    level: 'Intermediate',
    minutes: 10,
    objective: 'Explain what a Java object variable holds, choose between == and equals(), and recognise what causes a NullPointerException.',
    kind: 'article',
    concepts: {
      references: { label: 'Variables hold references', href: '#references' },
      equality: { label: '== versus equals()', href: '#equality' },
      nulls: { label: 'null and NullPointerException', href: '#null' },
    },
    sections: [
      { type: 'h', id: 'references', text: 'Variables hold references' },
      { type: 'p', text: 'In Java, a variable of a class type does not contain the object. It contains a reference to an object on the heap. new creates an object; assignment copies only the reference.' },
      { type: 'code', lang: 'java', caption: 'One object, two references.', code: 'Dog a = new Dog("Rex");\nDog b = a;           // b refers to the same Dog\nb.setName("Max");\nSystem.out.println(a.getName()); // Max' },
      { type: 'widget', name: 'references-java' },
      { type: 'h', id: 'equality', text: '== versus equals()' },
      { type: 'p', text: 'For objects, == asks whether two references point to the same object. equals() asks whether two objects are meaningfully equal, as defined by the class. String overrides equals() to compare characters.' },
      { type: 'code', lang: 'java', caption: 'Two separate String objects with the same characters.', code: 'String s1 = new String("hi");\nString s2 = new String("hi");\nSystem.out.println(s1 == s2);      // false: different objects\nSystem.out.println(s1.equals(s2)); // true: same characters' },
      { type: 'callout', title: 'String literals', text: '"hi" == "hi" is often true because identical literals share one pooled object. Never rely on this: compare strings with equals().' },
      { type: 'h', id: 'null', text: 'null and NullPointerException' },
      { type: 'p', text: 'A reference can be null, meaning it points to no object. Calling a method or reading a field through a null reference compiles fine but throws a NullPointerException at run time.' },
    ],
    takeaways: ['Object variables hold references; assignment copies the reference, not the object.', 'Use == for "same object" and equals() for "equal content".', 'Calling a method on null throws NullPointerException at run time.'],
  },
  {
    id: 'python-variables',
    subject: 'python',
    title: 'Variables and memory in Python',
    level: 'Beginner',
    minutes: 9,
    objective: 'Describe Python variables as names bound to objects, predict the effect of mutating a shared list, and make an independent copy.',
    kind: 'article',
    concepts: {
      binding: { label: 'Names refer to objects', href: '#names-and-objects' },
      mutability: { label: 'Mutable objects are shared', href: '#mutable-objects' },
      copying: { label: 'Making a real copy', href: '#copying' },
    },
    sections: [
      { type: 'h', id: 'names-and-objects', text: 'Names refer to objects' },
      { type: 'p', text: 'A Python variable is a name that refers to an object. x = 5 binds the name x to an int object. y = x binds y to the same object. x = x + 1 creates a new int, 6, and rebinds x to it; y still refers to 5.' },
      { type: 'h', id: 'mutable-objects', text: 'Mutable objects are shared' },
      { type: 'p', text: 'Lists, dictionaries and sets are mutable: they can change in place. If two names refer to the same list, a change made through one name is visible through the other.' },
      { type: 'code', lang: 'python', caption: 'b = a does not copy the list.', code: 'a = [1, 2]\nb = a\nb.append(3)\nprint(a)        # [1, 2, 3]\nprint(a is b)   # True: one list, two names' },
      { type: 'p', text: 'Step through the trace below to watch names and objects change line by line.' },
      { type: 'widget', name: 'python-trace' },
      { type: 'h', id: 'copying', text: 'Making a real copy' },
      { type: 'p', text: 'To get an independent list, copy it: a.copy(), list(a) or a[:] all create a new list with the same items. For lists that contain other lists, copy.deepcopy copies the nested lists too.' },
    ],
    takeaways: ['Assignment binds a name to an object; it never copies the object.', 'Changing a mutable object through one name is visible through every name that refers to it.', 'Use a.copy() or list(a) for a new list; copy.deepcopy for nested data.'],
  },
  {
    id: 'heart',
    subject: 'anatomy',
    title: 'The human heart',
    level: 'Beginner',
    minutes: 12,
    objective: 'Name the four chambers of the heart, trace blood through the pulmonary and systemic circuits, and explain what the valves do.',
    kind: 'article',
    concepts: {
      chambers: { label: 'The four chambers', href: '#four-chambers' },
      circuits: { label: 'The two circuits', href: '#two-circuits' },
      valves: { label: 'Valves', href: '#valves' },
    },
    sections: [
      { type: 'h', id: 'four-chambers', text: 'The four chambers' },
      { type: 'p', text: 'The heart is a muscular pump with four chambers. The two upper chambers, the atria, receive blood. The two lower chambers, the ventricles, pump it out. A wall called the septum separates the right side from the left.' },
      { type: 'list', items: [
        'Right atrium: receives deoxygenated blood from the body through the superior and inferior venae cavae.',
        'Right ventricle: pumps that blood to the lungs through the pulmonary artery.',
        'Left atrium: receives oxygenated blood from the lungs through the pulmonary veins.',
        'Left ventricle: pumps oxygenated blood to the whole body through the aorta. Its wall is the thickest.',
      ] },
      { type: 'p', text: 'Turn the model, tap a chamber, and follow the blood. Blue marks deoxygenated blood and red marks oxygenated blood; in the body, deoxygenated blood is dark red, not blue.' },
      { type: 'widget', name: 'heart' },
      { type: 'h', id: 'two-circuits', text: 'The two circuits' },
      { type: 'p', text: 'Blood passes through the heart twice on each trip around the body. The pulmonary circuit (right side) sends blood to the lungs to pick up oxygen and release carbon dioxide. The systemic circuit (left side) sends oxygenated blood to every other organ.' },
      { type: 'callout', title: 'Arteries and veins', text: 'Arteries carry blood away from the heart and veins carry it toward the heart. That is why the pulmonary artery carries deoxygenated blood and the pulmonary veins carry oxygenated blood.' },
      { type: 'h', id: 'valves', text: 'Valves' },
      { type: 'p', text: 'Four valves keep blood flowing one way. The tricuspid valve sits between the right atrium and right ventricle, and the mitral (bicuspid) valve between the left atrium and left ventricle. The pulmonary and aortic valves guard the exits to the pulmonary artery and the aorta. The "lub-dub" of a heartbeat is the sound of valves closing.' },
    ],
    takeaways: ['Atria receive blood; ventricles pump it out.', 'Right side: body to lungs. Left side: lungs to body.', 'Valves prevent backflow; arteries carry blood away from the heart.'],
  },
  {
    id: 'photosynthesis',
    subject: 'botany',
    title: 'Photosynthesis',
    level: 'Beginner',
    minutes: 11,
    objective: 'State the inputs and outputs of photosynthesis, say where each stage happens in the chloroplast, and explain what a limiting factor is.',
    kind: 'article',
    concepts: {
      equation: { label: 'Inputs and outputs', href: '#inputs-and-outputs' },
      chloroplast: { label: 'Inside the chloroplast', href: '#where-it-happens' },
      limits: { label: 'Limiting factors', href: '#limiting-factors' },
    },
    sections: [
      { type: 'h', id: 'inputs-and-outputs', text: 'Inputs and outputs' },
      { type: 'p', text: 'Photosynthesis uses light energy to turn carbon dioxide and water into glucose, releasing oxygen. The overall equation is 6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂.' },
      { type: 'list', items: ['Carbon dioxide enters the leaf through pores called stomata.', 'Water is drawn up from the roots through the xylem.', 'Light is absorbed by chlorophyll, the green pigment.', 'Oxygen leaves through the stomata; glucose is used for energy or stored as starch.'] },
      { type: 'h', id: 'where-it-happens', text: 'Inside the chloroplast' },
      { type: 'p', text: 'Photosynthesis happens in chloroplasts, mostly in the mesophyll cells of leaves. It runs in two linked stages.' },
      { type: 'list', items: ['Light-dependent reactions, in the thylakoid membranes: light energy splits water, releasing oxygen, and makes ATP and NADPH.', 'The Calvin cycle, in the stroma: ATP and NADPH power the fixing of carbon dioxide into sugar.'] },
      { type: 'widget', name: 'plant-cell' },
      { type: 'callout', title: 'Where the oxygen comes from', text: 'The oxygen released comes from the water molecules, not from carbon dioxide. Isotope-labelling experiments in the 1940s showed this.' },
      { type: 'h', id: 'limiting-factors', text: 'Limiting factors' },
      { type: 'p', text: 'The rate of photosynthesis is held back by whichever input is in shortest supply, called the limiting factor. In bright light with little carbon dioxide, adding more light changes little; adding carbon dioxide speeds things up.' },
      { type: 'p', text: 'Experiment below. This is a simplified teaching model: real rates also depend on temperature, the species and how long conditions last.' },
      { type: 'widget', name: 'photosynthesis' },
    ],
    takeaways: ['Inputs: carbon dioxide, water, light. Outputs: glucose and oxygen.', 'Light-dependent reactions in the thylakoids; the Calvin cycle in the stroma.', 'The scarcest input limits the overall rate.'],
  },
]

export const moreQuestions: Question[] = [
  // HTML
  { id: 'ht-1', lessonId: 'html-structure', concept: 'skeleton', difficulty: 1, prompt: 'Which element holds the content that appears in the browser window?', choices: [
    { id: 'a', text: '<head>', why: 'head holds information about the page, such as its title, not the visible content.' },
    { id: 'b', text: '<body>' },
    { id: 'c', text: '<title>', why: 'title sets the text in the browser tab, not the page content.' },
  ], answer: 'b', explanation: 'Everything the visitor sees goes inside body.' },
  { id: 'ht-2', lessonId: 'html-structure', concept: 'elements', difficulty: 2, prompt: 'In <a href="/learn">Lessons</a>, what is href?', choices: [
    { id: 'a', text: 'An attribute of the a element' },
    { id: 'b', text: 'A separate element', why: 'Elements have their own tags; href sits inside the opening tag of a.' },
    { id: 'c', text: 'The link text', why: 'The link text is "Lessons", the content between the tags.' },
  ], answer: 'a', explanation: 'Attributes are name="value" pairs inside an opening tag; href gives the link destination.', followUp: 'ht-2e' },
  { id: 'ht-2e', lessonId: 'html-structure', concept: 'elements', difficulty: 1, remedial: true, prompt: 'In <img src="cat.jpg" alt="A cat asleep">, which attribute is read aloud by screen readers?', choices: [
    { id: 'a', text: 'alt' },
    { id: 'b', text: 'src', why: 'src is the file location; it means nothing to a listener.' },
  ], answer: 'a', explanation: 'alt describes the image for people who cannot see it.' },
  { id: 'ht-3', lessonId: 'html-structure', concept: 'semantics', difficulty: 2, interview: true, prompt: 'Why use <nav> rather than <div class="nav"> for a menu?', choices: [
    { id: 'a', text: 'It tells browsers and assistive technology that the block is navigation' },
    { id: 'b', text: 'It renders faster', why: 'There is no meaningful speed difference; the benefit is meaning.' },
    { id: 'c', text: 'div is deprecated', why: 'div is valid HTML; it simply carries no meaning.' },
  ], answer: 'a', explanation: 'Semantic elements expose roles, so screen-reader users can jump to the navigation directly.' },
  { id: 'ht-4', lessonId: 'html-structure', concept: 'skeleton', difficulty: 3, prompt: 'What does <!DOCTYPE html> do?', choices: [
    { id: 'a', text: 'Makes the browser render the page in standards mode' },
    { id: 'b', text: 'Loads the HTML library', why: 'HTML needs no library; the doctype is an instruction to the parser.' },
    { id: 'c', text: 'Displays a heading', why: 'It is not an element and shows nothing on the page.' },
  ], answer: 'a', explanation: 'Without it, browsers fall back to "quirks mode", which imitates old, inconsistent behaviour.' },

  // CSS
  { id: 'bx-1', lessonId: 'css-box-model', concept: 'layers', difficulty: 1, prompt: 'Which layer sits between the content and the border?', choices: [
    { id: 'a', text: 'Padding' },
    { id: 'b', text: 'Margin', why: 'Margin is outside the border.' },
    { id: 'c', text: 'Outline', why: 'Outline is drawn outside the border and takes no layout space; it is not one of the four layers.' },
  ], answer: 'a', explanation: 'Inside out: content, padding, border, margin.' },
  { id: 'bx-2', lessonId: 'css-box-model', concept: 'sizing', difficulty: 2, interview: true, prompt: 'width: 200px; padding: 20px; border: 2px solid; with the default box-sizing. How wide is the element on screen?', choices: [
    { id: 'a', text: '244px' },
    { id: 'b', text: '200px', why: 'That would be true with box-sizing: border-box, not the default content-box.' },
    { id: 'c', text: '222px', why: 'Padding and border apply to both sides: 20 + 20 and 2 + 2.' },
  ], answer: 'a', explanation: '200 + 20 + 20 + 2 + 2 = 244. With content-box, width covers only the content.', followUp: 'bx-2e' },
  { id: 'bx-2e', lessonId: 'css-box-model', concept: 'sizing', difficulty: 1, remedial: true, prompt: 'With box-sizing: border-box and width: 200px, how wide is the element, border included?', choices: [
    { id: 'a', text: '200px' },
    { id: 'b', text: '244px', why: 'border-box folds padding and border into the 200px.' },
  ], answer: 'a', explanation: 'border-box makes width mean the whole box, which is why many stylesheets set it everywhere.' },
  { id: 'bx-3', lessonId: 'css-box-model', concept: 'margins', difficulty: 3, prompt: 'A paragraph with margin-bottom: 30px is followed by one with margin-top: 20px. What is the gap between them?', choices: [
    { id: 'a', text: '30px' },
    { id: 'b', text: '50px', why: 'Vertical margins between stacked blocks collapse rather than add.' },
    { id: 'c', text: '20px', why: 'When margins collapse, the larger one wins.' },
  ], answer: 'a', explanation: 'Adjacent vertical margins collapse to the larger value.' },

  // C
  { id: 'cp-1', lessonId: 'c-pointers', concept: 'address', difficulty: 1, prompt: 'In C, what does &x give you?', choices: [
    { id: 'a', text: 'The address of x' },
    { id: 'b', text: 'The value of x', why: 'Plain x gives the value; & gives where it is stored.' },
    { id: 'c', text: 'A copy of x', why: 'Nothing is copied; & reports a location.' },
  ], answer: 'a', explanation: '& is the address-of operator. Store the result in a pointer, such as int *p = &x.' },
  { id: 'cp-2', lessonId: 'c-pointers', concept: 'deref', difficulty: 2, prompt: 'After int x = 5; int *p = &x; *p = 9; what is x?', choices: [
    { id: 'a', text: '9' },
    { id: 'b', text: '5', why: '*p = 9 writes to the variable p points to, which is x.' },
    { id: 'c', text: 'The address of x', why: 'x is an int; it holds a number, not an address.' },
  ], answer: 'a', explanation: 'Assigning through *p changes the variable at that address.', followUp: 'cp-2e' },
  { id: 'cp-2e', lessonId: 'c-pointers', concept: 'deref', difficulty: 1, remedial: true, prompt: 'If p holds the address of x, what does *p refer to?', choices: [
    { id: 'a', text: 'x itself' },
    { id: 'b', text: 'The address of p', why: 'That would be &p. *p follows the address stored in p.' },
  ], answer: 'a', explanation: '*p means "the variable at the address in p", so *p is x.' },
  { id: 'cp-3', lessonId: 'c-pointers', concept: 'passing', difficulty: 3, interview: true, prompt: 'Why does void swap(int a, int b) fail to swap the caller’s variables?', choices: [
    { id: 'a', text: 'C passes copies of the arguments, so only the copies are swapped' },
    { id: 'b', text: 'swap is a reserved word', why: 'swap is an ordinary identifier.' },
    { id: 'c', text: 'The function must return the swapped values', why: 'A function returns one value; the fix is to pass addresses.' },
  ], answer: 'a', explanation: 'C is pass-by-value. Passing &m and &n lets swap reach the originals.' },

  // C#
  { id: 'cn-1', lessonId: 'csharp-types', concept: 'value', difficulty: 1, prompt: 'Is int a value type or a reference type in C#?', choices: [
    { id: 'a', text: 'A value type' },
    { id: 'b', text: 'A reference type', why: 'Built-in numeric types are structs, which are value types.' },
  ], answer: 'a', explanation: 'int is an alias for System.Int32, a struct, so assignment copies the number.' },
  { id: 'cn-2', lessonId: 'csharp-types', concept: 'reference', difficulty: 2, prompt: 'PointC is a class. After var c1 = new PointC { X = 1 }; var c2 = c1; c2.X = 5; what is c1.X?', choices: [
    { id: 'a', text: '5' },
    { id: 'b', text: '1', why: 'That would be true for a struct. For a class, c1 and c2 refer to one object.' },
  ], answer: 'a', explanation: 'Assigning a class variable copies the reference, so c2.X = 5 changes the shared object.', followUp: 'cn-2e' },
  { id: 'cn-2e', lessonId: 'csharp-types', concept: 'reference', difficulty: 1, remedial: true, prompt: 'When you assign one class variable to another, what is copied?', choices: [
    { id: 'a', text: 'The reference to the object' },
    { id: 'b', text: 'The whole object', why: 'Only structs are copied whole. Classes share one object.' },
  ], answer: 'a', explanation: 'Both variables now refer to the same object.' },
  { id: 'cn-3', lessonId: 'csharp-types', concept: 'strings', difficulty: 3, interview: true, prompt: 'string is a reference type. Why does s2 = s1; s2 += "!"; leave s1 unchanged?', choices: [
    { id: 'a', text: 'Strings are immutable, so += creates a new string and points s2 at it' },
    { id: 'b', text: 'string is secretly a struct', why: 'string is a class (System.String).' },
    { id: 'c', text: 'The compiler copies strings on assignment', why: 'Assignment copies the reference; immutability is what protects s1.' },
  ], answer: 'a', explanation: 'No string is ever changed in place; operations produce new string objects.' },

  // Java
  { id: 'jv-1', lessonId: 'java-objects', concept: 'references', difficulty: 1, prompt: 'After Dog a = new Dog("Rex"); Dog b = a; how many Dog objects exist?', choices: [
    { id: 'a', text: 'One' },
    { id: 'b', text: 'Two', why: 'Only new creates objects. b = a copies the reference.' },
  ], answer: 'a', explanation: 'a and b are two references to a single object.' },
  { id: 'jv-2', lessonId: 'java-objects', concept: 'equality', difficulty: 2, interview: true, prompt: 'What does new String("hi") == new String("hi") evaluate to?', choices: [
    { id: 'a', text: 'false' },
    { id: 'b', text: 'true', why: '== compares references, and new creates two different objects.' },
  ], answer: 'a', explanation: 'Use equals() to compare the characters; it returns true here.', followUp: 'jv-2e' },
  { id: 'jv-2e', lessonId: 'java-objects', concept: 'equality', difficulty: 1, remedial: true, prompt: 'Which compares the characters of two Strings?', choices: [
    { id: 'a', text: 's1.equals(s2)' },
    { id: 'b', text: 's1 == s2', why: '== asks whether they are the same object.' },
  ], answer: 'a', explanation: 'String overrides equals() to compare content.' },
  { id: 'jv-3', lessonId: 'java-objects', concept: 'nulls', difficulty: 2, prompt: 'Dog d = null; d.bark(); What happens?', choices: [
    { id: 'a', text: 'A NullPointerException is thrown at run time' },
    { id: 'b', text: 'It does not compile', why: 'The compiler accepts it; the failure happens when the line runs.' },
    { id: 'c', text: 'bark() returns null', why: 'There is no object to run bark() on.' },
  ], answer: 'a', explanation: 'Calling a method through a null reference throws NullPointerException.' },

  // Python
  { id: 'py-1', lessonId: 'python-variables', concept: 'binding', difficulty: 1, prompt: 'After x = 5; y = x; x = x + 1, what is y?', choices: [
    { id: 'a', text: '5' },
    { id: 'b', text: '6', why: 'x + 1 makes a new int and rebinds only x; y still refers to 5.' },
  ], answer: 'a', explanation: 'Ints are immutable. Rebinding x does not affect y.' },
  { id: 'py-2', lessonId: 'python-variables', concept: 'mutability', difficulty: 2, interview: true, prompt: 'a = [1, 2]; b = a; b.append(3). What is a?', choices: [
    { id: 'a', text: '[1, 2, 3]' },
    { id: 'b', text: '[1, 2]', why: 'b = a does not copy the list; both names refer to one list.' },
  ], answer: 'a', explanation: 'append changes the shared list in place.', followUp: 'py-2e' },
  { id: 'py-2e', lessonId: 'python-variables', concept: 'mutability', difficulty: 1, remedial: true, prompt: 'Does b = a make a copy of the list a?', choices: [
    { id: 'a', text: 'No, both names refer to the same list' },
    { id: 'b', text: 'Yes, b gets its own copy', why: 'Assignment only binds a name; use a.copy() for a copy.' },
  ], answer: 'a', explanation: 'a is b would print True.' },
  { id: 'py-3', lessonId: 'python-variables', concept: 'copying', difficulty: 2, prompt: 'Which line gives b an independent copy of the list a?', choices: [
    { id: 'a', text: 'b = a.copy()' },
    { id: 'b', text: 'b = a', why: 'That binds a second name to the same list.' },
    { id: 'c', text: 'b = a is a', why: 'That stores the boolean True.' },
  ], answer: 'a', explanation: 'a.copy(), list(a) and a[:] all make a new list.' },

  // Heart
  { id: 'ha-1', lessonId: 'heart', concept: 'chambers', difficulty: 1, prompt: 'Which chamber pumps blood out to the whole body?', choices: [
    { id: 'a', text: 'Left ventricle' },
    { id: 'b', text: 'Right ventricle', why: 'The right ventricle pumps blood to the lungs.' },
    { id: 'c', text: 'Left atrium', why: 'Atria receive blood; the left atrium receives it from the lungs.' },
  ], answer: 'a', explanation: 'The left ventricle pumps oxygenated blood into the aorta.' },
  { id: 'ha-2', lessonId: 'heart', concept: 'circuits', difficulty: 2, prompt: 'Which vessel carries deoxygenated blood from the heart to the lungs?', choices: [
    { id: 'a', text: 'Pulmonary artery' },
    { id: 'b', text: 'Pulmonary vein', why: 'Pulmonary veins carry oxygenated blood from the lungs back to the heart.' },
    { id: 'c', text: 'Aorta', why: 'The aorta carries oxygenated blood to the body.' },
  ], answer: 'a', explanation: 'Arteries leave the heart; the pulmonary artery leaves the right ventricle for the lungs.', followUp: 'ha-2e' },
  { id: 'ha-2e', lessonId: 'heart', concept: 'circuits', difficulty: 1, remedial: true, prompt: 'Arteries carry blood ...', choices: [
    { id: 'a', text: 'away from the heart' },
    { id: 'b', text: 'toward the heart', why: 'Veins carry blood toward the heart.' },
  ], answer: 'a', explanation: 'Direction, not oxygen level, defines an artery.' },
  { id: 'ha-3', lessonId: 'heart', concept: 'chambers', difficulty: 2, interview: true, prompt: 'Why is the wall of the left ventricle thicker than the right?', choices: [
    { id: 'a', text: 'It must generate higher pressure to push blood around the whole body' },
    { id: 'b', text: 'It pumps a larger volume of blood', why: 'Both ventricles pump about the same volume per beat; the left works against more resistance.' },
    { id: 'c', text: 'It receives blood from the lungs', why: 'That is the left atrium’s job.' },
  ], answer: 'a', explanation: 'The systemic circuit is far longer and higher-pressure than the pulmonary circuit.' },
  { id: 'ha-4', lessonId: 'heart', concept: 'valves', difficulty: 2, prompt: 'What is the main job of the heart valves?', choices: [
    { id: 'a', text: 'Keeping blood flowing in one direction' },
    { id: 'b', text: 'Adding oxygen to the blood', why: 'Oxygen is picked up in the lungs.' },
    { id: 'c', text: 'Producing blood cells', why: 'Blood cells are made in bone marrow.' },
  ], answer: 'a', explanation: 'Valves close to stop backflow, which is also what makes the heartbeat sounds.' },

  // Photosynthesis
  { id: 'ph-1', lessonId: 'photosynthesis', concept: 'equation', difficulty: 1, prompt: 'Which gas does photosynthesis release?', choices: [
    { id: 'a', text: 'Oxygen' },
    { id: 'b', text: 'Carbon dioxide', why: 'Carbon dioxide is taken in, not released.' },
  ], answer: 'a', explanation: 'Oxygen is a by-product of splitting water.' },
  { id: 'ph-2', lessonId: 'photosynthesis', concept: 'chloroplast', difficulty: 2, prompt: 'Where in the chloroplast does the Calvin cycle take place?', choices: [
    { id: 'a', text: 'The stroma' },
    { id: 'b', text: 'The thylakoid membranes', why: 'The thylakoids host the light-dependent reactions.' },
    { id: 'c', text: 'The mitochondria', why: 'Mitochondria are separate organelles used in respiration.' },
  ], answer: 'a', explanation: 'The Calvin cycle uses ATP and NADPH in the stroma to fix carbon dioxide.', followUp: 'ph-2e' },
  { id: 'ph-2e', lessonId: 'photosynthesis', concept: 'chloroplast', difficulty: 1, remedial: true, prompt: 'Which organelle carries out photosynthesis?', choices: [
    { id: 'a', text: 'The chloroplast' },
    { id: 'b', text: 'The mitochondrion', why: 'Mitochondria release energy from food; chloroplasts capture light energy.' },
  ], answer: 'a', explanation: 'Chloroplasts contain chlorophyll and both stages of photosynthesis.' },
  { id: 'ph-3', lessonId: 'photosynthesis', concept: 'limits', difficulty: 2, interview: true, prompt: 'A plant is in bright light but very low carbon dioxide. What happens if you add more light?', choices: [
    { id: 'a', text: 'Little changes, because carbon dioxide is the limiting factor' },
    { id: 'b', text: 'The rate rises a lot', why: 'Light is already plentiful; the scarce input sets the rate.' },
  ], answer: 'a', explanation: 'Raising a factor that is not limiting has little effect.' },
  { id: 'ph-4', lessonId: 'photosynthesis', concept: 'equation', difficulty: 3, prompt: 'The oxygen released by photosynthesis comes from which molecule?', choices: [
    { id: 'a', text: 'Water' },
    { id: 'b', text: 'Carbon dioxide', why: 'Isotope experiments showed the oxygen atoms come from water.' },
  ], answer: 'a', explanation: 'Water is split in the light-dependent reactions, releasing oxygen.' },
]
