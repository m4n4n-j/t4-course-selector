import { useState, useEffect, useRef } from 'react';
import data from './data/term6.json';
import seniorReviews from './data/senior-reviews.json';
import biddingData from './data/bidding-data.json';
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

function getBiddingSummary(courseId) {
  const stats = biddingData.biddingStats[courseId];
  const officialCode = biddingData.courseCodes[courseId] || null;
  if (!stats || !stats.length) return null;
  const maxMRB = Math.max(...stats.map(s => s.mrb || 0));
  const totalBidders = stats.reduce((sum, s) => sum + (s.bidderCount || 0), 0);
  const totalSeats = stats.reduce((sum, s) => sum + (s.maxSeats || 0), 0);
  const fillRate = totalSeats > 0 ? Math.round((totalBidders / totalSeats) * 100) : 0;
  
  let tier = 'low';
  let tierLabel = '🟢 Easy to Get';
  let tip = `${totalBidders} bidders for ${totalSeats} seats (${fillRate}% capacity). Cleared at 0 bid points. High seat availability.`;
  if (maxMRB > 0 || fillRate >= 100) {
    tier = 'high';
    tierLabel = '🔥 High Demand';
    tip = maxMRB > 0
      ? `Clearing price reached ${maxMRB} pts (${fillRate}% capacity filled). Allocate substantial bid points.`
      : `Oversubscribed at ${fillRate}% capacity (${totalBidders} bidders for ${totalSeats} seats). High competition.`;
  } else if (fillRate >= 50) {
    tier = 'moderate';
    tierLabel = '⚡ Moderate Demand';
    tip = `Moderate interest (${fillRate}% capacity, ${totalBidders}/${totalSeats} seats). Cleared at 0 bid points.`;
  }
  
  return {
    officialCode,
    stats,
    maxMRB,
    totalBidders,
    totalSeats,
    fillRate,
    tier,
    tierLabel,
    tip
  };
}

