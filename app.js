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
function transportForStop(title){
 if(/高雄小港機場出發|抵達熊本機場|華航|搭機|福岡機場.*高雄/.test(title))return ['航班','flight'];
 if(/機場巴士/.test(title))return ['機場巴士','bus'];
 if(/電停/.test(title))return ['市電','train'];
 if(title==='前往水前寺成趣園')return ['市電備案','train'];
 if(/小火車|あまてらす鐵道/.test(title))return ['小火車','train'];
 if(/峽.*划船/.test(title))return ['划船・步行','boat'];
 if(/取車|還車|Fairfield 出發|回 Fairfield|返回阿蘇|離開高千穗/.test(title))return ['自駕','car'];
 if(/上通|下通|溫泉街|湯之坪|峽步道|市區散步/.test(title))return ['步行','walk'];
 return null;
}
function renderStop(s){const [time,title,desc,query,tag]=s,transport=transportForStop(title),mustGo=tag==='重點'||title==='熊本熊部長辦公室・鶴屋百貨',label=mustGo?'必去':tag;return `<li class="stop${tag==='彈性'?' flexible':''}"><div class="stop-time">${esc(time)}</div><div class="stop-content"><h4>${esc(title)}${label?`<span class="pill${tag==='彈性'?' flex':''}${mustGo?' must-go':''}">${mustGo?'<span aria-hidden="true">☆&nbsp;</span>':''}${esc(label)}</span>`:''}</h4>${transport?`<div class="stop-meta"><span class="transport-tag ${transport[1]}">${esc(transport[0])}</span></div>`:''}<p>${esc(desc)}</p>${query?`<div class="links">${mapLink(query)}</div>`:''}</div></li>`}
function renderDetail(d){return `<details class="detail-box"><summary>${esc(d.title)}</summary><p>${esc(d.text)}</p>${d.rows?`<div class="table-wrap detail-table"><table><caption class="sr-only">${esc(d.title)}</caption><thead><tr>${d.rows[0].map(cell=>`<th scope="col">${esc(cell)}</th>`).join('')}</tr></thead><tbody>${d.rows.slice(1).map(row=>`<tr>${row.map(cell=>`<td>${esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`:''}${d.links?`<div class="links">${d.links.map(([name,q])=>mapLink(q,name)).join('')}</div>`:''}${d.url?`<div class="links">${external(d.url,d.urlLabel)}</div>`:''}</details>`}
function renderDay(){
 const d=days[activeDay];
 document.querySelectorAll('.day-tab').forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===activeDay));tab.tabIndex=i===activeDay?0:-1});
 $('#day-counter').textContent=String(activeDay+1).padStart(2,'0')+' / 06';
 $('#prev-day').disabled=activeDay===0;$('#next-day').disabled=activeDay===days.length-1;
 const panel=$('#day-panel');panel.setAttribute('aria-labelledby','tab-day-'+activeDay);panel.dataset.day=String(activeDay);
 const h=d.hotel!==null?hotels[d.hotel]:null;
 panel.innerHTML=`<header class="day-header"><span class="day-number" aria-hidden="true">${String(activeDay+1).padStart(2,'0')}</span><div><span class="small-label">DAY ${String(activeDay+1).padStart(2,'0')} · ${esc(d.date)}</span><h3>${esc(d.title)}</h3><p>${esc(d.subtitle)}</p></div><svg class="day-art" viewBox="0 0 96 96" aria-hidden="true"><use href="assets/journey-icons.svg#${['castle','mountain','boat','onsen','city','suitcase'][activeDay]}"/></svg></header><div class="day-body"><p class="day-summary">${esc(d.summary)}</p>${d.plans?`<div class="plan-tabs" role="tablist" aria-label="高千穗當日方案">${Object.entries(d.plans).map(([key,plan])=>`<button id="plan-${key}" class="plan-tab" role="tab" aria-controls="plan-content" aria-selected="${key===activePlan}" tabindex="${key===activePlan?0:-1}" data-plan="${key}">${esc(plan.label)}</button>`).join('')}</div><div id="plan-content" role="tabpanel" aria-labelledby="plan-${activePlan}"><ol class="timeline">${d.plans[activePlan].stops.map(renderStop).join('')}</ol></div>`:`<ol class="timeline">${d.stops.map(renderStop).join('')}</ol>`}<aside class="stay-strip"><span aria-hidden="true">⌂</span><div><span class="small-label">${h?'今晚住宿':'旅程終點'}</span><strong>${h?esc(h.name):'返回高雄'}</strong><p>${h?esc(d.hotelNote??(activeDay===1?'阿蘇連住第 1 晚':h.room)):'本日無住宿'}</p></div>${h?external(mapUrl(h.query??h.name),'住宿地圖','stay-map'):''}</aside><aside class="day-note"><strong>當日提醒</strong><br>${esc(d.note)}</aside>${(d.details??[]).map(renderDetail).join('')}</div>`;
 panel.querySelectorAll('.plan-tab').forEach(button=>{
  button.addEventListener('click',()=>{activePlan=button.dataset.plan;save('plan',activePlan);renderDay();$('#plan-'+activePlan).focus({preventScroll:true})});
  button.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();activePlan=e.key==='Home'?'A':e.key==='End'?'B':activePlan==='A'?'B':'A';save('plan',activePlan);renderDay();$('#plan-'+activePlan).focus({preventScroll:true})}})
 });
}
function selectDay(index,focus=false){if(index<0||index>=days.length)return;activeDay=index;renderDay();const panel=$('#day-panel');panel.classList.remove('chapter-pop');void panel.offsetWidth;panel.classList.add('chapter-pop');if(focus)$('#tab-day-'+activeDay).focus({preventScroll:true})}
$('.day-tabs').innerHTML=days.map((d,i)=>`<button id="tab-day-${i}" class="day-tab" type="button" role="tab" aria-controls="day-panel" aria-selected="${i===0}" tabindex="${i===0?0:-1}" data-day="${i}"><span class="tab-day">DAY ${i+1}</span><span class="tab-date">${esc(d.date.split('（')[0])} <small>（${esc(d.date.split('（')[1])}</small></span><span class="tab-place">${esc(d.short)}</span></button>`).join('');
document.querySelectorAll('.day-tab').forEach(button=>{
 button.addEventListener('click',()=>selectDay(Number(button.dataset.day)));
 button.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();selectDay(e.key==='Home'?0:e.key==='End'?days.length-1:(activeDay+(e.key==='ArrowRight'?1:-1)+days.length)%days.length,true)}})
});
$('#prev-day').addEventListener('click',()=>selectDay(activeDay-1));$('#next-day').addEventListener('click',()=>selectDay(activeDay+1));
let startTouch=null;
$('#day-panel').addEventListener('touchstart',e=>{if(e.touches.length!==1||e.target.closest('a,button,input,textarea,summary')){startTouch=null;return}startTouch={x:e.touches[0].clientX,y:e.touches[0].clientY}}, {passive:true});
$('#day-panel').addEventListener('touchend',e=>{if(!startTouch)return;const dx=e.changedTouches[0].clientX-startTouch.x,dy=e.changedTouches[0].clientY-startTouch.y;startTouch=null;if(Math.abs(dx)>75&&Math.abs(dx)>Math.abs(dy)*1.6)selectDay(activeDay+(dx<0?1:-1))},{passive:true});
$('#day-panel').addEventListener('touchcancel',()=>{startTouch=null},{passive:true});
$('#hotel-list').innerHTML=hotels.map(h=>`<article class="hotel-card"><div class="hotel-top"><span class="small-label">${esc(h.date)}</span><span class="night">${esc(h.night)}</span></div><h3>${esc(h.name)}</h3><p>${esc(h.room)}</p><div class="hotel-bottom"><div><b>${esc(h.costLabel??('NT$'+h.cost.toLocaleString('en-US')))}</b><small>${h.night.includes('2')?'2 晚合計':'1 晚合計'}</small></div>${external(mapUrl(h.query??h.name),'住宿地圖 ↗','hotel-map')}</div></article>`).join('');
const rawChecks=readSaved('checks',{});
const checked=rawChecks&&typeof rawChecks==='object'&&!Array.isArray(rawChecks)?rawChecks:{};
$('#checklist-items').innerHTML=checklist.map((group,gi)=>`<div class="check-group"><h3>${esc(group.name)}</h3>${group.items.map((item,ii)=>{const key=`${gi}-${ii}`;return `<label class="check-item"><input type="checkbox" data-check="${key}"${checked[key]===true?' checked':''}><span>${esc(item)}</span></label>`}).join('')}</div>`).join('');
function updateProgress(){const boxes=[...document.querySelectorAll('[data-check]')],done=boxes.filter(b=>b.checked).length;$('#check-counter').textContent=done+' / '+boxes.length;const percent=Math.round(done/boxes.length*100);$('#check-progress').style.width=percent+'%';$('.progress-track').setAttribute('aria-valuenow',String(percent))}
document.querySelectorAll('[data-check]').forEach(box=>box.addEventListener('change',()=>{checked[box.dataset.check]=box.checked;save('checks',checked);updateProgress()}));
const savedNotes=readSaved('notes','');$('#trip-notes').value=typeof savedNotes==='string'?savedNotes:'';
$('#trip-notes').addEventListener('input',()=>{const ok=save('notes',$('#trip-notes').value);$('#notes-status').textContent=ok?'已儲存到目前瀏覽器。':'目前只能暫存於這個頁面，關閉前請自行備份。'});
renderDay();updateProgress();


