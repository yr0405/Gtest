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

const rawVisits=readSaved('visits',{});
const visits=rawVisits&&typeof rawVisits==='object'&&!Array.isArray(rawVisits)?rawVisits:{};
function visitKey(title){return days[activeDay].date+'|'+(days[activeDay].plans?activePlan:'main')+'|'+title}
function stopArt(title){
 const icon=/溫泉|泡湯|四季彩/.test(title)?'onsen':/峽|划船/.test(title)?'boat':/山|米塚|草千里|大觀峰|狭霧台/.test(title)?'mountain':/神社|城|庭園|水前寺/.test(title)?'castle':/商店|百貨|街道|花卉村/.test(title)?'city':null;
 return icon?'<svg class="stop-art" viewBox="0 0 96 96" aria-hidden="true"><use href="assets/journey-icons.svg#'+icon+'"/></svg>':'';
}

function renderStop(s){const [time,title,desc,query,tag,extra]=s,transport=transportForStop(title),mustGo=tag==='重點'||title==='熊本熊部長辦公室・鶴屋百貨',label=mustGo?'必去':tag,jump=extra?.jump?`<a class="map-link" href="#${esc(extra.jump)}" data-jump-detail="${esc(extra.jump)}">${esc(extra.jumpLabel??'查看詳情 ↓')}</a>`:'',direct=extra?.url?external(extra.url,extra.urlLabel??'開啟地圖'):'',links=[query?mapLink(query):'',direct,jump].filter(Boolean).join('');return `<li class="stop${tag==='彈性'?' flexible':''}"><div class="stop-time">${esc(time)}</div><div class="stop-content"><h4>${esc(title)}${label?`<span class="pill${tag==='彈性'?' flex':''}${mustGo?' must-go':''}">${mustGo?'<span aria-hidden="true">☆&nbsp;</span>':''}${esc(label)}</span>`:''}</h4>${transport?`<div class="stop-meta"><span class="transport-tag ${transport[1]}">${esc(transport[0])}</span></div>`:''}<p>${esc(desc)}</p>${links?`<div class="links">${links}</div>`:''}<label class="visit-check"><input type="checkbox" data-visit="${esc(visitKey(title))}"${visits[visitKey(title)]===true?' checked':''}><span>已完成／已到訪</span></label></div></li>`}
function renderDetail(d){return `<details class="detail-box"${d.id?` id="${esc(d.id)}"`:''}><summary>${esc(d.title)}</summary><p>${esc(d.text)}</p>${d.rows?`<div class="table-wrap detail-table"><table><caption class="sr-only">${esc(d.title)}</caption><thead><tr>${d.rows[0].map(cell=>`<th scope="col">${esc(cell)}</th>`).join('')}</tr></thead><tbody>${d.rows.slice(1).map(row=>`<tr>${row.map(cell=>`<td>${esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`:''}${d.links?`<div class="links">${d.links.map(([name,q])=>mapLink(q,name)).join('')}</div>`:''}${d.url?`<div class="links">${external(d.url,d.urlLabel)}</div>`:''}</details>`}
function renderDay(){
 const d=days[activeDay];
 document.querySelectorAll('.day-tab').forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===activeDay));tab.tabIndex=i===activeDay?0:-1});
 $('#day-counter').textContent=String(activeDay+1).padStart(2,'0')+' / 06';
 $('#prev-day').disabled=activeDay===0;$('#next-day').disabled=activeDay===days.length-1;
 const panel=$('#day-panel');panel.setAttribute('aria-labelledby','tab-day-'+activeDay);panel.dataset.day=String(activeDay);
 const h=d.hotel!==null?hotels[d.hotel]:null;
 panel.innerHTML=`<header class="day-header"><span class="day-number" aria-hidden="true">${String(activeDay+1).padStart(2,'0')}</span><div><span class="small-label">DAY ${String(activeDay+1).padStart(2,'0')} · ${esc(d.date)}</span><h3>${esc(d.title)}</h3><p>${esc(d.subtitle)}</p></div><svg class="day-art" viewBox="0 0 96 96" aria-hidden="true"><use href="assets/journey-icons.svg#${['castle','mountain','boat','onsen','city','suitcase'][activeDay]}"/></svg></header><div class="day-body"><p class="day-summary">${esc(d.summary)}</p>${d.plans?`<div class="plan-tabs" role="tablist" aria-label="高千穗當日方案">${Object.entries(d.plans).map(([key,plan])=>`<button id="plan-${key}" class="plan-tab" role="tab" aria-controls="plan-content" aria-selected="${key===activePlan}" tabindex="${key===activePlan?0:-1}" data-plan="${key}">${esc(plan.label)}</button>`).join('')}</div><div id="plan-content" role="tabpanel" aria-labelledby="plan-${activePlan}"><ol class="timeline">${d.plans[activePlan].stops.map(renderStop).join('')}</ol></div>`:`<ol class="timeline">${d.stops.map(renderStop).join('')}</ol>`}<aside class="stay-strip"><span aria-hidden="true">⌂</span><div><span class="small-label">${h?'今晚住宿':'旅程終點'}</span><strong>${h?esc(h.name):'返回高雄'}</strong><p>${h?esc(d.hotelNote??(activeDay===1?'阿蘇連住第 1 晚':h.room)):'本日無住宿'}</p></div>${h?external(mapUrl(h.query??h.name),'住宿地圖','stay-map'):''}</aside><aside class="day-note"><strong>當日提醒</strong><br>${esc(d.note)}</aside>${(d.details??[]).map(renderDetail).join('')}</div>`;
 panel.querySelectorAll('[data-visit]').forEach(box=>box.addEventListener('change',()=>{visits[box.dataset.visit]=box.checked;save('visits',visits)}));
 panel.querySelectorAll('[data-jump-detail]').forEach(link=>link.addEventListener('click',()=>{const target=panel.querySelector('#'+CSS.escape(link.dataset.jumpDetail));if(target)target.open=true}));
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
$('#hotel-list').innerHTML=hotels.map(h=>`<article class="hotel-card"><div class="hotel-top"><span class="small-label">${esc(h.date)}</span><span class="night">${esc(h.night)}</span></div><h3>${esc(h.name)}</h3><p class="hotel-address">${esc(h.address)}</p><p class="small-label">${esc(h.englishName)}</p><p>訂房平台：${esc(h.platform)}</p><p>${esc(h.room)}</p><div class="hotel-bottom"><div><b>費用請登入查看</b><small>私人費用頁</small></div>${external(mapUrl(h.query??h.name),'住宿地圖 ↗','hotel-map')}</div></article>`).join('');
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
 navLinks.forEach(link=>{const href=link.getAttribute('href');if(!href||!href.startsWith('#'))return;const target=document.querySelector(href);if(target)observer.observe(target)});
 observer.observe($('#home'));
}