function CourseCard({course, section, selected, conflict, rejected, onSelect, onDetail, onReject, compact = false}) {
  const review = seniorReviews[course.id];
  const demand = getBiddingSummary(course.id);
  return <article className={`course-card ${compact ? 'compact' : ''} ${selected ? 'selected' : ''} ${conflict ? 'clash' : ''} ${rejected ? 'rejected' : ''} ${review ? `has-review ${review.sentiment}` : ''}`}
    style={{'--area':courseAreaStyle(course.area).color}} draggable={!rejected}
    onDragStart={e => { e.dataTransfer.setData('application/x-term6-section', JSON.stringify({courseId:course.id,sectionId:section.id})); e.dataTransfer.effectAllowed='copy'; }}>
    <div className="card-top"><button className="course-title" onClick={() => onDetail(course)} title={`Read details: ${course.name}`}>
      <b>{compact ? course.shortName : course.name}</b><span className={compact ? "course-full-name" : "course-acronym"}>{compact ? course.name : course.shortName}</span>
    </button><button className="detail-button" aria-label={`Details for ${course.name}`} onClick={() => onDetail(course)} title={`Details for ${course.name}`}>{compact ? 'ⓘ' : 'Details'}</button></div>
    {!compact && <p className="faculty">{course.faculty || 'Faculty unconfirmed'}</p>}
    <div className="card-tags">
      <Anchor value={section.anchor}/>
      {demand?.officialCode && <span className="course-code-tag">{demand.officialCode}</span>}
      {!compact && course.area !== 'Unconfirmed' && <span>{course.area}</span>}
      {compact && course.id==='ZMT' && <span>{section.label}</span>}
      {section.phase && <span className="phase-tag">{compact ? section.phase : (section.phase === 'PRE' ? 'Pre-mid (PRE)' : section.phase === 'POST' ? 'Post-mid (POST)' : section.phase)}</span>}
      {demand && (
        <span
          className={`demand-tag ${demand.tier}`}
          title={`Bidding Demand: ${demand.tierLabel} · ${demand.maxMRB > 0 ? `MRB ${demand.maxMRB} pts · ` : ''}${demand.fillRate}% filled (${demand.totalBidders}/${demand.totalSeats} seats)`}
        >
          {compact ? (demand.maxMRB > 0 ? `🔥 MRB ${demand.maxMRB}` : demand.tier === 'low' ? '🟢 Easy' : `⚡ ${demand.fillRate}%`) : (demand.maxMRB > 0 ? `🔥 MRB ${demand.maxMRB} pts` : demand.tierLabel)}
        </span>
      )}
      {review && <span className={compact ? `compact-recco-tag ${review.sentiment}` : `recco-tag ${review.sentiment}`} title={review.headline}>{compact ? (review.badgeType === 'star' ? '★ Recco' : review.badgeType === 'popcorn' ? '🍿 T6 Pick' : review.badgeType === 'warning' ? '⚠️ Heavy' : '☕ Chill') : review.badge}</span>}
      {!compact && course.issues.length > 0 && <span className="review-tag">Check details</span>}
    </div>
    {!compact && review && <div className={`senior-tip-banner ${review.sentiment}`}><b>Senior take:</b> {review.headline}</div>}
    {!compact && <p className="faculty">{course.credits} credits · {course.grading} · {course.outlineStatus === 'historical' ? 'Historical outline' : 'Current outline'}</p>}
    {!compact && <p className="meeting">{section.label} · {meetingLabel(section)}</p>}
    <div className="card-bottom"><button className={selected ? 'remove-link' : 'add-link'} onClick={() => onSelect(course,section)} aria-label={`${selected ? 'Remove' : 'Add'} ${course.name} (${section.label}) ${selected ? 'from' : 'to'} plan`} title={conflict ? `Clashes with ${conflict}` : undefined} disabled={Boolean(conflict) && !selected || rejected}>
      {selected ? 'Remove' : conflict ? (compact ? `Clash: ${conflict}` : `Clashes with ${conflict}`) : (compact ? 'Add' : 'Add to plan')}</button>
      <button className="text-button" aria-label={`${rejected ? 'Restore' : 'Reject'} ${course.id}`} onClick={() => onReject(course.id)}>{rejected ? 'Restore' : compact ? '×' : 'Reject'}</button></div>
  </article>;
}
function Details({course,onClose}) {
  const closeRef = useRef(null);
  const review = seniorReviews[course.id];
  const demand = getBiddingSummary(course.id);
  useEffect(() => { const previous=document.activeElement; closeRef.current?.focus();
    const handler=e=>{if(e.key==='Escape')onClose();if(e.key==='Tab') {const nodes=closeRef.current?.closest('[role="dialog"]')?.querySelectorAll('button,a[href],input,select');if(!nodes?.length)return; const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}};
    window.addEventListener('keydown',handler); return()=>{window.removeEventListener('keydown',handler);previous?.focus();}; },[onClose]);
  return <div className="modal-backdrop" onClick={onClose}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="detail-title" onClick={e=>e.stopPropagation()}>
    <header><div><span className="eyebrow">{course.id} {demand?.officialCode ? `(${demand.officialCode})` : ''} · COURSE DETAILS</span><h2 id="detail-title">{course.name}</h2><p>{course.faculty || 'Faculty unconfirmed'}</p></div><button ref={closeRef} className="icon-button" onClick={onClose} aria-label="Close details">×</button></header>
    <div className="modal-body"><div className="facts"><span>{course.credits ? `${course.credits} credits` : 'Credits unconfirmed'}</span><span>{course.grading || 'Grading unconfirmed'}</span><span>{demand?.officialCode ? `Official Code: ${demand.officialCode}` : 'Formal course code unconfirmed'}</span></div>
    {demand && <section className="bidding-box">
      <h4>📊 Bidding Demand & Seats (Round 23)</h4>
      <div className={`senior-tip-banner ${demand.tier === 'high' ? 'heavy' : demand.tier === 'moderate' ? 'chill' : 'recco'}`} style={{marginTop:'6px',marginBottom:'10px'}}>
        <b>Bidding Insight:</b> {demand.tip}
      </div>
      <div className="bidding-stats-pills" style={{marginBottom:'10px'}}>
        <span className="bidding-pill">Clearing MRB: <b style={{color:demand.maxMRB>0?'#ef4444':'#10b981'}}>{demand.maxMRB} pts</b></span>
        <span className="bidding-pill">Capacity: <b>{demand.fillRate}%</b> ({demand.totalBidders}/{demand.totalSeats} seats)</span>
        <span className="bidding-pill">Competitiveness: <b>{demand.tierLabel}</b></span>
      </div>
      <table className="bidding-table">
        <thead>
          <tr>
            <th>Programme Anchor</th>
            <th>Course Code</th>
            <th>Clearing MRB</th>
            <th>Bidders</th>
            <th>Max Seats</th>
            <th>Fill %</th>
            <th>Round Rule</th>
          </tr>
        </thead>
        <tbody>
          {demand.stats.map((st, i) => (
            <tr key={i}>
              <td><b>{st.programme}</b></td>
              <td><code>{st.code}</code></td>
              <td><b style={{color:st.mrb>0?'#dc2626':'#16a34a'}}>{st.mrb} pts</b></td>
              <td>{st.bidderCount}</td>
              <td>{st.maxSeats}</td>
              <td>{st.maxSeats > 0 ? `${Math.round((st.bidderCount / st.maxSeats) * 100)}%` : 'N/A'}</td>
              <td>{st.actionTypeName}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>}
    {review && <section className={`senior-reviews-modal-box ${review.sentiment}`}>
      <div className="senior-box-header">
        <h4>💬 What Seniors Say</h4>
        <span className={`recco-tag ${review.sentiment}`}>{review.badge}</span>
      </div>
      <p className="senior-headline"><b>Takeaway:</b> {review.headline}</p>
      <div className="senior-tags">
        {review.tags.map(t => <span key={t} className="senior-subtag">{t}</span>)}
      </div>
      <div className="senior-quotes">
        {review.reviews.map((r, i) => <blockquote key={i} className="senior-quote"><p>“{r.quote}”</p><cite>— {r.author}</cite></blockquote>)}
      </div>
    </section>}
    {course.eligibilityText && <><h3>Programme information from supplied sources</h3><p>{course.eligibilityText}</p></>}
    {course.issues.length > 0 && <div className="review-box"><h3>Needs confirmation</h3><ul>{course.issues.map((s,i)=><li key={i}>{s}</li>)}</ul></div>}
    <h3>Timetable offerings</h3>{course.sections.map(s => (
      <div className="offering" key={s.id}>
        <Anchor value={s.anchor}/><strong>{s.label}</strong><p>{meetingLabel(s)}</p>
        {s.faculty && <p>{s.faculty}</p>}
        {s.eligibilityText && <p>{s.eligibilityText}</p>}
        {s.outlineFiles?.map(f=><small key={f}>{f}</small>)}
        <small>Excel RegularCourses: {s.sources.map(e=>`${e.sourceCell} “${e.sourceText}”`).join('; ')}</small>
      </div>
    ))}
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
  const [area,setArea]=useState('All'); const [seniorFilter,setSeniorFilter]=useState('All');
  const [demandFilter,setDemandFilter]=useState('All');
  const [seniorCategory,setSeniorCategory]=useState('all');
  const [biddingCategory,setBiddingCategory]=useState('all');
  const [biddingSort,setBiddingSort]=useState('demand');
  const [biddingAnchor,setBiddingAnchor]=useState('All');
  const [biddingSearch,setBiddingSearch]=useState('');
  const [detail,setDetail]=useState(null); const [notice,setNotice]=useState('');
  const [shareOpen,setShareOpen]=useState(false);
  useEffect(()=>{try{localStorage.setItem(KEY,JSON.stringify(Object.fromEntries(Object.entries(selections).map(([id,s])=>[id,s.id]))));}catch{/* Browser can deny storage. */}},[selections]);
  useEffect(()=>{try{localStorage.setItem('iimb-term6-2026-rejected',JSON.stringify(rejected));}catch{/* Browser can deny storage. */}},[rejected]);
  useEffect(()=>{try{localStorage.setItem('iimb-term6-2026-workshops',JSON.stringify(selectedWorkshops.map(w=>w.id)));}catch{/* Browser can deny storage. */}},[selectedWorkshops]);
  useEffect(()=>{try{localStorage.setItem('iimb-term6-2026-bpim',JSON.stringify(bpim));}catch{/* Browser can deny storage. */}},[bpim]);
  useEffect(()=>{try{localStorage.setItem('iimb-term6-2026-include-workshops',JSON.stringify(showWorkshops));}catch{/* Browser can deny storage. */}},[showWorkshops]);
  function changeWorkshops(enabled) {setShowWorkshops(enabled);if(!enabled){setSelectedWorkshops([]);if(view==='workshops')setView('calendar');setNotice('Workshops removed from your plan.');}else setNotice('Workshops enabled. Open the Workshops tab to browse and add them.');}
  function resetFilters(){setQuery('');setAnchor('All');setCoverage('All');setArea('All');setSeniorFilter('All');setDemandFilter('All');}
  const visible = courses.filter(c => {
    const demand = getBiddingSummary(c.id);
    return [c.name,c.id,c.faculty,c.area].filter(Boolean).join(' ').toLowerCase().includes(query.toLowerCase()) &&
      (area==='All'||c.area===area) &&
      (coverage==='All'||coverage==='Current outlines'&&c.outlineStatus==='current'||coverage==='Historical outlines'&&c.outlineStatus==='historical') &&
      (seniorFilter==='All'||seniorFilter==='reccos'&&seniorReviews[c.id]?.sentiment==='recco'||seniorFilter==='chill'&&seniorReviews[c.id]?.sentiment==='chill'||seniorFilter==='heavy'&&seniorReviews[c.id]?.sentiment==='heavy'||seniorFilter==='reviewed'&&Boolean(seniorReviews[c.id])) &&
      (demandFilter==='All'||(demand && demand.tier===demandFilter));
  });
  const visibleSections = c=>c.sections.filter(s=>anchor==='All'||s.anchor===anchor);
  const reviewedCourseList = Object.values(seniorReviews).filter(r => r.courseId !== 'WS_11');
  const reccosCount = reviewedCourseList.filter(r => r.sentiment === 'recco').length;
  const chillCount = reviewedCourseList.filter(r => r.sentiment === 'chill').length;
  const heavyCount = reviewedCourseList.filter(r => r.sentiment === 'heavy').length;

  const allBiddingCourses = Object.keys(biddingData.biddingStats).map(id => {
    const c = courses.find(course => course.id === id) || workshops.find(w => w.id === id) || {
      id,
      name: id,
      faculty: 'Faculty unconfirmed',
      credits: 3,
      area: 'Elective',
      sections: []
    };
    const summary = getBiddingSummary(id);
    const section = c.sections ? c.sections[0] : null;
    return { course: c, summary, section, isWorkshop: id.startsWith('WS_') };
  }).filter(item => item.summary !== null);

  const highDemandList = allBiddingCourses.filter(item => item.summary.tier === 'high');
  const modDemandList = allBiddingCourses.filter(item => item.summary.tier === 'moderate');
  const lowDemandList = allBiddingCourses.filter(item => item.summary.tier === 'low');

  const filteredBiddingCourses = allBiddingCourses
    .filter(item => {
      if (biddingCategory !== 'all' && item.summary.tier !== biddingCategory) return false;
      if (biddingAnchor !== 'All') {
        const hasAnchor = item.summary.stats.some(s => s.programme === biddingAnchor);
        if (!hasAnchor) return false;
      }
      if (biddingSearch.trim()) {
        const q = biddingSearch.toLowerCase().trim();
        const matchName = item.course.name.toLowerCase().includes(q);
        const matchId = item.course.id.toLowerCase().includes(q);
        const matchCode = item.summary.officialCode?.toLowerCase().includes(q);
        const matchFaculty = item.course.faculty?.toLowerCase().includes(q);
        if (!matchName && !matchId && !matchCode && !matchFaculty) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (biddingSort === 'demand') return b.summary.fillRate - a.summary.fillRate;
      if (biddingSort === 'mrb') return b.summary.maxMRB - a.summary.maxMRB || b.summary.fillRate - a.summary.fillRate;
      if (biddingSort === 'seats') {
        const seatsA = Math.max(0, a.summary.totalSeats - a.summary.totalBidders);
        const seatsB = Math.max(0, b.summary.totalSeats - b.summary.totalBidders);
        return seatsB - seatsA;
      }
      if (biddingSort === 'bidders') return b.summary.totalBidders - a.summary.totalBidders;
      if (biddingSort === 'name') return a.course.name.localeCompare(b.course.name);
      return 0;
    });

  function applyWonAllocation() {
    const newSelections = { ...selections };
    let appliedCount = 0;
    biddingData.myAllocation.selectedCourses.forEach(won => {
      const c = courses.find(course => course.id === won.courseId);
      if (c) {
        const s = c.sections.find(sec => sec.anchor === won.sectionAnchor || sec.id === won.sectionId) || c.sections[0];
        if (s) {
          newSelections[c.id] = s;
          appliedCount++;
        }
      }
    });
    setSelections(newSelections);
    setNotice(`Applied ${appliedCount} winning courses from your Bidding Allocation directly into My Plan!`);
  }

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
    <div className="intro"><b>Build your Term 6 plan.</b> Read course details, tap Add to plan, or drag an offering into My plan. Clashing choices are blocked. <span>All programme anchors are shown; cross-programme enrolment needs confirmation. Pre-mid (PRE) and post-mid (POST) half-term courses run consecutively and can be added simultaneously. Check senior reccos and real bidding demand metrics to optimize your choices.</span></div>
    <div className="programme-control"><span>All courses are available to add to your plan. Check programme eligibility in Details before enrolling.</span><label className="workshop-toggle"><input type="checkbox" checked={showWorkshops} onChange={e=>changeWorkshops(e.target.checked)}/> Include workshops</label></div>
    <section className="plan" aria-label="My plan" onDragOver={e=>e.preventDefault()} onDrop={e=>drop(e)}>
      <div className="plan-heading"><h2>My plan <span>{count} regular courses</span></h2><div><span>{knownCredits} confirmed credits{unknownCredits ? ` + ${unknownCredits} course(s) with unknown credits` : ''}</span><button onClick={()=>setShareOpen(true)} disabled={!count&&!selectedWorkshops.length}>Share / download</button><button className="text-button" onClick={()=>{setSelections({});setSelectedWorkshops([]);setNotice('Plan cleared.');}} disabled={!count&&!selectedWorkshops.length}>Clear plan</button></div></div>
      <div className="selected-chips">{count===0&&selectedWorkshops.length===0?<p>Drop an offering here, or tap Add to plan. Your choices save on this device.</p>:<>{Object.entries(selections).map(([id,s])=><div className="plan-chip" key={id}><b>{courses.find(c=>c.id===id).name} <small>({id})</small></b><span>{s.label} · {meetingLabel(s)}</span><button aria-label={`Remove ${id}`} onClick={()=>choose(courses.find(c=>c.id===id),s)}>×</button></div>)}{selectedWorkshops.map(w=><div className="plan-chip" key={w.id}><b>{w.name}</b><span>{w.startDate.slice(8)}–{w.endDate.slice(8)} Dec</span><button aria-label={`Remove ${w.name}`} onClick={()=>chooseWorkshop(w)}>×</button></div>)}</>}</div>
    </section>
    <div className="notice" role="status" aria-live="polite">{notice || 'ZMT: Group 1 at 10:00 and Group 2 at 11:45, both Wednesday/Thursday.'}</div>
    <nav className="toolbar" aria-label="Course views"><div className="tabs">{[['calendar','Calendar'],['list','Browse all courses'],['senior-reviews','Senior Reviews ⭐'],['bidding','Bidding & Demand 📊'],...(showWorkshops?[['workshops','Workshops']]:[]),['review','Missing outlines & review']].map(([id,label])=><button aria-pressed={view===id} className={view===id?'active':''} key={id} onClick={()=>setView(id)}>{label}</button>)}</div>
      {['calendar','list'].includes(view)&&<div className="filters"><input aria-label="Search course or faculty" placeholder="Search course or faculty…" value={query} onChange={e=>setQuery(e.target.value)}/><select aria-label="Anchoring programme" value={anchor} onChange={e=>setAnchor(e.target.value)}>{['All','PGP','EPGP','PGPEM'].map(a=><option key={a} value={a}>{a==='All'?'All programme anchors':`${a} anchor`}</option>)}</select><select aria-label="Bidding demand filter" value={demandFilter} onChange={e=>setDemandFilter(e.target.value)}>{[['All','All demand levels'],['high','🔥 High Demand (MRB > 0 / >100%)'],['moderate','⚡ Moderate Demand (50–100%)'],['low','🟢 Easy to Get (<50% filled)']].map(([val,lbl])=><option key={val} value={val}>{lbl}</option>)}</select><select aria-label="Senior reviews filter" value={seniorFilter} onChange={e=>setSeniorFilter(e.target.value)}>{[['All','All courses'],['reccos','★ Senior Reccos only'],['chill','☕ Chill & Zero BT only'],['heavy','⚠️ Workload Advisories only'],['reviewed','All courses with senior reviews']].map(([val,lbl])=><option key={val} value={val}>{lbl}</option>)}</select><select aria-label="Outline coverage" value={coverage} onChange={e=>setCoverage(e.target.value)}>{['All','Current outlines','Historical outlines'].map(a=><option key={a}>{a}</option>)}</select><select aria-label="Teaching area" value={area} onChange={e=>setArea(e.target.value)}>{['All',...new Set(courses.map(c=>c.area))].map(a=><option key={a} value={a}>{a==='All'?'All areas':a}</option>)}</select><button className="reset-filters" onClick={resetFilters}>Show all courses</button></div>}
    </nav>
    <main>
    {view==='calendar'&&<><div className="section-heading"><div><h2>Weekly timetable</h2><p>{visible.filter(c=>visibleSections(c).length).length} courses shown. Codes are the main labels; tap a course for its full details.</p></div><span>Scroll sideways on smaller screens</span></div><div className="calendar-scroll" role="region" aria-label="Weekly course calendar; scroll to see more days or times" tabIndex={0}><div className="calendar">
      <div className="grid-head time-head">Time</div>{DAYS.map(day=><div key={day} className="grid-head">{day}</div>)}
      {slots.map(slot=><div className="calendar-row" key={slot.index}><div className="slot-label"><b>{slot.start}</b><span>{slot.end}</span></div>{DAYS.map(day=><div className="calendar-cell" key={day} onDragOver={e=>e.preventDefault()} onDrop={e=>drop(e,day,slot.index)}>
        {visible.flatMap(c=>visibleSections(c).filter(s=>s.meetings.some(m=>m.day===day&&m.index===slot.index)).map(s=><CourseCard compact key={s.id} course={c} section={s} selected={selections[c.id]?.id===s.id} conflict={conflictWith(s,selections,c.id)} rejected={rejected.includes(c.id)} onSelect={choose} onDetail={setDetail} onReject={reject}/>))}
      </div>)}</div>)}
    </div></div></>}
    {view==='list'&&<><div className="section-heading"><div><h2>Browse all courses</h2><p>{visible.filter(c=>visibleSections(c).length).length} of {courses.length} courses · Full names and all programme anchors. Open Details before choosing an offering.</p></div></div><div className="course-list">{visible.flatMap(c=>visibleSections(c).map(s=><CourseCard key={s.id} course={c} section={s} selected={selections[c.id]?.id===s.id} conflict={conflictWith(s,selections,c.id)} rejected={rejected.includes(c.id)} onSelect={choose} onDetail={setDetail} onReject={reject}/>))}</div>{!visible.some(c=>visibleSections(c).length)&&<p>No courses match these filters.</p>}</>}
    {view==='senior-reviews'&&<section className="senior-reviews-view" aria-label="Senior Course Reviews & Recommendations">
      <div className="senior-overview-banner">
        <h2>Senior Reviews & Elective Recommendations</h2>
        <p>Unfiltered feedback, exam tips, and workload advice collected from IIM Bangalore seniors to help you pick your Term 6 electives wisely.</p>
        <div className="senior-stats-row">
          <div className="senior-stat-badge"><b>{reviewedCourseList.length}</b> Reviewed Electives</div>
          <div className="senior-stat-badge"><b>{reccosCount}</b> Top Recommendations (★ Reccos)</div>
          <div className="senior-stat-badge"><b>{chillCount}</b> Zero-BT & Chill Courses</div>
          <div className="senior-stat-badge"><b>{heavyCount}</b> Workload & Caution Advisories</div>
        </div>
      </div>
      <div className="senior-category-pills" role="tablist" aria-label="Review categories">
        {[
          ['all', `All Senior Reviews (${reviewedCourseList.length})`],
          ['recco', `★ Top Senior Reccos (${reccosCount})`],
          ['chill', `☕ Chill & Zero BT (${chillCount})`],
          ['heavy', `⚠️ Workload & Advisories (${heavyCount})`]
        ].map(([cat, label]) => (
          <button
            key={cat}
            role="tab"
            aria-selected={seniorCategory === cat}
            className={`category-pill ${seniorCategory === cat ? 'active' : ''}`}
            onClick={() => setSeniorCategory(cat)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="senior-reviews-grid">
        {Object.values(seniorReviews)
          .filter(r => r.courseId !== 'WS_11')
          .filter(r => seniorCategory === 'all' || r.sentiment === seniorCategory)
          .map(rev => {
            const courseObj = courses.find(c => c.id === rev.courseId);
            const section = courseObj?.sections[0];
            const isSelected = Boolean(selections[rev.courseId]);
            const conflict = section ? conflictWith(section, selections, rev.courseId) : null;
            return (
              <article key={rev.courseId} className={`senior-review-card ${rev.sentiment}`}>
                <div className="senior-card-header">
                  <div className="senior-card-title">
                    <b>{rev.name} ({rev.courseId})</b>
                    <span>{rev.faculty} · {courseObj ? `${courseObj.credits} credits` : ''} · {courseObj?.area}</span>
                  </div>
                  <span className={`recco-tag ${rev.sentiment}`}>{rev.badge}</span>
                </div>
                <div className="senior-card-takeaway">
                  <b>Senior Takeaway:</b> {rev.headline}
                </div>
                <div className="senior-tags">
                  {rev.tags.map(t => <span key={t} className="senior-subtag">{t}</span>)}
                </div>
                <div className="senior-card-quotes">
                  {rev.reviews.map((r, i) => (
                    <blockquote key={i} className="senior-quote">
                      <p>“{r.quote}”</p>
                      <cite>— {r.author}</cite>
                    </blockquote>
                  ))}
                </div>
                <div className="senior-card-meta">
                  {section && <span><b>Offerings:</b> {courseObj.sections.map(s => `${s.label}: ${meetingLabel(s)}`).join('; ')}</span>}
                  {conflict && !isSelected && <span className="conflict-text">Clashes with {conflict} in your plan</span>}
                </div>
                <div className="senior-card-actions">
                  {section && (
                    <button
                      className={isSelected ? 'remove-btn' : 'add-btn'}
                      onClick={() => courseObj && section && choose(courseObj, section)}
                      disabled={Boolean(conflict) && !isSelected}
                    >
                      {isSelected ? 'Remove from plan' : conflict ? `Clashes with ${conflict}` : 'Add to plan'}
                    </button>
                  )}
                  {courseObj && (
                    <button onClick={() => setDetail(courseObj)}>
                      Full Details
                    </button>
                  )}
                </div>
              </article>
            );
          })}
      </div>
    </section>}
    {view==='bidding'&&<section className="bidding-view" aria-label="Course Bidding Demand and Competitiveness">
      <div className="demand-overview-banner">
        <h2>Term 6 Course Bidding & Demand Intelligence</h2>
        <p>Real-time analytics on which electives are intensely contested (high clearing MRB points or oversubscribed) versus courses with ample open seats and guaranteed entry at 0 bid points. Grounded in actual IIM Bangalore Round 23 bidding metrics.</p>
        <div className="demand-stats-row">
          <div className="demand-stat-badge"><b>{allBiddingCourses.length}</b> Courses Analyzed</div>
          <div className="demand-stat-badge"><b>{highDemandList.length}</b> 🔥 High Demand (MRB &gt; 0 / &gt;100%)</div>
          <div className="demand-stat-badge"><b>{modDemandList.length}</b> ⚡ Moderate Demand (50–100%)</div>
          <div className="demand-stat-badge"><b>{lowDemandList.length}</b> 🟢 Easy to Get (&lt;50% filled)</div>
        </div>
      </div>

      <div className="won-allocation-box">
        <div className="won-allocation-left">
          <h3>🏆 Your Confirmed Round 23 Allocation ({biddingData.myAllocation.confirmedCredits} Credits)</h3>
          <p>5 courses secured in your round allocation with {biddingData.myAllocation.usedBidPoints} bid points used:</p>
          <div className="won-courses-chips">
            {biddingData.myAllocation.selectedCourses.map(w => (
              <span key={w.courseId} className="won-course-chip">
                ✓ <b>{w.name} ({w.courseId})</b> · {w.bidPoints > 0 ? `${w.bidPoints} pts` : '0 pts'}
              </span>
            ))}
          </div>
        </div>
        <button className="apply-won-btn" onClick={applyWonAllocation} title="Add these 5 allocated courses directly into My Plan">
          Apply Won Courses to My Plan ⚡
        </button>
      </div>

      <div className="bidding-controls-bar">
        <input
          type="text"
          placeholder="Search course name, code (e.g. EC740, CBM), or professor…"
          value={biddingSearch}
          onChange={e => setBiddingSearch(e.target.value)}
          aria-label="Search bidding courses"
        />
        <select
          value={biddingCategory}
          onChange={e => setBiddingCategory(e.target.value)}
          aria-label="Filter by demand level"
        >
          <option value="all">All Demand Levels ({allBiddingCourses.length})</option>
          <option value="high">🔥 High Demand / Competitive ({highDemandList.length})</option>
          <option value="moderate">⚡ Moderate Demand ({modDemandList.length})</option>
          <option value="low">🟢 Easy to Get / High Availability ({lowDemandList.length})</option>
        </select>
        <select
          value={biddingSort}
          onChange={e => setBiddingSort(e.target.value)}
          aria-label="Sort courses"
        >
          <option value="demand">Sort: Highest Demand %</option>
          <option value="mrb">Sort: Highest Clearing MRB Points</option>
          <option value="seats">Sort: Most Seats Available (Easiest)</option>
          <option value="bidders">Sort: Most Bidders</option>
          <option value="name">Sort: Course Name (A-Z)</option>
        </select>
        <select
          value={biddingAnchor}
          onChange={e => setBiddingAnchor(e.target.value)}
          aria-label="Filter by programme anchor"
        >
          <option value="All">All Programme Anchors</option>
          <option value="PGP">PGP Anchor</option>
          <option value="EPGP">EPGP Anchor</option>
          <option value="PGPEM">PGPEM Anchor</option>
        </select>
      </div>

      <div className="demand-cards-grid">
        {filteredBiddingCourses.map(item => {
          const { course: c, summary, section, isWorkshop } = item;
          const isSelected = isWorkshop ? selectedWorkshops.some(w => w.id === c.id) : Boolean(selections[c.id]);
          const conflict = section && !isWorkshop ? conflictWith(section, selections, c.id) : null;
          const review = seniorReviews[c.id];
          const seatsAvailable = Math.max(0, summary.totalSeats - summary.totalBidders);
          return (
            <article key={c.id} className={`demand-card ${summary.tier}-demand`}>
              <div className="demand-card-header">
                <div className="demand-card-title">
                  <b>{c.name} ({c.id})</b>
                  <span>{summary.officialCode ? `${summary.officialCode} · ` : ''}{c.faculty || 'Faculty unconfirmed'} · {c.credits} credits · {c.area || 'Elective'}</span>
                </div>
                <span className={`demand-tag ${summary.tier}`}>
                  {summary.tierLabel}
                </span>
              </div>

              <div className="demand-metrics-bar">
                <div className="demand-stat-row">
                  <span>Clearing Price (MRB):</span>
                  <span className="mrb-val">{summary.maxMRB > 0 ? `${summary.maxMRB} pts` : '0 pts (Free)'}</span>
                </div>
                <div className="demand-stat-row">
                  <span>Bidders vs Capacity:</span>
                  <b>{summary.totalBidders} bidders / {summary.totalSeats} seats</b>
                </div>
                <div className="demand-progress-track">
                  <div
                    className={`demand-progress-fill ${summary.tier}`}
                    style={{ width: `${Math.min(100, summary.fillRate)}%` }}
                  />
                </div>
                <div className="demand-stat-row">
                  <span>Subscription Rate:</span>
                  <b style={{ color: summary.fillRate >= 100 ? '#ef4444' : summary.fillRate >= 50 ? '#d97706' : '#16a34a' }}>
                    {summary.fillRate}% filled {seatsAvailable > 0 ? `(${seatsAvailable} seats available)` : '(Oversubscribed)'}
                  </b>
                </div>
              </div>

              <div className="demand-takeaway-text">
                <b>Strategy Tip:</b> {summary.tip}
              </div>

              {review && (
                <div className={`senior-tip-banner ${review.sentiment}`} style={{ margin: 0, fontSize: '11px', padding: '6px 10px' }}>
                  <b>Senior Take:</b> {review.headline}
                </div>
              )}

              <div className="demand-card-actions">
                {!isWorkshop && section && (
                  <button
                    className={isSelected ? 'remove-btn' : 'add-btn'}
                    onClick={() => choose(c, section)}
                    disabled={Boolean(conflict) && !isSelected}
                  >
                    {isSelected ? 'Remove from plan' : conflict ? `Clashes with ${conflict}` : 'Add to plan'}
                  </button>
                )}
                {isWorkshop && (
                  <button
                    className={isSelected ? 'remove-btn' : 'add-btn'}
                    onClick={() => chooseWorkshop(c)}
                  >
                    {isSelected ? 'Remove workshop' : 'Add workshop'}
                  </button>
                )}
                <button className="details-btn" onClick={() => setDetail(c)}>
                  Full Details
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>}
    {showWorkshops&&view==='workshops'&&<><div className="section-heading"><div><h2>December workshops</h2><p>6–12 December 2026 · Select up to two non-clashing campus workshops, or one travel workshop.</p></div></div><label className="bpim"><input type="checkbox" checked={bpim} onChange={e=>{setBpim(e.target.checked);if(e.target.checked){setSelectedWorkshops([]);setNotice('Workshop choices cleared: the workbook excludes BPIM participants.');}}}/> I am enrolled in a BPIM</label><div className="workshop-list">{workshops.map(w=>{const selected=selectedWorkshops.some(x=>x.id===w.id);const reason=workshopConflict(w,selectedWorkshops,bpim);const wRev=seniorReviews[w.id];return <article key={w.id} className={`workshop ${selected?'selected':''}`}><div className="card-tags"><Anchor value={w.anchor}/><span>{w.credits} credits</span><span>{w.travel?'Travel':'Campus'}</span>{wRev&&<span className={`recco-tag ${wRev.sentiment}`}>{wRev.badge}</span>}</div><h3>{w.name}{w.asterisk?'*':''}</h3><p>{w.faculty}</p><b>{w.startDate.slice(8)}–{w.endDate.slice(8)} December 2026</b><p>{w.travel?'Travel itinerary / daily times not supplied':`${w.start}–${w.end}, with breaks`} · {w.grading}</p><small>{w.minSeats}–{w.maxSeats} seats · Excel Workshops row {w.sourceRow}</small><p className="review-note">{w.anchor!=='PGP'?'Confirm PGP/PGPBA enrolment in this anchored offering.':''}{w.asterisk?' Asterisk meaning not specified in workbook.':''}</p>{wRev&&<div className="senior-card-takeaway"><b>Senior Takeaway:</b> {wRev.headline}</div>}<details><summary>Outline sources and review</summary><p>{w.outlineStatus === 'historical' ? 'Historical outline — current version needed.' : 'Current outline supplied.'}</p>{w.outlineFiles?.map(f=><p key={f}>{f}</p>)}{w.issues?.map((issue,i)=><p className="review-note" key={i}>{issue}</p>)}</details><button onClick={()=>chooseWorkshop(w)} disabled={!selected&&Boolean(reason)}>{selected?'Remove workshop':'Add workshop'}</button>{reason&&!selected&&<small className="conflict-text">{reason}</small>}</article>;})}</div><div className="review-box"><h3>Workbook rules</h3><ul>{data.workshopRules.map(r=><li key={r}>{r}</li>)}</ul></div></>}
    {view==='review'&&<><div className="section-heading"><div><h2>Mapping review</h2><p>{courses.length} regular course acronyms · {courses.reduce((n,c)=>n+c.sections.length,0)} offerings{showWorkshops?` · ${workshops.length} workshops`:''} · {courses.filter(c=>c.outlineFile).length} outlines mapped</p></div><button onClick={()=>download(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),'Term6_Course_Data.json')}>Download data</button></div><div className="review-box"><h3>What needs checking</h3><ul>{data.notes.filter(n=>showWorkshops||!n.toLowerCase().includes('workshop')).map(n=><li key={n}>{n}</li>)}</ul></div><section className="missing-outlines" aria-label="Missing current course outlines"><h3>What is missing?</h3><p>All regular courses have a full-name match. Current assessments and course content cannot be confirmed for these seven courses because only older outlines are supplied.</p><ul>{historicCourses.map(c=><li key={c.id}><button className="text-button" onClick={()=>setDetail(c)}>{c.name} ({c.id})</button> — current-year outline needed.</li>)}</ul><p><b>Research for Marketing Decisions (RMD):</b> Mayank Nagpal’s outline is missing. Confirm which professor teaches each offering; Gopal Das’s outline is supplied.</p>{showWorkshops&&<><h3>Current workshop outlines needed</h3><ul>{historicWorkshops.map(w=><li key={w.id}>{w.name}</li>)}</ul><p>Other workshop outlines are matched. Open Workshops for date and programme discrepancies.</p></>}</section><div className="review-table"><table><thead><tr><th>Acronym / title</th><th>Faculty</th><th>Schedule / anchor</th><th>Review notes</th></tr></thead><tbody>{courses.map(c=><tr key={c.id}><td><button className="text-button" onClick={()=>setDetail(c)}><b>{c.id}</b><br/>{c.name}</button></td><td>{c.faculty||'Unconfirmed'}</td><td>{c.sections.map(s=><p key={s.id}><Anchor value={s.anchor}/> {s.label}<br/>{meetingLabel(s)}</p>)}</td><td>{c.issues.length?c.issues.join(' '):'Outline and Excel timing mapped. Formal catalogue code not supplied.'}</td></tr>)}</tbody></table></div></>}
    </main>
    {(count>0||selectedWorkshops.length>0)&&<section className="plan-export"><div className="section-heading"><h2>Selected schedule</h2><button onClick={()=>setShareOpen(true)}>Share / download plan</button></div><div className="selected-sheet-scroll"><PlanSheet data={data} selections={selections} selectedWorkshops={selectedWorkshops}/></div></section>}
    {shareOpen&&<PlanShare data={data} selections={selections} selectedWorkshops={selectedWorkshops} onClose={()=>setShareOpen(false)} onDownloadText={exportPlan}/>}
    <footer>Based on the supplied timetable and course outlines. Anchoring programme is not an enrolment guarantee. Planning limits are not enforced because Term 6 credit requirements have not been supplied.</footer>
    {detail&&<Details course={detail} onClose={()=>setDetail(null)}/>}
  </>;
}
