export interface TenseGuide {
  tense: string
  name: string
  description: string
  examples: Array<{ es: string; en: string }>
  formation: {
    headers: string[]
    rows: Array<{ pronoun: string; forms: string[] }>
    note?: string
  }
  irregulars?: {
    verbs: string[]
    rows: Array<{ pronoun: string; forms: string[] }>
  }
  triggerWords: string[]
  contrastNote?: string
}

const GUIDES: TenseGuide[] = [
  {
    tense: 'present',
    name: 'Present (Presente)',
    description: 'Expresses current states, habitual actions, and general truths.',
    examples: [
      { es: 'Yo **hablo** español todos los días.', en: 'I speak Spanish every day.' },
      { es: 'Ella **come** en el restaurante.', en: 'She eats at the restaurant.' },
    ],
    formation: {
      headers: ['-AR (hablar)', '-ER (comer)', '-IR (vivir)'],
      rows: [
        { pronoun: 'yo',        forms: ['hablo',    'como',    'vivo']   },
        { pronoun: 'tú',        forms: ['hablas',   'comes',   'vives']  },
        { pronoun: 'él/ella',   forms: ['habla',    'come',    'vive']   },
        { pronoun: 'nosotros',  forms: ['hablamos', 'comemos', 'vivimos'] },
        { pronoun: 'vosotros',  forms: ['habláis',  'coméis',  'vivís']  },
        { pronoun: 'ellos',     forms: ['hablan',   'comen',   'viven']  },
      ],
      note: 'Many verbs have stem changes: e→ie (querer→quiero), o→ue (poder→puedo), e→i (pedir→pido).',
    },
    irregulars: {
      verbs: ['ser', 'ir', 'tener', 'estar'],
      rows: [
        { pronoun: 'yo',       forms: ['soy',   'voy',   'tengo',  'estoy']  },
        { pronoun: 'tú',       forms: ['eres',  'vas',   'tienes', 'estás']  },
        { pronoun: 'él/ella',  forms: ['es',    'va',    'tiene',  'está']   },
        { pronoun: 'nosotros', forms: ['somos', 'vamos', 'tenemos','estamos'] },
        { pronoun: 'vosotros', forms: ['sois',  'vais',  'tenéis', 'estáis'] },
        { pronoun: 'ellos',    forms: ['son',   'van',   'tienen', 'están']  },
      ],
    },
    triggerWords: ['ahora', 'hoy', 'siempre', 'nunca', 'a veces', 'normalmente', 'generalmente', 'todos los días'],
  },
  {
    tense: 'preterite',
    name: 'Preterite (Pretérito Indefinido)',
    description: 'Expresses completed past actions with a clear beginning or end.',
    examples: [
      { es: 'Ayer yo **hablé** con mi madre.', en: 'Yesterday I spoke with my mother.' },
      { es: 'Ellos **comieron** pizza anoche.', en: 'They ate pizza last night.' },
    ],
    formation: {
      headers: ['-AR (hablar)', '-ER (comer)', '-IR (vivir)'],
      rows: [
        { pronoun: 'yo',        forms: ['hablé',      'comí',      'viví']      },
        { pronoun: 'tú',        forms: ['hablaste',   'comiste',   'viviste']   },
        { pronoun: 'él/ella',   forms: ['habló',      'comió',     'vivió']     },
        { pronoun: 'nosotros',  forms: ['hablamos',   'comimos',   'vivimos']   },
        { pronoun: 'vosotros',  forms: ['hablasteis', 'comisteis', 'vivisteis'] },
        { pronoun: 'ellos',     forms: ['hablaron',   'comieron',  'vivieron']  },
      ],
      note: '-ER and -IR share the same endings. Nosotros is identical to present for -AR/-IR.',
    },
    irregulars: {
      verbs: ['ser/ir', 'tener', 'hacer', 'estar'],
      rows: [
        { pronoun: 'yo',       forms: ['fui',     'tuve',     'hice',    'estuve']     },
        { pronoun: 'tú',       forms: ['fuiste',  'tuviste',  'hiciste', 'estuviste']  },
        { pronoun: 'él/ella',  forms: ['fue',     'tuvo',     'hizo',    'estuvo']     },
        { pronoun: 'nosotros', forms: ['fuimos',  'tuvimos',  'hicimos', 'estuvimos']  },
        { pronoun: 'vosotros', forms: ['fuisteis','tuvisteis','hicisteis','estuvisteis'] },
        { pronoun: 'ellos',    forms: ['fueron',  'tuvieron', 'hicieron','estuvieron'] },
      ],
    },
    triggerWords: ['ayer', 'anoche', 'la semana pasada', 'el año pasado', 'hace…', 'de repente', 'entonces', 'una vez', 'en 1990'],
    contrastNote: 'Use preterite for completed events; use imperfect for ongoing states or habitual past actions.',
  },
  {
    tense: 'imperfect',
    name: 'Imperfect (Pretérito Imperfecto)',
    description: 'Describes ongoing/habitual past states and background context.',
    examples: [
      { es: 'De niño, yo **hablaba** con mis abuelos.', en: 'As a child, I used to speak with my grandparents.' },
      { es: 'Ella **comía** cuando sonó el teléfono.', en: 'She was eating when the phone rang.' },
    ],
    formation: {
      headers: ['-AR (hablar)', '-ER (comer)', '-IR (vivir)'],
      rows: [
        { pronoun: 'yo',        forms: ['hablaba',   'comía',   'vivía']   },
        { pronoun: 'tú',        forms: ['hablabas',  'comías',  'vivías']  },
        { pronoun: 'él/ella',   forms: ['hablaba',   'comía',   'vivía']   },
        { pronoun: 'nosotros',  forms: ['hablábamos','comíamos','vivíamos'] },
        { pronoun: 'vosotros',  forms: ['hablabais', 'comíais', 'vivíais'] },
        { pronoun: 'ellos',     forms: ['hablaban',  'comían',  'vivían']  },
      ],
      note: '-ER and -IR share the same endings. Only 3 truly irregular verbs exist.',
    },
    irregulars: {
      verbs: ['ser', 'ir', 'ver'],
      rows: [
        { pronoun: 'yo',       forms: ['era',   'iba',   'veía']   },
        { pronoun: 'tú',       forms: ['eras',  'ibas',  'veías']  },
        { pronoun: 'él/ella',  forms: ['era',   'iba',   'veía']   },
        { pronoun: 'nosotros', forms: ['éramos','íbamos','veíamos'] },
        { pronoun: 'vosotros', forms: ['erais', 'ibais', 'veíais'] },
        { pronoun: 'ellos',    forms: ['eran',  'iban',  'veían']  },
      ],
    },
    triggerWords: ['siempre', 'nunca', 'a veces', 'todos los días', 'de niño/a', 'cuando era', 'cada vez', 'mientras'],
    contrastNote: 'Use imperfect for background, habitual, or interrupted past actions; use preterite for completed single events.',
  },
  {
    tense: 'future',
    name: 'Future (Futuro Simple)',
    description: 'Expresses future events, predictions, and probability about the present.',
    examples: [
      { es: 'Mañana yo **hablaré** con el director.', en: 'Tomorrow I will speak with the director.' },
      { es: '¿Dónde **estará** mi llave?', en: 'Where could my key be? (probability)' },
    ],
    formation: {
      headers: ['-AR (hablar)', '-ER (comer)', '-IR (vivir)'],
      rows: [
        { pronoun: 'yo',        forms: ['hablaré',    'comeré',    'viviré']    },
        { pronoun: 'tú',        forms: ['hablarás',   'comerás',   'vivirás']   },
        { pronoun: 'él/ella',   forms: ['hablará',    'comerá',    'vivirá']    },
        { pronoun: 'nosotros',  forms: ['hablaremos', 'comeremos', 'viviremos'] },
        { pronoun: 'vosotros',  forms: ['hablaréis',  'comeréis',  'viviréis']  },
        { pronoun: 'ellos',     forms: ['hablarán',   'comerán',   'vivirán']   },
      ],
      note: 'Add endings to the full infinitive (no stem change). All conjugations carry an accent except nosotros.',
    },
    irregulars: {
      verbs: ['tener→tendr-', 'hacer→har-', 'poder→podr-', 'salir→saldr-'],
      rows: [
        { pronoun: 'yo',       forms: ['tendré',    'haré',    'podré',    'saldré']    },
        { pronoun: 'tú',       forms: ['tendrás',   'harás',   'podrás',   'saldrás']   },
        { pronoun: 'él/ella',  forms: ['tendrá',    'hará',    'podrá',    'saldrá']    },
        { pronoun: 'nosotros', forms: ['tendremos', 'haremos', 'podremos', 'saldremos'] },
        { pronoun: 'vosotros', forms: ['tendréis',  'haréis',  'podréis',  'saldréis']  },
        { pronoun: 'ellos',    forms: ['tendrán',   'harán',   'podrán',   'saldrán']   },
      ],
    },
    triggerWords: ['mañana', 'la próxima semana', 'el año que viene', 'algún día', 'pronto', 'en el futuro'],
  },
  {
    tense: 'conditional',
    name: 'Conditional (Condicional Simple)',
    description: 'Expresses hypothetical situations, polite requests, and future-in-the-past.',
    examples: [
      { es: 'Yo **hablaría** más si tuviera tiempo.', en: 'I would speak more if I had time.' },
      { es: '¿Me **podrías** ayudar?', en: 'Could you help me? (polite)' },
    ],
    formation: {
      headers: ['-AR (hablar)', '-ER (comer)', '-IR (vivir)'],
      rows: [
        { pronoun: 'yo',        forms: ['hablaría',    'comería',    'viviría']    },
        { pronoun: 'tú',        forms: ['hablarías',   'comerías',   'vivirías']   },
        { pronoun: 'él/ella',   forms: ['hablaría',    'comería',    'viviría']    },
        { pronoun: 'nosotros',  forms: ['hablaríamos', 'comeríamos', 'viviríamos'] },
        { pronoun: 'vosotros',  forms: ['hablaríais',  'comeríais',  'viviríais']  },
        { pronoun: 'ellos',     forms: ['hablarían',   'comerían',   'vivirían']   },
      ],
      note: 'Uses the same irregular stems as the future tense. All forms carry an accent mark.',
    },
    irregulars: {
      verbs: ['tener→tendr-', 'hacer→har-', 'poder→podr-', 'salir→saldr-'],
      rows: [
        { pronoun: 'yo',       forms: ['tendría',    'haría',    'podría',    'saldría']    },
        { pronoun: 'tú',       forms: ['tendrías',   'harías',   'podrías',   'saldrías']   },
        { pronoun: 'él/ella',  forms: ['tendría',    'haría',    'podría',    'saldría']    },
        { pronoun: 'nosotros', forms: ['tendríamos', 'haríamos', 'podríamos', 'saldríamos'] },
        { pronoun: 'vosotros', forms: ['tendríais',  'haríais',  'podríais',  'saldríais']  },
        { pronoun: 'ellos',    forms: ['tendrían',   'harían',   'podrían',   'saldrían']   },
      ],
    },
    triggerWords: ['si (imperfect subj)…', 'quisiera', 'podría', 'debería', 'me gustaría', 'en tu lugar'],
  },
  {
    tense: 'present_subjunctive',
    name: 'Present Subjunctive (Presente de Subjuntivo)',
    description: 'Expresses doubt, wishes, emotions, and hypotheticals in subordinate clauses.',
    examples: [
      { es: 'Quiero que tú **hables** más despacio.', en: 'I want you to speak more slowly.' },
      { es: 'Es importante que **comas** bien.', en: 'It is important that you eat well.' },
    ],
    formation: {
      headers: ['-AR (hablar)', '-ER (comer)', '-IR (vivir)'],
      rows: [
        { pronoun: 'yo',        forms: ['hable',    'coma',    'viva']    },
        { pronoun: 'tú',        forms: ['hables',   'comas',   'vivas']   },
        { pronoun: 'él/ella',   forms: ['hable',    'coma',    'viva']    },
        { pronoun: 'nosotros',  forms: ['hablemos', 'comamos', 'vivamos'] },
        { pronoun: 'vosotros',  forms: ['habléis',  'comáis',  'viváis']  },
        { pronoun: 'ellos',     forms: ['hablen',   'coman',   'vivan']   },
      ],
      note: 'Formed from the yo present indicative: "-AR" verbs take -E endings; "-ER/-IR" take -A endings ("boot trick").',
    },
    irregulars: {
      verbs: ['ser', 'estar', 'tener', 'ir'],
      rows: [
        { pronoun: 'yo',       forms: ['sea',    'esté',    'tenga',    'vaya']    },
        { pronoun: 'tú',       forms: ['seas',   'estés',   'tengas',   'vayas']   },
        { pronoun: 'él/ella',  forms: ['sea',    'esté',    'tenga',    'vaya']    },
        { pronoun: 'nosotros', forms: ['seamos', 'estemos', 'tengamos', 'vayamos'] },
        { pronoun: 'vosotros', forms: ['seáis',  'estéis',  'tengáis',  'vayáis']  },
        { pronoun: 'ellos',    forms: ['sean',   'estén',   'tengan',   'vayan']   },
      ],
    },
    triggerWords: ['quiero que', 'es necesario que', 'espero que', 'ojalá', 'cuando (future)', 'para que', 'a menos que', 'aunque (doubt)'],
  },
  {
    tense: 'imperfect_subjunctive',
    name: 'Imperfect Subjunctive (Imperfecto de Subjuntivo)',
    description: 'Expresses past hypotheticals, wishes, and doubts; used in si-clauses.',
    examples: [
      { es: 'Si yo **tuviera** dinero, viajaría.', en: 'If I had money, I would travel.' },
      { es: 'Quería que **hablaras** con ella.', en: 'She wanted you to speak with her.' },
    ],
    formation: {
      headers: ['-AR (hablar)', '-ER (comer)', '-IR (vivir)'],
      rows: [
        { pronoun: 'yo',        forms: ['hablara',    'comiera',    'viviera']    },
        { pronoun: 'tú',        forms: ['hablaras',   'comieras',   'vivieras']   },
        { pronoun: 'él/ella',   forms: ['hablara',    'comiera',    'viviera']    },
        { pronoun: 'nosotros',  forms: ['habláramos', 'comiéramos', 'viviéramos'] },
        { pronoun: 'vosotros',  forms: ['hablarais',  'comierais',  'vivierais']  },
        { pronoun: 'ellos',     forms: ['hablaran',   'comieran',   'vivieran']   },
      ],
      note: 'Derived from the ellos preterite form (drop -ron, add endings). The -se form (hablase) is an equally valid alternative.',
    },
    irregulars: {
      verbs: ['ser/ir', 'tener', 'hacer', 'estar'],
      rows: [
        { pronoun: 'yo',       forms: ['fuera',     'tuviera',    'hiciera',    'estuviera']    },
        { pronoun: 'tú',       forms: ['fueras',    'tuvieras',   'hicieras',   'estuvieras']   },
        { pronoun: 'él/ella',  forms: ['fuera',     'tuviera',    'hiciera',    'estuviera']    },
        { pronoun: 'nosotros', forms: ['fuéramos',  'tuviéramos', 'hiciéramos', 'estuviéramos'] },
        { pronoun: 'vosotros', forms: ['fuerais',   'tuvierais',  'hicierais',  'estuvierais']  },
        { pronoun: 'ellos',    forms: ['fueran',    'tuvieran',   'hicieran',   'estuvieran']   },
      ],
    },
    triggerWords: ['si (+ cond.)', 'ojalá (past)', 'quería que', 'era necesario que', 'como si', 'antes de que (past)'],
  },
  {
    tense: 'present_perfect',
    name: 'Present Perfect (Pretérito Perfecto)',
    description: 'Describes recently completed actions or past actions relevant to the present.',
    examples: [
      { es: 'Hoy yo **he hablado** con mi jefe.', en: 'Today I have spoken with my boss.' },
      { es: 'Ellos **han comido** aquí antes.', en: 'They have eaten here before.' },
    ],
    formation: {
      headers: ['haber (present)'],
      rows: [
        { pronoun: 'yo',       forms: ['he']     },
        { pronoun: 'tú',       forms: ['has']    },
        { pronoun: 'él/ella',  forms: ['ha']     },
        { pronoun: 'nosotros', forms: ['hemos']  },
        { pronoun: 'vosotros', forms: ['habéis'] },
        { pronoun: 'ellos',    forms: ['han']    },
      ],
      note: 'Formula: haber (present) + past participle. Regular: -AR → -ado (hablado), -ER/-IR → -ido (comido, vivido). Irregular participles: hecho, dicho, visto, puesto, vuelto, escrito, abierto, muerto, roto.',
    },
    triggerWords: ['hoy', 'esta semana', 'este año', 'ya', 'todavía no', 'alguna vez', 'nunca', 'recientemente'],
    contrastNote: 'In Spain, used for recent past (like English "I have done"); in Latin America, preterite is often preferred instead.',
  },
  {
    tense: 'imperative',
    name: 'Imperative (Imperativo)',
    description: 'Gives commands or instructions; yo form does not exist.',
    examples: [
      { es: '**Habla** más despacio, por favor.', en: 'Speak more slowly, please. (tú)' },
      { es: '**Coman** ustedes primero.', en: 'You (all) eat first. (ustedes)' },
    ],
    formation: {
      headers: ['-AR (hablar)', '-ER (comer)', '-IR (vivir)'],
      rows: [
        { pronoun: 'tú',       forms: ['habla',    'come',    'vive']    },
        { pronoun: 'usted',    forms: ['hable',    'coma',    'viva']    },
        { pronoun: 'nosotros', forms: ['hablemos', 'comamos', 'vivamos'] },
        { pronoun: 'vosotros', forms: ['hablad',   'comed',   'vivid']   },
        { pronoun: 'ustedes',  forms: ['hablen',   'coman',   'vivan']   },
      ],
      note: 'Tú affirmative = 3rd person present. Usted/nosotros/ustedes = present subjunctive. Negative commands use present subjunctive for all forms.',
    },
    irregulars: {
      verbs: ['ser', 'ir', 'tener', 'hacer'],
      rows: [
        { pronoun: 'tú',       forms: ['sé',     've',     'ten',     'haz']     },
        { pronoun: 'usted',    forms: ['sea',    'vaya',   'tenga',   'haga']    },
        { pronoun: 'nosotros', forms: ['seamos', 'vayamos','tengamos','hagamos'] },
        { pronoun: 'vosotros', forms: ['sed',    'id',     'tened',   'haced']   },
        { pronoun: 'ustedes',  forms: ['sean',   'vayan',  'tengan',  'hagan']   },
      ],
    },
    triggerWords: ['por favor', '¡', 'no (neg. command)', 'vamos a', 'hay que'],
  },
  {
    tense: 'past_perfect',
    name: 'Past Perfect (Pluscuamperfecto)',
    description: 'Describes an action completed before another past action ("had done").',
    examples: [
      { es: 'Cuando llegué, ella ya **había comido**.', en: 'When I arrived, she had already eaten.' },
      { es: 'Nosotros **habíamos hablado** antes.', en: 'We had spoken before.' },
    ],
    formation: {
      headers: ['haber (imperfect)'],
      rows: [
        { pronoun: 'yo',       forms: ['había']   },
        { pronoun: 'tú',       forms: ['habías']  },
        { pronoun: 'él/ella',  forms: ['había']   },
        { pronoun: 'nosotros', forms: ['habíamos'] },
        { pronoun: 'vosotros', forms: ['habíais'] },
        { pronoun: 'ellos',    forms: ['habían']  },
      ],
      note: 'Formula: haber (imperfect) + past participle. Uses the same past participles as present perfect (hablado, comido, hecho, visto, etc.).',
    },
    triggerWords: ['ya', 'cuando', 'antes de', 'todavía no', 'después de que', 'jamás'],
  },
  {
    tense: 'future_perfect',
    name: 'Future Perfect (Futuro Perfecto)',
    description: 'Describes an action that will be completed by a future point; also expresses probability about the past.',
    examples: [
      { es: 'Para el lunes, **habremos terminado** el proyecto.', en: 'By Monday, we will have finished the project.' },
      { es: '¿**Habrá llegado** ya?', en: 'Could she have arrived already? (probability)' },
    ],
    formation: {
      headers: ['haber (future)'],
      rows: [
        { pronoun: 'yo',       forms: ['habré']    },
        { pronoun: 'tú',       forms: ['habrás']   },
        { pronoun: 'él/ella',  forms: ['habrá']    },
        { pronoun: 'nosotros', forms: ['habremos'] },
        { pronoun: 'vosotros', forms: ['habréis']  },
        { pronoun: 'ellos',    forms: ['habrán']   },
      ],
      note: 'Formula: haber (future) + past participle. Uses the same past participles as present perfect.',
    },
    triggerWords: ['para entonces', 'para el lunes', 'cuando llegues', 'dentro de', 'antes de que'],
  },
  {
    tense: 'conditional_perfect',
    name: 'Conditional Perfect (Condicional Perfecto)',
    description: 'Describes an action that would have happened under different circumstances ("would have done").',
    examples: [
      { es: 'Si hubiera sabido, **habría hablado** contigo.', en: 'If I had known, I would have spoken with you.' },
      { es: 'Ellos **habrían comido** si hubiera comida.', en: 'They would have eaten if there had been food.' },
    ],
    formation: {
      headers: ['haber (conditional)'],
      rows: [
        { pronoun: 'yo',       forms: ['habría']    },
        { pronoun: 'tú',       forms: ['habrías']   },
        { pronoun: 'él/ella',  forms: ['habría']    },
        { pronoun: 'nosotros', forms: ['habríamos'] },
        { pronoun: 'vosotros', forms: ['habríais']  },
        { pronoun: 'ellos',    forms: ['habrían']   },
      ],
      note: 'Formula: haber (conditional) + past participle. Used in the result clause of past hypotheticals: "Si hubiera… habría…"',
    },
    triggerWords: ['si hubiera/hubiese…', 'en ese caso', 'de haberlo sabido', 'si no hubiera sido por'],
  },
  {
    tense: 'present_perfect_subjunctive',
    name: 'Present Perfect Subjunctive (Perfecto de Subjuntivo)',
    description: 'Expresses doubt, emotion, or judgment about a recently completed action in a subordinate clause.',
    examples: [
      { es: 'Espero que **hayas hablado** con ella.', en: 'I hope you have spoken with her.' },
      { es: 'Es increíble que **hayan comido** todo.', en: 'It\'s incredible that they have eaten everything.' },
    ],
    formation: {
      headers: ['haber (present subjunctive)'],
      rows: [
        { pronoun: 'yo',       forms: ['haya']    },
        { pronoun: 'tú',       forms: ['hayas']   },
        { pronoun: 'él/ella',  forms: ['haya']    },
        { pronoun: 'nosotros', forms: ['hayamos'] },
        { pronoun: 'vosotros', forms: ['hayáis']  },
        { pronoun: 'ellos',    forms: ['hayan']   },
      ],
      note: 'Formula: haber (present subjunctive) + past participle. Triggered by the same subjunctive expressions as the present subjunctive, but referring to completed actions.',
    },
    triggerWords: ['espero que', 'es bueno que', 'me alegra que', 'ojalá', 'no creo que', 'dudo que'],
  },
]

export const TENSE_GUIDES: Record<string, TenseGuide> = Object.fromEntries(
  GUIDES.map(g => [g.tense, g])
)
