"use strict";
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const mapUrl=query=>'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(query);
const external=(url,label,cls='map-link')=>`<a class="${cls}" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`;
const mapLink=(query,label='開啟地圖')=>external(mapUrl(query),label);
const storagePrefix='misha-kyushu-2026-v1-';
let storageAvailable=true;
function readSaved(key,fallback){try{const raw=localStorage.getItem(storagePrefix+key);return raw===null?fallback:JSON.parse(raw)}catch{return fallback}}
function save(key,value){try{localStorage.setItem(storagePrefix+key,JSON.stringify(value));return true}catch{storageAvailable=false;$('#storage-status').textContent='目前瀏覽器無法儲存進度；本次仍可勾選與記筆記，關閉後可能不會保留。';return false}}
let activeDay=0;
let activePlan=readSaved('plan','A')==='B'?'B':'A';
function renderStop(s){const [time,title,desc,query,tag]=s;return `<li class="stop${tag==='彈性'?' flexible':''}"><div class="stop-time">${esc(time)}</div><div class="stop-content"><h4>${esc(title)}${tag?`<span class="pill${tag==='彈性'?' flex':''}">${esc(tag)}</span>`:''}</h4><p>${esc(desc)}</p>${query?`<div class="links">${mapLink(query)}</div>`:''}</div></li>`}
function renderDetail(d){return `<details class="detail-box"><summary>${esc(d.title)}</summary><p>${esc(d.text)}</p>${d.links?`<div class="links">${d.links.map(([name,q])=>mapLink(q,name)).join('')}</div>`:''}${d.url?`<div class="links">${external(d.url,d.urlLabel)}</div>`:''}</details>`}
function renderDay(){
 const d=days[activeDay];
 document.querySelectorAll('.day-tab').forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===activeDay));tab.tabIndex=i===activeDay?0:-1});
 $('#day-counter').textContent=String(activeDay+1).padStart(2,'0')+' / 06';
 $('#prev-day').disabled=activeDay===0;$('#next-day').disabled=activeDay===days.length-1;
 const panel=$('#day-panel');panel.setAttribute('aria-labelledby','tab-day-'+activeDay);
 const h=d.hotel!==null?hotels[d.hotel]:null;
 panel.innerHTML=`<header class="day-header"><span class="day-number" aria-hidden="true">${String(activeDay+1).padStart(2,'0')}</span><div><span class="small-label">DAY ${String(activeDay+1).padStart(2,'0')} · ${esc(d.date)}</span><h3>${esc(d.title)}</h3><p>${esc(d.subtitle)}</p></div></header><div class="day-body"><p class="day-summary">${esc(d.summary)}</p>${d.plans?`<div class="plan-tabs" role="tablist" aria-label="高千穗當日方案">${Object.entries(d.plans).map(([key,plan])=>`<button id="plan-${key}" class="plan-tab" role="tab" aria-controls="plan-content" aria-selected="${key===activePlan}" tabindex="${key===activePlan?0:-1}" data-plan="${key}">${esc(plan.label)}</button>`).join('')}</div><div id="plan-content" role="tabpanel" aria-labelledby="plan-${activePlan}"><ol class="timeline">${d.plans[activePlan].stops.map(renderStop).join('')}</ol></div>`:`<ol class="timeline">${d.stops.map(renderStop).join('')}</ol>`}<aside class="stay-strip"><span aria-hidden="true">⌂</span><div><span class="small-label">${h?'今晚住宿':'旅程終點'}</span><strong>${h?esc(h.name):'返回高雄'}</strong><p>${h?esc(d.hotelNote??(activeDay===1?'阿蘇連住第 1 晚':h.room)):'本日無住宿'}</p></div>${h?external(mapUrl(h.query??h.name),'住宿地圖','stay-map'):''}</aside><aside class="day-note"><strong>當日提醒</strong><br>${esc(d.note)}</aside>${(d.details??[]).map(renderDetail).join('')}</div>`;
 panel.querySelectorAll('.plan-tab').forEach(button=>{
  button.addEventListener('click',()=>{activePlan=button.dataset.plan;save('plan',activePlan);renderDay();$('#plan-'+activePlan).focus({preventScroll:true})});
  button.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();activePlan=e.key==='Home'?'A':e.key==='End'?'B':activePlan==='A'?'B':'A';save('plan',activePlan);renderDay();$('#plan-'+activePlan).focus({preventScroll:true})}})
 });
}
function selectDay(index,focus=false){if(index<0||index>=days.length)return;activeDay=index;renderDay();if(focus)$('#tab-day-'+activeDay).focus({preventScroll:true})}
$('.day-tabs').innerHTML=days.map((d,i)=>`<button id="tab-day-${i}" class="day-tab" type="button" role="tab" aria-controls="day-panel" aria-selected="${i===0}" tabindex="${i===0?0:-1}" data-day="${i}"><span class="tab-day">DAY ${i+1}</span><span class="tab-place">${esc(d.short)}</span><span class="tab-date">${esc(d.date.split('（')[0])}</span></button>`).join('');
document.querySelectorAll('.day-tab').forEach(button=>{
 button.addEventListener('click',()=>selectDay(Number(button.dataset.day)));
 button.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();selectDay(e.key==='Home'?0:e.key==='End'?days.length-1:(activeDay+(e.key==='ArrowRight'?1:-1)+days.length)%days.length,true)}})
});
$('#prev-day').addEventListener('click',()=>selectDay(activeDay-1));$('#next-day').addEventListener('click',()=>selectDay(activeDay+1));
let startTouch=null;
$('#day-panel').addEventListener('touchstart',e=>{if(e.touches.length!==1||e.target.closest('a,button,input,textarea,summary')){startTouch=null;return}startTouch={x:e.touches[0].clientX,y:e.touches[0].clientY}}, {passive:true});
$('#day-panel').addEventListener('touchend',e=>{if(!startTouch)return;const dx=e.changedTouches[0].clientX-startTouch.x,dy=e.changedTouches[0].clientY-startTouch.y;startTouch=null;if(Math.abs(dx)>75&&Math.abs(dx)>Math.abs(dy)*1.6)selectDay(activeDay+(dx<0?1:-1))},{passive:true});
$('#day-panel').addEventListener('touchcancel',()=>{startTouch=null},{passive:true});
$('#hotel-list').innerHTML=hotels.map(h=>`<article class="hotel-card"><div class="hotel-top"><span class="small-label">${esc(h.date)}</span><span class="night">${esc(h.night)}</span></div><h3>${esc(h.name)}</h3><p>${esc(h.room)}</p><div class="hotel-bottom"><div><b>NT$${h.cost.toLocaleString('en-US')}</b><small>${h.night.includes('2')?'2 晚合計':'1 晚合計'}</small></div>${external(mapUrl(h.query??h.name),'住宿地圖 ↗','hotel-map')}</div></article>`).join('');
const rawChecks=readSaved('checks',{});
const checked=rawChecks&&typeof rawChecks==='object'&&!Array.isArray(rawChecks)?rawChecks:{};
$('#checklist-items').innerHTML=checklist.map((group,gi)=>`<div class="check-group"><h3>${esc(group.name)}</h3>${group.items.map((item,ii)=>{const key=`${gi}-${ii}`;return `<label class="check-item"><input type="checkbox" data-check="${key}"${checked[key]===true?' checked':''}><span>${esc(item)}</span></label>`}).join('')}</div>`).join('');
function updateProgress(){const boxes=[...document.querySelectorAll('[data-check]')],done=boxes.filter(b=>b.checked).length;$('#check-counter').textContent=done+' / '+boxes.length;const percent=Math.round(done/boxes.length*100);$('#check-progress').style.width=percent+'%';$('.progress-track').setAttribute('aria-valuenow',String(percent))}
document.querySelectorAll('[data-check]').forEach(box=>box.addEventListener('change',()=>{checked[box.dataset.check]=box.checked;save('checks',checked);updateProgress()}));
const savedNotes=readSaved('notes','');$('#trip-notes').value=typeof savedNotes==='string'?savedNotes:'';
$('#trip-notes').addEventListener('input',()=>{const ok=save('notes',$('#trip-notes').value);$('#notes-status').textContent=ok?'已儲存到目前瀏覽器。':'目前只能暫存於這個頁面，關閉前請自行備份。'});
renderDay();updateProgress();
