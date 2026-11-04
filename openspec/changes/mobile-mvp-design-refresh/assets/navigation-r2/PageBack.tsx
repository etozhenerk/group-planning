import type { MouseEventHandler } from 'react';
import styles from './PageBack.module.css';
document.documentElement.dataset.inputModality ??= 'pointer';
document.addEventListener('keydown',event=>{if(event.key==='Tab')document.documentElement.dataset.inputModality='keyboard'},true);
document.addEventListener('pointerdown',()=>{document.documentElement.dataset.inputModality='pointer'},true);
export type PageBackProps = { label: string; href?: string; onClick?: MouseEventHandler<HTMLButtonElement>; disabled?: boolean };
export const PageBack = ({label, href, onClick, disabled}: PageBackProps) => {
  const icon = <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 5-7 7 7 7" /></svg>;
  return href ? <a className={styles.back} href={href} aria-label={label} data-page-back>{icon}</a> : <button className={styles.back} type="button" onClick={onClick} disabled={disabled} aria-label={label} data-page-back>{icon}</button>;
};
