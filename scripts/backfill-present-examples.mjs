import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const EXAMPLES = {
  hablar: {
    yo:       ['Yo hablo español todos los días.',        'I speak Spanish every day.'],
    tú:       ['Tú hablas muy bien el inglés.',           'You speak English very well.'],
    él:       ['Él habla con su familia por teléfono.',   'He speaks with his family on the phone.'],
    nosotros: ['Nosotros hablamos de todo en la cena.',   'We talk about everything at dinner.'],
    vosotros: ['Vosotros habláis demasiado rápido.',      'You all speak too fast.'],
    ellos:    ['Ellos hablan tres idiomas.',              'They speak three languages.'],
  },
  comer: {
    yo:       ['Yo como fruta cada mañana.',              'I eat fruit every morning.'],
    tú:       ['Tú comes mucho en el desayuno.',          'You eat a lot at breakfast.'],
    él:       ['Él come en la cantina del trabajo.',      'He eats at the work cafeteria.'],
    nosotros: ['Nosotros comemos juntos los domingos.',   'We eat together on Sundays.'],
    vosotros: ['Vosotros coméis muy tarde.',              'You all eat very late.'],
    ellos:    ['Ellos comen verduras con cada comida.',   'They eat vegetables with every meal.'],
  },
  vivir: {
    yo:       ['Yo vivo en un apartamento pequeño.',      'I live in a small apartment.'],
    tú:       ['Tú vives cerca del parque.',              'You live near the park.'],
    él:       ['Él vive solo desde hace un año.',         'He has been living alone for a year.'],
    nosotros: ['Nosotros vivimos en la misma calle.',     'We live on the same street.'],
    vosotros: ['Vosotros vivís muy lejos del centro.',    'You all live very far from downtown.'],
    ellos:    ['Ellos viven en el campo.',                'They live in the countryside.'],
  },
  trabajar: {
    yo:       ['Yo trabajo desde casa los viernes.',      'I work from home on Fridays.'],
    tú:       ['Tú trabajas demasiadas horas.',           'You work too many hours.'],
    él:       ['Él trabaja en una empresa tecnológica.',  'He works at a tech company.'],
    nosotros: ['Nosotros trabajamos bien en equipo.',     'We work well as a team.'],
    vosotros: ['Vosotros trabajáis mucho los fines de semana.', 'You all work a lot on weekends.'],
    ellos:    ['Ellos trabajan en el mismo edificio.',    'They work in the same building.'],
  },
  escribir: {
    yo:       ['Yo escribo en mi diario cada noche.',     'I write in my diary every night.'],
    tú:       ['Tú escribes muy bien.',                   'You write very well.'],
    él:       ['Él escribe artículos para un blog.',      'He writes articles for a blog.'],
    nosotros: ['Nosotros escribimos cartas a los abuelos.', 'We write letters to the grandparents.'],
    vosotros: ['Vosotros escribís con mucha creatividad.', 'You all write with a lot of creativity.'],
    ellos:    ['Ellos escriben el informe juntos.',       'They write the report together.'],
  },
  beber: {
    yo:       ['Yo bebo agua con cada comida.',           'I drink water with every meal.'],
    tú:       ['Tú bebes demasiado café.',                'You drink too much coffee.'],
    él:       ['Él bebe un vaso de leche por la mañana.', 'He drinks a glass of milk in the morning.'],
    nosotros: ['Nosotros bebemos té por las tardes.',     'We drink tea in the afternoons.'],
    vosotros: ['Vosotros bebéis mucho zumo de naranja.',  'You all drink a lot of orange juice.'],
    ellos:    ['Ellos beben agua mineral en el trabajo.', 'They drink mineral water at work.'],
  },
  caminar: {
    yo:       ['Yo camino al trabajo cada día.',          'I walk to work every day.'],
    tú:       ['Tú caminas muy rápido.',                  'You walk very fast.'],
    él:       ['Él camina por el parque después de cenar.', 'He walks through the park after dinner.'],
    nosotros: ['Nosotros caminamos juntos por las mañanas.', 'We walk together in the mornings.'],
    vosotros: ['Vosotros camináis sin cansaros.',         'You all walk without getting tired.'],
    ellos:    ['Ellos caminan cinco kilómetros al día.',  'They walk five kilometers a day.'],
  },
  aprender: {
    yo:       ['Yo aprendo algo nuevo cada semana.',      'I learn something new every week.'],
    tú:       ['Tú aprendes los idiomas muy rápido.',     'You learn languages very fast.'],
    él:       ['Él aprende tocando la guitarra.',         'He learns by playing the guitar.'],
    nosotros: ['Nosotros aprendemos de nuestros errores.','We learn from our mistakes.'],
    vosotros: ['Vosotros aprendéis escuchando música.',   'You all learn by listening to music.'],
    ellos:    ['Ellos aprenden a cocinar juntos.',        'They learn to cook together.'],
  },
  abrir: {
    yo:       ['Yo abro la tienda a las nueve.',          'I open the store at nine.'],
    tú:       ['Tú abres las ventanas cada mañana.',      'You open the windows every morning.'],
    él:       ['Él abre el correo al llegar al trabajo.', 'He opens his mail when he arrives at work.'],
    nosotros: ['Nosotros abrimos el restaurante los fines de semana.', 'We open the restaurant on weekends.'],
    vosotros: ['Vosotros abrís los regalos con cuidado.', 'You all open gifts carefully.'],
    ellos:    ['Ellos abren la biblioteca a las ocho.',   'They open the library at eight.'],
  },
  leer: {
    yo:       ['Yo leo un libro antes de dormir.',        'I read a book before sleeping.'],
    tú:       ['Tú lees el periódico cada mañana.',       'You read the newspaper every morning.'],
    él:       ['Él lee novelas históricas.',              'He reads historical novels.'],
    nosotros: ['Nosotros leemos en voz alta con los niños.', 'We read aloud with the children.'],
    vosotros: ['Vosotros leéis mucho en verano.',         'You all read a lot in summer.'],
    ellos:    ['Ellos leen artículos científicos.',       'They read scientific articles.'],
  },
  ser: {
    yo:       ['Yo soy profesor de matemáticas.',         'I am a math teacher.'],
    tú:       ['Tú eres muy generoso con todos.',         'You are very generous with everyone.'],
    él:       ['Él es el mejor amigo que tengo.',         'He is the best friend I have.'],
    nosotros: ['Nosotros somos de la misma ciudad.',      'We are from the same city.'],
    vosotros: ['Vosotros sois los mejores estudiantes.',  'You all are the best students.'],
    ellos:    ['Ellos son hermanos gemelos.',             'They are twin brothers.'],
  },
  tener: {
    yo:       ['Yo tengo mucho trabajo esta semana.',     'I have a lot of work this week.'],
    tú:       ['Tú tienes una familia muy grande.',       'You have a very big family.'],
    él:       ['Él tiene tres hijos pequeños.',           'He has three young children.'],
    nosotros: ['Nosotros tenemos una reunión a las dos.', 'We have a meeting at two.'],
    vosotros: ['Vosotros tenéis muchas responsabilidades.', 'You all have many responsibilities.'],
    ellos:    ['Ellos tienen mucho talento.',             'They have a lot of talent.'],
  },
  ir: {
    yo:       ['Yo voy al gimnasio tres veces por semana.', 'I go to the gym three times a week.'],
    tú:       ['Tú vas a la escuela en bicicleta.',       'You go to school by bicycle.'],
    él:       ['Él va al médico esta tarde.',             'He is going to the doctor this afternoon.'],
    nosotros: ['Nosotros vamos de vacaciones en agosto.', 'We are going on vacation in August.'],
    vosotros: ['Vosotros vais al partido esta noche.',    'You all are going to the game tonight.'],
    ellos:    ['Ellos van al mercado los sábados.',       'They go to the market on Saturdays.'],
  },
  hacer: {
    yo:       ['Yo hago la cena todos los lunes.',        'I make dinner every Monday.'],
    tú:       ['Tú haces deporte cada mañana.',           'You exercise every morning.'],
    él:       ['Él hace su cama antes de salir.',         'He makes his bed before leaving.'],
    nosotros: ['Nosotros hacemos reuniones cada semana.', 'We have meetings every week.'],
    vosotros: ['Vosotros hacéis muy buen trabajo.',       'You all do very good work.'],
    ellos:    ['Ellos hacen muchas preguntas en clase.',  'They ask many questions in class.'],
  },
  estar: {
    yo:       ['Yo estoy muy cansado hoy.',               'I am very tired today.'],
    tú:       ['Tú estás contento con los resultados.',   'You are happy with the results.'],
    él:       ['Él está en una reunión ahora mismo.',     'He is in a meeting right now.'],
    nosotros: ['Nosotros estamos listos para empezar.',   'We are ready to start.'],
    vosotros: ['Vosotros estáis de acuerdo con el plan.', 'You all agree with the plan.'],
    ellos:    ['Ellos están esperando el autobús.',       'They are waiting for the bus.'],
  },
}

async function main() {
  console.log('Backfilling present tense examples...')
  let count = 0
  for (const [infinitive, pronounData] of Object.entries(EXAMPLES)) {
    const verb = await prisma.verb.findFirst({ where: { infinitive } })
    if (!verb) { console.log('  ⚠ not found:', infinitive); continue }
    for (const [pronoun, [exampleEs, exampleEn]] of Object.entries(pronounData)) {
      await prisma.verbConjugation.updateMany({
        where: { verbId: verb.id, tense: 'present', pronoun },
        data: { exampleEs, exampleEn },
      })
      count++
    }
    console.log('  ✓', infinitive)
  }
  console.log(`Done! Updated ${count} rows.`)
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