const travelPhrases=[["飯店","我有訂房。","予約しています。","I have a reservation."],["飯店","我們是四位成人，訂了兩間房。","大人4名で、2部屋予約しています。","We booked two rooms for four adults."],["飯店","可以先寄放行李嗎？","チェックイン前に荷物を預けてもいいですか。","May we leave our luggage before check-in?"],["飯店","我們不加購早餐。請確認不會另外收費。","朝食の追加は希望しません。追加料金がかからないか確認をお願いします。","We do not want to add breakfast. Please confirm there is no extra charge."],["餐廳","四位，請問有位子嗎？","4人ですが、席は空いていますか。","Do you have a table for four?"],["餐廳","請問大約要等多久？","待ち時間はどのくらいですか。","How long is the wait?"],["餐廳","請給我們這個。","これをお願いします。","We would like this, please."],["餐廳","麻煩結帳。可以刷卡嗎？","お会計をお願いします。クレジットカードは使えますか。","The bill, please. Do you accept credit cards?"],["租車","我要領取預約的租車。","予約した車を受け取りに来ました。","I am here to pick up my reserved rental car."],["租車","我要還車，已經加滿油。","車を返却します。ガソリンは満タンにしました。","I am returning the car. I have filled the tank."],["租車","請問這台車要加哪一種油？","この車はどの種類の燃料を入れればいいですか。","What type of fuel does this car need?"],["租車","請問停車場在哪裡？","駐車場はどこですか。","Where is the parking lot?"],["購物","請問有其他尺寸嗎？","ほかのサイズはありますか。","Do you have another size?"],["購物","請問有庫存嗎？","在庫はありますか。","Is this in stock?"],["購物","請問可以免稅嗎？","免税で買えますか。","Can I buy this tax-free?"],["景點交通","請問洗手間在哪裡？","トイレはどこですか。","Where is the restroom?"],["景點交通","我們有預約划船，請問在哪裡報到？","ボートを予約しています。受付はどこですか。","We have a boat reservation. Where do we check in?"],["景點交通","想買四位成人的小火車車票。","トロッコ列車の大人4人分のチケットを買いたいです。","We would like four adult tickets for the sightseeing train."],["景點交通","請問這班車會到熊本站嗎？","このバス・電車は熊本駅に行きますか。","Does this bus or train go to Kumamoto Station?"],["景點交通","請說慢一點，謝謝。","もう少しゆっくり話していただけますか。","Could you speak a little more slowly, please?"]];

