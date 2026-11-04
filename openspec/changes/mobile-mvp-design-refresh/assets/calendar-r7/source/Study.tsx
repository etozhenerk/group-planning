import {Stage} from '/Users/misha/Documents/Codex/projects/group-planning/.agents/skills/stageshow/kit/stage'
import {Phone} from '/Users/misha/Documents/Codex/projects/group-planning/.agents/skills/stageshow/kit/phone'
import styles from './Study.module.css'

export const Study = () => {
 const initialView = new URLSearchParams(location.search).get('view') ?? (location.pathname.includes('/list-r1/') ? 'list' : 'calendar')
 const initialState = new URLSearchParams(location.search).get('state') ?? 'ready'
 return <div className={styles.study}>
  <Stage width={390} height={815} compact={{below:390,width:358,height:760}} theme="dark" fidelity="realistic" className={styles.stage}>
    {(_s,_r,layout)=><Phone width={layout==='compact'?326:358} frame="pro" dark wallpaper="#24252a" className={styles.phone}><iframe title="Мои встречи — календарь" src={`frame.html?state=${encodeURIComponent(initialState)}&view=${encodeURIComponent(initialView)}`} style={{position:'absolute',inset:0,width:'100%',height:'100%',border:0}}/></Phone>}
  </Stage>
  <div className={styles.controls}><label>Состояние <select aria-label="Состояние календаря" defaultValue={initialState} onChange={e=>{const frame=document.querySelector<HTMLIFrameElement>('iframe');frame?.contentWindow?.postMessage({type:'list-preview-state',value:e.target.value},location.origin)}}><option value="ready">Есть встречи</option><option value="twenty">20 встреч в день</option><option value="multiple">Несколько встреч в день</option><option value="long">Длинное название</option><option value="empty-day">День без встреч</option><option value="empty">Пока пусто</option><option value="loading">Загрузка</option><option value="error">Ошибка загрузки</option></select></label></div>
</div>

}
