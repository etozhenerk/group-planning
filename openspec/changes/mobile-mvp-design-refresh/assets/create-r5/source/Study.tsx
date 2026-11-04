import { Stage } from '/Users/misha/Documents/Codex/projects/group-planning/.agents/skills/stageshow/kit/stage'
import { Phone } from '/Users/misha/Documents/Codex/projects/group-planning/.agents/skills/stageshow/kit/phone'
import styles from '@preview/Study.module.css'
export const Study = () => {
  const initial = new URLSearchParams(location.search).get('state') ?? 'empty'
  return <div className={styles.study}>
    <Stage width={390} height={815} compact={{below:390,width:358,height:760}} theme="dark" fidelity="realistic" className={styles.stage}>{(_s,_r,layout)=><Phone width={layout==='compact'?326:358} frame="pro" dark wallpaper="#24252a" className={styles.phone}><iframe title="Создание встречи" src={`frame.html?state=${initial}`} style={{position:'absolute',inset:0,width:'100%',height:'100%',border:0}} /></Phone>}</Stage>
    <div className={styles.controls}><label>Состояние <select aria-label="Состояние формы" defaultValue={initial} onChange={event=>{document.querySelector<HTMLIFrameElement>('iframe')?.contentWindow?.postMessage({type:'create-preview-state',value:event.target.value},location.origin)}}><option value="empty">Пустая форма</option><option value="map">Карта · полный экран</option><option value="filled">Заполнено, с фото</option><option value="validation">Ошибки полей</option><option value="error">Ошибка отправки</option><option value="uncertain">Результат неизвестен</option></select></label></div>
    <p className={styles.controls}>Прототип · данные остаются в этом браузере</p>
  </div>
}
