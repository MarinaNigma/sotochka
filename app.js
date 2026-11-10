import {summarize,today,monday,addDays,START} from './demo-domain.js';
const $=s=>document.querySelector(s);
const people=[{id:'person1',name:'Участница 1',city:''},{id:'person2',name:'Участница 2',city:''},{id:'person3',name:'Участница 3',city:''}];
const activities=['йога','стрейчинг','пилатес','бег','велосипед','бассейн','силовая/зал','табата','степ','другое'];
const phrases={person1:'Коврик расстелен. Мечтам тоже нужна разминка.',person2:'Гантельки сами себя не поднимут. Хотя при тебе уже пытаются.',person3:'Беговая дорожка или парк? Главное — в своём темпе.'};
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const avatar=(id,cls='mini-avatar')=>`<svg class="${cls}" viewBox="0 0 220 250" aria-hidden="true"><use href="./avatars.svg#${id}"/></svg>`;
const format=date=>new Date(date+'T12:00:00Z').toLocaleDateString('ru-RU',{day:'numeric',month:'long',timeZone:'UTC'});
const range=w=>`${format(w.start)} — ${format(w.end)}`;
const word=(n,forms)=>forms[n%100>=11&&n%100<=14?2:n%10===1?0:n%10>=2&&n%10<=4?1:2];
const training=n=>`${n} ${word(n,['тренировка','тренировки','тренировок'])}`;
const weeks=n=>`${n} ${word(n,['неделя','недели','недель'])}`;
const money=n=>n.toLocaleString('ru-RU')+' ₽';
let profile=null;try{profile=localStorage.getItem('sotochka-demo-profile');}catch{}
if(!people.some(p=>p.id===profile))profile=null;
let state,selectedYear,editing=null,deleting=null,requestKey=null,busy=false,toastTimer;
async function api(url,method='GET') {
 if(method!=='GET'||url!=='/api/state')throw Error('В демонстрации сохранение отключено');
 const date=today(), current=monday(date), rows=[];
 const add=(id,activity,day,index)=>rows.push({id:'demo-'+index,participant_id:id,activity_type:activity,custom_activity:'',activity_date:day,comment:'Демонстрационная запись',created_at:day+'T08:00:00Z',updated_at:day+'T08:00:00Z'});
 if(date>=START){add('person2','силовая/зал',date,1);add('person3','бег',date,2);add('person3','бассейн',current,3);}
 return summarize(rows,date);
}
function toast(message){$('#toast').textContent=message;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,5000);}
function renderProfile(){$('#profile-name').textContent=people.find(p=>p.id===profile)?.name||'';$('#switch').textContent=profile?'Сменить участницу':'Выбрать участницу';}
function choose(){if(!$('#choose-dialog').open)$('#choose-dialog').showModal();}
$('#choose-options').innerHTML=people.map(p=>`<button class="choose-btn" data-profile="${p.id}">${avatar(p.id,'')} ${p.name}<span>↗</span></button>`).join('');
$('#choose-options').addEventListener('click',e=>{const button=e.target.closest('[data-profile]');if(!button)return;profile=button.dataset.profile;try{localStorage.setItem('sotochka-demo-profile',profile);}catch{}$('#choose-dialog').close();renderProfile();if(state)renderCurrent();});
$('#choose-dialog').addEventListener('cancel',e=>{if(!profile)e.preventDefault();});
$('#switch').onclick=choose;
$('#activity').insertAdjacentHTML('beforeend',activities.map(x=>`<option>${x}</option>`).join(''));
$('#activity').onchange=()=>{const custom=$('#activity').value==='другое';$('#custom-wrap').hidden=!custom;$('#custom').required=custom;};
function renderCurrent(){
 const w=state.weeks.find(w=>w.start===state.current);
 $('#week-range').textContent=w?range(w):'Учёт начнётся 9 ноября 2026';
 $('#cards').innerHTML=people.map(p=>{const n=w?.people.find(x=>x.id===p.id).count||0;return `<article class="card ${p.id===profile?'selected':''}"><div class="card-top">${p.id===profile?'<span class="you">ЭТО ТЫ ↙</span>':''}${avatar(p.id,'card-avatar')}</div><div class="card-body"><div class="name-row"><h3>${p.name}</h3><span class="city">${p.city}</span></div><div class="count">${training(n)} <span class="optional">/ цель — 2</span></div><div class="progress" aria-label="Выполнено ${Math.min(n,2)} из 2"><span class="${n>=1?'done':''}"></span><span class="${n>=2?'done':''}"></span></div><div class="goal">${n>=2?'✓ Цель выполнена':`Пока не хватает ${2-n} ${n===1?'тренировки':'тренировок'}`}</div><p class="card-copy">${n===0?'Диван пока ведёт. Но неделя ещё идёт':n===1?'Одна есть. Ещё одна — и можно выдохнуть':'Две есть! Дальше — по любви'}</p>${p.id===profile?'<button class="button" data-add>Записать тренировку <span>＋</span></button>':''}</div></article>`;}).join('');
 const n=w?.people.find(x=>x.id===profile)?.count||0;
 $('#motivation').innerHTML=`<span aria-hidden="true">✳</span><p>${n>=2?'Две есть! Дальше — по любви':phrases[profile]||'Подруги верят в тебя. Кроссовки тоже ждут.'}<small>${n>=2?'Цель выполнена. Можно гордиться собой.':'В своём темпе. С поддержкой подруг.'}</small></p>`;
 $('#feed').innerHTML=feedHTML(state.current,false);
}
function feedHTML(start,editable){const items=state.workouts.filter(x=>x.activity_date>=start&&x.activity_date<=state.weeks.find(w=>w.start===start)?.end);if(!items.length)return '<div class="empty"><span class="empty-icon">〰</span>Пока тихо. Кто первой разбудит этот спортивный чат?</div>';
 return items.map(x=>{const p=people.find(p=>p.id===x.participant_id);return `<article class="feed-item">${avatar(p.id)}<div class="feed-content"><div class="feed-meta"><b>${p.name}</b><time datetime="${x.activity_date}">${format(x.activity_date)}</time></div><div class="activity-name">↗ ${esc(x.activity_type==='другое'?x.custom_activity:x.activity_type)}</div>${x.comment?`<p class="comment">${esc(x.comment)}</p>`:''}${editable&&p.id===profile?`<div class="feed-actions"><button data-edit="${x.id}">Изменить</button><button data-delete="${x.id}">Удалить</button></div>`:''}</div></article>`;}).join('');}
