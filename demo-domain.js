export const participants = [{id:'person1',name:'Участница 1'},{id:'person2',name:'Участница 2'},{id:'person3',name:'Участница 3'}];
export const activities = ['йога','стрейчинг','пилатес','бег','велосипед','бассейн','силовая/зал','табата','степ','другое'];
export const START='2026-11-09';
export const addDays=(date,n)=>new Date(Date.parse(date+'T00:00:00Z')+n*86400000).toISOString().slice(0,10);
export function today(now=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Yekaterinburg',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);}
export function monday(date){const day=new Date(date+'T00:00:00Z').getUTCDay();return addDays(date,-((day+6)%7));}
export const yearOf=week=>Number(addDays(week,6).slice(0,4));
export function validate(input,date){
 if(!participants.some(p=>p.id===input.participant_id)) throw Error('Выбери участницу');
 if(!activities.includes(input.activity_type)) throw Error('Выбери активность');
 if(typeof input.activity_date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(input.activity_date)||Number.isNaN(Date.parse(input.activity_date))||new Date(input.activity_date).toISOString().slice(0,10)!==input.activity_date||input.activity_date<START||input.activity_date<monday(date)||input.activity_date>date) throw Error('Можно отмечать только прошедшие дни текущей недели и сегодня по Тюмени');
 const custom=String(input.custom_activity??'').trim(),comment=String(input.comment??'').trim();
 if(input.activity_type==='другое'&&(!custom||custom.length>60)) throw Error('Укажи активность: до 60 символов');
 if(comment.length>300) throw Error('Комментарий: до 300 символов');
 return {participant_id:input.participant_id,activity_type:input.activity_type,custom_activity:input.activity_type==='другое'?custom:'',activity_date:input.activity_date,comment};
}
export function summarize(workouts,date){
 const current=monday(date),weeks=[];
 for(let w=START;w<=current;w=addDays(w,7)){
 const closed=w<current;
 weeks.push({start:w,end:addDays(w,6),year:yearOf(w),closed,people:participants.map(p=>{const count=workouts.filter(x=>x.participant_id===p.id&&x.activity_date>=w&&x.activity_date<=addDays(w,6)).length;return {id:p.id,count,success:closed&&count>=2,fine:closed?(count<2?100:0):null};})});
 }
 const years=[...new Set(weeks.map(w=>w.year))].reverse();
 return {today:date,current,year:yearOf(current),years,weeks,participants,workouts};
}
