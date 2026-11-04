import {useState} from 'react'
import {changeOutgoing} from '@/features/send-message/model/changeOutgoing'
import styles from '@preview/CompactDelivery.module.css'
export type CompactDeliveryProps={user:string;meeting:string;id:string;state:'uncertain'|'rejected'}
export const CompactDelivery=({user,meeting,id,state}:CompactDeliveryProps)=>{
 const [problem,setProblem]=useState('')
 return <div className={styles.status} data-testid="message-delivery"><span role="status">{state==='rejected'?'Не отправлено':'Проверяем отправку'}</span>{state==='rejected'&&<><span aria-hidden="true">·</span><button onClick={()=>void changeOutgoing(user,meeting,id,'retry').catch(()=>setProblem('Не удалось повторить отправку'))}>Повторить</button></>}{problem&&<span role="alert">{problem}</span>}</div>
}
