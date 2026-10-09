export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const minutes = time => Number(time.split(':')[0]) * 60 + Number(time.split(':')[1]);
export function overlaps(a, b) {
  return a.day === b.day && minutes(a.start) < minutes(b.end) && minutes(b.start) < minutes(a.end);
}
export function conflictWith(section, selections, courseId) {
  return Object.entries(selections).filter(([id]) => id !== courseId)
    .find(([, other]) => section.meetings.some(a => other.meetings.some(b => overlaps(a, b))))?.[0] || null;
}
export function eligibilityIssue(course, programme) {
  return course.blockedProgrammes?.includes(programme) ? `${course.id} is not offered to ${programme} according to the supplied programme rules.` : null;
}
export function selectSection(selections, course, section, programme = 'All') {
  const ineligible = eligibilityIssue(course, programme);
  if (ineligible) return {selections, conflict: ineligible};
  const conflict = conflictWith(section, selections, course.id);
  return conflict ? {selections, conflict} : {selections: {...selections, [course.id]: section}, conflict: null};
}
export function workshopConflict(candidate, selected, bpim = false) {
  if (bpim) return 'BPIM enrolment excludes these workshops under the workbook rules.';
  const other = selected.find(w => w.id !== candidate.id && (w.travel || candidate.travel ||
    (w.startDate <= candidate.endDate && candidate.startDate <= w.endDate)));
  if (other) return `Clashes with ${other.name}.`;
  if (!candidate.travel && selected.filter(w => w.id !== candidate.id).length >= 2) return 'The workbook allows at most two non-clashing campus workshops.';
  return null;
}
export function restoreSelections(saved, courses, programme = 'All') {
  try {
    const parsed = JSON.parse(saved || '{}'); let valid = {};
    for (const [id, sectionId] of Object.entries(parsed)) {
      const course = courses.find(c => c.id === id);
      const section = course?.sections.find(s => s.id === sectionId);
      if (section && !eligibilityIssue(course, programme) && !conflictWith(section, valid, id)) valid[id] = section;
    }
    return valid;
  } catch { return {}; }
}
export function meetingLabel(section) {
  const grouped = new Map();
  for (const m of section.meetings) {
    const time = `${m.start}–${m.end}`;
    grouped.set(time, [...(grouped.get(time) || []), m.day]);
  }
  return [...grouped].map(([time, days]) => `${days.join('/')} ${time}`).join(' + ');
}

export function restoreWorkshops(savedIds, workshops, enabled = false, bpim = false) {
  if (!enabled || bpim || !Array.isArray(savedIds)) return [];
  const valid = [];
  for (const id of savedIds) {
    const workshop = workshops.find(w=>w.id===id);
    if (workshop && !valid.some(w=>w.id===id) && !workshopConflict(workshop,valid)) valid.push(workshop);
  }
  return valid;
}
