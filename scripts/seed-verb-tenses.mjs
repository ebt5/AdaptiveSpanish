import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// Tenses to seed (present already seeded)
const TENSES = [
  'preterite', 'imperfect', 'future', 'conditional',
  'present_subjunctive', 'imperfect_subjunctive',
  'present_perfect', 'imperative',
  'past_perfect', 'future_perfect', 'conditional_perfect',
  'present_perfect_subjunctive'
]

const PRONOUNS = ['yo', 'tú', 'él', 'nosotros', 'vosotros', 'ellos']
const IMPERATIVE_PRONOUNS = ['tú', 'él', 'nosotros', 'vosotros', 'ellos']

// Helper: past participles
const PARTICIPLES = {
  hablar: 'hablado', comer: 'comido', vivir: 'vivido',
  trabajar: 'trabajado', escribir: 'escrito', beber: 'bebido',
  caminar: 'caminado', aprender: 'aprendido', abrir: 'abierto',
  leer: 'leído', ser: 'sido', tener: 'tenido',
  ir: 'ido', hacer: 'hecho', estar: 'estado'
}

// Haber conjugations for compound tenses
const HABER = {
  present_perfect:              { yo:'he', tú:'has', él:'ha', nosotros:'hemos', vosotros:'habéis', ellos:'han' },
  past_perfect:                 { yo:'había', tú:'habías', él:'había', nosotros:'habíamos', vosotros:'habíais', ellos:'habían' },
  future_perfect:               { yo:'habré', tú:'habrás', él:'habrá', nosotros:'habremos', vosotros:'habréis', ellos:'habrán' },
  conditional_perfect:          { yo:'habría', tú:'habrías', él:'habría', nosotros:'habríamos', vosotros:'habríais', ellos:'habrían' },
  present_perfect_subjunctive:  { yo:'haya', tú:'hayas', él:'haya', nosotros:'hayamos', vosotros:'hayáis', ellos:'hayan' },
}

