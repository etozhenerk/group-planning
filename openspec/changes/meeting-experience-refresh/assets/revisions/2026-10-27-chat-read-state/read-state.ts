import { createState } from "@prototype/pages/chat/model/model";
import { renderShell } from "@prototype/pages/chat/ui/conversation";
import { icon } from "@prototype/shared/lib/dom";
import { installReadContext } from "./read-context";

const mode = new URLSearchParams(location.search).get("state") ?? "chat";
const app = document.querySelector<HTMLElement>("#app")!;
app.innerHTML = renderShell(createState());
const conversation = document.querySelector<HTMLElement>("#conversation")!;
const list = document.querySelector<HTMLElement>("#message-list")!;
const own = document.querySelector<HTMLElement>(".message.own .message-main")!;
const opener = document.createElement("button");
opener.type = "button";opener.className = "read-receipt";
opener.textContent = "Прочитали 2";opener.setAttribute("aria-haspopup", "dialog");own.append(opener);
if (mode === 'context-zero') opener.hidden = true;
let returnTarget: HTMLElement = opener;
const divider = document.createElement("div");divider.className = "unread-divider";divider.textContent = "Непрочитанные";
list.querySelectorAll(".message")[2]?.before(divider);
const overlay = document.querySelector<HTMLElement>("#sheet-overlay")!;
const sheet = document.querySelector<HTMLElement>("#sheet")!;
const shell = document.querySelector<HTMLElement>("#chat-surface")!;
overlay.classList.add("reader-state");
let closing: ReturnType<typeof setTimeout> | undefined;
const people = '<div class="people-list"><div class="person-row"><span class="avatar lilac" aria-hidden="true">Л</span><div><strong>Лена</strong></div></div><div class="person-row"><span class="avatar mint" aria-hidden="true">Т</span><div><strong>Тимофей</strong></div></div></div>';
const loading = '<div role="status" aria-label="Загружаем список">'+Array.from({length:3},()=>'<div class="person-row" aria-hidden="true"><span class="avatar reader-skeleton-avatar"></span><div class="reader-skeleton"></div></div>').join("")+'</div>';
const close = () => {
  overlay.dataset.phase = "closing";sheet.inert = true;
  closing = setTimeout(() => { overlay.hidden=true;sheet.inert=false;shell.inert=false;returnTarget.focus({preventScroll:true}); },matchMedia('(prefers-reduced-motion:reduce)').matches?0:150);
};
const open = (state = "readers") => {
  clearTimeout(closing);sheet.inert=false;shell.inert=true;overlay.hidden=false;overlay.dataset.phase="open";
  const body = state === "loading" ? loading : state === "empty" ? '<p class="reader-empty">Пока никто не прочитал</p>' : state === "error" ? '<div class="reader-error" role="alert"><p>Не удалось загрузить список</p><button type="button" class="small-action" data-retry>Повторить</button></div>' : people;
  sheet.innerHTML = `<div class="sheet-grab-area"><div class="sheet-handle" aria-hidden="true"></div><header class="sheet-header"><h1 id="sheet-title">Прочитали</h1><button class="icon-button" type="button" data-close aria-label="Закрыть">${icon("close")}</button></header></div><div class="sheet-scroll">${body}</div>`;
  sheet.querySelector('[data-close]')?.addEventListener('click',close);
  sheet.querySelector('[data-retry]')?.addEventListener('click',()=>open());
  sheet.focus({preventScroll:true});
};
opener.addEventListener('click',()=>{returnTarget=opener;open();});
overlay.querySelector('.sheet-backdrop')?.addEventListener('click',close);
document.addEventListener('keydown',event=> { if(event.key==='Escape'&&!overlay.hidden)close(); });
let dragStart=0;
sheet.addEventListener('pointerdown',event=> {if((event.target as HTMLElement).closest('.sheet-grab-area'))dragStart=event.clientY;});
sheet.addEventListener('pointerup',event=> {if(dragStart&&event.clientY-dragStart>60)close();dragStart=0;});
if (['readers','loading','empty','error'].includes(mode))open(mode);
if(mode==='history-loading'||mode==='history-error') {
 const history=document.createElement('div');history.className='history-state';history.innerHTML=mode==='history-loading'?'<div class="reader-skeleton" role="status" aria-label="Загружаем сообщения"></div><div class="reader-skeleton" aria-hidden="true"></div>':'<p role="alert">Не удалось загрузить сообщения</p><button class="small-action" type="button">Повторить</button>';list.prepend(history);history.querySelector('button')?.addEventListener('click',()=>history.remove());
}
if(mode==='list') { conversation.classList.add('list-preview');list.innerHTML='<button class="meeting-unread" type="button"><span class="meeting-summary"><strong>Вечер без планов</strong><small>Суббота, 31 октября · 4 участника</small></span><span class="unread-badge" aria-label="3 непрочитанных сообщения">3</span></button>';document.querySelector<HTMLElement>('#input-area')!.hidden=true;list.querySelector('button')?.addEventListener('click',()=>location.search=''); }
else { const jump=document.createElement('button');jump.type='button';jump.className='new-message-link';jump.textContent='3 новых сообщения';shell.append(jump);jump.addEventListener('click',()=>{conversation.scrollTop=conversation.scrollHeight;jump.hidden=true;}); }
document.querySelector('form')?.addEventListener('submit',event=>event.preventDefault());
installReadContext(target => { returnTarget = target;open(mode === 'context-zero' ? 'empty' : 'readers'); }, mode === 'context-zero');
