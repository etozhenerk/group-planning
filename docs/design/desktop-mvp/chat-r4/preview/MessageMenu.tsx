import {useEffect,useLayoutEffect,useState} from 'react'
import type {RefObject} from 'react'
import {createPortal} from 'react-dom'
import {useFloating,offset,flip,shift,autoUpdate,FloatingFocusManager,useDismiss,useRole,useInteractions} from '@floating-ui/react'
import {ChatIcon} from '@/shared/ui/ChatIcon'
import {EmojiDock} from '@/shared/ui/EmojiDock'
import {Dialog} from '@/shared/ui/Dialog'
import {useChatModel} from '@preview/ChatContext'
import styles from '@preview/MessageMenu.module.css'
export type MessageMenuProps={open:boolean;change:(value:boolean)=>void;choose:(emoji:string)=>void;pending:boolean;anchor:RefObject<HTMLElement|null>;boundary:RefObject<HTMLElement|null>;context:string;selected:string[];readers?:()=>void;failed?:{retry:()=>void;restore:()=>void;restoreDisabled:boolean}}
export const MessageMenu=({open,change,choose,pending,anchor,selected,readers,context,failed}:MessageMenuProps)=>{
 const model=useChatModel(),[all,setAll]=useState(false)
 const floating=useFloating({open,onOpenChange:change,placement:'top-start',strategy:'fixed',middleware:[offset(10),flip({padding:12}),shift({padding:12})],whileElementsMounted:autoUpdate})
 const dismiss=useDismiss(floating.context,{enabled:!all}),role=useRole(floating.context,{role:'dialog'}),interactions=useInteractions([dismiss,role])
 useLayoutEffect(()=>{floating.refs.setReference(anchor.current)},[anchor,open])
 useEffect(()=>{if(!open){setAll(false)}},[open])
 if(!open){return null}
 const entry=model.entries.find(entry=>entry.text===context)
 const count=entry?.id==='own-1'?(model.scenario==='not-read'?'0':'3'):entry?.id==='own-unread'?'0':undefined
 return createPortal(<><button className={styles.backdrop} aria-label="Закрыть действия с сообщением" tabIndex={-1} onClick={()=>change(false)}/>{!all&&<FloatingFocusManager context={floating.context} modal initialFocus={-1} returnFocus={anchor}><div ref={floating.refs.setFloating} style={floating.floatingStyles} className={styles.menu} aria-label="Действия с сообщением" data-chat-overlay="reaction" {...interactions.getFloatingProps()}>{!failed&&<div className={styles.quick}>{['❤️','👍','😂','🔥','🎉'].map(emoji=><button key={emoji} type="button" aria-label={emoji} aria-pressed={selected.includes(emoji)} disabled={pending} onClick={()=>choose(emoji)}>{emoji}</button>)}<button className={styles.more} aria-label="Все эмодзи" onClick={()=>setAll(true)}><ChatIcon name="down" size={18}/></button></div>}{failed&&<div className={styles.failure}><button onClick={failed.retry}><ChatIcon name="send" size={18}/>Повторить отправку</button><button onClick={failed.restore} disabled={failed.restoreDisabled}><ChatIcon name="left" size={18}/>Вернуть текст в поле</button></div>}{!failed&&entry?.actor.id==='misha'&&count===undefined&&<div className={styles.sent}><b>Отправлено</b><span>Подтверждения прочтения пока нет</span></div>}{readers&&count!==undefined&&<button className={styles.readers} aria-label={count==="0"?"Кто прочитал":"Прочитали "+count} onClick={readers}><span className={styles.checks}>✓✓</span><span>{count==="0"?"Кто прочитал":"Прочитали "+count}</span>{count!=="0"&&<span className={styles.avatars}><img src="./avatars/lena.jpg" alt=""/><img src="./avatars/sasha.jpg" alt=""/><img src="./avatars/dima.jpg" alt=""/></span>}<ChatIcon name="right" size={16}/></button>}</div></FloatingFocusManager>}<Dialog open={all} title="Реакция на сообщение" onClose={()=>change(false)} chatAction><div className={styles.all}><EmojiDock reaction selected={selected} pending={pending} onSelect={choose} onClose={()=>change(false)}/></div></Dialog></>,document.body)
}