function renderYear(){
 const chosen=state.weeks.filter(w=>w.year===Number(selectedYear));
 const totals=people.map(p=>({...p,training:chosen.reduce((s,w)=>s+w.people.find(x=>x.id===p.id).count,0),success:chosen.filter(w=>w.people.find(x=>x.id===p.id).success).length,fine:chosen.reduce((s,w)=>s+(w.people.find(x=>x.id===p.id).fine||0),0)}));
 const ordered=[...totals].sort((a,b)=>b.success-a.success);let last=-1,rank=0;
 $('#ranking').innerHTML=ordered.map((p,i)=>{if(last!==p.success)rank=i+1;last=p.success;return `<div class="rank-row"><b><em>${rank.toString().padStart(2,'0')}</em>${p.name}</b><span>${weeks(p.success)}</span></div>`;}).join('');
 const best=ordered[0]?.success||0,leaders=ordered.filter(p=>p.success===best);
 $('#leader').textContent=!best?'Первое лидерство ещё впереди':leaders.length>1?'Лидерство делят: '+leaders.map(p=>p.name).join(', '):`${leaders[0].name} держит темп: ${weeks(best)} с выполненной целью`;
 $('#rank-year').textContent=selectedYear;
 $('#fines').innerHTML=totals.map(p=>`<div class="fine-row"><span>${p.name}</span><b>${money(p.fine)}</b></div>`).join('');
 const sum=totals.reduce((s,p)=>s+p.fine,0);$('#fine-total').textContent=money(sum);$('#fine-note').textContent=sum?'Начислено за завершённые недели. Следующая — новый старт.':'Пока без соточек. Красиво идём!';
 $('#year-status').textContent=chosen.every(w=>w.closed)?`Итог ${selectedYear} года`:'На данный момент';
 $('#year-totals').innerHTML=totals.map(p=>`<div class="year-total"><b>${p.name}</b>${training(p.training)}<br>${weeks(p.success)} с выполненной целью<br>${money(p.fine)} начислено</div>`).join('');
 $('#weeks').innerHTML=[...chosen].reverse().map(w=>`<tr><td><button class="week-link" data-week="${w.start}">${range(w)}</button>${!w.closed?'<small>● Идёт</small>':''}</td>${w.people.map(p=>`<td>${training(p.count)}<small>${w.closed?(p.success?'✓ Цель выполнена':'На доброе дело'):(p.count>=2?'✓ Цель выполнена':'Цель ещё впереди')}</small><small>${w.closed?money(p.fine):'Прогноз: '+money(p.count<2?100:0)}</small></td>`).join('')}</tr>`).join('');
 $('#history-empty').textContent=chosen.some(w=>w.closed)?'Нажми на неделю, чтобы посмотреть записи. Архив — только для просмотра.':'История появится после первой недели. Текущая неделя показана предварительно.';
 $('#archive-feed').replaceChildren();
}
async function load(){try{const fresh=await api('/api/state');state=fresh;$('#connection').hidden=true;if(!selectedYear||!state.years.includes(Number(selectedYear)))selectedYear=state.year;$('#year').innerHTML=state.years.map(y=>`<option ${y===Number(selectedYear)?'selected':''}>${y}</option>`).join('');renderCurrent();renderYear();return true;}catch{$('#connection').hidden=false;$('#connection').innerHTML='Не удалось загрузить данные. Проверь соединение. <button class="retry" id="retry">Повторить</button>';$('#retry').onclick=load;return false;}}
$('#year').onchange=()=>{selectedYear=Number($('#year').value);renderYear();};
function openForm(id=null){if(!state){toast('Сначала загрузим данные. Попробуй ещё раз.');return;}if(!profile){choose();return;}editing=id;requestKey=crypto.randomUUID();$('#workout-form').reset();$('#custom-wrap').hidden=true;$('#custom').required=false;$('#form-error').hidden=true;$('#form-profile').textContent=people.find(p=>p.id===profile).name;$('#form-title').textContent=id?'Исправим запись':'Ещё одна в копилку!';$('#date').min=state.current;$('#date').max=state.today;$('#date').value=state.today;if(id){const x=state.workouts.find(x=>x.id===id);$('#activity').value=x.activity_type;$('#custom').value=x.custom_activity;$('#date').value=x.activity_date;$('#comment').value=x.comment;$('#activity').onchange();}$('#save').disabled=true;$('#save').textContent='В демо сохранение отключено';$('#workout-dialog').showModal();}
$('#close-form').onclick=()=>{if(!busy)$('#workout-dialog').close();};
$('#workout-dialog').addEventListener('cancel',e=>{if(busy)e.preventDefault();});
document.addEventListener('click',e=>{const add=e.target.closest('[data-add]'),edit=e.target.closest('[data-edit]'),del=e.target.closest('[data-delete]'),week=e.target.closest('[data-week]');if(add)openForm();if(edit)openForm(edit.dataset.edit);if(del){deleting=del.dataset.delete;$('#delete-error').hidden=true;$('#delete-dialog').showModal();}if(week){const w=state.weeks.find(w=>w.start===week.dataset.week);$('#archive-feed').innerHTML=`<h3 class="archive-title">${range(w)} · просмотр</h3>${w.closed&&w.people.some(p=>p.fine)?'<p class="small">На этой неделе помогла доброму делу. Следующая — новый старт.</p>':''}`+feedHTML(w.start,false);}});
$('#workout-form').onsubmit=async e=>{e.preventDefault();if(busy)return;busy=true;$('#save').disabled=true;$('#close-form').disabled=true;$('#save').textContent='Сохраняем…';$('#form-error').hidden=true;try{await api('/api/workouts'+(editing?'/'+editing:''),editing?'PUT':'POST',{participant_id:profile,activity_type:$('#activity').value,custom_activity:$('#custom').value,activity_date:$('#date').value,comment:$('#comment').value,request_key:requestKey});$('#workout-dialog').close();toast('Записали! Подруги в курсе');await load();}catch(error){$('#form-error').textContent='Не удалось сохранить. Попробуй ещё раз. '+(error.name==='TimeoutError'?'Сервер не ответил вовремя.':error.message);$('#form-error').hidden=false;}finally{busy=false;$('#save').disabled=false;$('#close-form').disabled=false;$('#save').textContent='В зачёт! ↗';}};
$('#keep').onclick=()=>$('#delete-dialog').close();
$('#delete-dialog').addEventListener('cancel',e=>{if($('#delete').disabled)e.preventDefault();});
$('#delete').onclick=async()=>{$('#delete').disabled=true;$('#keep').disabled=true;try{await api('/api/workouts/'+deleting,'DELETE',{participant_id:profile});$('#delete-dialog').close();toast('Тренировка удалена');await load();}catch{$('#delete-error').textContent='Не удалось удалить. Попробуй ещё раз.';$('#delete-error').hidden=false;}finally{$('#delete').disabled=false;$('#keep').disabled=false;}};
renderProfile();if(!profile)choose();load();
// Refresh server time on return to the page, including after a week boundary.
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!busy)load();});
setInterval(()=>{if(!document.hidden&&!busy&&!$('#workout-dialog').open)load();},60000);
