"""Read the supplied timetable without changing it. Usage: python parse-term6.py path.xlsx

Requires openpyxl. Programme anchors are FONT COLOURS, not row positions.
Preserves every source cell and uninterpreted parenthetical value for auditing.
"""
import json
import re
import sys
from collections import defaultdict
from pathlib import Path
import openpyxl

ROOT = Path(__file__).resolve().parents[1]
book = openpyxl.load_workbook(sys.argv[1], data_only=True)
sheet = book['RegularCourses']
legend = {sheet[f'I{r}'].font.color.rgb: sheet[f'I{r}'].value for r in (3, 4, 5)}
slots = [{'index': i, 'start': a, 'end': b} for i, (a, b) in enumerate([
    ('08:00', '09:30'), ('10:00', '11:30'), ('11:45', '13:15'),
    ('14:30', '16:00'), ('16:15', '17:45'), ('18:00', '19:30')], 1)]
assert len(legend) == 3
found = defaultdict(list)
day = None
for row in sheet:
    if row[0].value in ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']:
        day = row[0].value
    if not day:
        continue
    for cell in row[1:7]:
        if not cell.value:
            continue
        raw = str(cell.value).strip()
        match = re.fullmatch(r'([A-Z]+)\s*((?:\([^)]*\)\s*)*)', raw)
        if not match:
            raise ValueError(f'Unrecognized course at {cell.coordinate}: {raw}')
        code = match[1]
        flags = re.findall(r'\(([^)]*)\)', raw)
        anchor = legend.get(cell.font.color.rgb)
        if not anchor:
            raise ValueError(f'Unknown programme colour at {cell.coordinate}')
        phase = next((x for x in flags if x in ['PRE', 'POST']), None)
        found[code].append({'day': day, 'slotIndex': cell.column - 1, 'anchor': anchor,
            'phase': phase, 'sourceCell': cell.coordinate, 'sourceText': raw,
            'parentheticalValue': next((int(x) for x in flags if x.isdigit()), None)})

metadata = json.loads((ROOT / 'src/data/outline-metadata.json').read_text())
workshop_metadata = json.loads((ROOT / 'src/data/workshop-metadata.json').read_text())
courses = []
for code, entries in sorted(found.items()):
    grouped = defaultdict(list)
    for entry in entries:
        # Pair repeated slots on the same day (e.g. IB Thursday) into one offering.
        grouped[(entry['anchor'], entry['phase'], 'MT' if entry['day'] in ['Mon', 'Tue'] else 'WT' if entry['day'] in ['Wed', 'Thu'] else 'FS')].append(entry)
    sections = []
    for number, ((anchor, phase, block), es) in enumerate(grouped.items(), 1):
        # ZMT has two alternative groups at adjacent times; other repeated slots
        # such as IB/TEP are compulsory consecutive sessions in the source.
        variants = [[e for e in es if e['slotIndex'] == slot] for slot in sorted({e['slotIndex'] for e in es})] if code == 'ZMT' else [es]
        for variant in variants:
            slot_ids = sorted({e['slotIndex'] for e in variant})
            sid = f'{code}_{anchor}_{block}_{phase or "FULL"}_{"-".join(map(str,slot_ids))}'
            label = ('Group 1' if slot_ids == [2] else 'Group 2') if code == 'ZMT' else anchor + (f' ({phase})' if phase else '')
            sections.append({'id': sid, 'label': label, 'anchor': anchor, 'phase': phase,
                'meetings': [{'day': e['day'], **slots[e['slotIndex']-1]} for e in variant],
                'sources': variant})
    meta = metadata.get(code, {})
    issues = list(meta.get('issues', []))
    if not meta.get('outlineFile'):
        issues.append('Course outline missing: full title, faculty, credits, grading and eligibility need confirmation.')
    if any(s['anchor'] != 'PGP' for s in sections):
        issues.append('Non-PGP anchor shown by the Excel colour legend. Confirm PGP/PGPBA access to each offering; anchor alone does not establish eligibility.')
    if len(sections) > 1 and code not in ['ZMT', 'GCK', 'SL', 'SPM', 'RMD']:
        issues.append('Multiple offerings: confirm professor identity and which group your programme can choose. Offerings have not been merged into one timetable.')
    if any(s['phase'] for s in sections):
        issues.append('PRE/POST dates are unspecified. Clashes are checked conservatively until exact date ranges are provided.')
    for section in sections:
        section.update(meta.get('sectionMetadata', {}).get(section['anchor'], {}))
    courses.append({**meta, 'id':code, 'shortName':code, 'officialCode':None, 'name':meta.get('name',code),
        'faculty':meta.get('faculty'), 'area':meta.get('area', 'Unconfirmed'), 'credits':meta.get('credits'),
        'grading':meta.get('grading'), 'outline':meta.get('outline',[]),
        'gradingBreakdown':meta.get('gradingBreakdown',{}), 'eligibilityText':meta.get('eligibilityText'),
        'outlineFile':meta.get('outlineFile'), 'issues':issues, 'sections':sections})