// Packing progress is independent from the existing trip checklist.
const savedPacking=readSaved('packing',{});
const packed=savedPacking&&typeof savedPacking==='object'&&!Array.isArray(savedPacking)?savedPacking:{};
$('#packing-items').innerHTML=packingGroups.map(group=>`<details class="check-group packing-group" data-packing-group="${esc(group.id)}"${['carry-tech','clothing'].includes(group.id)?' open':''}><summary><span>${esc(group.name)}</span><span class="packing-group-count" data-packing-count="${esc(group.id)}"></span></summary><div class="packing-group-items">${group.items.map((item,index)=>{const key=group.id+':'+index;return `<label class="check-item"><input type="checkbox" data-pack="${esc(key)}"${packed[key]===true?' checked':''}><span>${esc(item)}</span></label>`}).join('')}</div></details>`).join('');
function updatePackingProgress(){const boxes=[...document.querySelectorAll('[data-pack]')],done=boxes.filter(b=>b.checked).length,percent=boxes.length?Math.round(done/boxes.length*100):0;$('#packing-counter').textContent=done+' / '+boxes.length;$('#packing-progress').style.width=percent+'%';$('#packing-track').setAttribute('aria-valuenow',String(percent));packingGroups.forEach(group=>{const inputs=[...document.querySelectorAll('[data-packing-group="'+group.id+'"] [data-pack]')];document.querySelector('[data-packing-count="'+group.id+'"]').textContent=inputs.filter(i=>i.checked).length+' / '+inputs.length})}
document.querySelectorAll('[data-pack]').forEach(box=>box.addEventListener('change',()=>{packed[box.dataset.pack]=box.checked;save('packing',packed);updatePackingProgress()}));
updatePackingProgress();
const number=value=>value.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
function renderBudget(){const budget=travelBudget,fares=budget.airfares.reduce((sum,x)=>sum+x,0),sharedCents=budget.items.reduce((sum,x)=>sum+x.twdCents,0),totalCents=fares*100+sharedCents,baseShare=Math.floor(sharedCents/4),remainder=sharedCents%4;const originalTwd=fares+budget.items.filter(i=>i.currency==='NT$').reduce((n,i)=>n+i.amount,0),originalYen=budget.items.filter(i=>i.currency==='JPY ¥').reduce((n,i)=>n+i.amount,0);const original=i=>i.currency?esc(i.currency)+i.amount.toLocaleString('en-US'):'到店確認';$('#budget-content').innerHTML=`<div class="budget-summary"><div><span>基本費用台幣估算｜4人</span><strong><small>約 NT$</small>${number(totalCents/100)}</strong></div><div><span>平均每人估算</span><b>約 NT$${number(totalCents/400)}</b></div></div><p class="budget-original">原幣已列費用：<strong>NT$${originalTwd.toLocaleString('en-US')} ＋ ¥${originalYen.toLocaleString('en-US')}</strong>；到店入湯稅另列估值。</p><div class="table-wrap"><table><caption class="sr-only">四人旅行費用原幣與台幣估算</caption><thead><tr><th scope="col">項目</th><th scope="col">原幣金額</th><th scope="col">台幣金額／估值</th></tr></thead><tbody><tr><td>4人機票</td><td>NT$${fares.toLocaleString('en-US')}</td><td>NT$${number(fares)}</td></tr>${budget.items.map(item=>`<tr><td>${esc(item.name)}</td><td>${original(item)}</td><td>${item.estimate?'約 ':''}NT$${number(item.twdCents/100)}</td></tr>`).join('')}<tr class="budget-total"><td>合計</td><td>台幣估算</td><td>約 NT$${number(totalCents/100)}</td></tr></tbody></table></div><p class="muted">機票依10/19更正為17,117、17,117、16,876、16,958元，合計68,068元。湯布院與租車台幣欄沿用原對話提供的估值，未採即時匯率；到店入湯稅暫估203.24元。未含其他住宿稅、油資、通行費、停車、餐飲、景點及購物。</p><details class="detail-box"><summary>查看四人費用分攤</summary><div class="table-wrap"><table><caption class="sr-only">依機票原金額與共同費用均分的四人分攤估算</caption><thead><tr><th scope="col">旅客</th><th scope="col">機票</th><th scope="col">共同費用估算</th><th scope="col">合計估算</th></tr></thead><tbody>${budget.airfares.map((fare,index)=>{const share=baseShare+(index<remainder?1:0);return `<tr><td>旅客 ${index+1}</td><td>${number(fare)}</td><td>${number(share/100)}</td><td>${number(fare+share/100)}</td></tr>`}).join('')}</tbody></table></div><p class="muted">旅客編號沿用你提供機票的順序。住宿、租車及入湯稅估算共NT$${number(sharedCents/100)}，暫按4人均分並調整分錢尾數；實際分攤以最後帳單為準。</p></details>`;}
renderBudget();

