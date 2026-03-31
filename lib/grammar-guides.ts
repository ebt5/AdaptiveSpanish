export interface GrammarGuide {
  tag: string
  name: string
  whatItIs: string
  whyTricky: string
  pattern: string
  examples: Array<{ es: string; en: string }>
  mistakes: Array<{ wrong: string; right: string; note: string }>
  triggers: string[]
}

export const GRAMMAR_GUIDES: GrammarGuide[] = [
  {
    tag: 'survival',
    name: 'Survival Phrases',
    whatItIs: 'The essential phrases you need to communicate in any Spanish-speaking situation from day one.',
    whyTricky: 'These phrases are not grammatically complex, but the cultural register matters. Spanish distinguishes formal (usted) from informal (tú), and choosing wrong can come across as rude or overly stiff. Also, some common responses — like De nada (You\'re welcome) — have no obvious literal English connection.',
    pattern: 'Learn these as fixed phrases first. Don\'t try to build them from grammar rules.',
    examples: [
      { es: '**¿Cómo estás?** — Bien, gracias. ¿Y tú?', en: 'How are you? — Fine, thanks. And you?' },
      { es: '**¿Me puede ayudar?** — Claro que sí.', en: 'Can you help me? — Of course.' },
      { es: '**¿Cuánto cuesta?** — Son veinte euros.', en: 'How much does it cost? — It\'s twenty euros.' },
    ],
    mistakes: [
      { wrong: 'Cómo estás tú? (adding tú is unnecessary)', right: '¿Cómo estás?', note: 'Subject pronouns are usually dropped in Spanish.' },
      { wrong: 'No entiendo tú. (wrong pronoun position)', right: 'No te entiendo.', note: 'Object pronouns come before the verb.' },
    ],
    triggers: ['¿Cómo...?', '¿Dónde está...?', 'Por favor', 'Gracias', 'Lo siento', '¿Puede...?'],
  },
  {
    tag: 'ser-estar',
    name: 'Ser vs. Estar',
    whatItIs: 'Spanish has two verbs for "to be": ser (permanent/essential) and estar (temporary/conditional). Using the wrong one changes meaning dramatically.',
    whyTricky: 'English has one verb — "to be" — for everything. Spanish splits it based on whether something is essential/identity (ser) or temporary/state (estar). But the rules aren\'t perfectly clean: location uses estar even for permanent things; events use ser even for temporary ones. And some adjectives change meaning entirely: ser aburrido = to be boring (personality); estar aburrido = to be bored (right now).',
    pattern: 'Ser: identity, origin, profession, characteristics, time, events\nEstar: location, temporary states, emotions, progressive tenses, results',
    examples: [
      { es: '**Soy** médico. / **Estoy** enfermo.', en: 'I am a doctor (identity). / I am sick (temporary state).' },
      { es: '**Es** alta. / **Está** de pie.', en: 'She is tall (characteristic). / She is standing (position).' },
      { es: 'La reunión **es** en la sala. / Las llaves **están** en la mesa.', en: 'The meeting is in the room (event location). / The keys are on the table (thing\'s location).' },
    ],
    mistakes: [
      { wrong: 'Estoy de México. (origin with estar)', right: 'Soy de México.', note: 'Origin always uses ser.' },
      { wrong: 'El libro es en la mesa. (object location with ser)', right: 'El libro está en la mesa.', note: 'Object location always uses estar.' },
    ],
    triggers: ['identity', 'profession', 'origin', 'location', 'emotion', 'condition', 'aburrido/rico/malo (meaning changes with ser vs. estar)'],
  },
  {
    tag: 'tener-expressions',
    name: 'Tener Expressions',
    whatItIs: 'A set of idiomatic phrases where Spanish uses tener (to have) where English uses "to be." You don\'t BE hungry — you HAVE hunger.',
    whyTricky: 'In English, bodily and emotional states use "to be": I am hungry, cold, right, afraid. In Spanish, these are expressed with tener + noun. This means the adjective becomes a noun (hambre, frío, razón) and tener replaces ser/estar. Learners constantly say estoy hambre or soy hambre — both are wrong.',
    pattern: 'tener + [noun] where English says "to be + [adjective]"',
    examples: [
      { es: '**Tengo hambre.** No puedo esperar más.', en: 'I\'m hungry (I have hunger). I can\'t wait anymore.' },
      { es: 'Ella **tiene razón.** No lo sabía.', en: 'She\'s right (she has reason). I didn\'t know.' },
      { es: '**Tengo 30 años.** Nací en 1994.', en: 'I\'m 30 years old (I have 30 years). I was born in 1994.' },
    ],
    mistakes: [
      { wrong: 'Estoy hambre / Soy hambre', right: 'Tengo hambre', note: 'Hunger is a noun in Spanish — use tener, not ser/estar.' },
      { wrong: 'Soy 25 años', right: 'Tengo 25 años', note: 'Age uses tener, not ser.' },
    ],
    triggers: ['hambre', 'sed', 'frío', 'calor', 'sueño', 'miedo', 'prisa', 'razón', 'suerte', 'X años'],
  },
  {
    tag: 'hacer-expressions',
    name: 'Hacer Expressions',
    whatItIs: 'Hacer (to make/do) is used in two major non-obvious ways: weather expressions and time duration phrases.',
    whyTricky: 'English says "It IS cold" or "It IS windy" — using to be for weather. Spanish says hace frío, hace viento — literally "it makes cold." There is no logical English parallel. The time duration use is even harder: "I\'ve been living here for two years" becomes hace dos años que vivo aquí — present tense, no "for," and hace at the start.',
    pattern: 'Weather: hace + [noun]\nDuration: hace + [time] + que + [present tense verb]',
    examples: [
      { es: '**Hace frío** hoy. Lleva abrigo.', en: 'It\'s cold today (it makes cold). Wear a coat.' },
      { es: '**Hace viento** y está nublado.', en: 'It\'s windy and cloudy.' },
      { es: '**Hace dos años que** vivo en Madrid.', en: 'I\'ve been living in Madrid for two years.' },
    ],
    mistakes: [
      { wrong: 'Es frío / Está frío (for weather)', right: 'Hace frío', note: 'Weather uses hacer, not ser or estar.' },
      { wrong: 'He vivido en Madrid por dos años', right: 'Hace dos años que vivo en Madrid', note: 'Ongoing duration since the past uses hace + que + present, not the perfect tense.' },
    ],
    triggers: ['frío', 'calor', 'viento', 'sol', 'tiempo', 'hace + [time] + que'],
  },
  {
    tag: 'reflexive',
    name: 'Reflexive Verbs',
    whatItIs: 'Verbs where the subject acts on itself, indicated by adding a reflexive pronoun (me, te, se, nos, os, se). They can also indicate reciprocal actions or simply mark certain idiomatic verbs.',
    whyTricky: 'English has reflexive pronouns (myself, yourself) but uses them far less. Spanish reflexive verbs include things English doesn\'t treat reflexively: getting up (levantarse), being called (llamarse), going away (irse). Many verbs also change meaning when made reflexive: ir = to go; irse = to leave/take off. Dormir = to sleep; dormirse = to fall asleep.',
    pattern: '[reflexive pronoun] + [verb]: me levanto, te llamas, se despierta, nos vamos',
    examples: [
      { es: '**Me llamo** Ana. ¿Cómo **te llamas** tú?', en: 'My name is Ana (I call myself). What\'s your name?' },
      { es: '**Se levanta** a las siete todos los días.', en: 'She gets up at seven every day.' },
      { es: 'Mañana **nos vamos** a la playa.', en: 'Tomorrow we\'re heading to the beach (taking ourselves off).' },
    ],
    mistakes: [
      { wrong: 'Llamo Ana (missing reflexive pronoun)', right: 'Me llamo Ana', note: 'Llamarse requires the reflexive pronoun.' },
      { wrong: 'Voy ahora (for "I\'m leaving now")', right: 'Me voy ahora', note: 'Irse means to leave/take off; ir means to go somewhere.' },
    ],
    triggers: ['llamarse', 'levantarse', 'irse', 'sentirse', 'ponerse', 'quedarse', 'despertarse', 'dormirse'],
  },
  {
    tag: 'gustar-type',
    name: 'Gustar-type Verbs',
    whatItIs: 'A group of verbs that work "backwards" from English — the thing that pleases/hurts/interests acts as the subject, and the person experiencing it is the indirect object.',
    whyTricky: 'In English: "I like coffee" — I is the subject, coffee is the object. In Spanish: Me gusta el café — el café is the subject, me is the indirect object (to me). This means the verb agrees with the thing, not the person, and you must use the indirect object pronoun (me/te/le/nos/os/les), not the subject pronoun. Forgetting the pronoun or using yo instead of me is extremely common.',
    pattern: '[indirect object pronoun] + [verb] + [subject noun]:\nme/te/le/nos/os/les + gusta(n)/duele(n)/falta(n)/parece(n)/encanta(n)',
    examples: [
      { es: '**Me gusta** el café. / **Me gustan** los deportes.', en: 'I like coffee (singular). / I like sports (plural, so gustan).' },
      { es: '**Le duele** la cabeza.', en: 'His/Her head hurts (the head hurts to him/her).' },
      { es: '**Nos falta** tiempo para terminar.', en: 'We don\'t have enough time to finish (time is lacking to us).' },
    ],
    mistakes: [
      { wrong: 'Yo gusto el café', right: 'Me gusta el café', note: 'Use indirect object pronoun me, not subject pronoun yo.' },
      { wrong: 'Me gusta los deportes', right: 'Me gustan los deportes', note: 'Gustar agrees with the subject (deportes, plural).' },
    ],
    triggers: ['gustar', 'encantar', 'doler', 'faltar', 'parecer', 'interesar', 'molestar', 'apetecer'],
  },
  {
    tag: 'verb-infinitive',
    name: 'Verb + Infinitive Chains',
    whatItIs: 'Spanish frequently chains a conjugated verb with an infinitive to express wants, abilities, obligations, and near future — similar to English modal + verb constructions.',
    whyTricky: 'The chains themselves are similar to English (I want to go = quiero ir), but Spanish has many more of these constructions with different nuances, and some don\'t translate literally. Acabar de + infinitive means "to have just done something" (acabo de comer = I just ate). Ir a + infinitive is the standard near future. Tener que + infinitive expresses obligation more strongly than deber.',
    pattern: '[conjugated verb] + [infinitive]:\nquerer, poder, deber, tener que, ir a, acabar de, volver a + [infinitive]',
    examples: [
      { es: '**Voy a estudiar** esta noche. No puedo salir.', en: 'I\'m going to study tonight. I can\'t go out.' },
      { es: '**Acabo de llegar.** Estoy cansado.', en: 'I just arrived. I\'m tired.' },
      { es: '**Tienes que** llamar a tu madre.', en: 'You have to call your mother (obligation).' },
    ],
    mistakes: [
      { wrong: 'Voy estudiar (missing a)', right: 'Voy a estudiar', note: 'Ir a requires the preposition a before the infinitive.' },
      { wrong: 'Acabo comido (using past participle)', right: 'Acabo de comer', note: 'Acabar de uses an infinitive, not a past participle.' },
    ],
    triggers: ['querer', 'poder', 'deber', 'tener que', 'ir a', 'acabar de', 'volver a', 'dejar de', 'empezar a', 'tratar de'],
  },
  {
    tag: 'progressive',
    name: 'Progressive Constructions',
    whatItIs: 'Spanish uses estar + gerund for ongoing actions, but also has unique progressive constructions with llevar, seguir, and ir that have no clean English equivalents.',
    whyTricky: 'The basic estar + gerund (estoy hablando = I am talking) is familiar. But llevar + time + gerund (llevo dos horas esperando = I\'ve been waiting for two hours) uses the present tense and a completely different structure than English. Seguir + gerund (sigo esperando = I\'m still waiting / I keep waiting) and ir + gerund (voy aprendiendo = I\'m gradually learning) are also common but unfamiliar.',
    pattern: 'Basic: estar + [gerund]\nDuration: llevar + [time] + [gerund]\nContinuation: seguir + [gerund]\nGradual: ir + [gerund]',
    examples: [
      { es: '¿Qué **estás haciendo**? — **Estoy** leyendo.', en: 'What are you doing? — I\'m reading.' },
      { es: '**Llevo tres horas trabajando** sin parar.', en: 'I\'ve been working for three hours without stopping.' },
      { es: '**Sigo esperando** su respuesta.', en: 'I\'m still waiting for his answer / I keep waiting.' },
    ],
    mistakes: [
      { wrong: 'Llevo tres horas de esperar', right: 'Llevo tres horas esperando', note: 'Llevar + duration uses the gerund (-ndo), not an infinitive.' },
      { wrong: '¿Cuánto tiempo has estado aquí? (unnatural)', right: '¿Cuánto tiempo llevas aquí?', note: 'Duration since a point in the past is more naturally expressed with llevar.' },
    ],
    triggers: ['estar + -ndo', 'llevar + time + -ndo', 'seguir + -ndo', 'ir + -ndo', '¿cuánto tiempo llevas...?'],
  },
  {
    tag: 'object-pronouns',
    name: 'Object Pronouns',
    whatItIs: 'Direct and indirect object pronouns (lo, la, le, me, te, nos, se...) replace nouns and are placed before conjugated verbs in Spanish — the opposite of English.',
    whyTricky: 'In English, pronouns come after the verb: "I see him," "She told me." In Spanish they come before: lo veo, me dijo. When two object pronouns are stacked, the indirect comes first: me lo dijo (he told it to me). And when le/les come before lo/la, they must change to se: se lo di (not le lo di). The pronoun must also attach to infinitives and gerunds in some positions.',
    pattern: 'Before conjugated verb: [IO pronoun] + [DO pronoun] + [verb]\nle/les → se when before lo/la/los/las\nAttach to infinitive: voy a verlo / lo voy a ver (both OK)',
    examples: [
      { es: '**Lo vi** ayer en el parque.', en: 'I saw him/it yesterday in the park.' },
      { es: '**Me lo dijo** esta mañana.', en: 'He told it to me this morning.' },
      { es: '**Se lo di** a María. (not le lo di)', en: 'I gave it to María.' },
    ],
    mistakes: [
      { wrong: 'Di lo a ella', right: 'Se lo di / Se lo di a ella', note: 'Pronouns come before the verb; le becomes se before lo.' },
      { wrong: 'Le lo expliqué', right: 'Se lo expliqué', note: 'Le + lo always becomes se + lo.' },
    ],
    triggers: ['lo', 'la', 'los', 'las', 'le', 'les', 'me', 'te', 'nos', 'os', 'se lo', 'me lo'],
  },
  {
    tag: 'por-para',
    name: 'Por vs. Para',
    whatItIs: 'Both por and para translate to "for" in English, but they express fundamentally different relationships and are not interchangeable.',
    whyTricky: 'English uses "for" to cover a wide range of meanings. Spanish splits these into two prepositions with distinct functions. Por covers cause, exchange, duration, movement through, and means. Para covers purpose, destination, recipient, deadlines, and opinion. The confusion is compounded by idioms that don\'t follow the rules obviously: por supuesto (of course), para siempre (forever), por favor (please).',
    pattern: 'Por: cause, motivation, duration, means, movement through, exchange\nPara: purpose, goal, destination, recipient, deadline, opinion',
    examples: [
      { es: 'Lo hice **por** ti. / Esto es **para** ti.', en: 'I did it because of you (cause). / This is for you (recipient).' },
      { es: 'Salgo **para** Madrid mañana.', en: 'I\'m leaving for Madrid tomorrow (destination).' },
      { es: 'Hablamos **por** teléfono dos horas.', en: 'We talked on the phone for two hours (means, duration).' },
    ],
    mistakes: [
      { wrong: 'Lo hice para ti (when meaning "because of you")', right: 'Lo hice por ti', note: 'Por for cause/motivation; para for recipient/purpose.' },
      { wrong: 'Estudio por el futuro (when meaning "in order to have a future")', right: 'Estudio para el futuro', note: 'Para for goals and purposes.' },
    ],
    triggers: ['por: causa, duración, medio, movimiento, cambio', 'para: propósito, destinatario, destino, plazo, opinión'],
  },
  {
    tag: 'negative-constructions',
    name: 'Negative Constructions',
    whatItIs: 'Spanish uses double (or multiple) negatives as standard grammar — they reinforce, not cancel, each other. "No sé nada" literally says "I don\'t know nothing" but means "I don\'t know anything."',
    whyTricky: 'English grammar forbids double negatives ("I don\'t know nothing" is considered incorrect). In Spanish, they are required. When a negative word (nada, nadie, nunca, tampoco) follows the verb, no must also precede the verb. The negative word can also precede the verb alone (nunca viene = he never comes), in which case no is not needed. Remembering when to add no and when not to is the main challenge.',
    pattern: 'Negative word after verb: no + [verb] + [negative word]\nNegative word before verb: [negative word] + [verb] (no needed)\nNo → never; nada → nothing/anything; nadie → nobody/anyone; nunca → never; tampoco → neither/either',
    examples: [
      { es: '**No sé nada.** No me preguntes.', en: 'I don\'t know anything. Don\'t ask me.' },
      { es: '**Nunca** viene a tiempo.', en: 'He never comes on time.' },
      { es: 'A mí **tampoco** me gusta.', en: 'I don\'t like it either (neither do I).' },
    ],
    mistakes: [
      { wrong: 'No sé algo (using positive word in negative sentence)', right: 'No sé nada', note: 'In negative sentences, use nada/nadie/nunca, not algo/alguien/siempre.' },
      { wrong: 'Nunca no viene (double negative when nunca precedes the verb)', right: 'Nunca viene', note: 'When the negative word comes before the verb, don\'t add no.' },
    ],
    triggers: ['nada', 'nadie', 'nunca', 'jamás', 'tampoco', 'ningún', 'ninguno'],
  },
  {
    tag: 'hay-que-impersonal',
    name: 'Hay que / Impersonal Se',
    whatItIs: 'Two constructions that express general statements or obligations without specifying a subject — the Spanish equivalent of "one must," "you have to," or passive-voice sentences.',
    whyTricky: 'English uses passive voice ("It is forbidden to smoke") or vague "you" ("You have to study"). Spanish uses hay que + infinitive for impersonal obligation and se + verb for general rules, passive statements, or descriptions of how things are done. Neither has a subject, which violates English grammar instincts.',
    pattern: 'Obligation: hay que + [infinitive] (no subject)\nImpersonal/passive: se + [3rd person verb]: se habla, se vende, se dice',
    examples: [
      { es: '**Hay que** tener paciencia en la vida.', en: 'You have to have patience in life (one must).' },
      { es: '**Se habla** español aquí.', en: 'Spanish is spoken here (one speaks Spanish here).' },
      { es: '**¿Cómo se dice** "umbrella" en español?', en: 'How do you say "umbrella" in Spanish? (how is it said)' },
    ],
    mistakes: [
      { wrong: 'Tengo que estudiar (when giving general advice)', right: 'Hay que estudiar', note: 'Tener que is personal (I must). Hay que is general (one must).' },
      { wrong: 'Yo digo "paraguas" (when describing general practice)', right: 'Se dice "paraguas"', note: 'Se + verb for general or impersonal statements.' },
    ],
    triggers: ['hay que + infinitivo', 'se dice', 'se habla', 'se vende', 'se puede', 'se prohíbe'],
  },
  {
    tag: 'unintentional',
    name: 'Unintentional Constructions',
    whatItIs: 'A specific use of se with an indirect object pronoun to express accidental or unintentional events — the subject is the thing that "happened," removing blame from the person.',
    whyTricky: 'In English: "I dropped the glass" — I am the agent, glass is the object. In Spanish: Se me cayó el vaso — literally "the glass fell on me." The glass is the grammatical subject; the person is an indirect object. This structure communicates that it was unintentional. It\'s deeply idiomatic and has no direct English parallel. The verb agrees with the thing (singular/plural), not the person.',
    pattern: 'se + [indirect object pronoun] + [verb] + [subject thing]\nse me cayó / se te olvidó / se le rompió / se nos acabó',
    examples: [
      { es: '**Se me olvidó** el libro. Lo siento.', en: 'I forgot the book (the book forgot itself on me). Sorry.' },
      { es: '**Se te cayó** el vaso.', en: 'You dropped the glass (the glass fell from you, accidentally).' },
      { es: '**Se nos acabó** el tiempo.', en: 'We ran out of time (time finished itself on us).' },
    ],
    mistakes: [
      { wrong: 'Olvidé el libro (no se — suggests intentional)', right: 'Se me olvidó el libro', note: 'Se me olvidó implies accidental forgetting; olvidé implies more intentional.' },
      { wrong: 'Se me cayeron el vaso (wrong agreement)', right: 'Se me cayó el vaso', note: 'The verb agrees with el vaso (singular), not with me.' },
    ],
    triggers: ['se me/te/le/nos/les + olvidar', 'caer', 'romper', 'perder', 'acabar', 'quedar'],
  },
  {
    tag: 'subjunctive',
    name: 'Subjunctive Mood',
    whatItIs: 'The subjunctive is a verb mood (not a tense) used to express doubt, desire, emotion, hypothetical situations, and recommendations — whenever the speaker is not stating a plain fact.',
    whyTricky: 'English barely uses the subjunctive (compare "I suggest he leave" vs. common "I suggest he leaves"). Spanish uses it constantly. The key is recognizing trigger patterns: whenever one person wants/hopes/fears/doubts something about another person, the second verb goes subjunctive. The main challenge is learning the triggers and then forming the subjunctive correctly (different endings from indicative, with many irregulars).',
    pattern: 'Two subjects + que: [person A] + [trigger verb] + que + [person B] + [subjunctive]\nTrigger verbs: querer, esperar, temer, dudar, recomendar, alegrarse de, sorprender + que\nImpersonal triggers: es importante que, es posible que, ojalá',
    examples: [
      { es: 'Espero que **vengas** a la fiesta.', en: 'I hope you come to the party (esperar que triggers subjunctive).' },
      { es: 'Es importante que **estudies** todos los días.', en: 'It\'s important that you study every day.' },
      { es: '**Ojalá** pueda ir contigo.', en: 'I hope I can go with you (ojalá always triggers subjunctive).' },
    ],
    mistakes: [
      { wrong: 'Espero que vienes (indicative after trigger)', right: 'Espero que vengas', note: 'After esperar que, use subjunctive — the outcome is wished, not factual.' },
      { wrong: 'Quiero ir (uses infinitive here — correct!)', right: '✓ Quiero ir', note: 'When both verbs have the SAME subject, use infinitive, not subjunctive.' },
    ],
    triggers: ['esperar que', 'querer que', 'ojalá', 'es importante que', 'es posible que', 'dudar que', 'no creer que', 'cuando + future', 'antes de que', 'para que'],
  },
  {
    tag: 'conditional',
    name: 'Conditional & Si Clauses',
    whatItIs: 'The conditional expresses what would happen, and si (if) clauses combine it with the imperfect subjunctive to describe hypothetical or counterfactual situations.',
    whyTricky: 'English uses "would" + verb for conditional (I would go). Spanish uses a single conditional form (iría). The challenge is si clauses: "If I had money, I would travel" requires si + imperfect subjunctive + conditional: Si tuviera dinero, viajaría. English speakers often put present tense in the if-clause (si tengo dinero — which is actually a different, real possibility). The two forms express different degrees of likelihood.',
    pattern: 'Pure conditional: [conditional verb] — iría, hablaría, comería\nHypothetical si clause: si + [imperfect subjunctive] + [conditional]\nPast hypothetical: si + [past perfect subjunctive] + [conditional perfect]',
    examples: [
      { es: '**Hablaría** más si pudiera.', en: 'I would speak more if I could.' },
      { es: 'Si **tuviera** dinero, **viajaría** por el mundo.', en: 'If I had money (hypothetical), I would travel the world.' },
      { es: '**¿Podría** hablar con el gerente?', en: 'Could I speak with the manager? (polite conditional)' },
    ],
    mistakes: [
      { wrong: 'Si tengo dinero, viajaría (mixing tenses)', right: 'Si tuviera dinero, viajaría', note: 'Hypothetical si + conditional requires imperfect subjunctive, not present.' },
      { wrong: 'Si tendría dinero... (conditional in si clause)', right: 'Si tuviera dinero...', note: 'Never use conditional after si in hypothetical clauses.' },
    ],
    triggers: ['si + imperfecto de subjuntivo', 'si + pluscuamperfecto de subjuntivo', 'conditional -ría endings', 'quisiera (polite)', 'me gustaría'],
  },
  {
    tag: 'idioms-discourse',
    name: 'Idioms & Discourse Markers',
    whatItIs: 'Fixed expressions and conversational connectors that don\'t translate literally but are essential for sounding natural and fluent in Spanish.',
    whyTricky: 'These phrases must be learned as chunks — trying to build them from vocabulary leads to errors. Discourse markers like o sea and es que are incredibly common in speech but don\'t appear in textbooks. Some idioms are culturally specific and vary by region. Knowing these is what separates someone who speaks correct Spanish from someone who sounds natural.',
    pattern: 'No pattern — learn these as fixed expressions. Focus on meaning in context, not literal translation.',
    examples: [
      { es: '**O sea**, no entiendo lo que dices.', en: 'I mean, I don\'t understand what you\'re saying.' },
      { es: '**No pasa nada.** Puede pasar a cualquiera.', en: 'No worries. It can happen to anyone.' },
      { es: '**¡Qué va!** Eso no puede ser verdad.', en: 'No way! That can\'t be true.' },
    ],
    mistakes: [
      { wrong: 'Translating idioms literally', right: 'Learn as fixed expressions', note: 'Echar de menos ≠ throw from less. It means "to miss someone."' },
      { wrong: 'Avoiding these phrases (sounds robotic)', right: 'Use o sea, a ver, es que, pues naturally', note: 'Discourse markers make speech sound fluent — omitting them sounds unnatural.' },
    ],
    triggers: ['o sea', 'es que', 'a ver', 'pues', 'o sea', 'al final', 'por fin', 'no pasa nada', 'qué va', 'sin embargo', 'a propósito'],
  },
]

export function getGuide(tag: string): GrammarGuide | undefined {
  return GRAMMAR_GUIDES.find(g => g.tag === tag)
}
