import { Check } from 'lucide-react';
import { readCurrentReply } from '@rsvp/model/replies';
import styles from '@rsvp/mobile/Declined/Declined.module.css';

export const Declined=()=>{
  const reply=readCurrentReply();
  const go=()=>{
    const viewer=new URLSearchParams(location.search).get('viewer');
    if(viewer==='live' && parent!==window){const url=new URL(parent.location.href);url.search='?surface=list';parent.location.replace(url.href);}
    else{location.replace(new URL('../list/frame.html',location.href).href);}
  };
  return <div className={styles.screen}><header><img src="../../../somewhere.svg?shape=round-r1" alt=""/><strong>somewhere</strong></header><main className={styles.card}><span className={styles.icon}><Check size={26} strokeWidth={1.8}/></span><h1>Вы ответили «Не смогу»</h1><p className={styles.meeting}>{reply?.title || 'Ужин в пятницу'}</p><p className={styles.copy}>Организатор увидит ваш ответ.</p><button type="button" onClick={go}>К моим встречам</button></main></div>;
};
