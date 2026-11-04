import { Stage } from '/Users/misha/Documents/Codex/projects/group-planning/.agents/skills/stageshow/kit/stage'
import { Phone } from '/Users/misha/Documents/Codex/projects/group-planning/.agents/skills/stageshow/kit/phone'
import styles from '@preview/Study.module.css'
export const Study = () => {
  const initial = new URLSearchParams(location.search).get('state') ?? 'ready'
  return <div className={styles.study}>
    <Stage width={390} height={815} compact={{ below:390, width:358, height:760 }} theme="dark" fidelity="realistic" className={styles.stage}>{(_s,_r,layout) => <Phone width={layout === 'compact' ? 326 : 358} frame="pro" dark wallpaper="#24252a" className={styles.phone}><iframe title="Приглашения" src={`frame.html?state=${encodeURIComponent(initial)}`} style={{ position:'absolute', inset:0, width:'100%', height:'100%', border:0 }} /></Phone>}</Stage>
    <div className={styles.controls}><label>Состояние <select aria-label="Состояние приглашений" defaultValue={initial} onChange={event => { const frame=document.querySelector<HTMLIFrameElement>('iframe'); frame?.contentWindow?.postMessage({ type:'invitations-preview-state', value:event.target.value }, location.origin) }}><option value="ready">Есть приглашения</option><option value="long">Длинные данные</option><option value="empty">Пока пусто</option><option value="loading">Загрузка</option><option value="error">Ошибка загрузки</option><option value="refresh-error">Ошибка обновления</option></select></label></div>
    <p className={styles.controls}>Прототип · ответы меняются только в этом превью</p>
  </div>
}
