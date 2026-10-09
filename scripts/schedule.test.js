import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { overlaps, eligibilityIssue, conflictWith, selectSection, restoreSelections, workshopConflict } from '../src/schedule.js';
const data = JSON.parse(fs.readFileSync(new URL('../src/data/term6.json', import.meta.url)));
const course = id => data.courses.find(c => c.id === id);
test('ZMT alternatives reserve Wednesday and Thursday at the right times', () => {
  const [first, second] = course('ZMT').sections;
  assert.equal(course('ZMT').sections.length, 2);
  assert.deepEqual(first.meetings.map(m => [m.day, m.start]), [['Wed','10:00'],['Thu','10:00']]);
  assert.deepEqual(second.meetings.map(m => [m.day, m.start]), [['Wed','11:45'],['Thu','11:45']]);
  const selected = {EM:course('EM').sections[0]};
  assert.equal(conflictWith(first, selected, 'ZMT'), 'EM');
  assert.equal(conflictWith(second, selected, 'ZMT'), null);
  assert.equal(selectSection(selected, course('ZMT'), first).selections.ZMT, undefined);
  assert.equal(selectSection({ZMT:first}, course('ZMT'), second).selections.ZMT.id, second.id);
});
test('IB reserves two Thursday sessions without inventing Wednesday sessions', () => {
  const ib = course('IB').sections[0];
  assert.equal(ib.meetings.length, 2);
  assert(ib.meetings.every(m => m.day === 'Thu'));
  for (const start of ['14:30','16:15']) {
    assert.equal(conflictWith({meetings:[{day:'Thu',start,end:'17:45'}]}, {IB:ib}, 'OTHER'), 'IB');
    assert.equal(conflictWith({meetings:[{day:'Wed',start,end:'17:45'}]}, {IB:ib}, 'OTHER'), null);
  }
});
test('programme legend identifies GCK offerings independently of row position', () => {
  assert.deepEqual(course('GCK').sections.map(s => [s.anchor,s.meetings[0].start]), [['PGPEM','18:00'],['EPGP','10:00']]);
});
test('time boundaries and canonical saved choices', () => {
  assert(!overlaps({day:'Mon',start:'08:00',end:'09:30'}, {day:'Mon',start:'09:30',end:'11:00'}));
  assert.deepEqual(restoreSelections('broken',data.courses),{});
  assert.deepEqual(restoreSelections(JSON.stringify({OLD:'old'}),data.courses),{});
  const section = course('ZMT').sections[0];
  assert.equal(restoreSelections(JSON.stringify({ZMT:section.id}),data.courses).ZMT.id,section.id);
});
test('campus overlap, travel exclusivity and BPIM restrictions', () => {
  const early=data.workshops.find(w=>w.id==='WS_5'),late=data.workshops.find(w=>w.id==='WS_10');
  const long=data.workshops.find(w=>w.id==='WS_9'),travel=data.workshops.find(w=>w.travel);
  assert.equal(workshopConflict(late,[early]),null);
  assert(workshopConflict(long,[early]));
  assert(workshopConflict(travel,[early]));
  assert(workshopConflict(early,[travel]));
  assert(workshopConflict(early,[],true));
});
test('complete source-cell audit and outline grading reconciliation', () => {
  const cells=data.courses.flatMap(c=>c.sections.flatMap(s=>s.sources.map(e=>e.sourceCell)));
  assert.equal(cells.length,102);assert.equal(new Set(cells).size,102);
  for(const c of data.courses) {
    assert.equal(new Set(c.sections.map(s=>s.id)).size,c.sections.length);
    for(const s of c.sections) assert.equal(s.sources.length,s.meetings.length);
    if(Object.keys(c.gradingBreakdown).length) assert.equal(Object.values(c.gradingBreakdown).reduce((n,v)=>n+parseFloat(v),0),c.id==='IMC'?50:100);
    assert(c.outlineFiles.length > 0);
    if(c.outlineStatus==='historical') assert.deepEqual(c.gradingBreakdown,{});
  }
});

test('explicit programme exclusions apply to adding and restoring choices', () => {
  assert(eligibilityIssue(course('BGS'),'PGP'));
  assert(eligibilityIssue(course('BGS'),'PGPBA'));
  assert.equal(eligibilityIssue(course('BGS'),'EPGP'),null);
  assert(eligibilityIssue(course('DBWAI'),'PGPBA'));
  assert(eligibilityIssue(course('PBM'),'PGPEM'));
  const bgs=course('BGS');
  assert.deepEqual(selectSection({},bgs,bgs.sections[0],'PGP').selections,{});
  assert.deepEqual(restoreSelections(JSON.stringify({BGS:bgs.sections[0].id}),data.courses,'PGP'),{});
  assert.equal(data.courses.filter(c=>c.outlineStatus==='historical').length,7);
  assert.equal(Object.keys(course('RMD').gradingBreakdown).length,0);
});
