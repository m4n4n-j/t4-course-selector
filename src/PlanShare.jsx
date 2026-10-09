import { useEffect, useRef, useState } from 'react';
import { DAYS, meetingLabel } from './schedule';
import { courseAreaStyle } from './course-colors';

function saveFile(file) {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url; link.download = file.name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function PlanSheet({data, selections, selectedWorkshops, captureRef}) {
  const selected = data.courses.filter(c => selections[c.id]).sort((a,b)=>a.name.localeCompare(b.name));
  const credits = selected.reduce((n,c)=>n+(c.credits || 0),0)+selectedWorkshops.reduce((n,w)=>n+w.credits,0);
  const areaCounts = new Map();
  for (const course of [...selected,...selectedWorkshops]) areaCounts.set(course.area,(areaCounts.get(course.area)||0)+1);
  return <div className="plan-sheet" ref={captureRef} data-plan-capture={captureRef ? 'true' : undefined}>
    <header className="sheet-heading"><div><p>IIM BANGALORE · 2026–27</p><h2>My Term 6 timetable</h2><p>{data.period}</p></div><div><b>{selected.length} courses{selectedWorkshops.length ? ` · ${selectedWorkshops.length} workshops` : ''}</b><p>{credits} confirmed credits</p></div></header>
    <div className="sheet-area-legend" aria-label="Selected course areas">{[...areaCounts].sort(([a],[b])=>String(a).localeCompare(String(b))).map(([area,count])=>{const palette=courseAreaStyle(area);return <span key={area} style={{backgroundColor:palette.tint,color:'#334155',borderColor:palette.color}}><i style={{backgroundColor:palette.color}}/>{palette.label} ({count})</span>;})}</div>
    <div className="sheet-calendar"><div className="sheet-time">Time</div>{DAYS.map(d=><div className="sheet-day" key={d}>{d}</div>)}{data.slots.map(t=><div className="sheet-row" key={t.index}><div className="sheet-time">{t.start}<br/>{t.end}</div>{DAYS.map(day=><div className="sheet-cell" key={day}>{selected.filter(c=>selections[c.id].meetings.some(m=>m.day===day&&m.index===t.index)).map(c=>{const palette=courseAreaStyle(c.area);return <div className="sheet-event" key={c.id} style={{backgroundColor:palette.tint,borderLeftColor:palette.color}}><b>{c.id}</b><span>{selections[c.id].label}</span><small>{c.area}</small></div>;})}</div>)}</div>)}</div>
    <h3>Selected courses</h3>
    <div className="sheet-course-list">{selected.map(c=>{const section=selections[c.id],palette=courseAreaStyle(c.area);return <article className="sheet-course sheet-course-coloured" key={c.id} style={{borderLeftColor:palette.color}}><h3>{c.id} · {c.name}</h3><p><strong>{palette.label}</strong> · {c.faculty || 'Faculty unconfirmed'} · {c.credits ? `${c.credits} credits` : 'Credits unconfirmed'}</p><p><b>{section.label}</b> · {meetingLabel(section)}</p></article>;})}</div>
    {selectedWorkshops.length > 0 && <><h3>Selected workshops</h3>{selectedWorkshops.map(w=>{const palette=courseAreaStyle(w.area);return <article className="sheet-course sheet-course-coloured" key={w.id} style={{borderLeftColor:palette.color}}><h3>{w.name}</h3><p><strong>{palette.label}</strong> · {w.faculty} · {w.credits} credits · {w.anchor}</p><p>{w.startDate}–{w.endDate}{w.start ? ` · ${w.start}–${w.end}` : ' · Travel workshop'}</p></article>;})}</>}
    <footer className="sheet-footer">Timetable source: {data.version}. Programme eligibility and flagged mappings need confirmation. PRE/POST clashes are checked conservatively.</footer>
  </div>;
}

export default function PlanShare({data, selections, selectedWorkshops, onClose, onDownloadText}) {
  const [attempt,setAttempt]=useState(0);
  const [result,setResult]=useState({attempt:null});
  const [status,setStatus]=useState('');
  const [sharing,setSharing]=useState(false);
  const captureRef=useRef(null); const closeRef=useRef(null);
  const ready=result.attempt===attempt;
  const file=ready ? result.file : null;
  let canShare=false;
  try {canShare=Boolean(file && navigator.share && navigator.canShare?.({files:[file]}));}catch{/* Download remains available. */}
  useEffect(()=>{
    const previous=document.activeElement; closeRef.current?.focus();
    const handler=e=>{if(e.key==='Escape')onClose();if(e.key==='Tab'){const nodes=closeRef.current?.closest('[role="dialog"]')?.querySelectorAll('button:not(:disabled),a[href]');if(!nodes?.length)return;const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}};
    window.addEventListener('keydown',handler);return()=>{window.removeEventListener('keydown',handler);previous?.focus();};
  },[onClose]);
  useEffect(()=>{
    let cancelled=false; let url;
    async function prepare(){try{
      const {default:html2canvas}=await import('html2canvas');
      await document.fonts?.ready;
      if(cancelled)return;
      const sheet=captureRef.current;
      const canvas=await html2canvas(sheet,{scale:2,backgroundColor:'#ffffff',logging:false,windowWidth:1040,scrollX:0,scrollY:0,onclone:doc=>{const parent=doc.querySelector('.share-capture');parent.style.left='0';parent.style.top='0';const capture=doc.querySelector('[data-plan-capture]');capture.style.position='static';capture.style.width='1000px';capture.style.maxWidth='none';capture.style.visibility='visible';}});
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
      if(!blob)throw Error('Image creation failed');
      if(cancelled)return;
      const imageFile=new File([blob],'Term6_Timetable.png',{type:'image/png'});
      url=URL.createObjectURL(imageFile);
      setResult({attempt,file:imageFile,url});
    }catch{if(!cancelled)setResult({attempt,error:'Could not create the image. Retry or download the text plan.'});}}
    prepare();return()=>{cancelled=true;if(url)URL.revokeObjectURL(url);};
  },[attempt,selections,selectedWorkshops]);
  async function share(){if(!file || !canShare || sharing)return;setSharing(true);try{
    // The image is prepared before this click, preserving user activation.
    await navigator.share({files:[file],title:'My Term 6 plan'});
    setStatus('Share menu opened.');
  }catch(error){setStatus(error.name==='AbortError'?'Sharing cancelled.':'Sharing failed. Download the image and send it from your app.');}finally{setSharing(false);}}
  return <><div className="modal-backdrop" onClick={onClose}><section className="modal share-modal" role="dialog" aria-modal="true" aria-labelledby="share-title" onClick={e=>e.stopPropagation()}><header><div><h2 id="share-title">Share or download your timetable</h2><p>A clean image of your selected courses, ready to send.</p></div><button className="icon-button" ref={closeRef} onClick={onClose} aria-label="Close sharing">×</button></header><div className="modal-body"><div className="share-actions"><button disabled={!file} onClick={()=>{saveFile(file);setStatus('Image download started.');}}>Download PNG</button>{canShare && <button disabled={sharing} onClick={share}>{sharing?'Sharing…':'Share image'}</button>}<button onClick={onDownloadText}>Download text plan</button></div><p className="share-status" role="status" aria-live="polite">{!ready?'Preparing image…':result.error||status||'Your image is ready.'}</p>{ready && result.error && <button onClick={()=>setAttempt(n=>n+1)}>Retry image</button>}{file && !canShare && <p className="share-help">Download the image, then attach it in WhatsApp, email or another app.</p>}{file && <img className="share-preview" src={result.url} alt="Preview of your Term 6 timetable, coloured by course area"/>}</div></section></div><div className="share-capture" aria-hidden="true"><PlanSheet data={data} selections={selections} selectedWorkshops={selectedWorkshops} captureRef={captureRef}/></div></>;
}
