import styles from '@preview/MessageReceipt.module.css'
export type MessageReceiptProps={count:string|undefined;show:()=>void}
export const MessageReceipt=({count,show}:MessageReceiptProps)=>{
 const read=count!==undefined&&Number(count)>0
 const label=read?'Прочитали '+count+'. Открыть сведения':count==='0'?'Отправлено. Пока никто не прочитал. Открыть сведения':'Отправлено. Нет подтверждения прочтения. Открыть действия'
 return <button type="button" className={styles.receipt} data-read={read} aria-label={label} title={label} onClick={show} aria-haspopup="dialog" data-testid="message-receipt"><svg viewBox="0 0 24 18" width="20" height="15" fill="none" stroke="currentColor" strokeWidth={read?1.9:1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m2 9 4 4L16 3"/>{read&&<path d="m10 12 1 1L22 2"/>}</svg></button>
}