ws = book['Workshops']
workshops = []
for row in list(range(5,13))+[14,15]:
    values = [ws.cell(row,c).value for c in range(1,11)]
    _, name, credits, anchor, faculty, area, grading, minimum, maximum, date = values
    match = re.fullmatch(r'(\d+)-(\d+) December 2026', date.strip())
    assert match, date
    workshops.append({'id':f'WS_{row}', 'name':name.strip().rstrip('*').strip(), 'asterisk': '*' in name,
        'credits':credits,'anchor':anchor,'faculty':faculty.replace('\n',' ').strip(), 'area':area,
        'grading':grading,'minSeats':minimum,'maxSeats':maximum,
        'startDate':f'2026-12-{int(match[1]):02}', 'endDate':f'2026-12-{int(match[2]):02}',
        'travel':row in [14,15], 'start':None if row in [14,15] else '09:30',
        'end':None if row in [14,15] else '16:30','sourceRow':row, **workshop_metadata.get(f'WS_{row}', {})})

data = {'term':'Term 6', 'period':'December 2026 – March 2027','version':'9 October 2026, 16:00',
    'sourceWorkbook':Path(sys.argv[1]).name,'masterWorkbook':next(iter(metadata.values()))['masterSource'],'slots':slots,'courses':courses,'workshops':workshops,
    'notes':['Programme anchors use the Excel font-colour legend (PGP green, EPGP red, PGPEM blue). PGPBA is not separately identified.',
        'Parenthetical numbers are preserved as raw source values. Their meaning is not defined in this workbook; they are not shown as seats, demand or bid prices.',
        'ZMT: two Wednesday/Thursday groups at 10:00 and 11:45, confirmed by the user and present in the Excel.',
        'Regular faculty, credits and grading type are matched to the 18 September mastersheet and course outlines. Latest 9 October timetable controls actual class times. Formal catalogue codes remain unconfirmed.',
        'Seven regular outlines are historical: ZMT, IHP, IWR, GM, DM, LCF, PBM. Their old assessments are not shown as current. RMD professor-to-slot mapping is unresolved and the Mayank Nagpal outline is missing.',
        'GCK, SPM and SL offerings share the same professor according to the mastersheet/outlines. Their times remain separate alternatives; programme access to each group still needs confirmation.',
        'Explicit restrictions: BGS excludes PGP/PGPBA; DBWAI excludes PGPBA; PBM excludes PGPEM. Other anchors do not establish eligibility.',
        'Campus workshops run 09:30–16:30 within the listed dates, with breaks; exact daily teaching allocation is not provided.',
        'Workshops marked with an asterisk in Excel retain that mark; its meaning is unspecified.'],
    'workshopRules':[str(ws[f'B{r}'].value).strip() for r in range(18,23)]}
(ROOT/'src/data/term6.json').write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n')
missing = [c['id'] for c in courses if not c['outlineFile']]
historical = [c['id'] for c in courses if c.get('outlineStatus') == 'historical']
lines = ['# Term 6 mapping review', '', f'Timing source: {data["sourceWorkbook"]}. Identity source: {data["masterWorkbook"]}.', '',
    'All 46 regular-course acronyms have an outline match. Formal catalogue codes are not supplied. Latest timetable dates take precedence over older outline dates.', '',
    '## Documents to request', '', 'Updated current-year outlines: '+', '.join(historical)+'.',
    'RMD: Mayank Nagpal outline is missing; confirm professor-to-slot allocation before using an assessment scheme.', '',
    '## Mappings and questions', '', '| Acronym | Title / faculty | Outline status | Offerings | Review |', '| --- | --- | --- | --- | --- |']
for c in courses:
    timings = '; '.join(s['label']+': '+', '.join(m['day']+' '+m['start']+'–'+m['end'] for m in s['meetings']) for s in c['sections'])
    lines.append('| '+ ' | '.join([c['id'],c['name']+' / '+(c['faculty'] or 'Unconfirmed'),c.get('outlineStatus','missing'),timings,' '.join(c['issues']) or 'Mapped.'])+' |')
lines += ['', '## Workshops', '', '| Workshop | Timetable dates | Outline status | Questions |', '| --- | --- | --- | --- |']
for w in workshops:
    lines.append('| '+' | '.join([w['name'], w['startDate']+'–'+w['endDate'],w.get('outlineStatus','missing'), ' '.join(w.get('issues',[])) or 'Mapped.'])+' |')
lines += ['', '## General questions', '', '- Confirm cross-programme access to each offering, especially PGPBA; anchor colours alone do not establish enrolment eligibility.',
    '- Confirm formal catalogue codes, current enrolment/credit limits, and what the parenthetical timetable numbers represent.',
    '- Confirm PRE/POST dates and the meaning of starred workshops.',
    '- IMC assessment table is in marks (10 + 15 + 25 = 50), not percentages; its scale is preserved.',
    '- No Term 4 seat counts, bidding results or senior reviews have been presented as Term 6 facts.', '']
(ROOT/'docs/TERM6_REVIEW.md').write_text('\n'.join(lines))
print(f'{len(courses)} regular courses, {sum(len(c["sections"]) for c in courses)} offerings, {len(workshops)} workshops; {len(missing)} unmatched, {len(historical)} historical outlines.')
