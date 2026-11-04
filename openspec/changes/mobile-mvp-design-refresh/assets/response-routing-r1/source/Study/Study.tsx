import { Stage } from '@stage/stage';
import { Phone } from '@stage/phone';
import styles from '@rsvp/Study/Study.module.css';

export const Study=()=>{
  const params=new URLSearchParams(location.search);
  const requested=params.get('surface') ?? 'invite';
  const surface=['invite','invitations','chat','list','declined'].includes(requested)?requested:'invite';
  const state=params.get('state') ?? 'ready';
  return <div className={styles.study}><Stage width={390} height={815} compact={{below:390,width:358,height:760}} theme="dark" fidelity="realistic" className={styles.stage}>{(_s,_r,layout)=><Phone width={layout==='compact'?326:358} frame="pro" dark wallpaper="#24252a" className={styles.phone}><iframe title="Результат ответа на приглашение" src={`/rsvp-mobile-source/mobile/${surface}/frame.html?state=${state}&viewer=live${params.get('response')==='confirmed'?'&response=confirmed':''}`} style={{position:'absolute',inset:0,width:'100%',height:'100%',border:0}}/></Phone>}</Stage><p className={styles.controls}>Мобильный макет · результат ответа</p><p className={styles.controls}><a href="?surface=invite&state=ready">К приглашению</a> · <a href="?surface=invite&state=guest">До входа</a> · <a href="?surface=declined">«Не смогу»</a> · <a href="?surface=chat&state=responses">Системные сообщения в чате</a></p></div>;
};
