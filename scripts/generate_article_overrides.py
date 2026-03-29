from pathlib import Path
import csv

SRC = Path('data/doozan_dictionary_preview.csv')
OUT = Path('data/article_overrides_top1000.csv')

# High-confidence manual overrides for very common nouns / common exceptions / clear cases.
MANUAL = {
    'vez': 'la vez',
    'día': 'el día',
    'año': 'el año',
    'padre': 'el padre',
    'cosa': 'la cosa',
    'señor': 'el señor',
    'hombre': 'el hombre',
    'tiempo': 'el tiempo',
    'casa': 'la casa',
    'verdad': 'la verdad',
    'vida': 'la vida',
    'noche': 'la noche',
    'hijo': 'el hijo',
    'favor': 'el favor',
    'amigo': 'el amigo',
    'papá': 'el papá',
    'trabajo': 'el trabajo',
    'mujer': 'la mujer',
    'parte': 'la parte',
    'acuerdo': 'el acuerdo',
    'momento': 'el momento',
    'mundo': 'el mundo',
    'gente': 'la gente',
    'niño': 'el niño',
    'hora': 'la hora',
    'problema': 'el problema',
    'lugar': 'el lugar',
    'persona': 'la persona',
    'dinero': 'el dinero',
    'hermano': 'el hermano',
    'mano': 'la mano',
    'caso': 'el caso',
    'nombre': 'el nombre',
    'forma': 'la forma',
    'cuenta': 'la cuenta',
    'razón': 'la razón',
    'idea': 'la idea',
    'pasado': 'el pasado',
    'semana': 'la semana',
    'familia': 'la familia',
    'policía': 'la policía',
    'país': 'el país',
    'minuto': 'el minuto',
    'mierda': 'la mierda',
    'historia': 'la historia',
    'amor': 'el amor',
    'lado': 'el lado',
    'manera': 'la manera',
    'cabeza': 'la cabeza',
    'punto': 'el punto',
    'mes': 'el mes',
    'ciudad': 'la ciudad',
    'tío': 'el tío',
    'puerta': 'la puerta',
    'palabra': 'la palabra',
    'ojo': 'el ojo',
    'agua': 'el agua',
    'fin': 'el fin',
    'camino': 'el camino',
    'esposo': 'el esposo',
    'pregunta': 'la pregunta',
    'muerte': 'la muerte',
    'millón': 'el millón',
    'realidad': 'la realidad',
    'equipo': 'el equipo',
    'ayuda': 'la ayuda',
    'cuerpo': 'el cuerpo',
    'jefe': 'el jefe',
    'presidente': 'el presidente',
    'supuesto': 'el supuesto',
    'gobierno': 'el gobierno',
    'nombre': 'el nombre',
    'madre': 'la madre',
    'programa': 'el programa',
    'tema': 'el tema',
    'sistema': 'el sistema',
    'problema': 'el problema',
    'forma': 'la forma',
    'voz': 'la voz',
    'ley': 'la ley',
    'calle': 'la calle',
    'mesa': 'la mesa',
    'mano': 'la mano',
    'grupo': 'el grupo',
    'número': 'el número',
    'campo': 'el campo',
    'guerra': 'la guerra',
    'cara': 'la cara',
    'servicio': 'el servicio',
    'amor': 'el amor',
    'amiga': 'la amiga',
    'empresa': 'la empresa',
    'coche': 'el coche',
    'peso': 'el peso',
    'cambio': 'el cambio',
    'control': 'el control',
    'carta': 'la carta',
    'arma': 'el arma',
    'alma': 'el alma',
    'cultura': 'la cultura',
    'imagen': 'la imagen',
    'memoria': 'la memoria',
    'radio': 'la radio',
    'foto': 'la foto',
    'moto': 'la moto',
}

FEM_ENDINGS = ('ción','sión','dad','tad','tud','umbre','ie','sis','itis','ez')
MASC_EXCEPTIONS = {'día','mapa','tema','problema','sistema','programa','clima','idioma','poema','planeta'}
FEM_EXCEPTIONS = {'mano','radio','foto','moto'}
SKIP = {'gracias'}


def infer_article(word: str):
    w = word.lower()
    if word in MANUAL:
        return MANUAL[word]
    if w in SKIP:
        return None
    if w in FEM_EXCEPTIONS:
        return f'la {word}'
    if w in MASC_EXCEPTIONS:
        return f'el {word}'
    if any(w.endswith(s) for s in FEM_ENDINGS):
        return f'la {word}'
    if w.endswith('a'):
        return f'la {word}'
    if w.endswith('o'):
        return f'el {word}'
    # high-confidence common masculine endings
    if w.endswith(('or','aje','án','ambre','ema')):
        return f'el {word}'
    # common feminine endings
    if w.endswith(('triz','umbre')):
        return f'la {word}'
    return None

rows = []
with SRC.open() as f:
    r = csv.DictReader(f)
    for row in r:
        sort_order = int(row['sortOrder'])
        if sort_order > 1000:
            break
        lemma = row['spanish']
        pos = row['pos']
        if pos != 'n':
            continue
        article_form = infer_article(lemma)
        if article_form:
            rows.append({
                'sortOrder': sort_order,
                'spanishLemma': lemma,
                'spanishWithArticle': article_form,
            })

OUT.parent.mkdir(parents=True, exist_ok=True)
with OUT.open('w', newline='') as f:
    w = csv.DictWriter(f, fieldnames=['sortOrder','spanishLemma','spanishWithArticle'])
    w.writeheader()
    w.writerows(rows)

print(f'wrote {len(rows)} overrides to {OUT}')