const phraseCategories=['全部',...new Set(travelPhrases.map(p=>p[0]))];
$('#phrase-filters').innerHTML=phraseCategories.map((category,i)=>'<button type="button" class="phrase-filter" aria-pressed="'+(i===0)+'" data-category="'+esc(category)+'">'+esc(category)+'</button>').join('');
function renderPhrases(category='全部'){
 $('#phrase-list').innerHTML=travelPhrases.map((p,i)=>({p,i})).filter(({p})=>category==='全部'||p[0]===category).map(({p,i})=>'<button type="button" class="phrase-card" data-phrase="'+i+'"><span class="small-label">'+esc(p[0])+'</span><strong>'+esc(p[1])+'</strong><span lang="ja">'+esc(p[2])+'</span><span lang="en">'+esc(p[3])+'</span><small>點開放大，給對方看 ↗</small></button>').join('');
 $('#phrase-list').querySelectorAll('[data-phrase]').forEach(button=>button.addEventListener('click',()=>{
  const p=travelPhrases[Number(button.dataset.phrase)];
  $('#phrase-dialog-title').textContent=p[1];$('#phrase-dialog-ja').textContent=p[2];$('#phrase-dialog-en').textContent=p[3];$('#phrase-dialog').showModal();
 }));
}
$('#phrase-filters').querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>{renderPhrases(button.dataset.category);$('#phrase-filters').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)))}));
$('#phrase-close').addEventListener('click',()=>$('#phrase-dialog').close());
renderPhrases();

const mapSlides=document.querySelector('#map-slides');if(mapSlides){const mapTabs=[...document.querySelectorAll('[data-map-tab]')];mapTabs.forEach((b,i)=>b.addEventListener('click',()=>mapSlides.scrollTo({left:mapSlides.children[i].offsetLeft-mapSlides.children[0].offsetLeft,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})));mapSlides.addEventListener('scroll',()=>{const i=Math.max(0,Math.min(6,Math.round(mapSlides.scrollLeft/(mapSlides.clientWidth+16))));mapTabs.forEach((b,n)=>b.setAttribute('aria-pressed',String(n===i)));document.querySelector('#map-count').textContent=(i+1)+' / 7｜'+(i?'Day '+i:'總覽')+'；點圖片可看大圖'});mapSlides.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();const i=Math.round(mapSlides.scrollLeft/(mapSlides.clientWidth+16));mapTabs[Math.max(0,Math.min(6,i+(e.key==='ArrowRight'?1:-1)))].click()}})}