// All conjugations by verb and tense
// Format: { tense: { pronoun: [form, exampleEs, exampleEn] } }
const CONJUGATIONS = {
  hablar: {
    preterite: {
      yo:       ['hablé',      'Ayer hablé con mi madre.',              'Yesterday I spoke with my mother.'],
      tú:       ['hablaste',   'Tú hablaste muy rápido.',               'You spoke very fast.'],
      él:       ['habló',      'Él habló durante una hora.',            'He spoke for an hour.'],
      nosotros: ['hablamos',   'Nosotros hablamos de todo.',            'We spoke about everything.'],
      vosotros: ['hablasteis', 'Vosotros hablasteis con el jefe.',      'You all spoke with the boss.'],
      ellos:    ['hablaron',   'Ellos hablaron en español.',            'They spoke in Spanish.'],
    },
    imperfect: {
      yo:       ['hablaba',    'Cuando era niño, hablaba mucho.',       'When I was a child, I used to talk a lot.'],
      tú:       ['hablabas',   'Tú siempre hablabas de fútbol.',        'You always used to talk about soccer.'],
      él:       ['hablaba',    'Él hablaba suavemente.',                'He was speaking softly.'],
      nosotros: ['hablábamos', 'Nosotros hablábamos cada día.',         'We used to talk every day.'],
      vosotros: ['hablabais',  'Vosotros hablabais en clase.',          'You all used to talk in class.'],
      ellos:    ['hablaban',   'Ellos hablaban de política.',           'They were talking about politics.'],
    },
    future: {
      yo:       ['hablaré',    'Mañana hablaré con el médico.',         'Tomorrow I will speak with the doctor.'],
      tú:       ['hablarás',   'Tú hablarás en la reunión.',            'You will speak at the meeting.'],
      él:       ['hablará',    'Él hablará tres idiomas pronto.',       'He will speak three languages soon.'],
      nosotros: ['hablaremos', 'Nosotros hablaremos más tarde.',        'We will speak later.'],
      vosotros: ['hablaréis',  'Vosotros hablaréis con ellos.',         'You all will speak with them.'],
      ellos:    ['hablarán',   'Ellos hablarán esta noche.',            'They will speak tonight.'],
    },
    conditional: {
      yo:       ['hablaría',    'Yo hablaría más si pudiera.',          'I would speak more if I could.'],
      tú:       ['hablarías',   'Tú hablarías mejor con práctica.',     'You would speak better with practice.'],
      él:       ['hablaría',    'Él hablaría, pero está nervioso.',     'He would speak, but he is nervous.'],
      nosotros: ['hablaríamos', 'Nosotros hablaríamos en inglés.',      'We would speak in English.'],
      vosotros: ['hablaríais',  'Vosotros hablaríais con más calma.',   'You all would speak more calmly.'],
      ellos:    ['hablarían',   'Ellos hablarían si los invitaran.',    'They would speak if they were invited.'],
    },
    present_subjunctive: {
      yo:       ['hable',     'Espero que yo hable bien.',              'I hope that I speak well.'],
      tú:       ['hables',    'Quiero que tú hables despacio.',         'I want you to speak slowly.'],
      él:       ['hable',     'Es importante que él hable la verdad.',  'It is important that he speak the truth.'],
      nosotros: ['hablemos',  'Ojalá que nosotros hablemos pronto.',    'I hope we speak soon.'],
      vosotros: ['habléis',   'Necesito que vosotros habléis menos.',   'I need you all to speak less.'],
      ellos:    ['hablen',    'Dudo que ellos hablen español.',         'I doubt that they speak Spanish.'],
    },
    imperfect_subjunctive: {
      yo:       ['hablara',     'Ojalá yo hablara mejor.',              'I wish I spoke better.'],
      tú:       ['hablaras',    'Quería que tú hablaras más.',          'I wanted you to speak more.'],
      él:       ['hablara',     'Era posible que él hablara solo.',     'It was possible that he was speaking alone.'],
      nosotros: ['habláramos',  'Si habláramos, lo resolveríamos.',     'If we spoke, we would resolve it.'],
      vosotros: ['hablarais',   'Esperaba que vosotros hablarais.',     'I hoped that you all would speak.'],
      ellos:    ['hablaran',    'Si hablaran, los escucharíamos.',      'If they spoke, we would listen.'],
    },
    imperative: {
      tú:       ['habla',      '¡Habla más despacio, por favor!',       'Speak more slowly, please!'],
      él:       ['hable',      'Que él hable primero.',                 'Let him speak first.'],
      nosotros: ['hablemos',   '¡Hablemos de esto ahora!',              'Let\'s talk about this now!'],
      vosotros: ['hablad',     '¡Hablad con respeto!',                  'Speak with respect!'],
      ellos:    ['hablen',     'Que hablen cuando estén listos.',       'Let them speak when they are ready.'],
    },
  },
  comer: {
    preterite: {
      yo:       ['comí',      'Ayer comí una pizza deliciosa.',         'Yesterday I ate a delicious pizza.'],
      tú:       ['comiste',   'Tú comiste todo el pastel.',             'You ate the entire cake.'],
      él:       ['comió',     'Él comió en un restaurante caro.',       'He ate at an expensive restaurant.'],
      nosotros: ['comimos',   'Nosotros comimos juntos.',               'We ate together.'],
      vosotros: ['comisteis', 'Vosotros comisteis tarde anoche.',       'You all ate late last night.'],
      ellos:    ['comieron',  'Ellos comieron sin hablar.',             'They ate without talking.'],
    },
    imperfect: {
      yo:       ['comía',    'De niño, comía verduras todos los días.', 'As a child, I used to eat vegetables every day.'],
      tú:       ['comías',   'Tú siempre comías rápido.',               'You always used to eat fast.'],
      él:       ['comía',    'Él comía solo en su cuarto.',             'He used to eat alone in his room.'],
      nosotros: ['comíamos', 'Nosotros comíamos en familia.',           'We used to eat as a family.'],
      vosotros: ['comíais',  'Vosotros comíais mucho dulce.',           'You all used to eat a lot of sweets.'],
      ellos:    ['comían',   'Ellos comían antes de las ocho.',         'They used to eat before eight.'],
    },
    future: {
      yo:       ['comeré',    'Mañana comeré con mi abuela.',           'Tomorrow I will eat with my grandmother.'],
      tú:       ['comerás',   'Tú comerás más sano este año.',          'You will eat healthier this year.'],
      él:       ['comerá',    'Él comerá pescado esta noche.',          'He will eat fish tonight.'],
      nosotros: ['comeremos', 'Nosotros comeremos a las dos.',          'We will eat at two o\'clock.'],
      vosotros: ['comeréis',  'Vosotros comeréis en mi casa.',          'You all will eat at my house.'],
      ellos:    ['comerán',   'Ellos comerán cuando lleguen.',          'They will eat when they arrive.'],
    },
    conditional: {
      yo:       ['comería',    'Yo comería más fruta si tuviera.',      'I would eat more fruit if I had it.'],
      tú:       ['comerías',   'Tú comerías allí si fuera barato.',     'You would eat there if it were cheap.'],
      él:       ['comería',    'Él comería cualquier cosa.',            'He would eat anything.'],
      nosotros: ['comeríamos', 'Nosotros comeríamos fuera más.',        'We would eat out more.'],
      vosotros: ['comeríais',  'Vosotros comeríais antes de llegar.',   'You all would eat before arriving.'],
      ellos:    ['comerían',   'Ellos comerían si tuvieran hambre.',    'They would eat if they were hungry.'],
    },
    present_subjunctive: {
      yo:       ['coma',    'No creo que yo coma carne.',               'I don\'t think I eat meat.'],
      tú:       ['comas',   'Quiero que tú comas bien.',                'I want you to eat well.'],
      él:       ['coma',    'Es bueno que él coma verduras.',           'It is good that he eats vegetables.'],
      nosotros: ['comamos', 'Sugiero que comamos juntos.',              'I suggest we eat together.'],
      vosotros: ['comáis',  'Espero que vosotros comáis sano.',         'I hope you all eat healthily.'],
      ellos:    ['coman',   'Ojalá que ellos coman a tiempo.',          'I hope they eat on time.'],
    },
    imperfect_subjunctive: {
      yo:       ['comiera',     'Ojalá yo comiera menos dulce.',        'I wish I ate less sugar.'],
      tú:       ['comieras',    'Quería que tú comieras despacio.',     'I wanted you to eat slowly.'],
      él:       ['comiera',     'Era mejor que él comiera en casa.',    'It was better that he ate at home.'],
      nosotros: ['comiéramos',  'Si comiéramos menos, adelgazaríamos.', 'If we ate less, we would lose weight.'],
      vosotros: ['comierais',   'Esperaba que vosotros comierais.',     'I hoped that you all would eat.'],
      ellos:    ['comieran',    'Si comieran más, tendrían energía.',   'If they ate more, they would have energy.'],
    },
    imperative: {
      tú:       ['come',      '¡Come más despacio!',                    'Eat more slowly!'],
      él:       ['coma',      'Que él coma antes de salir.',            'Let him eat before leaving.'],
      nosotros: ['comamos',   '¡Comamos algo antes de ir!',             'Let\'s eat something before going!'],
      vosotros: ['comed',     '¡Comed todo lo que está en el plato!',   'Eat everything on the plate!'],
      ellos:    ['coman',     'Que coman cuando quieran.',              'Let them eat when they want.'],
    },
  },
  vivir: {
    preterite: {
      yo:       ['viví',      'Viví en México por dos años.',           'I lived in Mexico for two years.'],
      tú:       ['viviste',   'Tú viviste una experiencia increíble.',  'You lived an incredible experience.'],
      él:       ['vivió',     'Él vivió hasta los cien años.',          'He lived to be one hundred.'],
      nosotros: ['vivimos',   'Nosotros vivimos juntos un año.',        'We lived together for a year.'],
      vosotros: ['vivisteis', 'Vosotros vivisteis en el campo.',        'You all lived in the countryside.'],
      ellos:    ['vivieron',  'Ellos vivieron muchas aventuras.',       'They lived many adventures.'],
    },
    imperfect: {
      yo:       ['vivía',    'Yo vivía cerca del mar de niño.',         'I used to live near the sea as a child.'],
      tú:       ['vivías',   'Tú vivías sin preocupaciones.',           'You used to live without worries.'],
      él:       ['vivía',    'Él vivía solo en un apartamento.',        'He used to live alone in an apartment.'],
      nosotros: ['vivíamos', 'Nosotros vivíamos muy lejos.',            'We used to live very far away.'],
      vosotros: ['vivíais',  'Vosotros vivíais en la ciudad.',          'You all used to live in the city.'],
      ellos:    ['vivían',   'Ellos vivían felices allí.',              'They used to live happily there.'],
    },
    future: {
      yo:       ['viviré',    'Viviré en España el año que viene.',     'I will live in Spain next year.'],
      tú:       ['vivirás',   'Tú vivirás una vida plena.',             'You will live a full life.'],
      él:       ['vivirá',    'Él vivirá cerca de sus hijos.',          'He will live close to his children.'],
      nosotros: ['viviremos', 'Nosotros viviremos en el campo.',        'We will live in the countryside.'],
      vosotros: ['viviréis',  'Vosotros viviréis bien juntos.',         'You all will live well together.'],
      ellos:    ['vivirán',   'Ellos vivirán muchos años.',             'They will live many years.'],
    },
    conditional: {
      yo:       ['viviría',    'Yo viviría en París si pudiera.',       'I would live in Paris if I could.'],
      tú:       ['vivirías',   'Tú vivirías mejor con un trabajo.',     'You would live better with a job.'],
      él:       ['viviría',    'Él viviría en la montaña.',             'He would live in the mountains.'],
      nosotros: ['viviríamos', 'Nosotros viviríamos en la playa.',      'We would live on the beach.'],
      vosotros: ['viviríais',  'Vosotros viviríais más tranquilos.',    'You all would live more peacefully.'],
      ellos:    ['vivirían',   'Ellos vivirían sin estrés.',            'They would live without stress.'],
    },
    present_subjunctive: {
      yo:       ['viva',    'Quiero que yo viva con propósito.',         'I want to live with purpose.'],
      tú:       ['vivas',   'Espero que tú vivas feliz.',               'I hope you live happily.'],
      él:       ['viva',    'Es mejor que él viva cerca.',              'It is better that he lives nearby.'],
      nosotros: ['vivamos', 'Ojalá vivamos muchos años.',               'I hope we live many years.'],
      vosotros: ['viváis',  'Quiero que vosotros viváis bien.',         'I want you all to live well.'],
      ellos:    ['vivan',   'Es importante que ellos vivan sanos.',     'It is important that they live healthily.'],
    },
    imperfect_subjunctive: {
      yo:       ['viviera',     'Ojalá yo viviera en el campo.',        'I wish I lived in the countryside.'],
      tú:       ['vivieras',    'Quería que tú vivieras más cerca.',    'I wanted you to live closer.'],
      él:       ['viviera',     'Ojalá él viviera más tiempo.',         'I wish he would live longer.'],
      nosotros: ['viviéramos',  'Si viviéramos aquí, seríamos felices.','If we lived here, we would be happy.'],
      vosotros: ['vivierais',   'Esperaba que vivierais juntos.',       'I hoped you all would live together.'],
      ellos:    ['vivieran',    'Si vivieran aquí, los visitaría.',     'If they lived here, I would visit them.'],
    },
    imperative: {
      tú:       ['vive',      '¡Vive el momento!',                      'Live in the moment!'],
      él:       ['viva',      'Que él viva como quiera.',               'Let him live as he wishes.'],
      nosotros: ['vivamos',   '¡Vivamos la vida al máximo!',            'Let\'s live life to the fullest!'],
      vosotros: ['vivid',     '¡Vivid sin arrepentimientos!',           'Live without regrets!'],
      ellos:    ['vivan',     'Que vivan en paz.',                      'Let them live in peace.'],
    },
  },
  trabajar: {
    preterite: {
      yo:       ['trabajé',      'Trabajé mucho ayer.',                 'I worked a lot yesterday.'],
      tú:       ['trabajaste',   'Tú trabajaste sin parar.',            'You worked without stopping.'],
      él:       ['trabajó',      'Él trabajó toda la noche.',           'He worked all night.'],
      nosotros: ['trabajamos',   'Nosotros trabajamos en equipo.',      'We worked as a team.'],
      vosotros: ['trabajasteis', 'Vosotros trabajasteis duro.',         'You all worked hard.'],
      ellos:    ['trabajaron',   'Ellos trabajaron juntos.',            'They worked together.'],
    },
    imperfect: {
      yo:       ['trabajaba',    'Yo trabajaba en una tienda.',         'I used to work in a store.'],
      tú:       ['trabajabas',   'Tú trabajabas de noche.',             'You used to work at night.'],
      él:       ['trabajaba',    'Él trabajaba todos los fines de semana.', 'He used to work every weekend.'],
      nosotros: ['trabajábamos', 'Trabajábamos desde las ocho.',        'We used to work from eight o\'clock.'],
      vosotros: ['trabajabais',  'Vosotros trabajabais en el campo.',   'You all used to work in the fields.'],
      ellos:    ['trabajaban',   'Ellos trabajaban de sol a sol.',      'They used to work from sunrise to sunset.'],
    },
    future: {
      yo:       ['trabajaré',    'Trabajaré desde casa mañana.',        'I will work from home tomorrow.'],
      tú:       ['trabajarás',   'Tú trabajarás en un banco.',          'You will work in a bank.'],
      él:       ['trabajará',    'Él trabajará en el proyecto.',        'He will work on the project.'],
      nosotros: ['trabajaremos', 'Trabajaremos hasta terminar.',        'We will work until we finish.'],
      vosotros: ['trabajaréis',  'Vosotros trabajaréis mucho.',         'You all will work a lot.'],
      ellos:    ['trabajarán',   'Ellos trabajarán el sábado.',         'They will work on Saturday.'],
    },
    conditional: {
      yo:       ['trabajaría',    'Trabajaría más si me pagaran más.',  'I would work more if they paid me more.'],
      tú:       ['trabajarías',   'Tú trabajarías ahí también.',        'You would also work there.'],
      él:       ['trabajaría',    'Él trabajaría en cualquier lugar.',  'He would work anywhere.'],
      nosotros: ['trabajaríamos', 'Trabajaríamos los domingos.',        'We would work on Sundays.'],
      vosotros: ['trabajaríais',  'Vosotros trabajaríais mejor solos.', 'You all would work better alone.'],
      ellos:    ['trabajarían',   'Ellos trabajarían sin quejarse.',    'They would work without complaining.'],
    },
    present_subjunctive: {
      yo:       ['trabaje',     'Quiero que yo trabaje en algo bueno.', 'I want to work on something good.'],
      tú:       ['trabajes',    'Espero que tú trabajes menos.',        'I hope you work less.'],
      él:       ['trabaje',     'Es necesario que él trabaje hoy.',     'It is necessary that he works today.'],
      nosotros: ['trabajemos',  'Ojalá trabajemos bien juntos.',        'I hope we work well together.'],
      vosotros: ['trabajéis',   'Es bueno que vosotros trabajéis.',     'It is good that you all work.'],
      ellos:    ['trabajen',    'Quiero que ellos trabajen más.',       'I want them to work more.'],
    },
    imperfect_subjunctive: {
      yo:       ['trabajara',     'Ojalá trabajara menos horas.',       'I wish I worked fewer hours.'],
      tú:       ['trabajaras',    'Quería que trabajaras conmigo.',     'I wanted you to work with me.'],
      él:       ['trabajara',     'Si trabajara más, ganaría más.',     'If he worked more, he would earn more.'],
      nosotros: ['trabajáramos',  'Si trabajáramos juntos, lo lograríamos.', 'If we worked together, we would achieve it.'],
      vosotros: ['trabajarais',   'Esperaba que trabajarais duro.',     'I hoped you all would work hard.'],
      ellos:    ['trabajaran',    'Si trabajaran, estarían ocupados.',  'If they worked, they would be busy.'],
    },
    imperative: {
      tú:       ['trabaja',      '¡Trabaja más duro!',                  'Work harder!'],
      él:       ['trabaje',      'Que él trabaje hasta terminar.',      'Let him work until he finishes.'],
      nosotros: ['trabajemos',   '¡Trabajemos juntos!',                 'Let\'s work together!'],
      vosotros: ['trabajad',     '¡Trabajad con entusiasmo!',           'Work with enthusiasm!'],
      ellos:    ['trabajen',     'Que trabajen sin descanso.',          'Let them work without rest.'],
    },
  },
  escribir: {
    preterite: {
      yo:       ['escribí',      'Escribí una carta ayer.',             'I wrote a letter yesterday.'],
      tú:       ['escribiste',   'Tú escribiste un poema hermoso.',     'You wrote a beautiful poem.'],
      él:       ['escribió',     'Él escribió una novela en un año.',   'He wrote a novel in one year.'],
      nosotros: ['escribimos',   'Nosotros escribimos el informe.',     'We wrote the report.'],
      vosotros: ['escribisteis', 'Vosotros escribisteis mucho.',        'You all wrote a lot.'],
      ellos:    ['escribieron',  'Ellos escribieron las respuestas.',   'They wrote the answers.'],
    },
    imperfect: {
      yo:       ['escribía',    'Yo escribía en mi diario cada noche.', 'I used to write in my diary every night.'],
      tú:       ['escribías',   'Tú escribías muy bien.',               'You used to write very well.'],
      él:       ['escribía',    'Él escribía artículos para el periódico.', 'He used to write articles for the newspaper.'],
      nosotros: ['escribíamos', 'Nosotros escribíamos cartas.',         'We used to write letters.'],
      vosotros: ['escribíais',  'Vosotros escribíais con pluma.',       'You all used to write with a pen.'],
      ellos:    ['escribían',   'Ellos escribían mucho.',               'They used to write a lot.'],
    },
    future: {
      yo:       ['escribiré',    'Escribiré un libro algún día.',       'I will write a book someday.'],
      tú:       ['escribirás',   'Tú escribirás la propuesta.',         'You will write the proposal.'],
      él:       ['escribirá',    'Él escribirá el contrato.',           'He will write the contract.'],
      nosotros: ['escribiremos', 'Nosotros escribiremos las notas.',    'We will write the notes.'],
      vosotros: ['escribiréis',  'Vosotros escribiréis el resumen.',    'You all will write the summary.'],
      ellos:    ['escribirán',   'Ellos escribirán pronto.',            'They will write soon.'],
    },
    conditional: {
      yo:       ['escribiría',    'Escribiría más si tuviera tiempo.',  'I would write more if I had time.'],
      tú:       ['escribirías',   'Tú escribirías mejor con calma.',    'You would write better calmly.'],
      él:       ['escribiría',    'Él escribiría una autobiografía.',   'He would write an autobiography.'],
      nosotros: ['escribiríamos', 'Escribiríamos el plan juntos.',      'We would write the plan together.'],
      vosotros: ['escribiríais',  'Vosotros escribiríais el guión.',    'You all would write the script.'],
      ellos:    ['escribirían',   'Ellos escribirían la historia.',     'They would write the story.'],
    },
    present_subjunctive: {
      yo:       ['escriba',     'Espero que yo escriba bien.',          'I hope I write well.'],
      tú:       ['escribas',    'Quiero que tú escribas más.',          'I want you to write more.'],
      él:       ['escriba',     'Es importante que él escriba claro.',  'It is important that he write clearly.'],
      nosotros: ['escribamos',  'Ojalá escribamos algo memorable.',     'I hope we write something memorable.'],
      vosotros: ['escribáis',   'Quiero que vosotros escribáis.',       'I want you all to write.'],
      ellos:    ['escriban',    'Es bueno que ellos escriban.',         'It is good that they write.'],
    },
    imperfect_subjunctive: {
      yo:       ['escribiera',     'Ojalá escribiera más rápido.',      'I wish I wrote faster.'],
      tú:       ['escribieras',    'Quería que escribieras una carta.',  'I wanted you to write a letter.'],
      él:       ['escribiera',     'Si escribiera más, aprendería.',    'If he wrote more, he would learn.'],
      nosotros: ['escribiéramos',  'Si escribiéramos juntos, lo terminaríamos.', 'If we wrote together, we would finish it.'],
      vosotros: ['escribierais',   'Esperaba que vosotros escribierais.','I hoped you all would write.'],
      ellos:    ['escribieran',    'Si escribieran menos, descansarían.', 'If they wrote less, they would rest.'],
    },
    imperative: {
      tú:       ['escribe',      '¡Escribe tu nombre aquí!',            'Write your name here!'],
      él:       ['escriba',      'Que él escriba la dirección.',        'Let him write the address.'],
      nosotros: ['escribamos',   '¡Escribamos la lista juntos!',        'Let\'s write the list together!'],
      vosotros: ['escribid',     '¡Escribid en letra clara!',           'Write in clear handwriting!'],
      ellos:    ['escriban',     'Que ellos escriban sus ideas.',       'Let them write their ideas.'],
    },
  },
  beber: {
    preterite: {
      yo:       ['bebí',      'Bebí agua fría después de correr.',      'I drank cold water after running.'],
      tú:       ['bebiste',   'Tú bebiste demasiado café.',             'You drank too much coffee.'],
      él:       ['bebió',     'Él bebió el vaso de un trago.',          'He drank the glass in one gulp.'],
      nosotros: ['bebimos',   'Nosotros bebimos vino en la cena.',      'We drank wine at dinner.'],
      vosotros: ['bebisteis', 'Vosotros bebisteis limonada.',           'You all drank lemonade.'],
      ellos:    ['bebieron',  'Ellos bebieron agua todo el día.',       'They drank water all day.'],
    },
    imperfect: {
      yo:       ['bebía',    'Bebía leche todos los días de niño.',     'I used to drink milk every day as a child.'],
      tú:       ['bebías',   'Tú bebías mucho jugo.',                   'You used to drink a lot of juice.'],
      él:       ['bebía',    'Él bebía café por la mañana.',            'He used to drink coffee in the morning.'],
      nosotros: ['bebíamos', 'Bebíamos agua con las comidas.',          'We used to drink water with meals.'],
      vosotros: ['bebíais',  'Vosotros bebíais té por la tarde.',       'You all used to drink tea in the afternoon.'],
      ellos:    ['bebían',   'Ellos bebían refrescos en el parque.',    'They used to drink sodas in the park.'],
    },
    future: {
      yo:       ['beberé',    'Beberé más agua este verano.',           'I will drink more water this summer.'],
      tú:       ['beberás',   'Tú beberás el medicamento.',             'You will drink the medicine.'],
      él:       ['beberá',    'Él beberá antes de la carrera.',         'He will drink before the race.'],
      nosotros: ['beberemos', 'Beberemos algo frío.',                   'We will drink something cold.'],
      vosotros: ['beberéis',  'Vosotros beberéis agua.',                'You all will drink water.'],
      ellos:    ['beberán',   'Ellos beberán cuando lleguen.',          'They will drink when they arrive.'],
    },
    conditional: {
      yo:       ['bebería',    'Bebería más agua si tuviera sed.',      'I would drink more water if I were thirsty.'],
      tú:       ['beberías',   'Tú beberías ese batido.',               'You would drink that smoothie.'],
      él:       ['bebería',    'Él bebería con gusto.',                 'He would drink gladly.'],
      nosotros: ['beberíamos', 'Beberíamos algo caliente.',             'We would drink something hot.'],
      vosotros: ['beberíais',  'Vosotros beberíais limonada.',          'You all would drink lemonade.'],
      ellos:    ['beberían',   'Ellos beberían sin parar.',             'They would drink without stopping.'],
    },
    present_subjunctive: {
      yo:       ['beba',    'Es necesario que yo beba más agua.',       'It is necessary that I drink more water.'],
      tú:       ['bebas',   'Quiero que tú bebas despacio.',            'I want you to drink slowly.'],
      él:       ['beba',    'Espero que él beba menos café.',           'I hope he drinks less coffee.'],
      nosotros: ['bebamos', 'Ojalá bebamos algo refrescante.',          'I hope we drink something refreshing.'],
      vosotros: ['bebáis',  'Es bueno que vosotros bebáis agua.',       'It is good that you all drink water.'],
      ellos:    ['beban',   'Quiero que ellos beban con calma.',        'I want them to drink calmly.'],
    },
    imperfect_subjunctive: {
      yo:       ['bebiera',     'Ojalá bebiera menos café.',            'I wish I drank less coffee.'],
      tú:       ['bebieras',    'Quería que bebieras agua.',            'I wanted you to drink water.'],
      él:       ['bebiera',     'Si bebiera más agua, se sentiría mejor.', 'If he drank more water, he would feel better.'],
      nosotros: ['bebiéramos',  'Si bebiéramos menos, dormiríamos mejor.', 'If we drank less, we would sleep better.'],
      vosotros: ['bebierais',   'Esperaba que bebierais con moderación.', 'I hoped you all would drink in moderation.'],
      ellos:    ['bebieran',    'Si bebieran agua, no tendrían sed.',   'If they drank water, they wouldn\'t be thirsty.'],
    },
    imperative: {
      tú:       ['bebe',      '¡Bebe agua antes de salir!',             'Drink water before leaving!'],
      él:       ['beba',      'Que él beba algo frío.',                 'Let him drink something cold.'],
      nosotros: ['bebamos',   '¡Bebamos por nuestra amistad!',          'Let\'s drink to our friendship!'],
      vosotros: ['bebed',     '¡Bebed agua, no refrescos!',             'Drink water, not soda!'],
      ellos:    ['beban',     'Que beban lo que quieran.',              'Let them drink what they want.'],
    },
  },
  caminar: {
    preterite: {
      yo:       ['caminé',      'Caminé cinco kilómetros ayer.',        'I walked five kilometers yesterday.'],
      tú:       ['caminaste',   'Tú caminaste hasta el centro.',        'You walked to the city center.'],
      él:       ['caminó',      'Él caminó sin cansarse.',              'He walked without getting tired.'],
      nosotros: ['caminamos',   'Nosotros caminamos por el parque.',    'We walked through the park.'],
      vosotros: ['caminasteis', 'Vosotros caminasteis en la lluvia.',   'You all walked in the rain.'],
      ellos:    ['caminaron',   'Ellos caminaron toda la tarde.',       'They walked all afternoon.'],
    },
    imperfect: {
      yo:       ['caminaba',    'Caminaba al trabajo cada día.',        'I used to walk to work every day.'],
      tú:       ['caminabas',   'Tú caminabas muy despacio.',           'You used to walk very slowly.'],
      él:       ['caminaba',    'Él caminaba por la playa.',            'He used to walk on the beach.'],
      nosotros: ['caminábamos', 'Caminábamos juntos por las mañanas.',  'We used to walk together in the mornings.'],
      vosotros: ['caminabais',  'Vosotros caminabais sin rumbo.',       'You all used to walk aimlessly.'],
      ellos:    ['caminaban',   'Ellos caminaban rápido.',              'They used to walk fast.'],
    },
    future: {
      yo:       ['caminaré',    'Caminaré más esta semana.',            'I will walk more this week.'],
      tú:       ['caminarás',   'Tú caminarás hasta la cima.',          'You will walk to the top.'],
      él:       ['caminará',    'Él caminará solo mañana.',             'He will walk alone tomorrow.'],
      nosotros: ['caminaremos', 'Caminaremos por la ciudad.',           'We will walk through the city.'],
      vosotros: ['caminaréis',  'Vosotros caminaréis al museo.',        'You all will walk to the museum.'],
      ellos:    ['caminarán',   'Ellos caminarán juntos.',              'They will walk together.'],
    },
    conditional: {
      yo:       ['caminaría',    'Caminaría más si tuviera tiempo.',    'I would walk more if I had time.'],
      tú:       ['caminarías',   'Tú caminarías en ese parque.',        'You would walk in that park.'],
      él:       ['caminaría',    'Él caminaría por horas.',             'He would walk for hours.'],
      nosotros: ['caminaríamos', 'Caminaríamos juntos al amanecer.',    'We would walk together at dawn.'],
      vosotros: ['caminaríais',  'Vosotros caminaríais descalzos.',     'You all would walk barefoot.'],
      ellos:    ['caminarían',   'Ellos caminarían sin parar.',         'They would walk without stopping.'],
    },
    present_subjunctive: {
      yo:       ['camine',    'Es bueno que yo camine más.',            'It is good that I walk more.'],
      tú:       ['camines',   'Quiero que tú camines conmigo.',         'I want you to walk with me.'],
      él:       ['camine',    'Espero que él camine hasta allá.',       'I hope he walks over there.'],
      nosotros: ['caminemos', 'Ojalá caminemos por la montaña.',        'I hope we walk through the mountain.'],
      vosotros: ['caminéis',  'Es bueno que vosotros caminéis.',        'It is good that you all walk.'],
      ellos:    ['caminen',   'Quiero que ellos caminen juntos.',       'I want them to walk together.'],
    },
    imperfect_subjunctive: {
      yo:       ['caminara',     'Ojalá caminara menos.',               'I wish I walked less.'],
      tú:       ['caminaras',    'Quería que caminaras conmigo.',       'I wanted you to walk with me.'],
      él:       ['caminara',     'Si caminara, estaría más sano.',      'If he walked, he would be healthier.'],
      nosotros: ['camináramos',  'Si camináramos más, adelgazaríamos.', 'If we walked more, we would lose weight.'],
      vosotros: ['caminarais',   'Esperaba que caminarais juntos.',     'I hoped you all would walk together.'],
      ellos:    ['caminaran',    'Si caminaran, llegarían pronto.',     'If they walked, they would arrive soon.'],
    },
    imperative: {
      tú:       ['camina',      '¡Camina más rápido!',                  'Walk faster!'],
      él:       ['camine',      'Que él camine un poco.',               'Let him walk a little.'],
      nosotros: ['caminemos',   '¡Caminemos hacia allá!',               'Let\'s walk over there!'],
      vosotros: ['caminad',     '¡Caminad con cuidado!',                'Walk carefully!'],
      ellos:    ['caminen',     'Que caminen sin prisa.',               'Let them walk without hurry.'],
    },
  },
  aprender: {
    preterite: {
      yo:       ['aprendí',      'Aprendí a tocar la guitarra.',        'I learned to play the guitar.'],
      tú:       ['aprendiste',   'Tú aprendiste rápido.',               'You learned quickly.'],
      él:       ['aprendió',     'Él aprendió la lección.',             'He learned the lesson.'],
      nosotros: ['aprendimos',   'Nosotros aprendimos mucho hoy.',      'We learned a lot today.'],
      vosotros: ['aprendisteis', 'Vosotros aprendisteis bien.',         'You all learned well.'],
      ellos:    ['aprendieron',  'Ellos aprendieron el idioma.',        'They learned the language.'],
    },
    imperfect: {
      yo:       ['aprendía',    'Aprendía algo nuevo cada día.',        'I used to learn something new every day.'],
      tú:       ['aprendías',   'Tú aprendías muy fácilmente.',         'You used to learn very easily.'],
      él:       ['aprendía',    'Él aprendía en silencio.',             'He used to learn in silence.'],
      nosotros: ['aprendíamos', 'Aprendíamos juntos en la biblioteca.', 'We used to learn together in the library.'],
      vosotros: ['aprendíais',  'Vosotros aprendíais escuchando.',      'You all used to learn by listening.'],
      ellos:    ['aprendían',   'Ellos aprendían rápido.',              'They used to learn fast.'],
    },
    future: {
      yo:       ['aprenderé',    'Aprenderé portugués este año.',       'I will learn Portuguese this year.'],
      tú:       ['aprenderás',   'Tú aprenderás a cocinar.',            'You will learn to cook.'],
      él:       ['aprenderá',    'Él aprenderá el programa pronto.',    'He will learn the program soon.'],
      nosotros: ['aprenderemos', 'Aprenderemos juntos.',                'We will learn together.'],
      vosotros: ['aprenderéis',  'Vosotros aprenderéis mucho.',         'You all will learn a lot.'],
      ellos:    ['aprenderán',   'Ellos aprenderán la canción.',        'They will learn the song.'],
    },
    conditional: {
      yo:       ['aprendería',    'Aprendería más con un buen profesor.', 'I would learn more with a good teacher.'],
      tú:       ['aprenderías',   'Tú aprenderías a bailar.',           'You would learn to dance.'],
      él:       ['aprendería',    'Él aprendería más con práctica.',    'He would learn more with practice.'],
      nosotros: ['aprenderíamos', 'Aprenderíamos más viajando.',        'We would learn more by traveling.'],
      vosotros: ['aprenderíais',  'Vosotros aprenderíais con esfuerzo.','You all would learn with effort.'],
      ellos:    ['aprenderían',   'Ellos aprenderían si quisieran.',    'They would learn if they wanted to.'],
    },
    present_subjunctive: {
      yo:       ['aprenda',    'Quiero que yo aprenda más.',            'I want to learn more.'],
      tú:       ['aprendas',   'Espero que tú aprendas algo nuevo.',    'I hope you learn something new.'],
      él:       ['aprenda',    'Es bueno que él aprenda pronto.',       'It is good that he learns soon.'],
      nosotros: ['aprendamos', 'Ojalá aprendamos de nuestros errores.', 'I hope we learn from our mistakes.'],
      vosotros: ['aprendáis',  'Quiero que vosotros aprendáis.',        'I want you all to learn.'],
      ellos:    ['aprendan',   'Es importante que ellos aprendan.',     'It is important that they learn.'],
    },
    imperfect_subjunctive: {
      yo:       ['aprendiera',     'Ojalá aprendiera más rápido.',      'I wish I learned faster.'],
      tú:       ['aprendieras',    'Quería que aprendieras a nadar.',   'I wanted you to learn to swim.'],
      él:       ['aprendiera',     'Si aprendiera inglés, viajaría.',   'If he learned English, he would travel.'],
      nosotros: ['aprendiéramos',  'Si aprendiéramos más, sería mejor.','If we learned more, it would be better.'],
      vosotros: ['aprendierais',   'Esperaba que aprendierais juntos.', 'I hoped you all would learn together.'],
      ellos:    ['aprendieran',    'Si aprendieran, mejorarían.',       'If they learned, they would improve.'],
    },
    imperative: {
      tú:       ['aprende',      '¡Aprende algo nuevo cada día!',       'Learn something new every day!'],
      él:       ['aprenda',      'Que él aprenda las reglas.',          'Let him learn the rules.'],
      nosotros: ['aprendamos',   '¡Aprendamos juntos!',                 'Let\'s learn together!'],
      vosotros: ['aprended',     '¡Aprended con entusiasmo!',           'Learn with enthusiasm!'],
      ellos:    ['aprendan',     'Que aprendan de sus errores.',        'Let them learn from their mistakes.'],
    },
  },
  abrir: {
    preterite: {
      yo:       ['abrí',      'Abrí la puerta sin llave.',              'I opened the door without a key.'],
      tú:       ['abriste',   'Tú abriste la ventana.',                 'You opened the window.'],
      él:       ['abrió',     'Él abrió una tienda nueva.',             'He opened a new store.'],
      nosotros: ['abrimos',   'Nosotros abrimos el regalo.',            'We opened the gift.'],
      vosotros: ['abristeis', 'Vosotros abristeis los ojos.',           'You all opened your eyes.'],
      ellos:    ['abrieron',  'Ellos abrieron la caja.',                'They opened the box.'],
    },
    imperfect: {
      yo:       ['abría',    'Abría la tienda temprano cada día.',      'I used to open the store early every day.'],
      tú:       ['abrías',   'Tú siempre abrías la puerta con cuidado.','You always used to open the door carefully.'],
      él:       ['abría',    'Él abría el libro lentamente.',           'He used to open the book slowly.'],
      nosotros: ['abríamos', 'Abríamos las persianas al amanecer.',     'We used to open the blinds at dawn.'],
      vosotros: ['abríais',  'Vosotros abríais el negocio a las nueve.','You all used to open the business at nine.'],
      ellos:    ['abrían',   'Ellos abrían los regalos con cuidado.',   'They used to open gifts carefully.'],
    },
    future: {
      yo:       ['abriré',    'Abriré mi propio negocio.',              'I will open my own business.'],
      tú:       ['abrirás',   'Tú abrirás la puerta principal.',        'You will open the main door.'],
      él:       ['abrirá',    'Él abrirá el sobre mañana.',             'He will open the envelope tomorrow.'],
      nosotros: ['abriremos', 'Abriremos el evento con un discurso.',   'We will open the event with a speech.'],
      vosotros: ['abriréis',  'Vosotros abriréis la presentación.',     'You all will open the presentation.'],
      ellos:    ['abrirán',   'Ellos abrirán la tienda pronto.',        'They will open the store soon.'],
    },
    conditional: {
      yo:       ['abriría',    'Abriría la ventana si no lloviera.',    'I would open the window if it weren\'t raining.'],
      tú:       ['abrirías',   'Tú abrirías la puerta a cualquiera.',   'You would open the door for anyone.'],
      él:       ['abriría',    'Él abriría una librería.',              'He would open a bookstore.'],
      nosotros: ['abriríamos', 'Abriríamos el paquete juntos.',         'We would open the package together.'],
      vosotros: ['abriríais',  'Vosotros abriríais sin pensarlo.',      'You all would open it without thinking.'],
      ellos:    ['abrirían',   'Ellos abrirían otro restaurante.',      'They would open another restaurant.'],
    },
    present_subjunctive: {
      yo:       ['abra',    'Quiero que yo abra la reunión.',           'I want to open the meeting.'],
      tú:       ['abras',   'Espero que tú abras la puerta.',           'I hope you open the door.'],
      él:       ['abra',    'Es necesario que él abra el negocio.',     'It is necessary that he opens the business.'],
      nosotros: ['abramos', 'Ojalá abramos pronto.',                    'I hope we open soon.'],
      vosotros: ['abráis',  'Quiero que vosotros abráis las ventanas.', 'I want you all to open the windows.'],
      ellos:    ['abran',   'Es bueno que ellos abran más tarde.',      'It is good that they open later.'],
    },
    imperfect_subjunctive: {
      yo:       ['abriera',     'Ojalá abriera una cafetería.',         'I wish I opened a café.'],
      tú:       ['abrieras',    'Quería que abrieras la ventana.',      'I wanted you to open the window.'],
      él:       ['abriera',     'Si abriera antes, tendría más clientes.', 'If he opened earlier, he would have more customers.'],
      nosotros: ['abriéramos',  'Si abriéramos juntos, sería fácil.',   'If we opened together, it would be easy.'],
      vosotros: ['abrierais',   'Esperaba que vosotros abrierais.',     'I hoped you all would open.'],
      ellos:    ['abrieran',    'Si abrieran, entraríamos.',            'If they opened, we would go in.'],
    },
    imperative: {
      tú:       ['abre',      '¡Abre la puerta, por favor!',            'Open the door, please!'],
      él:       ['abra',      'Que él abra el sobre.',                  'Let him open the envelope.'],
      nosotros: ['abramos',   '¡Abramos el debate!',                    'Let\'s open the debate!'],
      vosotros: ['abrid',     '¡Abrid las ventanas!',                   'Open the windows!'],
      ellos:    ['abran',     'Que abran cuando estén listos.',         'Let them open when they are ready.'],
    },
  },
  leer: {
    preterite: {
      yo:       ['leí',      'Leí ese libro en dos días.',              'I read that book in two days.'],
      tú:       ['leíste',   'Tú leíste el artículo completo.',         'You read the entire article.'],
      él:       ['leyó',     'Él leyó un poema en voz alta.',           'He read a poem out loud.'],
      nosotros: ['leímos',   'Nosotros leímos la misma novela.',        'We read the same novel.'],
      vosotros: ['leísteis', 'Vosotros leísteis el informe.',           'You all read the report.'],
      ellos:    ['leyeron',  'Ellos leyeron las instrucciones.',        'They read the instructions.'],
    },
    imperfect: {
      yo:       ['leía',    'Leía antes de dormir cada noche.',         'I used to read before sleeping every night.'],
      tú:       ['leías',   'Tú leías muchas revistas.',                'You used to read a lot of magazines.'],
      él:       ['leía',    'Él leía el periódico por la mañana.',      'He used to read the newspaper in the morning.'],
      nosotros: ['leíamos', 'Leíamos cuentos de hadas juntos.',         'We used to read fairy tales together.'],
      vosotros: ['leíais',  'Vosotros leíais poesía.',                  'You all used to read poetry.'],
      ellos:    ['leían',   'Ellos leían en la biblioteca.',            'They used to read at the library.'],
    },
    future: {
      yo:       ['leeré',    'Leeré ese libro este mes.',               'I will read that book this month.'],
      tú:       ['leerás',   'Tú leerás el contrato.',                  'You will read the contract.'],
      él:       ['leerá',    'Él leerá la carta esta tarde.',           'He will read the letter this afternoon.'],
      nosotros: ['leeremos', 'Leeremos juntos el capítulo.',            'We will read the chapter together.'],
      vosotros: ['leeréis',  'Vosotros leeréis las instrucciones.',     'You all will read the instructions.'],
      ellos:    ['leerán',   'Ellos leerán el documento.',              'They will read the document.'],
    },
    conditional: {
      yo:       ['leería',    'Leería más si tuviera tiempo.',          'I would read more if I had time.'],
      tú:       ['leerías',   'Tú leerías ese libro.',                  'You would read that book.'],
      él:       ['leería',    'Él leería toda la noche.',               'He would read all night.'],
      nosotros: ['leeríamos', 'Leeríamos en la playa.',                 'We would read on the beach.'],
      vosotros: ['leeríais',  'Vosotros leeríais en silencio.',         'You all would read in silence.'],
      ellos:    ['leerían',   'Ellos leerían con atención.',            'They would read carefully.'],
    },
    present_subjunctive: {
      yo:       ['lea',    'Quiero que yo lea más libros.',             'I want to read more books.'],
      tú:       ['leas',   'Espero que tú leas ese capítulo.',          'I hope you read that chapter.'],
      él:       ['lea',    'Es importante que él lea las reglas.',      'It is important that he reads the rules.'],
      nosotros: ['leamos', 'Ojalá leamos algo interesante.',            'I hope we read something interesting.'],
      vosotros: ['leáis',  'Quiero que vosotros leáis el poema.',       'I want you all to read the poem.'],
      ellos:    ['lean',   'Es bueno que ellos lean mucho.',            'It is good that they read a lot.'],
    },
    imperfect_subjunctive: {
      yo:       ['leyera',     'Ojalá leyera más libros.',              'I wish I read more books.'],
      tú:       ['leyeras',    'Quería que leyeras el manual.',         'I wanted you to read the manual.'],
      él:       ['leyera',     'Si leyera más, sabría más.',            'If he read more, he would know more.'],
      nosotros: ['leyéramos',  'Si leyéramos juntos, aprenderíamos.',   'If we read together, we would learn.'],
      vosotros: ['leyerais',   'Esperaba que leyerais el artículo.',    'I hoped you all would read the article.'],
      ellos:    ['leyeran',    'Si leyeran el libro, lo entenderían.',  'If they read the book, they would understand it.'],
    },
    imperative: {
      tú:       ['lee',      '¡Lee este libro, es genial!',             'Read this book, it\'s great!'],
      él:       ['lea',      'Que él lea las instrucciones.',           'Let him read the instructions.'],
      nosotros: ['leamos',   '¡Leamos juntos este poema!',              'Let\'s read this poem together!'],
      vosotros: ['leed',     '¡Leed más y pensad menos en la tele!',    'Read more and think less about TV!'],
      ellos:    ['lean',     'Que lean cuando quieran.',                'Let them read when they want.'],
    },
  },
  // IRREGULAR VERBS
  ser: {
    preterite: {
      yo:       ['fui',      'Fui el primero en llegar.',               'I was the first to arrive.'],
      tú:       ['fuiste',   'Tú fuiste muy amable conmigo.',           'You were very kind to me.'],
      él:       ['fue',      'Fue un día maravilloso.',                  'It was a wonderful day.'],
      nosotros: ['fuimos',   'Nosotros fuimos amigos durante años.',    'We were friends for years.'],
      vosotros: ['fuisteis', 'Vosotros fuisteis los mejores.',          'You all were the best.'],
      ellos:    ['fueron',   'Ellos fueron los ganadores.',             'They were the winners.'],
    },
    imperfect: {
      yo:       ['era',    'Era muy tímido de niño.',                   'I used to be very shy as a child.'],
      tú:       ['eras',   'Tú eras muy curioso.',                      'You used to be very curious.'],
      él:       ['era',    'Era un profesor excelente.',                'He used to be an excellent teacher.'],
      nosotros: ['éramos', 'Éramos buenos amigos.',                     'We used to be good friends.'],
      vosotros: ['erais',  'Vosotros erais muy jóvenes.',               'You all used to be very young.'],
      ellos:    ['eran',   'Eran muy trabajadores.',                    'They used to be very hardworking.'],
    },
    future: {
      yo:       ['seré',    'Seré médico algún día.',                   'I will be a doctor someday.'],
      tú:       ['serás',   'Tú serás muy feliz.',                      'You will be very happy.'],
      él:       ['será',    'Será una gran oportunidad.',               'It will be a great opportunity.'],
      nosotros: ['seremos', 'Seremos buenos compañeros.',               'We will be good partners.'],
      vosotros: ['seréis',  'Vosotros seréis los mejores.',             'You all will be the best.'],
      ellos:    ['serán',   'Ellos serán famosos.',                     'They will be famous.'],
    },
    conditional: {
      yo:       ['sería',    'Sería mejor esperar.',                    'It would be better to wait.'],
      tú:       ['serías',   'Tú serías un buen líder.',                'You would be a good leader.'],
      él:       ['sería',    'Sería difícil sin ayuda.',                'It would be difficult without help.'],
      nosotros: ['seríamos', 'Seríamos más felices allá.',              'We would be happier there.'],
      vosotros: ['seríais',  'Vosotros seríais perfectos para el rol.', 'You all would be perfect for the role.'],
      ellos:    ['serían',   'Ellos serían buenos socios.',             'They would be good partners.'],
    },
    present_subjunctive: {
      yo:       ['sea',    'Quiero que yo sea útil.',                   'I want to be useful.'],
      tú:       ['seas',   'Espero que tú seas feliz.',                 'I hope you are happy.'],
      él:       ['sea',    'Es importante que él sea honesto.',         'It is important that he be honest.'],
      nosotros: ['seamos', 'Ojalá seamos mejores.',                     'I hope we are better.'],
      vosotros: ['seáis',  'Quiero que vosotros seáis responsables.',   'I want you all to be responsible.'],
      ellos:    ['sean',   'Es necesario que sean puntuales.',          'It is necessary that they be punctual.'],
    },
    imperfect_subjunctive: {
      yo:       ['fuera',     'Ojalá fuera más paciente.',              'I wish I were more patient.'],
      tú:       ['fueras',    'Quería que fueras mi compañero.',        'I wanted you to be my partner.'],
      él:       ['fuera',     'Si fuera más alto, jugaría baloncesto.', 'If he were taller, he would play basketball.'],
      nosotros: ['fuéramos',  'Si fuéramos más ricos, viajaríamos.',    'If we were richer, we would travel.'],
      vosotros: ['fuerais',   'Esperaba que fuerais más puntuales.',    'I hoped you all would be more punctual.'],
      ellos:    ['fueran',    'Si fueran más amables, tendrían más amigos.', 'If they were kinder, they would have more friends.'],
    },
    imperative: {
      tú:       ['sé',       '¡Sé valiente!',                          'Be brave!'],
      él:       ['sea',      'Que él sea puntual.',                     'Let him be punctual.'],
      nosotros: ['seamos',   '¡Seamos honestos!',                       'Let\'s be honest!'],
      vosotros: ['sed',      '¡Sed responsables!',                      'Be responsible!'],
      ellos:    ['sean',     'Que sean lo que quieran ser.',            'Let them be what they want to be.'],
    },
  },
  tener: {
    preterite: {
      yo:       ['tuve',      'Tuve un sueño extraño anoche.',          'I had a strange dream last night.'],
      tú:       ['tuviste',   'Tú tuviste mucha suerte.',               'You had a lot of luck.'],
      él:       ['tuvo',      'Él tuvo un accidente menor.',            'He had a minor accident.'],
      nosotros: ['tuvimos',   'Nosotros tuvimos éxito.',                'We had success.'],
      vosotros: ['tuvisteis', 'Vosotros tuvisteis una buena idea.',     'You all had a good idea.'],
      ellos:    ['tuvieron',  'Ellos tuvieron problemas.',              'They had problems.'],
    },
    imperfect: {
      yo:       ['tenía',    'Tenía mucho trabajo antes.',              'I used to have a lot of work.'],
      tú:       ['tenías',   'Tú tenías mucha energía.',                'You used to have a lot of energy.'],
      él:       ['tenía',    'Él tenía dos perros.',                    'He used to have two dogs.'],
      nosotros: ['teníamos', 'Teníamos una casa grande.',               'We used to have a big house.'],
      vosotros: ['teníais',  'Vosotros teníais muchos amigos.',         'You all used to have many friends.'],
      ellos:    ['tenían',   'Ellos tenían poco dinero.',               'They used to have little money.'],
    },
    future: {
      yo:       ['tendré',    'Tendré más tiempo la próxima semana.',   'I will have more time next week.'],
      tú:       ['tendrás',   'Tú tendrás mucho éxito.',                'You will have a lot of success.'],
      él:       ['tendrá',    'Él tendrá una reunión mañana.',          'He will have a meeting tomorrow.'],
      nosotros: ['tendremos', 'Tendremos una fiesta.',                  'We will have a party.'],
      vosotros: ['tendréis',  'Vosotros tendréis noticias pronto.',     'You all will have news soon.'],
      ellos:    ['tendrán',   'Ellos tendrán que esperar.',             'They will have to wait.'],
    },
    conditional: {
      yo:       ['tendría',    'Tendría más amigos si saliera más.',    'I would have more friends if I went out more.'],
      tú:       ['tendrías',   'Tú tendrías razón en ese caso.',        'You would be right in that case.'],
      él:       ['tendría',    'Él tendría que trabajar más.',          'He would have to work more.'],
      nosotros: ['tendríamos', 'Tendríamos que pensarlo mejor.',        'We would have to think about it more.'],
      vosotros: ['tendríais',  'Vosotros tendríais que decidir.',       'You all would have to decide.'],
      ellos:    ['tendrían',   'Ellos tendrían más opciones.',          'They would have more options.'],
    },
    present_subjunctive: {
      yo:       ['tenga',    'Es bueno que yo tenga paciencia.',        'It is good that I have patience.'],
      tú:       ['tengas',   'Espero que tú tengas suerte.',            'I hope you have luck.'],
      él:       ['tenga',    'Es necesario que él tenga pasaporte.',    'It is necessary that he have a passport.'],
      nosotros: ['tengamos', 'Ojalá tengamos buen tiempo.',             'I hope we have good weather.'],
      vosotros: ['tengáis',  'Quiero que vosotros tengáis cuidado.',    'I want you all to be careful.'],
      ellos:    ['tengan',   'Es importante que tengan información.',   'It is important that they have information.'],
    },
    imperfect_subjunctive: {
      yo:       ['tuviera',     'Ojalá tuviera más dinero.',            'I wish I had more money.'],
      tú:       ['tuvieras',    'Quería que tuvieras más tiempo.',      'I wanted you to have more time.'],
      él:       ['tuviera',     'Si tuviera un coche, viajaría.',       'If he had a car, he would travel.'],
      nosotros: ['tuviéramos',  'Si tuviéramos más recursos, lo haríamos.', 'If we had more resources, we would do it.'],
      vosotros: ['tuvierais',   'Esperaba que tuvierais buena suerte.', 'I hoped you all would have good luck.'],
      ellos:    ['tuvieran',    'Si tuvieran más tiempo, terminarían.', 'If they had more time, they would finish.'],
    },
    imperative: {
      tú:       ['ten',      '¡Ten cuidado!',                           'Be careful!'],
      él:       ['tenga',    'Que él tenga paciencia.',                 'Let him have patience.'],
      nosotros: ['tengamos', '¡Tengamos calma!',                        'Let\'s stay calm!'],
      vosotros: ['tened',    '¡Tened fe!',                              'Have faith!'],
      ellos:    ['tengan',   'Que tengan lo que necesiten.',            'Let them have what they need.'],
    },
  },
  ir: {
    preterite: {
      yo:       ['fui',      'Fui al mercado esta mañana.',             'I went to the market this morning.'],
      tú:       ['fuiste',   'Tú fuiste al concierto ayer.',            'You went to the concert yesterday.'],
      él:       ['fue',      'Él fue a ver a su madre.',                'He went to see his mother.'],
      nosotros: ['fuimos',   'Nosotros fuimos de vacaciones.',          'We went on vacation.'],
      vosotros: ['fuisteis', 'Vosotros fuisteis al partido.',           'You all went to the game.'],
      ellos:    ['fueron',   'Ellos fueron al hospital.',               'They went to the hospital.'],
    },
    imperfect: {
      yo:       ['iba',    'Iba al gimnasio cada mañana.',              'I used to go to the gym every morning.'],
      tú:       ['ibas',   'Tú ibas al parque con frecuencia.',         'You used to go to the park frequently.'],
      él:       ['iba',    'Él iba a misa los domingos.',               'He used to go to mass on Sundays.'],
      nosotros: ['íbamos', 'Íbamos de compras los sábados.',            'We used to go shopping on Saturdays.'],
      vosotros: ['ibais',  'Vosotros ibais a la playa en verano.',      'You all used to go to the beach in summer.'],
      ellos:    ['iban',   'Ellos iban al cine juntos.',                'They used to go to the movies together.'],
    },
    future: {
      yo:       ['iré',    'Iré a España el próximo año.',              'I will go to Spain next year.'],
      tú:       ['irás',   'Tú irás a la conferencia.',                 'You will go to the conference.'],
      él:       ['irá',    'Él irá al médico mañana.',                  'He will go to the doctor tomorrow.'],
      nosotros: ['iremos', 'Iremos de viaje pronto.',                   'We will go on a trip soon.'],
      vosotros: ['iréis',  'Vosotros iréis al norte.',                  'You all will go north.'],
      ellos:    ['irán',   'Ellos irán de excursión.',                  'They will go on an excursion.'],
    },
    conditional: {
      yo:       ['iría',    'Iría a París si pudiera.',                 'I would go to Paris if I could.'],
      tú:       ['irías',   'Tú irías si te invitaran.',                'You would go if they invited you.'],
      él:       ['iría',    'Él iría a cualquier parte.',               'He would go anywhere.'],
      nosotros: ['iríamos', 'Iríamos juntos si hubiera tiempo.',        'We would go together if there were time.'],
      vosotros: ['iríais',  'Vosotros iríais encantados.',              'You all would go gladly.'],
      ellos:    ['irían',   'Ellos irían si pudieran.',                 'They would go if they could.'],
    },
    present_subjunctive: {
      yo:       ['vaya',    'Quiero que yo vaya al extranjero.',        'I want to go abroad.'],
      tú:       ['vayas',   'Espero que tú vayas con ellos.',           'I hope you go with them.'],
      él:       ['vaya',    'Es necesario que él vaya hoy.',            'It is necessary that he go today.'],
      nosotros: ['vayamos', 'Ojalá vayamos todos juntos.',              'I hope we all go together.'],
      vosotros: ['vayáis',  'Quiero que vosotros vayáis primero.',      'I want you all to go first.'],
      ellos:    ['vayan',   'Es bueno que ellos vayan con cuidado.',    'It is good that they go carefully.'],
    },
    imperfect_subjunctive: {
      yo:       ['fuera',     'Ojalá fuera a la fiesta.',               'I wish I went to the party.'],
      tú:       ['fueras',    'Quería que fueras conmigo.',             'I wanted you to go with me.'],
      él:       ['fuera',     'Si fuera más lejos, lo visitaría.',      'If it were farther, I would visit.'],
      nosotros: ['fuéramos',  'Si fuéramos juntos, sería mejor.',       'If we went together, it would be better.'],
      vosotros: ['fuerais',   'Esperaba que fuerais al evento.',        'I hoped you all would go to the event.'],
      ellos:    ['fueran',    'Si fueran, los veríamos.',               'If they went, we would see them.'],
    },
    imperative: {
      tú:       ['ve',       '¡Ve a casa ahora mismo!',                 'Go home right now!'],
      él:       ['vaya',     'Que él vaya primero.',                    'Let him go first.'],
      nosotros: ['vayamos',  '¡Vayamos ya!',                            'Let\'s go now!'],
      vosotros: ['id',       '¡Id con cuidado!',                        'Go carefully!'],
      ellos:    ['vayan',    'Que vayan cuando quieran.',               'Let them go when they want.'],
    },
  },
  hacer: {
    preterite: {
      yo:       ['hice',      'Hice la tarea anoche.',                  'I did the homework last night.'],
      tú:       ['hiciste',   'Tú hiciste un buen trabajo.',            'You did a good job.'],
      él:       ['hizo',      'Él hizo la cena para todos.',            'He made dinner for everyone.'],
      nosotros: ['hicimos',   'Nosotros hicimos el proyecto.',          'We did the project.'],
      vosotros: ['hicisteis', 'Vosotros hicisteis lo correcto.',        'You all did the right thing.'],
      ellos:    ['hicieron',  'Ellos hicieron mucho ruido.',            'They made a lot of noise.'],
    },
    imperfect: {
      yo:       ['hacía',    'Hacía ejercicio todos los días.',         'I used to exercise every day.'],
      tú:       ['hacías',   'Tú hacías galletas los domingos.',        'You used to make cookies on Sundays.'],
      él:       ['hacía',    'Él hacía preguntas difíciles.',           'He used to ask difficult questions.'],
      nosotros: ['hacíamos', 'Hacíamos picnics en el parque.',          'We used to have picnics in the park.'],
      vosotros: ['hacíais',  'Vosotros hacíais deporte juntos.',        'You all used to play sports together.'],
      ellos:    ['hacían',   'Ellos hacían mucho trabajo.',             'They used to do a lot of work.'],
    },
    future: {
      yo:       ['haré',    'Haré lo posible para ayudarte.',           'I will do everything possible to help you.'],
      tú:       ['harás',   'Tú harás grandes cosas.',                  'You will do great things.'],
      él:       ['hará',    'Él hará una presentación.',                'He will give a presentation.'],
      nosotros: ['haremos', 'Haremos lo que podamos.',                  'We will do what we can.'],
      vosotros: ['haréis',  'Vosotros haréis el viaje pronto.',         'You all will make the trip soon.'],
      ellos:    ['harán',   'Ellos harán cambios importantes.',         'They will make important changes.'],
    },
    conditional: {
      yo:       ['haría',    'Haría cualquier cosa por ti.',            'I would do anything for you.'],
      tú:       ['harías',   'Tú harías lo mismo en mi lugar.',         'You would do the same in my place.'],
      él:       ['haría',    'Él haría el trabajo sin quejarse.',       'He would do the work without complaining.'],
      nosotros: ['haríamos', 'Haríamos lo mejor que pudiéramos.',       'We would do the best we could.'],
      vosotros: ['haríais',  'Vosotros haríais algo diferente.',        'You all would do something different.'],
      ellos:    ['harían',   'Ellos harían todo lo necesario.',         'They would do everything necessary.'],
    },
    present_subjunctive: {
      yo:       ['haga',    'Quiero que yo haga algo útil.',            'I want to do something useful.'],
      tú:       ['hagas',   'Espero que tú hagas tu parte.',            'I hope you do your part.'],
      él:       ['haga',    'Es necesario que él haga la tarea.',       'It is necessary that he do the homework.'],
      nosotros: ['hagamos', 'Ojalá hagamos algo especial.',             'I hope we do something special.'],
      vosotros: ['hagáis',  'Quiero que vosotros hagáis el esfuerzo.',  'I want you all to make the effort.'],
      ellos:    ['hagan',   'Es bueno que ellos hagan preguntas.',      'It is good that they ask questions.'],
    },
    imperfect_subjunctive: {
      yo:       ['hiciera',     'Ojalá hiciera más ejercicio.',         'I wish I exercised more.'],
      tú:       ['hicieras',    'Quería que hicieras el favor.',        'I wanted you to do the favor.'],
      él:       ['hiciera',     'Si hiciera más, mejoraría.',           'If he did more, he would improve.'],
      nosotros: ['hiciéramos',  'Si hiciéramos más caso, aprenderíamos.', 'If we paid more attention, we would learn.'],
      vosotros: ['hicierais',   'Esperaba que hicierais el trabajo.',   'I hoped you all would do the work.'],
      ellos:    ['hicieran',    'Si hicieran más, lo lograrían.',       'If they did more, they would achieve it.'],
    },
    imperative: {
      tú:       ['haz',      '¡Haz tu tarea ahora!',                    'Do your homework now!'],
      él:       ['haga',     'Que él haga lo que le dijimos.',          'Let him do what we told him.'],
      nosotros: ['hagamos',  '¡Hagamos lo correcto!',                   'Let\'s do the right thing!'],
      vosotros: ['haced',    '¡Haced el trabajo a tiempo!',             'Do the work on time!'],
      ellos:    ['hagan',    'Que hagan lo que crean mejor.',           'Let them do what they think is best.'],
    },
  },
  estar: {
    preterite: {
      yo:       ['estuve',      'Estuve en Madrid la semana pasada.',   'I was in Madrid last week.'],
      tú:       ['estuviste',   'Tú estuviste muy cansado ayer.',       'You were very tired yesterday.'],
      él:       ['estuvo',      'Él estuvo enfermo tres días.',         'He was sick for three days.'],
      nosotros: ['estuvimos',   'Nosotros estuvimos allí dos horas.',   'We were there for two hours.'],
      vosotros: ['estuvisteis', 'Vosotros estuvisteis muy callados.',   'You all were very quiet.'],
      ellos:    ['estuvieron',  'Ellos estuvieron de acuerdo.',         'They were in agreement.'],
    },
    imperfect: {
      yo:       ['estaba',    'Estaba cansado cuando llegué.',          'I was tired when I arrived.'],
      tú:       ['estabas',   'Tú estabas muy contento.',               'You used to be very happy.'],
      él:       ['estaba',    'Él estaba sentado en el banco.',         'He was sitting on the bench.'],
      nosotros: ['estábamos', 'Estábamos esperando el autobús.',        'We were waiting for the bus.'],
      vosotros: ['estabais',  'Vosotros estabais muy animados.',        'You all were very enthusiastic.'],
      ellos:    ['estaban',   'Ellos estaban durmiendo.',               'They were sleeping.'],
    },
    future: {
      yo:       ['estaré',    'Estaré en casa toda la tarde.',          'I will be home all afternoon.'],
      tú:       ['estarás',   'Tú estarás bien muy pronto.',            'You will be fine very soon.'],
      él:       ['estará',    'Él estará aquí a las tres.',             'He will be here at three.'],
      nosotros: ['estaremos', 'Estaremos listos para las seis.',        'We will be ready by six.'],
      vosotros: ['estaréis',  'Vosotros estaréis de acuerdo.',          'You all will agree.'],
      ellos:    ['estarán',   'Ellos estarán esperando.',               'They will be waiting.'],
    },
    conditional: {
      yo:       ['estaría',    'Estaría feliz de ayudarte.',            'I would be happy to help you.'],
      tú:       ['estarías',   'Tú estarías mejor con descanso.',       'You would be better with rest.'],
      él:       ['estaría',    'Él estaría de acuerdo.',                'He would agree.'],
      nosotros: ['estaríamos', 'Estaríamos allí a tiempo.',             'We would be there on time.'],
      vosotros: ['estaríais',  'Vosotros estaríais contentos.',         'You all would be happy.'],
      ellos:    ['estarían',   'Ellos estarían sorprendidos.',          'They would be surprised.'],
    },
    present_subjunctive: {
      yo:       ['esté',    'Quiero que yo esté listo.',                'I want to be ready.'],
      tú:       ['estés',   'Espero que tú estés bien.',                'I hope you are well.'],
      él:       ['esté',    'Es importante que él esté presente.',      'It is important that he be present.'],
      nosotros: ['estemos', 'Ojalá estemos juntos pronto.',             'I hope we are together soon.'],
      vosotros: ['estéis',  'Quiero que vosotros estéis atentos.',      'I want you all to be attentive.'],
      ellos:    ['estén',   'Es necesario que ellos estén aquí.',       'It is necessary that they be here.'],
    },
    imperfect_subjunctive: {
      yo:       ['estuviera',     'Ojalá estuviera en la playa.',       'I wish I were at the beach.'],
      tú:       ['estuvieras',    'Quería que estuvieras conmigo.',     'I wanted you to be with me.'],
      él:       ['estuviera',     'Si estuviera aquí, ayudaría.',       'If he were here, he would help.'],
      nosotros: ['estuviéramos',  'Si estuviéramos listos, saldríamos.','If we were ready, we would leave.'],
      vosotros: ['estuvierais',   'Esperaba que estuvierais bien.',     'I hoped you all would be well.'],
      ellos:    ['estuvieran',    'Si estuvieran aquí, sería mejor.',   'If they were here, it would be better.'],
    },
    imperative: {
      tú:       ['está',     '¡Está tranquilo, todo irá bien!',         'Be calm, everything will be fine!'],
      él:       ['esté',     'Que él esté atento.',                     'Let him be attentive.'],
      nosotros: ['estemos',  '¡Estemos de acuerdo en esto!',            'Let\'s agree on this!'],
      vosotros: ['estad',    '¡Estad listos para mañana!',              'Be ready for tomorrow!'],
      ellos:    ['estén',    'Que estén donde los necesiten.',          'Let them be where they are needed.'],
    },
  },
}

