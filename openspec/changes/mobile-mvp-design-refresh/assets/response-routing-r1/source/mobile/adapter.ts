import { readReply, saveReply } from '@rsvp/model/replies';
import type { Answer, ReplyContext } from '@rsvp/model/types';

// Адаптер только макетов: ждёт подтверждение исходной fixture, не вызывает API.
const labels: Record<string, Answer> = {'Приду':'going','Возможно':'maybe','Не смогу':'not_going'};
let armed: {answer:Answer;context:ReplyContext}|null=null;
let leaving=false;
const context = ():ReplyContext => {
  const selected=document.querySelector('main h2');
  const title=selected?.textContent?.trim() || document.querySelector('h1')?.textContent?.trim() || 'Ужин в пятницу';
  return {id:'chat-dinner',title};
};
const destination = (surface:string) => new URL(`../${surface}/frame.html`,location.href);
const navigate = (surface:string,confirmed=false) => {
  if(leaving){return;}
  leaving=true;
  const viewer=new URLSearchParams(location.search).get('viewer');
  if(viewer==='live' && parent!==window){
    const url=new URL(parent.location.href);
    url.search='?surface='+surface+(confirmed?'&response=confirmed':'');
    parent.location.replace(url.href);
  } else { const url=destination(surface);if(confirmed){url.searchParams.set('response','confirmed');}location.replace(url.href); }
};
const complete=(answer:Answer,meta:ReplyContext)=>{
  if(leaving){return;}
  saveReply(answer,meta);
  armed=null;
  navigate(answer==='going'?'chat':answer==='maybe'?'invitations':'declined',true);
};
document.addEventListener('click',event=>{
  const target=event.target;
  if(!(target instanceof Element)){return;}
  const button=target.closest<HTMLButtonElement>('button');
  const label=button?.textContent?.trim() ?? '';
  const answer=labels[label];
  if(answer && button && !button.disabled){
    const siblings=[...button.parentElement!.querySelectorAll('button')].map(item=>item.textContent?.trim() ?? '');
    if(Object.keys(labels).every(item=>siblings.includes(item))){armed={answer,context:context()};}
  }
  const link=target.closest<HTMLAnchorElement>('a');
  if(!link){return;}
  const text=link.textContent?.trim();
  if(text==='К приглашениям'){event.preventDefault();event.stopPropagation();navigate('invitations');}
  if(['К моим встречам','Мои встречи'].includes(text ?? '')){event.preventDefault();event.stopPropagation();navigate('list');}
},true);
window.addEventListener('preview-answer',event=>{
  const detail=(event as CustomEvent<{id:string;answer:Answer}>).detail;
  if(armed && detail?.answer===armed.answer){complete(detail.answer,{...armed.context,id:detail.id});}
});
const addSystemEvents=()=>{
  const sample=document.querySelector<HTMLElement>('[data-testid="system-event"]');
  if(!sample || sample.parentElement?.querySelector('[data-rsvp-system]')){return;}
  const reply=readReply('chat-dinner');
  const examples=new URLSearchParams(location.search).get('state')==='responses';
  const texts=examples?['Миша ответил «Приду»','Саша ответил «Возможно»','Дима ответил «Не смогу»']:reply?.answer==='going' && (new URLSearchParams(location.search).get('response')==='confirmed')?['Миша ответил «Приду»']:[];
  texts.forEach((text,index)=>{
    const row=sample.cloneNode(true) as HTMLElement;
    row.dataset.rsvpSystem='true';
    const time=row.querySelector('time');
    const copy=row.querySelector('p');
    if(time){time.dateTime=`2026-11-04T06:${18+index}:00Z`;time.textContent=`09:${18+index}`;}
    if(copy){copy.textContent=text;}
    sample.parentElement?.append(row);
  });
  if(texts.length){requestAnimationFrame(()=>sample.parentElement?.querySelector('[data-rsvp-system]:last-child')?.scrollIntoView({block:'end'}));}
};
const inspect=()=>{
  addSystemEvents();
  if(leaving){return;}
  const root=document.querySelector('[data-invitation-preview]');
  if(armed){
    const label=Object.keys(labels).find(item=>labels[item]===armed?.answer);
    const statuses=[...document.querySelectorAll('[role="status"]')];
    if(statuses.some(item=>item.textContent?.includes(`Вы ответили «${label}»`))){complete(armed.answer,armed.context);return;}
  }
  // Ранее принятый участник и организатор не получают промежуточную кнопку.
  if(root && [...root.querySelectorAll('a')].some(item=>item.textContent?.trim()==='Открыть встречу')){navigate('chat');}
};
new MutationObserver(inspect).observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['disabled','aria-pressed']});
inspect();
