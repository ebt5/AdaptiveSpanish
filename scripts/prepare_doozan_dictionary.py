from pathlib import Path
import csv, json, re, sys

if len(sys.argv) < 3:
    print('usage: prepare_doozan_dictionary.py <source_dir> <output_csv>')
    raise SystemExit(1)

source = Path(sys.argv[1])
out_csv = Path(sys.argv[2])

freq_path = source / 'frequency.csv'
dict_path = source / 'es-en.data'

SKIP_PREFIXES = (
    'letter:',
    'obsolete form of',
    'pronunciation spelling of',
    'abbreviation of',
)
SKIP_CONTAINS = (
    '[+subjunctive',
    '[+masculine',
    '[+por',
    'followed by',
    'q:',
)

def clean_gloss(g: str) -> str:
    g = re.sub(r'\([^)]*\)', '', g).strip()
    g = g.replace('“', '"').replace('”', '"')
    g = re.sub(r'\s+', ' ', g)
    return g.strip('" ').strip()


def normalize_primary(g: str) -> str:
    g = re.sub(r';.*$', '', g).strip()
    g = re.sub(r'\s{2,}', ' ', g)
    return g.strip(' ,;')


def score_gloss(g: str, pos: str) -> int:
    score = 0
    lower = g.lower()
    if lower.startswith(SKIP_PREFIXES):
        return -100
    if any(x in lower for x in SKIP_CONTAINS):
        score -= 10
    if pos == 'v' and lower.startswith('to '):
        score += 20
    if pos in ('prep', 'conj', 'pron', 'art', 'determiner', 'num') and len(lower) < 40:
        score += 8
    if ';' in lower:
        score -= 2
    if ',' in lower:
        score -= 1
    if 'letter:' in lower:
        score -= 50
    if 'archaic' in lower or 'obsolete' in lower:
        score -= 20
    if len(lower) < 3:
        score -= 5
    if len(lower) <= 24:
        score += 4
    return score

text = dict_path.read_text(errors='ignore')
blocks = text.split('_____\n')
gloss_map = {}

for block in blocks:
    block = block.strip('\n')
    if not block.strip():
        continue
    lines = block.splitlines()
    lemma = lines[0].strip()
    pos = None
    glosses = []
    for line in lines[1:]:
        line = line.strip()
        if line.startswith('pos: ') and pos is None:
            pos = line[len('pos: '):].strip()
        elif line.startswith('gloss: '):
            g = clean_gloss(line[len('gloss: '):])
            if g and g not in glosses:
                glosses.append(g)
    if glosses and lemma not in gloss_map:
        gloss_map[lemma] = { 'glosses': glosses[:12], 'dict_pos': pos or '' }

seen = set()
rows = []
with freq_path.open(newline='') as f:
    reader = csv.DictReader(f)
    for rank, row in enumerate(reader, start=1):
        lemma = row['spanish'].strip()
        pos = row['pos'].strip()
        if lemma in seen:
            continue
        seen.add(lemma)
        raw = gloss_map.get(lemma, { 'glosses': [], 'dict_pos': '' })['glosses']
        filtered = [g for g in raw if score_gloss(g, pos) > -50]
        candidates = filtered or raw
        primary = ''
        if candidates:
            best = sorted(candidates, key=lambda g: score_gloss(g, pos), reverse=True)[0]
            primary = normalize_primary(best)
        variants = []
        for g in candidates:
            c = normalize_primary(g)
            if c and c not in variants:
                variants.append(c)
        rows.append({
            'sortOrder': rank,
            'spanish': lemma,
            'englishPrimary': primary,
            'englishVariantsJson': json.dumps(variants[:8], ensure_ascii=False),
            'pos': pos,
            'frequencyCount': row['count'].strip(),
        })

out_csv.parent.mkdir(parents=True, exist_ok=True)
with out_csv.open('w', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=['sortOrder','spanish','englishPrimary','englishVariantsJson','pos','frequencyCount'])
    writer.writeheader()
    writer.writerows(rows)

print(f'wrote {len(rows)} rows to {out_csv}')