async function main() {
  console.log('Seeding additional tenses...')

  const verbs = await prisma.verb.findMany()
  const verbMap = {}
  for (const v of verbs) {
    verbMap[v.infinitive] = v.id
  }

  // Compound tenses (using haber)
  const COMPOUND_TENSES = ['present_perfect', 'past_perfect', 'future_perfect', 'conditional_perfect', 'present_perfect_subjunctive']

  let totalCreated = 0

  for (const [infinitive, tenseData] of Object.entries(CONJUGATIONS)) {
    const verbId = verbMap[infinitive]
    if (!verbId) {
      console.log(`  ⚠ verb not found: ${infinitive}`)
      continue
    }
    const participle = PARTICIPLES[infinitive]
    let verbCreated = 0

    // Seed explicit tenses from CONJUGATIONS
    for (const [tense, pronounData] of Object.entries(tenseData)) {
      const pronouns = tense === 'imperative' ? IMPERATIVE_PRONOUNS : PRONOUNS
      for (const pronoun of pronouns) {
        if (!pronounData[pronoun]) continue
        const [form, exampleEs, exampleEn] = pronounData[pronoun]
        await prisma.verbConjugation.upsert({
          where: { verbId_tense_pronoun: { verbId, tense, pronoun } },
          update: { form, exampleEs, exampleEn },
          create: { verbId, tense, pronoun, form, exampleEs, exampleEn },
        })
        verbCreated++
      }
    }

    // Seed compound tenses automatically
    for (const tense of COMPOUND_TENSES) {
      const haberForms = HABER[tense]
      for (const pronoun of PRONOUNS) {
        const form = `${haberForms[pronoun]} ${participle}`
        const exampleEs = `${pronoun === 'yo' ? 'Yo' : pronoun === 'tú' ? 'Tú' : pronoun === 'él' ? 'Él' : pronoun === 'nosotros' ? 'Nosotros' : pronoun === 'vosotros' ? 'Vosotros' : 'Ellos'} ${form}.`
        const exampleEn = `(${tense.replace(/_/g,' ')}) — ${infinitive} — ${pronoun}`
        await prisma.verbConjugation.upsert({
          where: { verbId_tense_pronoun: { verbId, tense, pronoun } },
          update: { form, exampleEs, exampleEn },
          create: { verbId, tense, pronoun, form, exampleEs, exampleEn },
        })
        verbCreated++
      }
    }

    console.log(`  ✓ ${infinitive} (${verbCreated} conjugations)`)
    totalCreated += verbCreated
  }

  console.log(`Done! Seeded ${totalCreated} conjugations across ${Object.keys(CONJUGATIONS).length} verbs.`)
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