// Count calendar days in Taiwan, independent of the visitor's device timezone.
function getDepartureState(now=new Date()){
 const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Taipei',year:'numeric',month:'numeric',day:'numeric'}).formatToParts(now);
 const value=type=>Number(parts.find(part=>part.type===type).value);
 const today=Date.UTC(value('year'),value('month')-1,value('day'));
 if(now>=new Date('2026-12-03T13:45:00+08:00'))return {status:'finished',days:0};
 if(now>=new Date('2026-11-28T07:30:00+08:00'))return {status:'travelling',days:0};
 return {status:'countdown',days:Math.max(0,Math.round((Date.UTC(2026,10,28)-today)/86400000))};
}
function updateDepartureCountdown(){
 const state=getDepartureState(),started=state.status!=='countdown';
 $('.countdown').classList.toggle('is-started',started);
 $('#countdown-label').innerHTML=started?'秋日旅程<small>2026.11.28 — 12.03</small>':'距離出發<small>2026.11.28</small>';
 $('#countdown-days').textContent=started?(state.status==='travelling'?'旅行中':'已收藏'):String(state.days);
 $('#countdown-unit').textContent=started?'':'天';
}
updateDepartureCountdown();
setInterval(updateDepartureCountdown,60000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)updateDepartureCountdown()});

// The current chapter remains clear in the fixed navigation.
if('IntersectionObserver' in window){
 const navLinks=[...document.querySelectorAll('.section-nav a')];
 const observer=new IntersectionObserver(entries=>{
  const visible=entries.filter(entry=>entry.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
  if(!visible)return;
  navLinks.forEach(link=>{if(link.getAttribute('href')==='#'+visible.target.id)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current')});
 },{rootMargin:'-15% 0px -55% 0px',threshold:0});
 navLinks.forEach(link=>{const target=document.querySelector(link.getAttribute('href'));if(target)observer.observe(target)});
}
