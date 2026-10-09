"""Enrich timetable metadata from the reviewed mastersheet and outline mappings.

Usage: python enrich-outlines.py mastersheet.xlsx extracted_outline_directory
Requires openpyxl. Does not publish PDFs or import old grading as current facts.
"""
import json
import sys
from pathlib import Path
import openpyxl

ROOT = Path(__file__).resolve().parents[1]
sheet = openpyxl.load_workbook(sys.argv[1], data_only=True)['Master sheet']
source_root = Path(sys.argv[2])
mappings = json.loads((ROOT/'src/data/outline-mappings.json').read_text())
old = json.loads((ROOT/'src/data/outline-metadata.json').read_text())
result = {}
for code, mapping in mappings['regular'].items():
    rows = mapping.get('masterRows', [])
    masters = [{'row':r,'name':sheet[f'C{r}'].value.strip(), 'credits':sheet[f'D{r}'].value,
        'anchor':sheet[f'E{r}'].value, 'faculty':str(sheet[f'F{r}'].value).strip(),
        'area':sheet[f'G{r}'].value,'grading':sheet[f'H{r}'].value,
        'comments':sheet[f'I{r}'].value,'minSeats':sheet[f'J{r}'].value,
        'maxSeats':sheet[f'K{r}'].value} for r in rows]
    files = mapping.get('outlineFiles', [])
    for f in files:
        assert (source_root/f).is_file(), f
    master = masters[0] if masters else {}
    status = mapping.get('outlineStatus','current')
    previous = old.get(code, {})
    meta = {'name':mapping.get('name',master.get('name',code)).rstrip('*').strip(),
        'faculty':mapping.get('faculty',master.get('faculty')), 'area':mapping.get('area',master.get('area','Unconfirmed')),
        'credits':mapping.get('credits',master.get('credits')), 'grading':mapping.get('grading',master.get('grading')),
        'outlineFile':files[0] if files else None,'outlineFiles':files,'outlineStatus':status,
        'masterSource':Path(sys.argv[1]).name, 'masterEntries':masters,
        'eligibilityText':mapping.get('eligibilityText', 'Current mastersheet anchors: '+', '.join(dict.fromkeys(m['anchor'] for m in masters))+'. '+ ' '.join(dict.fromkeys(m['comments'] for m in masters if m['comments']))),
        'blockedProgrammes':mapping.get('blockedProgrammes',[]),
        'issues':mapping.get('issues',[]), 'mappingNotes':mapping.get('mappingNotes',[]),
        'outline':mapping.get('outline',previous.get('outline',[])) if status=='current' else [],
        'gradingBreakdown':mapping.get('gradingBreakdown',previous.get('gradingBreakdown',{})) if status=='current' else {},
        'evaluationNote':mapping.get('evaluationNote'),
        'evaluationContext':mapping.get('evaluationContext'),
        'sectionMetadata':mapping.get('sectionMetadata',{})}
    meta['area'] = {'InterD':'Interdis','MKtg':'Mktg','Man Com':'Mcomm'}.get(meta['area'],meta['area'])
    result[code] = meta
    if status=='historical':
        meta['issues'].append('Only a historical outline is supplied. Title, faculty, credits and grading type come from the current mastersheet; current evaluation and course content need reconfirmation.')
    if code=='RMD':
        meta['faculty']='Gopal Das / Mayank Nagpal (slot allocation unconfirmed)'
        meta['gradingBreakdown']={}
        meta['outline']=[]
        meta['evaluationContext']='Gopal Das outline is supplied; Mayank Nagpal outline is missing. Neither timetable slot is assigned a professor or evaluation scheme without confirmation.'
        meta['issues'].append('Mastersheet lists Gopal Das (PGP) and Mayank Nagpal (EPGP), mutually exclusive. Both timetable offerings are coloured PGP. Confirm faculty-to-slot allocation and supply the Mayank Nagpal outline.')
for key,mapping in mappings['workshops'].items():
    for f in mapping['outlineFiles']: assert (source_root/f).is_file(),f
(ROOT/'src/data/outline-metadata.json').write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n')
(ROOT/'src/data/workshop-metadata.json').write_text(json.dumps(mappings['workshops'],indent=2,ensure_ascii=False)+'\n')
print(f'Matched {len(result)} regular course acronyms and {len(mappings["workshops"])} workshop entries.')
