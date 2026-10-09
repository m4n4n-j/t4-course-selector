import { useState, useEffect, useRef } from 'react';
import data from './data/term6.json';
import { DAYS, conflictWith, selectSection, workshopConflict, restoreSelections, restoreWorkshops, meetingLabel } from './schedule';
import PlanShare, { PlanSheet } from './PlanShare';
import { courseAreaStyle } from './course-colors';
import './App.css';
const {workshops, slots} = data;
const courses = [...data.courses].sort((a,b)=>a.name.localeCompare(b.name));
const historicCourses = courses.filter(c=>c.outlineStatus==='historical');
const historicWorkshops = workshops.filter(w=>w.outlineStatus==='historical');
const KEY = 'iimb-term6-2026-selections-v1';
function read(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
function download(blob, name) {
  const url = URL.createObjectURL(blob); const a = document.createElement('a');
  a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function Anchor({value}) {return <span className={`anchor ${value}`}>{value}</span>;}
function CourseCard({course, section, selected, conflict, rejected, onSelect, onDetail, onReject, compact = false}) {
  return <article className={`course-card ${compact ? 'compact' : ''} ${selected ? 'selected' : ''} ${conflict ? 'clash' : ''} ${rejected ? 'rejected' : ''}`}
    style={{'--area':courseAreaStyle(course.area).color}} draggable={!rejected}
    onDragStart={e => { e.dataTransfer.setData('application/x-term6-section', JSON.stringify({courseId:course.id,sectionId:section.id})); e.dataTransfer.effectAllowed='copy'; }}>
    <div className="card-top"><button className="course-title" onClick={() => onDetail(course)} title={`Read details: ${course.name}`}>
      <b>{compact ? course.shortName : course.name}</b><span className={compact ? "course-full-name" : "course-acronym"}>{compact ? course.name : course.shortName}</span>
    </button><button className="detail-button" aria-label={`Details for ${course.name}`} onClick={() => onDetail(course)} title={`Details for ${course.name}`}>{compact ? 'ⓘ' : 'Details'}</button></div>
    {!compact && <p className="faculty">{course.faculty || 'Faculty unconfirmed'}</p>}
    <div className="card-tags"><Anchor value={section.anchor}/>{!compact && course.area !== 'Unconfirmed' && <span>{course.area}</span>}{compact && course.id==='ZMT' && <span>{section.label}</span>}{compact && section.phase && <span>{section.phase}</span>}{!compact && course.issues.length > 0 && <span className="review-tag">Check details</span>}</div>
    {!compact && <p className="faculty">{course.credits} credits · {course.grading} · {course.outlineStatus === 'historical' ? 'Historical outline' : 'Current outline'}</p>}
    {!compact && <p className="meeting">{section.label} · {meetingLabel(section)}</p>}
    <div className="card-bottom"><button className={selected ? 'remove-link' : 'add-link'} onClick={() => onSelect(course,section)} aria-label={`${selected ? 'Remove' : 'Add'} ${course.name} (${section.label}) ${selected ? 'from' : 'to'} plan`} title={conflict ? `Clashes with ${conflict}` : undefined} disabled={Boolean(conflict) && !selected || rejected}>
      {selected ? 'Remove' : conflict ? (compact ? `Clash: ${conflict}` : `Clashes with ${conflict}`) : (compact ? 'Add' : 'Add to plan')}</button>
      <button className="text-button" aria-label={`${rejected ? 'Restore' : 'Reject'} ${course.id}`} onClick={() => onReject(course.id)}>{rejected ? 'Restore' : compact ? '×' : 'Reject'}</button></div>
  </article>;
}
function Details({course,onClose}) {
  const closeRef = useRef(null);
  useEffect(() => { const previous=document.activeElement; closeRef.current?.focus();
    const handler=e=>{if(e.key==='Escape')onClose();if(e.key==='Tab') {const nodes=closeRef.current?.closest('[role="dialog"]')?.querySelectorAll('button,a[href],input,select');if(!nodes?.length)return; const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}};
    window.addEventListener('keydown',handler); return()=>{window.removeEventListener('keydown',handler);previous?.focus();}; },[onClose]);
  return <div className="modal-backdrop" onClick={onClose}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="detail-title" onClick={e=>e.stopPropagation()}>
    <header><div><span className="eyebrow">{course.id} · COURSE DETAILS</span><h2 id="detail-title">{course.name}</h2><p>{course.faculty || 'Faculty unconfirmed'}</p></div><button ref={closeRef} className="icon-button" onClick={onClose} aria-label="Close details">×</button></header>
    <div className="modal-body"><div className="facts"><span>{course.credits ? `${course.credits} credits` : 'Credits unconfirmed'}</span><span>{course.grading || 'Grading unconfirmed'}</span><span>Formal course code unconfirmed</span></div>
    {course.eligibilityText && <><h3>Programme information from supplied sources</h3><p>{course.eligibilityText}</p></>}
    {course.issues.length > 0 && <div className="review-box"><h3>Needs confirmation</h3><ul>{course.issues.map((s,i)=><li key={i}>{s}</li>)}</ul></div>}
    <h3>Timetable offerings</h3>{course.sections.map(s=><div className="offering" key={s.id}><Anchor value={s.anchor}/><strong>{s.label}</strong><p>{meetingLabel(s)}</p>{s.faculty && <p>{s.faculty}</p>}{s.eligibilityText && <p>{s.eligibilityText}</p>}{s.outlineFiles?.map(f=><small key={f}>{f}</small>)}<small>Excel RegularCourses: {s.sources.map(e=>`${e.sourceCell} “${e.sourceText}”`).join('; ')}</small></div>)}
    {course.outline.length > 0 && <><h3>Course focus</h3><ul>{course.outline.map(s=><li key={s}>{s}</li>)}</ul></>}
    {Object.keys(course.gradingBreakdown).length > 0 && <><h3>Evaluation from current outline</h3><table className="evaluation"><tbody>{Object.entries(course.gradingBreakdown).map(([name,weight])=><tr key={name}><td>{name}</td><td>{weight}</td></tr>)}</tbody></table></>}
    {course.evaluationNote && <p>{course.evaluationNote}</p>}{course.evaluationContext && <p>{course.evaluationContext}</p>}<h3>Sources · {course.outlineStatus} outline</h3>{course.outlineFiles?.map(f=><p key={f}>{f}</p>)}<p>{course.masterSource} · rows {course.masterEntries?.map(m=>m.row).join(', ') || 'Not listed'}</p><p>{data.sourceWorkbook} · {data.version}</p></div>
  </section></div>;
}
export default function App() {
  const [selections,setSelections] = useState(()=>{try{return restoreSelections(localStorage.getItem(KEY),courses);}catch{return {};}});
  const [rejected,setRejected] = useState(()=>{const v=read('iimb-term6-2026-rejected',[]);return Array.isArray(v)?v:[];});
  const [showWorkshops,setShowWorkshops] = useState(()=>read('iimb-term6-2026-include-workshops',false)===true);
  const [selectedWorkshops,setSelectedWorkshops] = useState(()=>restoreWorkshops(read('iimb-term6-2026-workshops',[]),workshops,showWorkshops,read('iimb-term6-2026-bpim',false)===true));
  const [bpim,setBpim] = useState(()=>read('iimb-term6-2026-bpim',false)===true);
  const [view,setView]=useState('calendar'); const [query,setQuery]=useState('');
  const [anchor,setAnchor]=useState('All'); const [coverage,setCoverage]=useState('All');
  const [area,setArea]=useState('All'); const [detail,setDetail]=useState(null); const [notice,setNotice]=useState('');
  const [shareOpen,setShareOpen]=useState(false);
  useEffect(()=>{try{localStorage.setItem(KEY,JSON.stringify(Object.fromEntries(Object.entries(selections).map(([id,s])=>[id,s.id]))));}catch{/* Browser can deny storage. */}},[selections]);
  useEffect(()=>{try{localStorage.setItem('iimb-term6-2026-rejected',JSON.stringify(rejected));}catch{/* Browser can deny storage. */}},[rejected]);
  useEffect(()=>{try{localStorage.setItem('iimb-term6-2026-workshops',JSON.stringify(selectedWorkshops.map(w=>w.id)));}catch{/* Browser can deny storage. */}},[selectedWorkshops]);
  useEffect(()=>{try{localStorage.setItem('iimb-term6-2026-bpim',JSON.stringify(bpim));}catch{/* Browser can deny storage. */}},[bpim]);
  useEffect(()=>{try{localStorage.setItem('iimb-term6-2026-include-workshops',JSON.stringify(showWorkshops));}catch{/* Browser can deny storage. */}},[showWorkshops]);
  function changeWorkshops(enabled) {setShowWorkshops(enabled);if(!enabled){setSelectedWorkshops([]);if(view==='workshops')setView('calendar');setNotice('Workshops removed from your plan.');}else setNotice('Workshops enabled. Open the Workshops tab to browse and add them.');}
  function resetFilters(){setQuery('');setAnchor('All');setCoverage('All');setArea('All');}
  const visible = courses.filter(c => [c.name,c.id,c.faculty,c.area].filter(Boolean).join(' ').toLowerCase().includes(query.toLowerCase()) &&
    (area==='All'||c.area===area) && (coverage==='All'||coverage==='Current outlines'&&c.outlineStatus==='current'||coverage==='Historical outlines'&&c.outlineStatus==='historical'));
  const visibleSections = c=>c.sections.filter(s=>anchor==='All'||s.anchor===anchor);
  const count=Object.keys(selections).length;
  const knownCredits=Object.keys(selections).reduce((sum,id)=>sum+(courses.find(c=>c.id===id)?.credits||0),0)+selectedWorkshops.reduce((sum,w)=>sum+w.credits,0);
  const unknownCredits=Object.keys(selections).filter(id=>!courses.find(c=>c.id===id)?.credits).length;
  function choose(course,section) {
    if(rejected.includes(course.id)){setNotice('Restore this rejected course before adding it.');return;}
    setSelections(prev=>{if(prev[course.id]?.id===section.id){const next={...prev};delete next[course.id];return next;}
      return selectSection(prev,course,section).selections;});
    const conflict=conflictWith(section,selections,course.id);
    setNotice(conflict ? `${course.id} clashes with ${conflict}. Choose another offering.` : `${course.id}: ${selections[course.id]?.id===section.id ? 'removed' : 'added at its scheduled times'}.`);
  }
  function reject(id) {setRejected(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id]);
    if(!rejected.includes(id))setSelections(prev=>{const n={...prev};delete n[id];return n;});}
  function drop(e,day=null,slot=null) {e.preventDefault();try{
    const payload=JSON.parse(e.dataTransfer.getData('application/x-term6-section'));
    const c=courses.find(x=>x.id===payload.courseId);const s=c?.sections.find(x=>x.id===payload.sectionId);
    if(!s)return;
    if(day&&!s.meetings.some(m=>m.day===day&&m.index===slot)){setNotice(`${c.id} cannot be moved to a different class time. Drop it into My plan or one of its scheduled cells.`);return;}
    if(selections[c.id]?.id===s.id){setNotice(`${c.id} is already in your plan.`);return;}choose(c,s);
  }catch{setNotice('Drag a course offering into the plan.');}}
  function chooseWorkshop(w) {if(!showWorkshops)return;if(selectedWorkshops.some(x=>x.id===w.id)){setSelectedWorkshops(prev=>prev.filter(x=>x.id!==w.id));return;}
    const reason=workshopConflict(w,selectedWorkshops,bpim);if(reason){setNotice(reason);return;}setSelectedWorkshops(prev=>[...prev,w]);setNotice(`${w.name} added.`);}
  function exportPlan(){const text=[`IIM Bangalore · Term 6 · ${data.period}`,`Timetable: ${data.version}`,'',...Object.entries(selections).map(([id,s])=>`${id} — ${courses.find(c=>c.id===id).name}\n${s.anchor} ${s.label}: ${meetingLabel(s)}\n${courses.find(c=>c.id===id).issues.join(' ')}`),'',...selectedWorkshops.map(w=>`${w.name} (${w.anchor}): ${w.startDate} to ${w.endDate}`),'',...data.notes.filter(n=>showWorkshops||!n.toLowerCase().includes('workshop'))].join('\n\n');download(new Blob([text],{type:'text/plain;charset=utf-8'}),'Term6_Plan.txt');}
  return <><header className="masthead"><div><div className="eyebrow">IIM BANGALORE · 2026–27</div><h1>Term 6 Course Selector</h1><p>{data.period} · Timetable updated {data.version}</p></div><div className="header-actions"><span className="count">{count} courses{showWorkshops?` · ${selectedWorkshops.length} workshops`:''}</span><button onClick={()=>setShareOpen(true)} disabled={!count&&!selectedWorkshops.length}>Share / download plan</button></div></header>
    <div className="intro"><b>Build your Term 6 plan.</b> Read course details, tap Add to plan, or drag an offering into My plan. Clashing choices are blocked. <span>All programme anchors are shown; cross-programme enrolment needs confirmation.</span></div>
    <div className="programme-control"><span>All courses are available to add to your plan. Check programme eligibility in Details before enrolling.</span><label className="workshop-toggle"><input type="checkbox" checked={showWorkshops} onChange={e=>changeWorkshops(e.target.checked)}/> Include workshops</label></div>
    <section className="plan" aria-label="My plan" onDragOver={e=>e.preventDefault()} onDrop={e=>drop(e)}>
      <div className="plan-heading"><h2>My plan <span>{count} regular courses</span></h2><div><span>{knownCredits} confirmed credits{unknownCredits ? ` + ${unknownCredits} course(s) with unknown credits` : ''}</span><button onClick={()=>setShareOpen(true)} disabled={!count&&!selectedWorkshops.length}>Share / download</button><button className="text-button" onClick={()=>{setSelections({});setSelectedWorkshops([]);setNotice('Plan cleared.');}} disabled={!count&&!selectedWorkshops.length}>Clear plan</button></div></div>
      <div className="selected-chips">{count===0&&selectedWorkshops.length===0?<p>Drop an offering here, or tap Add to plan. Your choices save on this device.</p>:<>{Object.entries(selections).map(([id,s])=><div className="plan-chip" key={id}><b>{courses.find(c=>c.id===id).name} <small>({id})</small></b><span>{s.label} · {meetingLabel(s)}</span><button aria-label={`Remove ${id}`} onClick={()=>choose(courses.find(c=>c.id===id),s)}>×</button></div>)}{selectedWorkshops.map(w=><div className="plan-chip" key={w.id}><b>{w.name}</b><span>{w.startDate.slice(8)}–{w.endDate.slice(8)} Dec</span><button aria-label={`Remove ${w.name}`} onClick={()=>chooseWorkshop(w)}>×</button></div>)}</>}</div>
    </section>
    <div className="notice" role="status" aria-live="polite">{notice || 'ZMT: Group 1 at 10:00 and Group 2 at 11:45, both Wednesday/Thursday.'}</div>
    <nav className="toolbar" aria-label="Course views"><div className="tabs">{[['calendar','Calendar'],['list','Browse all courses'],...(showWorkshops?[['workshops','Workshops']]:[]),['review','Missing outlines & review']].map(([id,label])=><button aria-pressed={view===id} className={view===id?'active':''} key={id} onClick={()=>setView(id)}>{label}</button>)}</div>
      {['calendar','list'].includes(view)&&<div className="filters"><input aria-label="Search course or faculty" placeholder="Search course or faculty…" value={query} onChange={e=>setQuery(e.target.value)}/><select aria-label="Anchoring programme" value={anchor} onChange={e=>setAnchor(e.target.value)}>{['All','PGP','EPGP','PGPEM'].map(a=><option key={a} value={a}>{a==='All'?'All programme anchors':`${a} anchor`}</option>)}</select><select aria-label="Outline coverage" value={coverage} onChange={e=>setCoverage(e.target.value)}>{['All','Current outlines','Historical outlines'].map(a=><option key={a}>{a}</option>)}</select><select aria-label="Teaching area" value={area} onChange={e=>setArea(e.target.value)}>{['All',...new Set(courses.map(c=>c.area))].map(a=><option key={a} value={a}>{a==='All'?'All areas':a}</option>)}</select><button className="reset-filters" onClick={resetFilters}>Show all courses</button></div>}
    </nav>
    <main>
    {view==='calendar'&&<><div className="section-heading"><div><h2>Weekly timetable</h2><p>{visible.filter(c=>visibleSections(c).length).length} courses shown. Codes are the main labels; tap a course for its full details.</p></div><span>Scroll sideways on smaller screens</span></div><div className="calendar-scroll" role="region" aria-label="Weekly course calendar; scroll to see more days or times" tabIndex={0}><div className="calendar">
      <div className="grid-head time-head">Time</div>{DAYS.map(day=><div key={day} className="grid-head">{day}</div>)}
      {slots.map(slot=><div className="calendar-row" key={slot.index}><div className="slot-label"><b>{slot.start}</b><span>{slot.end}</span></div>{DAYS.map(day=><div className="calendar-cell" key={day} onDragOver={e=>e.preventDefault()} onDrop={e=>drop(e,day,slot.index)}>
        {visible.flatMap(c=>visibleSections(c).filter(s=>s.meetings.some(m=>m.day===day&&m.index===slot.index)).map(s=><CourseCard compact key={s.id} course={c} section={s} selected={selections[c.id]?.id===s.id} conflict={conflictWith(s,selections,c.id)} rejected={rejected.includes(c.id)} onSelect={choose} onDetail={setDetail} onReject={reject}/>))}
      </div>)}</div>)}
    </div></div></>}
    {view==='list'&&<><div className="section-heading"><div><h2>Browse all courses</h2><p>{visible.filter(c=>visibleSections(c).length).length} of {courses.length} courses · Full names and all programme anchors. Open Details before choosing an offering.</p></div></div><div className="course-list">{visible.flatMap(c=>visibleSections(c).map(s=><CourseCard key={s.id} course={c} section={s} selected={selections[c.id]?.id===s.id} conflict={conflictWith(s,selections,c.id)} rejected={rejected.includes(c.id)} onSelect={choose} onDetail={setDetail} onReject={reject}/>))}</div>{!visible.some(c=>visibleSections(c).length)&&<p>No courses match these filters.</p>}</>}
    {showWorkshops&&view==='workshops'&&<><div className="section-heading"><div><h2>December workshops</h2><p>6–12 December 2026 · Select up to two non-clashing campus workshops, or one travel workshop.</p></div></div><label className="bpim"><input type="checkbox" checked={bpim} onChange={e=>{setBpim(e.target.checked);if(e.target.checked){setSelectedWorkshops([]);setNotice('Workshop choices cleared: the workbook excludes BPIM participants.');}}}/> I am enrolled in a BPIM</label><div className="workshop-list">{workshops.map(w=>{const selected=selectedWorkshops.some(x=>x.id===w.id);const reason=workshopConflict(w,selectedWorkshops,bpim);return <article key={w.id} className={`workshop ${selected?'selected':''}`}><div className="card-tags"><Anchor value={w.anchor}/><span>{w.credits} credits</span><span>{w.travel?'Travel':'Campus'}</span></div><h3>{w.name}{w.asterisk?'*':''}</h3><p>{w.faculty}</p><b>{w.startDate.slice(8)}–{w.endDate.slice(8)} December 2026</b><p>{w.travel?'Travel itinerary / daily times not supplied':`${w.start}–${w.end}, with breaks`} · {w.grading}</p><small>{w.minSeats}–{w.maxSeats} seats · Excel Workshops row {w.sourceRow}</small><p className="review-note">{w.anchor!=='PGP'?'Confirm PGP/PGPBA enrolment in this anchored offering.':''}{w.asterisk?' Asterisk meaning not specified in workbook.':''}</p><details><summary>Outline sources and review</summary><p>{w.outlineStatus === 'historical' ? 'Historical outline — current version needed.' : 'Current outline supplied.'}</p>{w.outlineFiles?.map(f=><p key={f}>{f}</p>)}{w.issues?.map((issue,i)=><p className="review-note" key={i}>{issue}</p>)}</details><button onClick={()=>chooseWorkshop(w)} disabled={!selected&&Boolean(reason)}>{selected?'Remove workshop':'Add workshop'}</button>{reason&&!selected&&<small className="conflict-text">{reason}</small>}</article>;})}</div><div className="review-box"><h3>Workbook rules</h3><ul>{data.workshopRules.map(r=><li key={r}>{r}</li>)}</ul></div></>}
    {view==='review'&&<><div className="section-heading"><div><h2>Mapping review</h2><p>{courses.length} regular course acronyms · {courses.reduce((n,c)=>n+c.sections.length,0)} offerings{showWorkshops?` · ${workshops.length} workshops`:''} · {courses.filter(c=>c.outlineFile).length} outlines mapped</p></div><button onClick={()=>download(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),'Term6_Course_Data.json')}>Download data</button></div><div className="review-box"><h3>What needs checking</h3><ul>{data.notes.filter(n=>showWorkshops||!n.toLowerCase().includes('workshop')).map(n=><li key={n}>{n}</li>)}</ul></div><section className="missing-outlines" aria-label="Missing current course outlines"><h3>What is missing?</h3><p>All regular courses have a full-name match. Current assessments and course content cannot be confirmed for these seven courses because only older outlines are supplied.</p><ul>{historicCourses.map(c=><li key={c.id}><button className="text-button" onClick={()=>setDetail(c)}>{c.name} ({c.id})</button> — current-year outline needed.</li>)}</ul><p><b>Research for Marketing Decisions (RMD):</b> Mayank Nagpal’s outline is missing. Confirm which professor teaches each offering; Gopal Das’s outline is supplied.</p>{showWorkshops&&<><h3>Current workshop outlines needed</h3><ul>{historicWorkshops.map(w=><li key={w.id}>{w.name}</li>)}</ul><p>Other workshop outlines are matched. Open Workshops for date and programme discrepancies.</p></>}</section><div className="review-table"><table><thead><tr><th>Acronym / title</th><th>Faculty</th><th>Schedule / anchor</th><th>Review notes</th></tr></thead><tbody>{courses.map(c=><tr key={c.id}><td><button className="text-button" onClick={()=>setDetail(c)}><b>{c.id}</b><br/>{c.name}</button></td><td>{c.faculty||'Unconfirmed'}</td><td>{c.sections.map(s=><p key={s.id}><Anchor value={s.anchor}/> {s.label}<br/>{meetingLabel(s)}</p>)}</td><td>{c.issues.length?c.issues.join(' '):'Outline and Excel timing mapped. Formal catalogue code not supplied.'}</td></tr>)}</tbody></table></div></>}
    </main>
    {(count>0||selectedWorkshops.length>0)&&<section className="plan-export"><div className="section-heading"><h2>Selected schedule</h2><button onClick={()=>setShareOpen(true)}>Share / download plan</button></div><div className="selected-sheet-scroll"><PlanSheet data={data} selections={selections} selectedWorkshops={selectedWorkshops}/></div></section>}
    {shareOpen&&<PlanShare data={data} selections={selections} selectedWorkshops={selectedWorkshops} onClose={()=>setShareOpen(false)} onDownloadText={exportPlan}/>}
    <footer>Based on the supplied timetable and course outlines. Anchoring programme is not an enrolment guarantee. Planning limits are not enforced because Term 6 credit requirements have not been supplied.</footer>
    {detail&&<Details course={detail} onClose={()=>setDetail(null)}/>}
  </>;
}
